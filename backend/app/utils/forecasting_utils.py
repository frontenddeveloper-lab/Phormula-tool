#############################################################################################################################3333

from flask import jsonify
from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.orm import sessionmaker
from config import Config
from calendar import month_name
from app.models.user_models import CountryProfile
from dotenv import load_dotenv
from dateutil.relativedelta import relativedelta
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import os, base64, warnings
from app.models.user_models import Inventory
import json
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import pmdarima as pm
import re  # <-- added

warnings.filterwarnings("ignore")

UPLOAD_FOLDER = Config.UPLOAD_FOLDER

# ============================== ENV / CONFIG ==============================
load_dotenv()
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/phormula')
db_url2 = os.getenv('DATABASE_AMAZON_URL')
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # ChatGPT adjudicator key
ROLLING_HISTORY_MONTHS = 4  # 👈 compare last 4 months of actuals in ChatGPT/local adjudicator

# ============================== SESSIONS & MAPS ==============================
def create_user_session(db_url):
    user_engine = create_engine(db_url)
    UserSession = sessionmaker(bind=user_engine)
    return UserSession()

def create_user_session(db_url2):
    user_engine1 = create_engine(db_url2)
    UserSession1 = sessionmaker(bind=user_engine1)
    return UserSession1()

MONTHS_REVERSE_MAP = {
    1: "january", 2: "february", 3: "march", 4: "april", 5: "may", 6: "june",
    7: "july", 8: "august", 9: "september", 10: "october", 11: "november", 12: "december"
}

MONTHS_MAP = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12
}

# ============================== DATE HELPERS ==============================
def month_label(dt: datetime) -> str:
    return dt.strftime("%b'%y")

def add_months(dt: datetime, k: int) -> datetime:
    return dt + relativedelta(months=k)

def target_forecast_labels(req_month_str: str, req_year: int, n: int = 3) -> list[str]:
    m = MONTHS_MAP[req_month_str.lower()]
    start = datetime(req_year, m, 1)
    return [month_label(add_months(start, i)) for i in range(1, n + 1)]

# ============================== DATETIME PARSER (robust) ==============================
# Handles ISO-8601 (Z/+HH:MM), UK/EU day-first, textual months (incl. "Sept"),
# timezone abbreviations, 2-digit years, and fallback via _source_month.
_TZ_ABBREV_TO_OFFSET = {
    "UTC": "+00:00", "GMT": "+00:00",
    "BST": "+01:00",
    "CET": "+01:00", "CEST": "+02:00",
    "EET": "+02:00", "EEST": "+03:00",
    "IST": "+05:30",
    "MSK": "+03:00",
    "AST": "-04:00", "ADT": "-03:00",
    "EST": "-05:00", "EDT": "-04:00",
    "CST": "-06:00", "CDT": "-05:00",
    "MST": "-07:00", "MDT": "-06:00",
    "PST": "-08:00", "PDT": "-07:00",
}
_TZ_ABBREV_REGEX = re.compile(r'\b(' + '|'.join(map(re.escape, _TZ_ABBREV_TO_OFFSET.keys())) + r')\b', re.IGNORECASE)

def _replace_tz_abbrev_with_offset(s: pd.Series) -> pd.Series:
    def repl(m):
        tz = m.group(1).upper()
        return _TZ_ABBREV_TO_OFFSET.get(tz, tz)
    return s.str.replace(_TZ_ABBREV_REGEX, repl, regex=True)

def _expand_two_digit_years(s: pd.Series) -> pd.Series:
    # textual: '1 Aug 25' -> '1 Aug 2025'
    s = s.str.replace(
        r'\b([0-3]?\d)\s+([A-Za-z]{3,9})\s+(\d{2})(\b|[^0-9])',
        lambda m: f"{m.group(1)} {m.group(2)} 20{m.group(3)}{m.group(4)}",
        regex=True
    )
    # numeric day-first: '15/09/25' -> '15/09/2025' (also -, .)
    s = s.str.replace(
        r'\b([0-3]?\d)[/.\-]([01]?\d)[/.\-](\d{2})\b',
        lambda m: f"{m.group(1)}/{m.group(2)}/20{m.group(3)}",
        regex=True
    )
    return s

def parse_order_datetime_series(raw: pd.Series, source_month_hint: pd.Series | None = None) -> pd.Series:
    """
    Returns a Series of naive UTC pandas Timestamps.
    Steps:
      1) Normalize tokens: 'Sept'->'Sep', collapse spaces, trim.
      2) Replace TZ abbreviations with numeric offsets.
      3) First pass: to_datetime(..., utc=True, dayfirst=True).
      4) Second pass: expand two-digit years and try again.
      5) Third pass: use source_month_hint ("August2025") + day guess.
      6) Convert tz-aware UTC to naive UTC.
    """
    s = raw.astype(str).str.strip()
    s = s.str.replace(r'\bSept\.?\b', 'Sep', regex=True)
    s = _replace_tz_abbrev_with_offset(s)
    s = s.str.replace(r'\s{2,}', ' ', regex=True)

    # Pass 1
    dt1 = pd.to_datetime(s, errors='coerce', utc=True, dayfirst=True, infer_datetime_format=True)

    # Pass 2
    needs2 = dt1.isna()
    if needs2.any():
        s2 = _expand_two_digit_years(s[needs2])
        s2 = _replace_tz_abbrev_with_offset(s2)
        dt2 = pd.to_datetime(s2, errors='coerce', utc=True, dayfirst=True, infer_datetime_format=True)
        dt1.loc[needs2] = dt2

    # Pass 3 (fallback with _source_month)
    needs3 = dt1.isna()
    if needs3.any() and source_month_hint is not None:
        src = source_month_hint.astype(str)
        day_guess = (
            s[needs3].str.extract(r'\b([0-3]?\d)\b', expand=False)
            .astype('float').fillna(1).clip(lower=1, upper=28).astype('int')
        )
        srcm = src[needs3].str.extract(r'([A-Za-z]+)', expand=False)
        srcy = src[needs3].str.extract(r'(\d{4})',   expand=False)
        rebuilt = day_guess.astype(str) + " " + srcm + " " + srcy
        rebuilt = _replace_tz_abbrev_with_offset(rebuilt)
        dt3 = pd.to_datetime(rebuilt, errors='coerce', utc=True, dayfirst=True)
        dt1.loc[needs3] = dt3

    # Convert tz-aware UTC to naive UTC
    try:
        if getattr(dt1.dt, "tz", None) is not None:
            dt1 = dt1.dt.tz_convert("UTC").dt.tz_localize(None)
    except Exception:
        # If some entries are naive already, only convert the aware ones
        mask = dt1.notna()
        try:
            dt1.loc[mask] = dt1.loc[mask].dt.tz_convert("UTC").dt.tz_localize(None)
        except Exception:
            pass

    return dt1

# ============================== GROWTH HELPER ==============================
def _compute_growth_from_history(recent_hist):
    vals = [float(x) for x in recent_hist if x is not None]
    if len(vals) < 2:
        return 0.0

    eps = 1e-6
    def mom(a, b):  # MoM = a/b - 1
        return (a / max(b, eps)) - 1.0

    g1 = mom(vals[-1], vals[-2])
    g2 = mom(vals[-2], vals[-3]) if len(vals) >= 3 else np.nan
    g3 = mom(vals[-3], vals[-4]) if len(vals) >= 4 else np.nan

    if (g1 < 0) and (not np.isnan(g2) and g2 < 0):
        return 0.0
    if g1 < 0:
        return 0.10

    if g1 > 0.40:
        recent_gs = [x for x in [g1, g2, g3] if not np.isnan(x)]
        if len(recent_gs) >= 2:
            g = np.prod([1.0 + x for x in recent_gs]) ** (1.0 / len(recent_gs)) - 1.0
        else:
            g = g1
        return max(float(g), 0.0)

    return max(float(g1), 0.0)

# ============================== REMAINING MONTHS (per-SKU base) ==============================
def calculate_remaining_months_v2(
    user_id,
    country,
    inventory_forecast,
    transit_time,
    stock_unit,
    recent_hist_map,
    base_months_map,
    anchor_months_all
):
    """
    Per-SKU extra months:
      extra[sku] = (transit_time + stock_unit) - base
      base = 3 for ARIMA winner, 4 for HYBRID winner
    anchor_months_all: sorted list of the forecast month labels (first 3 are ARIMA anchors).
    Creates numeric future-month columns and fills forecasts using growth rule.
    """

    def extra_for(sku):
        base = int(base_months_map.get(sku, 3))
        return max((transit_time + stock_unit) - base, 0)

    max_extra = 0
    for _, row in inventory_forecast.iterrows():
        s = row.get('sku', '')
        if s == 'Total':
            continue
        max_extra = max(max_extra, extra_for(s))

    if max_extra <= 0:
        return inventory_forecast

    third_label = anchor_months_all[2]
    third_dt = datetime.strptime(third_label, "%b'%y")
    start_dt = add_months(third_dt, 1)

    month_names = [month_label(add_months(start_dt, i)) for i in range(max_extra)]
    for m in month_names:
        if m not in inventory_forecast.columns:
            inventory_forecast[m] = 0.0

    for idx, row in inventory_forecast.iterrows():
        sku_key = row.get('sku', '')
        if sku_key == 'Total':
            continue

        base = int(base_months_map.get(sku_key, 3))
        extra = max((transit_time + stock_unit) - base, 0)

        if row.get('Last Month Sales(Units)', 0) > 0:
            base_sales = float(row['Last Month Sales(Units)'])
        elif row.get('Projected Sales Total', 0) > 0:
            base_sales = float(row['Projected Sales Total']) / 3.0  # keep same fallback semantics
        else:
            base_sales = 0.0

        g = _compute_growth_from_history(recent_hist_map.get(sku_key, []))

        val = base_sales
        start_index = 0 if base == 3 else 1  # shift one month for HYBRID (its 4th is already in anchors)
        for i, m in enumerate(month_names[start_index:start_index + extra]):
            # 🔧 INT ROUNDING
            inventory_forecast.at[idx, m] = int(np.rint(val))
            val *= (1.0 + g)

    return inventory_forecast

# ============================== PIPELINE UTILS ==============================
def debug_month_integrity(global_df, months_to_fetch):
    print("\n[PF DEBUG] ===== Month Integrity =====")

    # 1) Raw rows per month table (based on the table names you fetched)
    print("[PF DEBUG] Expected months:", months_to_fetch)

    # 2) Split by 'type' first
    by_type = (
        global_df.assign(_m=pd.to_datetime(global_df['date_time'], errors='coerce').dt.to_period('M'))
                  .groupby(['_m','type'])['sku'].size().unstack(fill_value=0)
    )
    print("\n[PF DEBUG] Rows by month x type (after naive to_datetime, coercing errors):")
    print(by_type.sort_index())

    # 3) Which rows failed parsing?
    dt_parsed = pd.to_datetime(global_df['date_time'], errors='coerce', infer_datetime_format=True)
    failed_parse = global_df[dt_parsed.isna()]
    if not failed_parse.empty:
        fp_by_month = (
            failed_parse.assign(_m=failed_parse['date_time'].astype(str).str.slice(0, 7))  # rough
                        .groupby('_m')['sku'].size()
        )
        print("\n[PF DEBUG] Rows with FAILED date parsing (rough bucketing by YYYY-MM):")
        print(fp_by_month.sort_index())
    else:
        print("\n[PF DEBUG] No rows failed date parsing.")

    # 4) Orders-only, after your cleaning regex + parsing (matches your pipeline)
    cleaned_dt = (
        global_df['date_time'].astype(str)
        .str.replace(r'\s(?:AM|PM)?\s?[A-Z]{3}$', '', regex=True)
        .pipe(pd.to_datetime, errors='coerce', infer_datetime_format=True)
    )
    orders_only = global_df[(global_df['type'] == 'Order') & cleaned_dt.notna()].copy()
    orders_only['_m'] = cleaned_dt[orders_only.index].dt.to_period('M')

    orders_count = orders_only.groupby('_m')['sku'].size().reindex(
        pd.period_range(min(orders_only['_m']), max(orders_only['_m']), freq='M'), fill_value=0
    )
    print("\n[PF DEBUG] Orders AFTER regex-clean + parsing (per month):")
    print(orders_count)

    # 5) Which expected months have zero orders after parsing?
    exp_periods = []
    for m in months_to_fetch:
        month = ''.join(filter(str.isalpha, m))
        year  = ''.join(filter(str.isdigit,  m))
        try:
            dt = pd.to_datetime(f"{month} {year}")
            exp_periods.append(dt.to_period('M'))
        except Exception:
            pass

    exp_periods = pd.PeriodIndex(exp_periods, freq='M')
    zero_months = [p for p in exp_periods if orders_count.get(p, 0) == 0]
    if zero_months:
        print("\n[PF DEBUG] ⚠️ Months with ZERO orders after parsing:", [str(p) for p in zero_months])
    else:
        print("\n[PF DEBUG] ✅ All expected months have some orders after parsing.")
    print("[PF DEBUG] ===============================\n")


# def process_forecasting(user_id, country, mv, year, engine, table_name_prefix="user"):
#     """
#     Build an orders-only dataframe for the last 12 full months (soft, best-effort):
#       - Try per-month tables for each month in the 12M window.
#       - If some months are missing, DO NOT raise; just log them.
#       - If the merged/all-months table exists, append it to improve coverage.
#       - Deduplicate and pass to generate_forecast.
#     Then apply gating:
#       - <5 latest contiguous months  -> ERROR 400
#       - 5..11 latest contiguous months -> ARIMA ONLY
#       - >=12 latest contiguous months  -> ARIMA + HYBRID
#     """
#     # --- 12-month window ending at last full month ---
#     today = datetime.now()
#     first_day_of_current_month = today.replace(day=1)
#     last_full_month_start = (first_day_of_current_month - timedelta(days=1)).replace(day=1)
#     start_date = (last_full_month_start - relativedelta(months=11))
#     end_date = (last_full_month_start + relativedelta(months=1) - timedelta(days=1))

#     months_to_fetch = [
#         f"{month_name[dt.month]}{dt.year}"
#         for dt in pd.date_range(start=start_date, end=end_date, freq="MS")
#     ]
#     print(f"[PF] 12M window: {start_date.strftime('%Y-%m-%d')} → {end_date.strftime('%Y-%m-%d')}")
#     print(f"[PF] Monthly tables to try (12): {months_to_fetch}")

#     # --- Introspect tables once ---
#     meta = MetaData()
#     meta.reflect(bind=engine)
#     normalized_tables = {name.lower(): name for name in meta.tables.keys()}
#     print(f"[PF] Tables available: {list(meta.tables.keys())}")

#     fetched_data = []
#     missing_months = []

#     # --- Fetch each monthly table if present ---
#     with engine.connect() as conn:
#         for month in months_to_fetch:
#             table_name = f"{table_name_prefix}_{user_id}_{country}_{month}_data"
#             tkey = table_name.lower()
#             if tkey in normalized_tables:
#                 t_actual = normalized_tables[tkey]
#                 try:
#                     print(f"[PF] Fetching monthly: {t_actual}")
#                     df_m = pd.read_sql(Table(t_actual, meta, autoload_with=engine).select(), conn)
#                     # 👇 add a hint so we can recover year/month during parsing if needed
#                     df_m['_source_month'] = month  # e.g. "August2025"
#                     fetched_data.append(df_m)
#                     print(f"[PF]  -> rows: {len(df_m)}")
#                 except Exception as e:
#                     print(f"[PF][WARN] Error fetching {t_actual}: {e}")
#             else:
#                 print(f"[PF][MISS] Monthly table not found: {table_name}")
#                 missing_months.append(month)

#         # --- Augment with merged/all-months table if present ---
#         merged_name = f"{table_name_prefix}_{user_id}_{country}_merge_data_of_all_months"
#         mkey = merged_name.lower()
#         if mkey in normalized_tables:
#             try:
#                 print(f"[PF] Augmenting with merged table: {normalized_tables[mkey]}")
#                 df_merged = pd.read_sql(Table(normalized_tables[mkey], meta, autoload_with=engine).select(), conn)
#                 # No reliable month hint for merged table; leave _source_month absent/NaN
#                 print(f"[PF]  -> merged rows: {len(df_merged)}")
#                 fetched_data.append(df_merged)
#             except Exception as e:
#                 print(f"[PF][WARN] Error fetching merged table {normalized_tables[mkey]}: {e}")
#         else:
#             print(f"[PF] No merged table found ({merged_name}).")

#     if not fetched_data:
#         print("[PF][ABORT] No data fetched from monthly/merged sources.")
#         return jsonify({"error": "No data available for the selected window."}), 400

#     # --- Combine (raw) ---
#     global_df = pd.concat(fetched_data, ignore_index=True)
#     print(f"[PF] Global concat rows: {len(global_df)}")

#     # Month integrity debug (helps identify which month failed parsing)
#     debug_month_integrity(global_df, months_to_fetch)

#     # --- Dedupe after integrity snapshot ---
#     dedupe_keys = [k for k in ['order_id', 'date_time', 'sku', 'quantity', 'type'] if k in global_df.columns]
#     if dedupe_keys:
#         before = len(global_df)
#         global_df = global_df.drop_duplicates(subset=dedupe_keys)
#         print(f"[PF] After dedupe: {before} → {len(global_df)}")
#     else:
#         print(f"[PF] No dedupe keys available; keeping {len(global_df)} rows as-is.")

#     # ✅ orders-only
#     if 'type' in global_df.columns:
#         filtered_df = global_df[global_df['type'] == 'Order'].copy()
#     else:
#         print("[PF][WARN] 'type' column missing; assuming all rows are Orders.")
#         filtered_df = global_df.copy()

#     if 'date_time' not in filtered_df.columns:
#         return jsonify({"error": "[PF][FATAL] 'date_time' column missing after fetch/merge."}), 400

#     # =======================
#     # Robust date parsing (ISO-8601 + offsets + TZ abbrev + day-first + 2-digit years + fallback)
#     # =======================
#     source_hint = filtered_df['_source_month'] if '_source_month' in filtered_df.columns else None
#     filtered_df['date_time'] = parse_order_datetime_series(filtered_df['date_time'], source_hint)
#     filtered_df = filtered_df.dropna(subset=['date_time'])

#     # Ensure required columns exist
#     keep_cols = ['sku', 'date_time', 'quantity', 'price_in_gbp']
#     for c in keep_cols:
#         if c not in filtered_df.columns:
#             filtered_df[c] = np.nan

#     new_df = filtered_df[keep_cols].copy()
#     new_df['quantity'] = pd.to_numeric(new_df['quantity'], errors='coerce').fillna(0).astype(int)
#     new_df = new_df.sort_values(by='date_time').set_index('date_time')

#     # ---- Compute latest contiguous-month streak ending at last full month ----
#     def _contiguous_streak_ending_at(end_period: pd.Period, month_index: pd.Index) -> int:
#         """Count consecutive months with any orders, going backwards from end_period."""
#         months_present = set(pd.PeriodIndex(month_index.to_period('M')))
#         streak = 0
#         p = end_period
#         while p in months_present:
#             streak += 1
#             p = p - 1
#         return streak

#     last_full_period = pd.Period(year=last_full_month_start.year,
#                                  month=last_full_month_start.month, freq='M')
#     streak = _contiguous_streak_ending_at(last_full_period, new_df.index)
#     distinct_months = int(new_df.index.to_period('M').nunique())
#     print(f"[PF] Distinct months in new_df (orders): {distinct_months}")
#     print(f"[PF] Latest contiguous months streak ending {last_full_period}: {streak}")

#     # ---- Gate logic (your requirement) ----
#     if streak < 5:
#         msg = (f"Insufficient recent data: only {streak} contiguous month(s) with orders up to {last_full_period}. "
#                f"Need at least 5. Please upload missing monthly tables or fix date formats.")
#         print(f"[PF][FATAL] {msg}")
#         return jsonify({"error": msg}), 400

#     hybrid_allowed = (streak >= 12)  # 5–11 => ARIMA-only; >=12 => ARIMA+HYBRID

#     # call forecast with the flag
#     return generate_forecast(user_id, new_df, country, mv, year, hybrid_allowed=hybrid_allowed)

def process_forecasting(user_id, country, mv, year, engine, table_name_prefix="user"):
    """
    Build an orders-only dataframe for the last 12 full months (soft, best-effort):
      - Try per-month tables for each month in the 12M window.
      - If some months are missing, DO NOT raise; just log them.
      - If the merged/all-months table exists, append it to improve coverage.
      - Deduplicate and pass to generate_forecast.
    Then apply gating:
      - <5 latest contiguous months  -> ERROR 400
      - 5..11 latest contiguous months -> ARIMA ONLY
      - >=12 latest contiguous months  -> ARIMA + HYBRID
    """
    # --- 12-month window ending at last full month ---
    today = datetime.now()
    first_day_of_current_month = today.replace(day=1)
    last_full_month_start = (first_day_of_current_month - timedelta(days=1)).replace(day=1)
    start_date = (last_full_month_start - relativedelta(months=11))
    end_date = (last_full_month_start + relativedelta(months=1) - timedelta(days=1))

    months_to_fetch = [
        f"{month_name[dt.month]}{dt.year}"
        for dt in pd.date_range(start=start_date, end=end_date, freq="MS")
    ]
    print(f"[PF] 12M window: {start_date.strftime('%Y-%m-%d')} → {end_date.strftime('%Y-%m-%d')}")
    print(f"[PF] Monthly tables to try (12): {months_to_fetch}")

    # --- Introspect tables once ---
    meta = MetaData()
    meta.reflect(bind=engine)
    normalized_tables = {name.lower(): name for name in meta.tables.keys()}
    print(f"[PF] Tables available: {list(meta.tables.keys())}")

    fetched_data = []
    missing_months = []

    # --- Fetch each monthly table if present ---
    with engine.connect() as conn:
        for month in months_to_fetch:
            table_name = f"{table_name_prefix}_{user_id}_{country}_{month}_data"
            tkey = table_name.lower()
            if tkey in normalized_tables:
                t_actual = normalized_tables[tkey]
                try:
                    print(f"[PF] Fetching monthly: {t_actual}")
                    df_m = pd.read_sql(Table(t_actual, meta, autoload_with=engine).select(), conn)
                    # 👇 add a hint so we can recover year/month during parsing if needed
                    df_m['_source_month'] = month  # e.g. "August2025"
                    fetched_data.append(df_m)
                    print(f"[PF]  -> rows: {len(df_m)}")
                except Exception as e:
                    print(f"[PF][WARN] Error fetching {t_actual}: {e}")
            else:
                print(f"[PF][MISS] Monthly table not found: {table_name}")
                missing_months.append(month)

        # --- Augment with merged/all-months table if present ---
        merged_name = f"{table_name_prefix}_{user_id}_{country}_merge_data_of_all_months"
        mkey = merged_name.lower()
        if mkey in normalized_tables:
            try:
                print(f"[PF] Augmenting with merged table: {normalized_tables[mkey]}")
                df_merged = pd.read_sql(Table(normalized_tables[mkey], meta, autoload_with=engine).select(), conn)
                # No reliable month hint for merged table; leave _source_month absent/NaN
                print(f"[PF]  -> merged rows: {len(df_merged)}")
                fetched_data.append(df_merged)
            except Exception as e:
                print(f"[PF][WARN] Error fetching merged table {normalized_tables[mkey]}: {e}")
        else:
            print(f"[PF] No merged table found ({merged_name}).")

    if not fetched_data:
        print("[PF][ABORT] No data fetched from monthly/merged sources.")
        return jsonify({"error": "No data available for the selected window."}), 400

    # --- Combine (raw) ---
    global_df = pd.concat(fetched_data, ignore_index=True)
    print(f"[PF] Global concat rows: {len(global_df)}")

    # Month integrity debug (helps identify which month failed parsing)
    debug_month_integrity(global_df, months_to_fetch)

    # --- Dedupe after integrity snapshot ---
    dedupe_keys = [k for k in ['order_id', 'date_time', 'sku', 'quantity', 'type'] if k in global_df.columns]
    if dedupe_keys:
        before = len(global_df)
        global_df = global_df.drop_duplicates(subset=dedupe_keys)
        print(f"[PF] After dedupe: {before} → {len(global_df)}")
    else:
        print(f"[PF] No dedupe keys available; keeping {len(global_df)} rows as-is.")

    # ✅ orders-only
    if 'type' in global_df.columns:
        filtered_df = global_df[global_df['type'] == 'Order'].copy()
    else:
        print("[PF][WARN] 'type' column missing; assuming all rows are Orders.")
        filtered_df = global_df.copy()

    if 'date_time' not in filtered_df.columns:
        return jsonify({"error": "[PF][FATAL] 'date_time' column missing after fetch/merge."}), 400

    # =======================
    # Robust date parsing (ISO-8601 + offsets + TZ abbrev + day-first + 2-digit years + fallback)
    # =======================
    source_hint = filtered_df['_source_month'] if '_source_month' in filtered_df.columns else None
    filtered_df['date_time'] = parse_order_datetime_series(filtered_df['date_time'], source_hint)
    filtered_df = filtered_df.dropna(subset=['date_time'])

    # Ensure required columns exist
    keep_cols = ['sku', 'date_time', 'quantity', 'price_in_gbp']
    for c in keep_cols:
        if c not in filtered_df.columns:
            filtered_df[c] = np.nan

    new_df = filtered_df[keep_cols].copy()
    new_df['quantity'] = pd.to_numeric(new_df['quantity'], errors='coerce').fillna(0).astype(int)
    new_df = new_df.sort_values(by='date_time').set_index('date_time')

    # 🔴 Drop any data outside the 12M window (especially partial current month)
    new_df = new_df.loc[
        (new_df.index >= pd.Timestamp(start_date)) &
        (new_df.index <= pd.Timestamp(end_date))
    ]
    print(f"[PF] Rows after clipping to 12M window: {len(new_df)}")

    if new_df.empty:
        print("[PF][ABORT] No rows inside the 12M window after date filtering.")
        return jsonify({"error": "No usable data inside the 12-month window."}), 400

    # ---- Compute latest contiguous-month streak ending at last full month ----
    def _contiguous_streak_ending_at(end_period: pd.Period, month_index: pd.Index) -> int:
        """Count consecutive months with any orders, going backwards from end_period."""
        months_present = set(pd.PeriodIndex(month_index.to_period('M')))
        streak = 0
        p = end_period
        while p in months_present:
            streak += 1
            p = p - 1
        return streak

    last_full_period = pd.Period(year=last_full_month_start.year,
                                 month=last_full_month_start.month, freq='M')
    streak = _contiguous_streak_ending_at(last_full_period, new_df.index)
    distinct_months = int(new_df.index.to_period('M').nunique())
    print(f"[PF] Distinct months in new_df (orders): {distinct_months}")
    print(f"[PF] Latest contiguous months streak ending {last_full_period}: {streak}")

    # ---- Gate logic ----
    if streak < 5:
        msg = (f"Insufficient recent data: only {streak} contiguous month(s) with orders up to {last_full_period}. "
               f"Need at least 5. Please upload missing monthly tables or fix date formats.")
        print(f"[PF][FATAL] {msg}")
        return jsonify({"error": msg}), 400

    hybrid_allowed = (streak >= 12)  # 5–11 => ARIMA-only; >=12 => ARIMA+HYBRID

    # call forecast with the flag
    return generate_forecast(user_id, new_df, country, mv, year, hybrid_allowed=hybrid_allowed)



def classify_skus_from_inventory(user_id, country, mv, year, engine, sales_df=None, table_name_prefix="user"):

    sku_info = {}

    engine1 = create_engine(db_url2)
    meta = MetaData()
    
    meta.reflect(bind=engine1)

    # ----- reference months -----
    ref_month = datetime(int(year), datetime.strptime(mv[:3].title(), "%b").month, 1)
    last_5_months = [ref_month - relativedelta(months=i) for i in range(5)]
    month_labels = [dt.strftime("%b%Y") for dt in last_5_months]
    month_keys = [f"{month_name[dt.month]}{dt.year}" for dt in last_5_months]

    # ================== Inventory presence (from DB) ==================
    for ref_date, month_label in zip(last_5_months, month_labels):
        month_start = ref_date.replace(day=1)
        month_end = (ref_date + relativedelta(months=1)).replace(day=1)

        # Pull inventory rows for the month
        sql = """
            SELECT
                seller_sku AS "SKU",
                fulfillable_quantity AS "Ending Warehouse Balance",
                synced_at
            FROM public.inventory
            WHERE synced_at >= %(start)s AND synced_at < %(end)s
        """
        df_inv = pd.read_sql(sql, con=engine1, params={"start": month_start, "end": month_end})

        # If your inventory table has scoping columns (e.g., user_id/country/marketplace_id),
        # add them in the SQL above and params here.

        if not df_inv.empty:
            # Keep the latest snapshot per SKU within the month
            df_inv = df_inv.sort_values("synced_at", ascending=False).drop_duplicates(subset=["SKU"], keep="first")

            for _, row in df_inv.iterrows():
                sku = row["SKU"]
                balance = row["Ending Warehouse Balance"]

                if sku not in sku_info:
                    sku_info[sku] = {
                        "inv_months": 0,
                        "inv_positive_months": 0,
                        "latest": False,
                        "sales_days": 0,
                    }

                sku_info[sku]["inv_months"] += 1
                if pd.notna(balance) and balance > 0:
                    sku_info[sku]["inv_positive_months"] += 1
                if month_label == month_labels[0]:
                    sku_info[sku]["latest"] = True
        else:
            # No rows for that month—skip silently or log if you prefer
            pass

    # ================== Sales processing (unchanged) ==================
    sku_sales_days_tracker = {}

    if sales_df is not None:
        sales_df = sales_df.copy()
        sales_df["date"] = sales_df.index.date
        for sku, group in sales_df.groupby("sku"):
            sku_sales_days_tracker[sku] = set(group["date"].unique())
    else:
        meta = MetaData()
        meta.reflect(bind=create_engine(db_url))
        normalized_tables = {name.lower(): name for name in meta.tables.keys()}
        with create_engine(db_url).connect() as conn:
            for month_key in month_keys:
                table_name = f"{table_name_prefix}_{user_id}_{country}_{month_key}_data"
                if table_name.lower() in normalized_tables:
                    table = Table(normalized_tables[table_name.lower()], meta, autoload_with=create_engine(db_url))
                    df_sales = pd.read_sql(table.select(), conn)
                    df_sales = df_sales[df_sales["type"] == "Order"]
                    df_sales["date"] = pd.to_datetime(df_sales["date_time"], errors="coerce").dt.date
                    for _, row in df_sales.iterrows():
                        sku = row["sku"]
                        date = row["date"]
                        if pd.isna(date):
                            continue
                        if sku not in sku_sales_days_tracker:
                            sku_sales_days_tracker[sku] = set()
                        if row["quantity"] > 0:
                            sku_sales_days_tracker[sku].add(date)
                else:
                    print(f"Missing sales table: {table_name}")

    for sku, day_set in sku_sales_days_tracker.items():
        if sku not in sku_info:
            sku_info[sku] = {"inv_months": 0, "inv_positive_months": 0, "latest": False, "sales_days": 0}
        sku_info[sku]["sales_days"] = len(day_set)

    # ================== Final classification ==================
    classifications = {}
    for sku, info in sku_info.items():
        if info["inv_months"] == 1 and info["latest"]:
            classifications[sku] = "New"
        elif info["sales_days"] >= 90:
            classifications[sku] = "Regular"
        else:
            classifications[sku] = "Irregular"

    return classifications



# ============================== ARIMA (3-MONTH FORECAST with DEBUG LOGS) ==============================
def forecast_next_two_months_with_append(sku_id, data, global_last_training_month=None):
    """
    ARIMA generates exactly 3 months after the requested month.
    """
    try:
        from pmdarima import auto_arima

        sku_data = data[data['sku'] == sku_id].copy()
        if sku_data.empty:
            print(f"[ARIMA][WARN] No data found for SKU: {sku_id}")
            return None

        sku_data = sku_data.drop(columns=['sku'])
        sku_data.index = pd.to_datetime(sku_data.index)
        sku_data = sku_data.resample('D').sum()
        sku_data['quantity'] = sku_data['quantity'].interpolate(method='linear').fillna(0)

        last_obs_dt = sku_data.index.max()
        print("\n[ARIMA] ==============================")
        print(f"[ARIMA] SKU: {sku_id}")
        print(f"[ARIMA] Last observed date: {last_obs_dt.strftime('%d-%b-%Y')}")

        # Fit ARIMA
        print(f"[ARIMA] Fitting model for {sku_id}...")
        auto_model = auto_arima(
            sku_data['quantity'],
            seasonal=True,
            trace=False,
            suppress_warnings=True,
            stepwise=True
        )
        model = auto_model.fit(sku_data['quantity'])
        print(f"[ARIMA] Model fit complete for SKU: {sku_id}")

        current_data = sku_data['quantity'].copy()
        last_training_date = current_data.index[-1]

        if global_last_training_month is None:
            req_period = last_training_date.to_period('M')
        else:
            req_period = global_last_training_month

        req_anchor_dt = datetime(req_period.year, req_period.month, 1)
        intended_labels = [month_label(add_months(req_anchor_dt, i)) for i in range(1, 4)]
        print(f"[ARIMA] Intended labels: {intended_labels}")

        third_month_start = add_months(req_anchor_dt, 3)
        end_of_third_month = add_months(third_month_start, 1) - pd.Timedelta(days=1)
        days_needed = max(0, (end_of_third_month - last_training_date).days) + 1
        print(f"[ARIMA] Horizon end: {end_of_third_month.strftime('%d-%b-%Y')} (days_needed={days_needed})")

        full_forecast = []
        for i in range(days_needed):
            next_val = float(model.predict(n_periods=1)[0])
            next_val = max(next_val, 0.0)

            next_date = current_data.index[-1] + pd.Timedelta(days=1)
            current_data.loc[next_date] = next_val
            full_forecast.append((next_date, next_val))

            model = auto_arima(
                current_data,
                seasonal=True,
                trace=False,
                error_action='ignore',
                suppress_warnings=True,
                stepwise=True
            ).fit(current_data)

            if (i + 1) in (1, 30, 60, 90) or (i + 1) % 30 == 0 or (i + 1) == days_needed:
                print(f"[ARIMA] Rolling append progress for {sku_id}: {i + 1} day(s)")

        forecast_df = pd.DataFrame(full_forecast, columns=['Date', 'Forecast']).set_index('Date')
        forecast_df_filtered = forecast_df[forecast_df.index.to_period('M') > req_period]

        monthly_summary = (
            forecast_df_filtered
            .resample('M')
            .agg({'Forecast': 'sum'})
            .reset_index()
            .rename(columns={'Date': 'Month'})
        )

        monthly_summary['label'] = monthly_summary['Month'].dt.strftime("%b'%y")
        monthly_summary = monthly_summary.set_index('label')
        monthly_summary = monthly_summary.reindex(intended_labels, fill_value=0.0).reset_index()
        monthly_summary.rename(columns={'index': 'label'}, inplace=True)

        monthly_summary['Month'] = pd.to_datetime(monthly_summary['label'].str.replace("'", "", regex=False), format="%b%y")
        monthly_summary['sku'] = sku_id

        # 🔧 INT ROUNDING
        monthly_summary['Forecast'] = np.rint(monthly_summary['Forecast']).astype(int)

        actual_months = monthly_summary['label'].tolist()
        actual_vals = monthly_summary['Forecast'].tolist()
        print(f"[ARIMA] Months: {actual_months}")
        print(f"[ARIMA] Values: {actual_vals}")
        print("[ARIMA] ==============================\n")

        return sku_id, monthly_summary[['Month', 'Forecast', 'sku']], sku_data

    except Exception as e:
        print(f"[ARIMA][ERROR] SKU {sku_id}: {e}")
        return None

# ============================== HYBRID (window = (T+S)-4, min 1) ==============================
def _hybrid_forecast_for_sku(sku_id, data, transit_time: int, stock_unit: int):
    """
    Hybrid model (updated):
      - Chooses Croston / SARIMA / ETS automatically.
      - Handles intermittent & sparse series.
      - Forecasts exactly 4 months (no growth extension).
      - Never returns None unless absolutely no data.
      - 100% compatible with generate_forecast().
    """
    try:
      
        
        # === CONFIG ===
        SPARSE_ZERO_THRESHOLD   = 0.60
        MIN_SERIES_LENGTH       = 30
        SEASONAL_PERIOD_DAILY   = 7
        SEASONAL_PERIOD_WEEKLY  = 52
        MIN_ARIMA_POINTS_DAILY  = 60
        MIN_ARIMA_POINTS_WEEKLY = 30
        REQUIRE_VAR_POSITIVE    = True
        FORECAST_MONTHS         = 4   # 👈 fixed to 4 months
        APPLY_GROWTH_EXTENSION  = False  # 👈 no exponential growth extension

        # === HELPERS ===
        def _zero_ratio(s: pd.Series) -> float:
            return float((s == 0).sum()) / len(s) if len(s) else 1.0

        def _sufficient_for_arima(s: pd.Series, agg: str) -> bool:
            n = len(s)
            if agg == "daily":
                if n < max(MIN_SERIES_LENGTH, MIN_ARIMA_POINTS_DAILY): return False
            else:
                if n < max(MIN_SERIES_LENGTH, MIN_ARIMA_POINTS_WEEKLY): return False
            if REQUIRE_VAR_POSITIVE and np.isclose(s.var(ddof=1), 0.0): return False
            return True

        def _croston_sba(y: np.ndarray, h: int, alpha: float = 0.1) -> np.ndarray:
            y = np.asarray(y, dtype=float)
            last_y, last_tau, t, z = None, None, 0, 0
            for v in y:
                t += 1
                if v > 0:
                    if last_y is None:
                        last_y = v
                        last_tau = t if last_tau is None else last_tau
                    else:
                        last_y  = last_y  + alpha * (v - last_y)
                        last_tau = last_tau + alpha * ((t - z) - last_tau)
                    z = t
            f = 0.0 if (last_y is None or not last_tau) else (last_y / last_tau) * (1 - alpha / 2.0)
            return np.full(h, f, dtype=float)

        def _ets(y: pd.Series, seasonal: int, horizon: int) -> np.ndarray:
            model = ExponentialSmoothing(
                y.astype(float),
                trend="add",
                seasonal="add",
                seasonal_periods=seasonal,
                initialization_method="estimated",
            )
            fit = model.fit(optimized=True)
            return fit.forecast(horizon).values.astype(float)

        def _auto_arima(y: pd.Series, seasonal: int, horizon: int) -> np.ndarray:
            model = pm.auto_arima(
                y.astype(float),
                start_p=0, start_q=0, max_p=3, max_q=3,
                start_P=0, start_Q=0, max_P=2, max_Q=2,
                seasonal=True, m=seasonal,
                d=None, D=None,
                stepwise=True, trace=False,
                error_action="ignore", suppress_warnings=True,
                information_criterion="aicc",
            )
            fc = model.predict(n_periods=horizon)
            return np.asarray(fc, dtype=float)

        def _next_month_starts(last_hist_date: pd.Timestamp, months: int) -> pd.DatetimeIndex:
            start = (last_hist_date + pd.offsets.MonthBegin(1)).normalize()
            return pd.date_range(start, periods=months, freq="MS")

        # === DATA PREP ===
        sku_df = data[data['sku'] == sku_id].copy()
        if sku_df.empty:
            return None
        s_raw = sku_df['quantity'].copy()
        s_raw.index = pd.to_datetime(sku_df.index)
        s_raw = s_raw.sort_index()
        if s_raw.empty:
            return None

        last_date = s_raw.index.max()
        start_cut = last_date - pd.Timedelta(days=365)
        s_daily = s_raw[s_raw.index >= start_cut].resample("D").sum().astype(float).fillna(0.0)

        zr = _zero_ratio(s_daily)
        if (zr > SPARSE_ZERO_THRESHOLD) or (len(s_daily) < MIN_SERIES_LENGTH):
            s = s_daily.resample("W-MON").sum()
            agg = "weekly"; seasonal = SEASONAL_PERIOD_WEEKLY; horizon = 16
            last_dt = s.index.max()
            fc_idx = pd.date_range(last_dt + pd.offsets.Week(weekday=0), periods=horizon, freq="W-MON")
        else:
            s = s_daily.asfreq("D", fill_value=0.0)
            agg = "daily"; seasonal = SEASONAL_PERIOD_DAILY; horizon = 120
            last_dt = s.index.max()
            fc_idx = pd.date_range(last_dt + pd.Timedelta(days=1), periods=horizon, freq="D")

        if len(s) < MIN_SERIES_LENGTH:
            print(f"[HYBRID] {sku_id} skipped (len={len(s)} < {MIN_SERIES_LENGTH})")
            return None

        # === MODEL CHOICE ===
        try:
            if zr > SPARSE_ZERO_THRESHOLD:
                yhat = _croston_sba(s.values, horizon)
                model_name = "Croston-SBA"
            else:
                if _sufficient_for_arima(s, agg):
                    try:
                        yhat = _auto_arima(s, seasonal, horizon)
                        model_name = f"AUTO-SARIMA(m={seasonal})"
                    except Exception:
                        yhat = _ets(s, seasonal, horizon)
                        model_name = "ETS(A,A)"
                else:
                    yhat = _ets(s, seasonal, horizon)
                    model_name = "ETS(A,A)"
        except Exception as e:
            print(f"[HYBRID WARN] {sku_id}: modeling error -> {e}")
            # fallback flat forecast instead of None
            avg_val = s_daily.resample("M").sum().tail(3).mean()
            future_months = _next_month_starts(last_date, FORECAST_MONTHS)
            monthly_out = pd.DataFrame({
                "sku": sku_id,
                "Month": future_months,
                "Forecast": [float(avg_val)] * len(future_months),
            })
            # 🔧 INT ROUNDING
            monthly_out["Forecast"] = np.rint(monthly_out["Forecast"]).astype(int)
            return sku_id, monthly_out[["Month", "Forecast", "sku"]], s_daily

        # === FORECAST BUILD ===
        yhat = np.clip(yhat, 0, None)
        fc = pd.DataFrame({"ds": fc_idx, "yhat": yhat})
        fc["Month"] = fc["ds"].dt.to_period("M").dt.to_timestamp()
        monthly = fc.groupby("Month", as_index=False)["yhat"].sum()

        # restrict to exactly 4 months
        future_months = _next_month_starts(last_dt, FORECAST_MONTHS)
        monthly = monthly[monthly["Month"].isin(future_months)]
        # 🔧 INT ROUNDING
        monthly["Forecast"] = np.rint(monthly["yhat"]).astype(int)
        monthly_out = pd.DataFrame({
            "sku": sku_id,
            "Month": monthly["Month"],
            "Forecast": monthly["Forecast"]
        })

        return sku_id, monthly_out[["Month", "Forecast", "sku"]], s_daily

    except Exception as e:
        print(f"[HYBRID ERROR] {sku_id}: {e}")
        return None

# ============================== EXPERT ADJUDICATOR (local) ==============================
def _months_with_positive_history(daily_series: pd.Series) -> int:
    monthly = daily_series.resample('M').sum()
    return int((monthly > 0).sum())

def _mk_monthly(series_daily: pd.Series) -> pd.Series:
    return series_daily.resample('M').sum().astype(float)

def _slope(y: np.ndarray) -> float:
    if len(y) < 2:
        return 0.0
    x = np.arange(len(y), dtype=float)
    xm, ym = x.mean(), y.mean()
    denom = ((x - xm) ** 2).sum()
    if denom == 0:
        return 0.0
    return float(((x - xm) * (y - ym)).sum() / denom)

def _safe_ratio(a: float, b: float, eps: float = 1e-6) -> float:
    return float(a / max(b, eps))

def _expert_score(history_m: pd.Series, forecast_m: pd.Series) -> float:
    h = history_m.dropna().astype(float)
    if len(h) == 0 or len(forecast_m) == 0:
        return float('inf')

    h_vals = h.values
    f_vals = forecast_m.values.astype(float)

    h_std  = float(h_vals.std(ddof=1)) if len(h_vals) > 1 else 0.0
    h_slope = _slope(h_vals)
    hg = []
    for i in range(1, len(h_vals)):
        hg.append(_safe_ratio(h_vals[i], h_vals[i-1]) - 1.0)
    h_g_typical = float(np.median(hg)) if hg else 0.0

    f_std = float(f_vals.std(ddof=1)) if len(f_vals) > 1 else 0.0
    f_slope = _slope(f_vals)
    f1_jump = abs((_safe_ratio(f_vals[0], h_vals[-1]) - 1.0)) if len(h_vals) >= 1 else 0.0
    fg = []
    for i in range(1, len(f_vals)):
        fg.append(_safe_ratio(f_vals[i], f_vals[i-1]) - 1.0)
    f_g_typical = float(np.median(fg)) if fg else 0.0
    f_g_maxjump = float(max([abs(x) for x in fg])) if fg else 0.0

    score = (
        0.30 * abs(f_slope - h_slope) / (abs(h_slope) + 1e-3) +
        0.25 * abs(f_g_typical - h_g_typical) +
        0.20 * f1_jump +
        0.10 * (max(0.0, (f_std / (h_std + 1e-6)) - 2.0) if h_std > 0.0 else 0.0) +
        0.10 * abs(f_vals.mean() - h_vals[-1]) / (abs(h_vals[-1]) + 1e-3) +
        0.05 * f_g_maxjump
    )
    return float(score)

def _adjudicate_by_history_trend(lastN_daily: pd.Series, arima_monthly: pd.Series, hybrid_monthly: pd.Series) -> str:
    h_m_all = _mk_monthly(lastN_daily)
    h_lastN = h_m_all.tail(ROLLING_HISTORY_MONTHS) if len(h_m_all) >= 1 else h_m_all
    score_a = _expert_score(h_lastN, arima_monthly)
    score_h = _expert_score(h_lastN, hybrid_monthly)
    return 'HYBRID' if score_h < score_a else 'ARIMA'

# ============================== CHATGPT ADJUDICATOR (primary) ==============================
def call_chatgpt_adjudicator(lastN_months: list, arima_months: list, hybrid_months: list,
                             transit_time: int, stock_unit: int, sku: str, country: str) -> str:
    """
    Uses ChatGPT to pick ARIMA vs HYBRID. Returns 'ARIMA' or 'HYBRID'.
    Falls back to local expert if key/lib not available or any error occurs.
    """
    if not OPENAI_API_KEY:
        return None  # no key => signal caller to fallback

    try:
        # prefer official SDK if available
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a forecasting adjudicator. Given the last few months of actual demand and two candidate "
                        "forecasts (ARIMA=3 months, HYBRID=4 months), choose the single model that best continues the "
                        "recent trend. Prefer continuity of trend/growth and reasonable volatility. "
                        "Answer STRICTLY with 'ARIMA' or 'HYBRID'."
                    )
                },
                {
                    "role": "user",
                    "content": json.dumps({
                        "sku": sku,
                        "country": country,
                        "transit_time": transit_time,
                        "stock_unit": stock_unit,
                        "last_N_months_actual": lastN_months,  # 👈 now 4 values
                        "arima_forecast_3m": arima_months,
                        "hybrid_forecast_4m": hybrid_months
                    })
                }
            ]
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.0,
                max_tokens=5,
            )
            text = resp.choices[0].message.content.strip().upper()
        except Exception:
            # HTTP fallback if SDK isn't available
            import requests
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "temperature": 0.0,
                "max_tokens": 5,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a forecasting adjudicator. Given the last few months of actual demand and two candidate "
                            "forecasts (ARIMA=3 months, HYBRID=4 months), choose the single model that best continues the "
                            "recent trend. Prefer continuity of trend/growth and reasonable volatility. "
                            "Answer STRICTLY with 'ARIMA' or 'HYBRID'."
                        )
                    },
                    {
                        "role": "user",
                        "content": json.dumps({
                            "sku": sku,
                            "country": country,
                            "transit_time": transit_time,
                            "stock_unit": stock_unit,
                            "last_N_months_actual": lastN_months,  # 👈 now 4 values
                            "arima_forecast_3m": arima_months,
                            "hybrid_forecast_4m": hybrid_months
                        })
                    }
                ]
            }
            r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=15)
            r.raise_for_status()
            text = r.json()["choices"][0]["message"]["content"].strip().upper()

        if "HYBRID" in text:
            return "HYBRID"
        if "ARIMA" in text:
            return "ARIMA"
        return None  # unclear => fall back

    except Exception as e:
        print(f"[GPT ADJUDICATOR] error: {e}")
        return None



import logging
    


from sqlalchemy import text, inspect
# def generate_forecast(user_id, new_df, country, mv, year, hybrid_allowed: bool = True):
#     engine = create_engine(db_url)
#     engine1 = create_engine(db_url2)
#     meta = MetaData()
#     meta.reflect(bind=engine)
#     meta.reflect(bind=engine1)

#     from sqlalchemy import inspect

# # --- Debug: list all tables for both DBs ---
#     def debug_list_tables(engine, label):
#         try:
#             insp = inspect(engine)
#             schemas = insp.get_schema_names()
#             print(f"\n=== TABLE LIST for {label} ===")
#             for sch in schemas:
#                 try:
#                     tables = insp.get_table_names(schema=sch)
#                     if tables:
#                         print(f"Schema: {sch}")
#                         for t in tables:
#                             print(f"  - {sch}.{t}")
#                 except Exception as e:
#                     print(f"  [!] Could not list tables for schema {sch}: {e}")
#         except Exception as e:
#             print(f"  [!] Could not inspect {label}: {e}")

#     # after creating engines:
#     engine = create_engine(db_url)
#     engine1 = create_engine(db_url2)

#     debug_list_tables(engine,  "Main DB (db_url)")
#     debug_list_tables(engine1, "Amazon DB (db_url2)")


#     req_year = int(year)
#     req_month_num = MONTHS_MAP[mv.lower()]
#     global_last_training_month = pd.Period(year=req_year, month=req_month_num, freq='M')

#     unique_skus = new_df['sku'].unique()
#     all_forecasts = pd.DataFrame()

#     profile = CountryProfile.query.filter_by(user_id=user_id, country=country).first()
#     if not profile:
#         raise ValueError(f"Country profile not found for user {user_id} and country {country}")
#     transit_time = int(profile.transit_time)
#     stock_unit = int(profile.stock_unit)
#     print(f"Transit time: {transit_time}, Stock unit: {stock_unit}")

#     tasks = [(sku, new_df.copy()) for sku in unique_skus]
#     model_winner = {}

#     # ========== ARIMA / HYBRID (unchanged) ==========
#     with ProcessPoolExecutor() as executor:
#         futures = {
#             executor.submit(
#                 forecast_next_two_months_with_append, sku, df, global_last_training_month
#             ): (sku, df)
#             for sku, df in tasks
#         }
#         arima_results = {}
#         for future in as_completed(futures):
#             sku, df = futures[future]
#             result = future.result()
#             if result is not None:
#                 arima_results[sku] = result

#     months_in_df = new_df.index.to_period('M').nunique()
#     hybrid_globally_enabled = hybrid_allowed
#     print(f"[HYBRID Gate] distinct_months={months_in_df}, allowed_by_streak={hybrid_allowed} -> enabled={hybrid_globally_enabled}")

#     hybrid_results = {}
#     if hybrid_globally_enabled:
#         with ProcessPoolExecutor() as executor:
#             futs = {sku: executor.submit(_hybrid_forecast_for_sku, sku, new_df.copy(), transit_time, stock_unit)
#                     for sku in unique_skus}
#             for sku, fut in futs.items():
#                 try:
#                     res = fut.result()
#                     if res is not None:
#                         hybrid_results[sku] = res
#                     else:
#                         print(f"[HYBRID] SKU={sku}: returned None (will fall back to ARIMA if present)")
#                 except Exception as e:
#                     print(f"[HYBRID][ERROR] SKU={sku}: {e} (will fall back to ARIMA if present)")
#     else:
#         print("[HYBRID] Disabled — ARIMA-only path based on streak gate.")

#     def _to_monthly_series(df_m: pd.DataFrame) -> pd.Series:
#         if df_m is None or df_m.empty:
#             return pd.Series(dtype=float)
#         df_m = df_m.copy()
#         month_idx = (
#             pd.to_datetime(df_m['Month'], errors='coerce')
#               .dt.to_period('M')
#               .dt.to_timestamp('M')
#         )
#         good = ~month_idx.isna()
#         if not good.any():
#             return pd.Series(dtype=float)
#         s = pd.Series(
#             pd.to_numeric(df_m.loc[good, 'Forecast'], errors='coerce'),
#             index=month_idx[good]
#         )
#         s = s.dropna()
#         s = s[~s.index.duplicated(keep='first')].sort_index()
#         return s

#     # ========== Adjudicate & assemble (unchanged) ==========
#     for sku in unique_skus:
#         arima_res = arima_results.get(sku)
#         hybrid_res = hybrid_results.get(sku)

#         if (arima_res is None) and (hybrid_res is None):
#             continue

#         s_daily = new_df[new_df['sku'] == sku][['quantity']]
#         s_daily = s_daily.resample('D').sum().astype(float).fillna(0.0)['quantity']
#         h_start = s_daily.index.max() - pd.DateOffset(months=ROLLING_HISTORY_MONTHS)
#         lastN_daily = s_daily[s_daily.index > h_start]

#         if (arima_res is not None) and (hybrid_res is not None):
#             _, a_monthly_df, _ = arima_res
#             _, h_monthly_df, _ = hybrid_res

#             arima_series = _to_monthly_series(a_monthly_df)
#             hybrid_series = _to_monthly_series(h_monthly_df)

#             lastN_m = _mk_monthly(lastN_daily).tail(ROLLING_HISTORY_MONTHS).astype(float).tolist()
#             a_list = a_monthly_df.sort_values('Month')['Forecast'].astype(float).tolist()[:3] if a_monthly_df is not None else []
#             h_list = h_monthly_df.sort_values('Month')['Forecast'].astype(float).tolist()[:4] if h_monthly_df is not None else []

#             gpt_choice = call_chatgpt_adjudicator(
#                 lastN_months=lastN_m,
#                 arima_months=a_list,
#                 hybrid_months=h_list,
#                 transit_time=transit_time,
#                 stock_unit=stock_unit,
#                 sku=sku,
#                 country=country
#             )

#             if gpt_choice in ("ARIMA", "HYBRID"):
#                 winner = gpt_choice
#                 print(f"[GPT] Winner for {sku}: {winner}")
#             else:
#                 winner = _adjudicate_by_history_trend(lastN_daily, arima_series, hybrid_series)
#                 print(f"[Expert] Winner for {sku}: {winner}")

#             model_winner[sku] = winner
#             chosen_df = h_monthly_df if winner == 'HYBRID' else a_monthly_df

#         elif arima_res is not None:
#             model_winner[sku] = 'ARIMA'
#             _, chosen_df, _ = arima_res
#         else:
#             model_winner[sku] = 'HYBRID'
#             _, chosen_df, _ = hybrid_res

#         chosen_df_sorted = (chosen_df.sort_values('Month').copy()
#                             if chosen_df is not None and not chosen_df.empty
#                             else pd.DataFrame(columns=['Month','Forecast','sku']))
#         if model_winner.get(sku) == 'ARIMA':
#             chosen_df_sorted = chosen_df_sorted.iloc[:3]

#         try:
#             price_gbp_value = new_df[new_df['sku'] == sku]['price_in_gbp'].iloc[0]
#         except IndexError:
#             price_gbp_value = None

#         chosen_df_sorted['price_in_gbp'] = price_gbp_value
#         chosen_df_sorted['sku'] = sku
#         chosen_df_sorted['Forecast'] = (
#             pd.to_numeric(chosen_df_sorted['Forecast'], errors='coerce')
#               .fillna(0)
#               .pipe(np.rint)
#               .astype(int)
#         )

#         all_forecasts = pd.concat(
#             [all_forecasts, chosen_df_sorted[['Month','Forecast','sku','price_in_gbp']]],
#             ignore_index=True
#         )

#     forecast_path = os.path.join(UPLOAD_FOLDER, f'forecasts_for_{user_id}_{country}.xlsx')
#     _af = all_forecasts.copy()
#     _af.rename(columns={'Month': 'month', 'Forecast': 'forecast'}, inplace=True)
#     _af[['sku', 'month', 'forecast', 'price_in_gbp']].to_excel(forecast_path, index=False)

#     all_forecasts['Month'] = pd.to_datetime(all_forecasts['Month'], errors='coerce')
#     all_forecasts = all_forecasts.dropna(subset=['Month'])
#     all_forecasts['Month'] = all_forecasts['Month'].dt.strftime("%b'%y")
#     arima_months = target_forecast_labels(mv, req_year, n=3)

#     forecast_pivot = (
#         all_forecasts.pivot_table(index='sku', columns='Month', values='Forecast', aggfunc='sum')
#         .reset_index()
#         .fillna(0)
#         .round()
#     )
#     forecast_pivot.columns.name = None
#     for col in arima_months:
#         if col not in forecast_pivot.columns:
#             forecast_pivot[col] = 0
#     monthwise_forecast_cols = [c for c in forecast_pivot.columns if c != 'sku']
#     monthwise_forecast_cols = sorted(monthwise_forecast_cols, key=lambda s: datetime.strptime(s, "%b'%y"))
#     forecast_totals = forecast_pivot[['sku'] + monthwise_forecast_cols].copy()

#     # ============================================================
#     # INVENTORY (DB): use fulfillable_quantity as Ending Warehouse Balance
#     # Take the latest snapshot per SKU within the requested month.
#     # Add user/country/marketplace filters to WHERE if you have those columns.
#     # ============================================================
    

#     import logging
    


#     from sqlalchemy import text, inspect

#     log = logging.getLogger(__name__)

#     def _assert_all_params_present(sql: str, params: dict):
#         needed = set(re.findall(r":([A-Za-z_][A-Za-z0-9_]*)", sql))
#         missing = needed - set(params.keys())
#         if missing:
#             raise ValueError(f"[INV] Missing SQL params: {', '.join(sorted(missing))} | Needed={needed} | Provided={set(params.keys())}")

#     def _compile_sql_preview(engine, sql_text_obj, params):
#         try:
#             bound = sql_text_obj.bindparams(**{k: params[k] for k in params})
#             compiled = bound.compile(dialect=engine.dialect, compile_kwargs={"literal_binds": True})
#             return str(compiled)
#         except Exception as e:
#             return f"[INV] <unable to compile preview: {e}>"

#     def _redact_url(e):
#         try:
#             return e.url.render_as_string(hide_password=True)
#         except Exception:
#             return "<unavailable>"

#     def _find_inventory_table(engines, candidate_schemas=("public", "inventory", None)):
#         """
#         Look for a table named 'inventory' across the given engines and schemas.
#         Returns (engine, schema, table) or (None, None, None).
#         """
#         for eng in engines:
#             try:
#                 insp = inspect(eng)
#                 # Enumerate schemas
#                 schemas = []
#                 try:
#                     schemas = insp.get_schema_names()
#                 except Exception:
#                     pass
#                 # Consider provided candidate schemas first; then any others
#                 check_schemas = [s for s in candidate_schemas if s in (None, *schemas)]
#                 for sch in check_schemas + [s for s in schemas if s not in check_schemas]:
#                     try:
#                         tables = insp.get_table_names(schema=sch)
#                     except Exception:
#                         continue
#                     if "inventory" in tables:
#                         return eng, sch or "public", "inventory"
#             except Exception as e:
#                 log.warning("[INV] Inspector failed for engine %s: %s", _redact_url(eng), e)
#         return None, None, None

#     # --- Compute month window ---
#     month_start = datetime(req_year, req_month_num, 1)
#     month_end   = (month_start + relativedelta(months=1)).replace(day=1)

#     # --- Which engine has the inventory table? Prefer engine1, then fallback to engine ---
#     inv_engine, inv_schema, inv_table = _find_inventory_table([engine1, engine], candidate_schemas=("public", None))
#     log.debug("[INV] engine1 URL=%s | engine URL=%s", _redact_url(engine1), _redact_url(engine))
#     log.debug("[INV] Resolved inventory location: engine=%s | schema=%s | table=%s",
#             _redact_url(inv_engine) if inv_engine else None, inv_schema, inv_table)

#     if not inv_engine:
#         # Build a diagnostic of what we can see
#         try:
#             insp1 = inspect(engine1); schemas1 = insp1.get_schema_names()
#         except Exception:
#             insp1 = None; schemas1 = []
#         try:
#             insp0 = inspect(engine);  schemas0 = insp0.get_schema_names()
#         except Exception:
#             insp0 = None; schemas0 = []

#         # Limit how much we log (avoid PII / huge dumps)
#         detail = {
#             "engine1_url": _redact_url(engine1),
#             "engine_schemas": schemas1[:10],
#             "engine_url": _redact_url(engine),
#             "fallback_schemas": schemas0[:10],
#         }
#         raise RuntimeError(f"[INV] Could not find table 'inventory' on either database. "
#                         f"Checked schemas. Details={detail}. "
#                         f"Fix: create table public.inventory or set INVENTORY_SCHEMA/DB correctly.")

#     # --- Optional marketplace filter from profile ---
#     marketplace_id = getattr(profile, "marketplace_id", None)

#     # --- Build schema-qualified identifier: schema.table ---
#     qualified_table = f'{inv_schema}."{inv_table}"' if inv_schema else f'"{inv_table}"'

#     # --- Build SQL with named binds ---
#     where_clauses = [
#         "synced_at >= :start",
#         "synced_at <  :end",
#         "user_id   = :user_id",
#     ]
#     params = {
#         "start": month_start,
#         "end": month_end,
#         "user_id": user_id,
#     }

#     if marketplace_id:
#         where_clauses.append("marketplace_id = :marketplace_id")
#         params["marketplace_id"] = marketplace_id

#     inv_sql = f"""
#         SELECT
#             seller_sku AS "SKU",
#             fulfillable_quantity AS "Ending Warehouse Balance",
#             synced_at
#         FROM {qualified_table}
#         WHERE {' AND '.join(where_clauses)}
#     """

#     # --- Debug logs ---
#     log.debug("[INV] Window start=%s end=%s | user_id=%s | marketplace_id=%s",
#             month_start, month_end, user_id, marketplace_id)
#     log.debug("[INV] SQL (template): %s", inv_sql.strip())
#     log.debug("[INV] Params: %s", {k: (str(v) if not isinstance(v, (str, int, float)) else v) for k, v in params.items()})

#     # --- Guards & preview ---
#     _assert_all_params_present(inv_sql, params)
#     preview = _compile_sql_preview(inv_engine, text(inv_sql), params)
#     log.debug("[INV] SQL (bound preview): %s", preview)

#     # --- Execute against the engine that actually has the table ---
#     try:
#         inv_df = pd.read_sql(text(inv_sql), con=inv_engine, params=params)
#         log.debug("[INV] Rows fetched: %d", len(inv_df))
#     except Exception as e:
#         log.exception("[INV] Query failed on %s", _redact_url(inv_engine))
#         raise RuntimeError(f"[INV] Inventory query failed on {_redact_url(inv_engine)}: {e}") from e

#     # --- Post-process ---
#     if inv_df.empty:
#         log.debug("[INV] No inventory rows in this window; creating empty totals frame.")
#         inventory_totals = pd.DataFrame({"sku": [], "Inventory at Month End": []})
#     else:
#         inv_df = (
#             inv_df.sort_values("synced_at", ascending=False)
#                 .drop_duplicates(subset=["SKU"], keep="first")
#         )
#         inventory_totals = (
#             inv_df[['SKU', 'Ending Warehouse Balance']]
#             .rename(columns={'SKU': 'sku', 'Ending Warehouse Balance': 'Inventory at Month End'})
#         )
#         log.debug("[INV] Inventory totals built for %d SKUs", len(inventory_totals))

#     # ========== Sales summary + product names (unchanged) ==========
#     table_name = f"user_{user_id}_{country}_{mv}{year}_data"
#     if table_name in meta.tables:
#         sales_table = Table(table_name, meta, autoload_with=engine)
#         with engine.connect() as conn:
#             sales_data = pd.read_sql(sales_table.select(), conn)
#         sales_summary = sales_data.groupby('sku')['quantity'].sum().reset_index().rename(columns={'quantity': 'Last Month Sales(Units)'})
#         product_names = sales_data.groupby('sku')['product_name'].first().reset_index().rename(columns={'product_name': 'Product Name'})
#     else:
#         sales_summary = pd.DataFrame(columns=['sku', 'Last Month Sales(Units)'])
#         product_names = pd.DataFrame(columns=['sku', 'Product Name'])

#     # Merge forecasts + inventory + sales
#     inventory_forecast = forecast_totals.merge(inventory_totals, on='sku', how='left').fillna(0)
#     inventory_forecast = inventory_forecast.merge(sales_summary, on='sku', how='left').fillna(0)
#     inventory_forecast = inventory_forecast.merge(product_names, on='sku', how='left').fillna("")

#     # Your classify() already reads DB fulfillable_quantity now
#     sku_classification = classify_skus_from_inventory(user_id, country, mv, year, engine1, sales_df=new_df)
#     inventory_forecast['SKU Type'] = inventory_forecast['sku'].map(sku_classification).fillna('Irregular')

#     # ========== recent monthly ACTUALS etc. (unchanged) ==========
#     monthly_actuals = (
#         new_df.groupby('sku')['quantity']
#         .resample('M')
#         .sum()
#         .rename_axis(index=['sku', 'Month'])
#         .reset_index()
#     )
#     recent_hist_map = {}
#     for sku, g in monthly_actuals.groupby('sku'):
#         last4 = g.sort_values('Month').tail(4)['quantity'].tolist()
#         if len(last4) >= 2:
#             recent_hist_map[sku] = last4

#     req_anchor_dt = datetime(req_year, req_month_num, 1)
#     sold_m3 = month_label(add_months(req_anchor_dt, -3))
#     sold_m2 = month_label(add_months(req_anchor_dt, -2))
#     sold_m1 = month_label(add_months(req_anchor_dt, -1))
#     sold_labels = [sold_m3, sold_m2, sold_m1]

#     monthly_actuals['Label'] = pd.to_datetime(monthly_actuals['Month']).dt.strftime("%b'%y")
#     last3_sold_pivot = (
#         monthly_actuals[monthly_actuals['Label'].isin(sold_labels)]
#         .pivot_table(index='sku', columns='Label', values='quantity', aggfunc='sum')
#         .reset_index()
#         .fillna(0)
#     )
#     for lbl in sold_labels:
#         if lbl not in last3_sold_pivot.columns:
#             last3_sold_pivot[lbl] = 0.0
#     rename_map = {lbl: f"{lbl} Sold" for lbl in sold_labels}
#     last3_sold_pivot = last3_sold_pivot.rename(columns=rename_map)

#     inventory_forecast = inventory_forecast.merge(
#         last3_sold_pivot[['sku', f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]],
#         on='sku', how='left'
#     ).fillna(0)

#     # ========== Remaining-months + totals (unchanged) ==========
#     extra_months = max(transit_time + stock_unit - 3, 0)
#     start_after_third = add_months(datetime(req_year, req_month_num, 1), 4)
#     future_month_columns = [month_label(add_months(start_after_third, i)) for i in range(extra_months)]
#     future_month_columns = [m for m in future_month_columns if m not in monthwise_forecast_cols]
#     for m in future_month_columns:
#         if m not in inventory_forecast.columns:
#             inventory_forecast[m] = 0.0

#     base_months_map = {sku: (4 if model_winner.get(sku) == 'HYBRID' else 3)
#                        for sku in inventory_forecast['sku'].tolist() if sku != 'Total'}

#     inventory_forecast = calculate_remaining_months_v2(
#         user_id, country, inventory_forecast, transit_time, stock_unit, recent_hist_map,
#         base_months_map=base_months_map,
#         anchor_months_all=monthwise_forecast_cols
#     )

#     all_future_cols = future_month_columns[:]
#     anchor_cols_sorted = monthwise_forecast_cols

#     projected_totals = []
#     for _, row in inventory_forecast.iterrows():
#         sku = row['sku']
#         if sku == 'Total':
#             projected_totals.append(0.0)
#             continue

#         base = 4 if model_winner.get(sku) == 'HYBRID' else 3
#         window = int(transit_time + stock_unit)
#         extra = max(window - base, 0)

#         base_cols = anchor_cols_sorted[:base]
#         base_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in base_cols))

#         start_idx = 0 if base == 3 else 1
#         rem_cols = all_future_cols[start_idx:start_idx + extra]
#         rem_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in rem_cols)) if rem_cols else 0.0

#         projected_totals.append(base_sum + rem_sum)

#     inventory_forecast['Projected Sales Total'] = np.rint(projected_totals).astype(int)
#     inventory_forecast['Inventory Projection'] = inventory_forecast['Projected Sales Total']
#     inventory_forecast['Dispatch'] = (
#         (inventory_forecast['Inventory Projection'] - inventory_forecast['Inventory at Month End'])
#         .clip(lower=0).pipe(np.rint).astype(int)
#     )
#     inventory_forecast['Current Inventory + Dispatch'] = (
#         inventory_forecast['Dispatch'] + inventory_forecast['Inventory at Month End']
#     ).astype(int)

#     sold_cols = [f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]
#     numeric_columns = ['Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)'] + sold_cols + monthwise_forecast_cols + future_month_columns
#     numeric_columns = [c for c in numeric_columns if c in inventory_forecast.columns]

#     total_row = pd.DataFrame([np.rint(inventory_forecast[numeric_columns].sum()).astype(int)], index=['Total'])
#     total_row.insert(0, 'sku', 'Total')
#     total_row['Product Name'] = 'Total'
#     total_row['SKU Type'] = "-"
#     inventory_forecast = pd.concat([inventory_forecast, total_row]).reset_index(drop=True)

#     int_cols = monthwise_forecast_cols + future_month_columns + [
#         'Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)',
#         'Dispatch', 'Current Inventory + Dispatch',
#         f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"
#     ]
#     int_cols = [c for c in int_cols if c in inventory_forecast.columns]
#     for c in int_cols:
#         inventory_forecast[c] = pd.to_numeric(inventory_forecast[c], errors='coerce').fillna(0).pipe(np.rint).astype(int)

#     final_columns = [
#         'sku', 'Product Name', 'SKU Type', 'Last Month Sales(Units)',
#         f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold",
#         'Projected Sales Total',
#         'Inventory at Month End',
#         'Dispatch', 'Current Inventory + Dispatch'
#     ] + monthwise_forecast_cols + future_month_columns
#     final_columns = [c for c in final_columns if c in inventory_forecast.columns]
#     print("Selected columns passed to frontend:", final_columns)

#     inventory_forecast = inventory_forecast[final_columns]

#     current_month = datetime.now().strftime("%b").lower()
#     inventory_output_path = os.path.join(UPLOAD_FOLDER, f'inventory_forecast_{user_id}_{country}_{current_month}+2.xlsx')
#     inventory_forecast.to_excel(inventory_output_path, index=False)

#     inventory_forecast_base64 = encode_file_to_base64(inventory_output_path)
#     return jsonify({'message': 'Inventory processed successfully', 'file_path': inventory_output_path}), 200


# def generate_forecast(user_id, new_df, country, mv, year, hybrid_allowed: bool = True):
#     engine = create_engine(db_url)
#     engine1 = create_engine(db_url2)  # Amazon DB - has inventory table
#     meta = MetaData()
#     meta.reflect(bind=engine)
#     meta.reflect(bind=engine1)

#     from sqlalchemy import inspect

#     # --- Debug: list all tables for both DBs ---
#     def debug_list_tables(engine, label):
#         try:
#             insp = inspect(engine)
#             schemas = insp.get_schema_names()
#             print(f"\n=== TABLE LIST for {label} ===")
#             for sch in schemas:
#                 try:
#                     tables = insp.get_table_names(schema=sch)
#                     if tables:
#                         print(f"Schema: {sch}")
#                         for t in tables:
#                             print(f"  - {sch}.{t}")
#                 except Exception as e:
#                     print(f"  [!] Could not list tables for schema {sch}: {e}")
#         except Exception as e:
#             print(f"  [!] Could not inspect {label}: {e}")

#     debug_list_tables(engine,  "Main DB (db_url)")
#     debug_list_tables(engine1, "Amazon DB (db_url2)")

#     req_year = int(year)
#     req_month_num = MONTHS_MAP[mv.lower()]
#     global_last_training_month = pd.Period(year=req_year, month=req_month_num, freq='M')

#     unique_skus = new_df['sku'].unique()
#     all_forecasts = pd.DataFrame()

#     profile = CountryProfile.query.filter_by(user_id=user_id, country=country).first()
#     if not profile:
#         raise ValueError(f"Country profile not found for user {user_id} and country {country}")
#     transit_time = int(profile.transit_time)
#     stock_unit = int(profile.stock_unit)
#     print(f"Transit time: {transit_time}, Stock unit: {stock_unit}")

#     tasks = [(sku, new_df.copy()) for sku in unique_skus]
#     model_winner = {}

#     # ========== ARIMA / HYBRID ==========
#     with ProcessPoolExecutor() as executor:
#         futures = {
#             executor.submit(
#                 forecast_next_two_months_with_append, sku, df, global_last_training_month
#             ): (sku, df)
#             for sku, df in tasks
#         }
#         arima_results = {}
#         for future in as_completed(futures):
#             sku, df = futures[future]
#             result = future.result()
#             if result is not None:
#                 arima_results[sku] = result

#     months_in_df = new_df.index.to_period('M').nunique()
#     hybrid_globally_enabled = hybrid_allowed
#     print(f"[HYBRID Gate] distinct_months={months_in_df}, allowed_by_streak={hybrid_allowed} -> enabled={hybrid_globally_enabled}")

#     hybrid_results = {}
#     if hybrid_globally_enabled:
#         with ProcessPoolExecutor() as executor:
#             futs = {sku: executor.submit(_hybrid_forecast_for_sku, sku, new_df.copy(), transit_time, stock_unit)
#                     for sku in unique_skus}
#             for sku, fut in futs.items():
#                 try:
#                     res = fut.result()
#                     if res is not None:
#                         hybrid_results[sku] = res
#                     else:
#                         print(f"[HYBRID] SKU={sku}: returned None (will fall back to ARIMA if present)")
#                 except Exception as e:
#                     print(f"[HYBRID][ERROR] SKU={sku}: {e} (will fall back to ARIMA if present)")
#     else:
#         print("[HYBRID] Disabled — ARIMA-only path based on streak gate.")

#     def _to_monthly_series(df_m: pd.DataFrame) -> pd.Series:
#         if df_m is None or df_m.empty:
#             return pd.Series(dtype=float)
#         df_m = df_m.copy()
#         month_idx = (
#             pd.to_datetime(df_m['Month'], errors='coerce')
#               .dt.to_period('M')
#               .dt.to_timestamp('M')
#         )
#         good = ~month_idx.isna()
#         if not good.any():
#             return pd.Series(dtype=float)
#         s = pd.Series(
#             pd.to_numeric(df_m.loc[good, 'Forecast'], errors='coerce'),
#             index=month_idx[good]
#         )
#         s = s.dropna()
#         s = s[~s.index.duplicated(keep='first')].sort_index()
#         return s

#     # ========== Adjudicate & assemble ==========
#     for sku in unique_skus:
#         arima_res = arima_results.get(sku)
#         hybrid_res = hybrid_results.get(sku)

#         if (arima_res is None) and (hybrid_res is None):
#             continue

#         s_daily = new_df[new_df['sku'] == sku][['quantity']]
#         s_daily = s_daily.resample('D').sum().astype(float).fillna(0.0)['quantity']
#         h_start = s_daily.index.max() - pd.DateOffset(months=ROLLING_HISTORY_MONTHS)
#         lastN_daily = s_daily[s_daily.index > h_start]

#         if (arima_res is not None) and (hybrid_res is not None):
#             _, a_monthly_df, _ = arima_res
#             _, h_monthly_df, _ = hybrid_res

#             arima_series = _to_monthly_series(a_monthly_df)
#             hybrid_series = _to_monthly_series(h_monthly_df)

#             lastN_m = _mk_monthly(lastN_daily).tail(ROLLING_HISTORY_MONTHS).astype(float).tolist()
#             a_list = a_monthly_df.sort_values('Month')['Forecast'].astype(float).tolist()[:3] if a_monthly_df is not None else []
#             h_list = h_monthly_df.sort_values('Month')['Forecast'].astype(float).tolist()[:4] if h_monthly_df is not None else []

#             gpt_choice = call_chatgpt_adjudicator(
#                 lastN_months=lastN_m,
#                 arima_months=a_list,
#                 hybrid_months=h_list,
#                 transit_time=transit_time,
#                 stock_unit=stock_unit,
#                 sku=sku,
#                 country=country
#             )

#             if gpt_choice in ("ARIMA", "HYBRID"):
#                 winner = gpt_choice
#                 print(f"[GPT] Winner for {sku}: {winner}")
#             else:
#                 winner = _adjudicate_by_history_trend(lastN_daily, arima_series, hybrid_series)
#                 print(f"[Expert] Winner for {sku}: {winner}")

#             model_winner[sku] = winner
#             chosen_df = h_monthly_df if winner == 'HYBRID' else a_monthly_df

#         elif arima_res is not None:
#             model_winner[sku] = 'ARIMA'
#             _, chosen_df, _ = arima_res
#         else:
#             model_winner[sku] = 'HYBRID'
#             _, chosen_df, _ = hybrid_res

#         chosen_df_sorted = (chosen_df.sort_values('Month').copy()
#                             if chosen_df is not None and not chosen_df.empty
#                             else pd.DataFrame(columns=['Month','Forecast','sku']))
#         if model_winner.get(sku) == 'ARIMA':
#             chosen_df_sorted = chosen_df_sorted.iloc[:3]

#         try:
#             price_gbp_value = new_df[new_df['sku'] == sku]['price_in_gbp'].iloc[0]
#         except IndexError:
#             price_gbp_value = None

#         chosen_df_sorted['price_in_gbp'] = price_gbp_value
#         chosen_df_sorted['sku'] = sku
#         chosen_df_sorted['Forecast'] = (
#             pd.to_numeric(chosen_df_sorted['Forecast'], errors='coerce')
#               .fillna(0)
#               .pipe(np.rint)
#               .astype(int)
#         )

#         all_forecasts = pd.concat(
#             [all_forecasts, chosen_df_sorted[['Month','Forecast','sku','price_in_gbp']]],
#             ignore_index=True
#         )

#     forecast_path = os.path.join(UPLOAD_FOLDER, f'forecasts_for_{user_id}_{country}.xlsx')
#     _af = all_forecasts.copy()
#     _af.rename(columns={'Month': 'month', 'Forecast': 'forecast'}, inplace=True)
#     _af[['sku', 'month', 'forecast', 'price_in_gbp']].to_excel(forecast_path, index=False)

#     all_forecasts['Month'] = pd.to_datetime(all_forecasts['Month'], errors='coerce')
#     all_forecasts = all_forecasts.dropna(subset=['Month'])
#     all_forecasts['Month'] = all_forecasts['Month'].dt.strftime("%b'%y")
#     arima_months = target_forecast_labels(mv, req_year, n=3)

#     forecast_pivot = (
#         all_forecasts.pivot_table(index='sku', columns='Month', values='Forecast', aggfunc='sum')
#         .reset_index()
#         .fillna(0)
#         .round()
#     )
#     forecast_pivot.columns.name = None
#     for col in arima_months:
#         if col not in forecast_pivot.columns:
#             forecast_pivot[col] = 0
#     monthwise_forecast_cols = [c for c in forecast_pivot.columns if c != 'sku']
#     monthwise_forecast_cols = sorted(monthwise_forecast_cols, key=lambda s: datetime.strptime(s, "%b'%y"))
#     forecast_totals = forecast_pivot[['sku'] + monthwise_forecast_cols].copy()

#     # ============================================================
#     # INVENTORY (DB): Fetch from Amazon DB (engine1)
#     # ============================================================
#     print("\n" + "="*60)
#     print("INVENTORY DATA FETCH")
#     print("="*60)
    
#     # Compute month window
#     month_start = datetime(req_year, req_month_num, 1)
#     month_end = (month_start + relativedelta(months=1)).replace(day=1)

#     print(f"[INV] Fetching inventory for window: {month_start.strftime('%Y-%m-%d')} to {month_end.strftime('%Y-%m-%d')}")
#     print(f"[INV] User ID: {user_id}")

#     # Query inventory directly from engine1 (Amazon DB)
#     inv_sql = """
#         SELECT
#             seller_sku AS "SKU",
#             fulfillable_quantity AS "Ending Warehouse Balance",
#             synced_at
#         FROM public.inventory
#         WHERE synced_at >= :start AND synced_at < :end
#         ORDER BY synced_at DESC
#     """

#     params = {
#         "start": month_start,
#         "end": month_end,
#     }

#     print(f"[INV] Executing SQL query...")

#     try:
#         # Execute against engine1 (Amazon DB)
#         inv_df = pd.read_sql(text(inv_sql), con=engine1, params=params)
#         print(f"[INV] ✓ Raw rows fetched: {len(inv_df)}")
        
#         if not inv_df.empty:
#             print(f"[INV] Sample inventory data:")
#             print(inv_df.head(3).to_string())
            
#             # Keep only the latest snapshot per SKU
#             inv_df = (
#                 inv_df.sort_values("synced_at", ascending=False)
#                     .drop_duplicates(subset=["SKU"], keep="first")
#             )
#             print(f"[INV] ✓ After deduplication: {len(inv_df)} unique SKUs")
            
#             # Create inventory totals
#             inventory_totals = inv_df[['SKU', 'Ending Warehouse Balance']].copy()
            
#             # Normalize SKU column name
#             inventory_totals.rename(columns={'SKU': 'sku'}, inplace=True)
            
#             # Ensure numeric values
#             inventory_totals['Ending Warehouse Balance'] = pd.to_numeric(
#                 inventory_totals['Ending Warehouse Balance'], 
#                 errors='coerce'
#             ).fillna(0).astype(int)
            
#             print(f"[INV] ✓ Inventory totals prepared:")
#             print(f"      Total SKUs: {len(inventory_totals)}")
#             print(f"      SKUs with inventory > 0: {(inventory_totals['Ending Warehouse Balance'] > 0).sum()}")
#             print(f"      Sample inventory values:")
#             print(inventory_totals.head(10).to_string())
            
#         else:
#             print("[INV] ⚠ No inventory data found for the specified period")
#             inventory_totals = pd.DataFrame({
#                 "sku": [], 
#                 "Ending Warehouse Balance": []
#             })
            
#     except Exception as e:
#         print(f"[INV] ✗ ERROR querying inventory: {e}")
#         import traceback
#         traceback.print_exc()
#         inventory_totals = pd.DataFrame({
#             "sku": [], 
#             "Ending Warehouse Balance": []
#         })

#     print("="*60 + "\n")

#     # ========== Sales summary + product names ==========
#     table_name = f"user_{user_id}_{country}_{mv}{year}_data"
#     if table_name in meta.tables:
#         sales_table = Table(table_name, meta, autoload_with=engine)
#         with engine.connect() as conn:
#             sales_data = pd.read_sql(sales_table.select(), conn)
#         sales_summary = sales_data.groupby('sku')['quantity'].sum().reset_index().rename(columns={'quantity': 'Last Month Sales(Units)'})
#         product_names = sales_data.groupby('sku')['product_name'].first().reset_index().rename(columns={'product_name': 'Product Name'})
#     else:
#         sales_summary = pd.DataFrame(columns=['sku', 'Last Month Sales(Units)'])
#         product_names = pd.DataFrame(columns=['sku', 'Product Name'])

#     # ========== MERGE DATA ==========
#     print("\n" + "="*60)
#     print("MERGING FORECAST WITH INVENTORY")
#     print("="*60)
    
#     print(f"[MERGE] Forecast SKUs: {len(forecast_totals)}")
#     print(f"[MERGE] Inventory SKUs: {len(inventory_totals)}")
    
#     # Debug: Check SKU formats before merge
#     if not forecast_totals.empty:
#         print(f"[MERGE] Sample forecast SKUs: {forecast_totals['sku'].head(3).tolist()}")
#     if not inventory_totals.empty:
#         print(f"[MERGE] Sample inventory SKUs: {inventory_totals['sku'].head(3).tolist()}")
        
#         # Check for common SKUs
#         common_skus = set(forecast_totals['sku']) & set(inventory_totals['sku'])
#         print(f"[MERGE] Common SKUs between forecast and inventory: {len(common_skus)}")
#         if common_skus:
#             print(f"[MERGE] Example common SKUs: {list(common_skus)[:3]}")

#     # Rename inventory column before merge
#     inventory_totals_renamed = inventory_totals.rename(
#         columns={'Ending Warehouse Balance': 'Inventory at Month End'}
#     )

#     # Merge with left join to keep all forecast SKUs
#     inventory_forecast = forecast_totals.merge(
#         inventory_totals_renamed,
#         on='sku', 
#         how='left'
#     )

#     # Fill NaN with 0 for SKUs not in inventory
#     inventory_forecast['Inventory at Month End'] = (
#         inventory_forecast['Inventory at Month End'].fillna(0).astype(int)
#     )

#     print(f"[MERGE] ✓ After inventory merge: {len(inventory_forecast)} rows")
#     print(f"[MERGE] ✓ SKUs with non-zero inventory: {(inventory_forecast['Inventory at Month End'] > 0).sum()}")
#     print(f"[MERGE] Sample merged data:")
#     print(inventory_forecast[['sku', 'Inventory at Month End']].head(10).to_string())

#     # Merge sales summary
#     inventory_forecast = inventory_forecast.merge(sales_summary, on='sku', how='left').fillna(0)

#     # Merge product names
#     inventory_forecast = inventory_forecast.merge(product_names, on='sku', how='left').fillna("")

#     print("="*60 + "\n")

#     # Classification
#     sku_classification = classify_skus_from_inventory(user_id, country, mv, year, engine1, sales_df=new_df)
#     inventory_forecast['SKU Type'] = inventory_forecast['sku'].map(sku_classification).fillna('Irregular')

#     # ========== Recent monthly actuals ==========
#     monthly_actuals = (
#         new_df.groupby('sku')['quantity']
#         .resample('M')
#         .sum()
#         .rename_axis(index=['sku', 'Month'])
#         .reset_index()
#     )
#     recent_hist_map = {}
#     for sku, g in monthly_actuals.groupby('sku'):
#         last4 = g.sort_values('Month').tail(4)['quantity'].tolist()
#         if len(last4) >= 2:
#             recent_hist_map[sku] = last4

#     req_anchor_dt = datetime(req_year, req_month_num, 1)
#     sold_m3 = month_label(add_months(req_anchor_dt, -3))
#     sold_m2 = month_label(add_months(req_anchor_dt, -2))
#     sold_m1 = month_label(add_months(req_anchor_dt, -1))
#     sold_labels = [sold_m3, sold_m2, sold_m1]

#     monthly_actuals['Label'] = pd.to_datetime(monthly_actuals['Month']).dt.strftime("%b'%y")
#     last3_sold_pivot = (
#         monthly_actuals[monthly_actuals['Label'].isin(sold_labels)]
#         .pivot_table(index='sku', columns='Label', values='quantity', aggfunc='sum')
#         .reset_index()
#         .fillna(0)
#     )
#     for lbl in sold_labels:
#         if lbl not in last3_sold_pivot.columns:
#             last3_sold_pivot[lbl] = 0.0
#     rename_map = {lbl: f"{lbl} Sold" for lbl in sold_labels}
#     last3_sold_pivot = last3_sold_pivot.rename(columns=rename_map)

#     inventory_forecast = inventory_forecast.merge(
#         last3_sold_pivot[['sku', f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]],
#         on='sku', how='left'
#     ).fillna(0)

#     # ========== Calculate remaining months ==========
#     extra_months = max(transit_time + stock_unit - 3, 0)
#     start_after_third = add_months(datetime(req_year, req_month_num, 1), 4)
#     future_month_columns = [month_label(add_months(start_after_third, i)) for i in range(extra_months)]
#     future_month_columns = [m for m in future_month_columns if m not in monthwise_forecast_cols]
#     for m in future_month_columns:
#         if m not in inventory_forecast.columns:
#             inventory_forecast[m] = 0.0

#     base_months_map = {sku: (4 if model_winner.get(sku) == 'HYBRID' else 3)
#                        for sku in inventory_forecast['sku'].tolist() if sku != 'Total'}

#     inventory_forecast = calculate_remaining_months_v2(
#         user_id, country, inventory_forecast, transit_time, stock_unit, recent_hist_map,
#         base_months_map=base_months_map,
#         anchor_months_all=monthwise_forecast_cols
#     )

#     all_future_cols = future_month_columns[:]
#     anchor_cols_sorted = monthwise_forecast_cols

#     # ========== Calculate projected totals ==========
#     projected_totals = []
#     for _, row in inventory_forecast.iterrows():
#         sku = row['sku']
#         if sku == 'Total':
#             projected_totals.append(0.0)
#             continue

#         base = 4 if model_winner.get(sku) == 'HYBRID' else 3
#         window = int(transit_time + stock_unit)
#         extra = max(window - base, 0)

#         base_cols = anchor_cols_sorted[:base]
#         base_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in base_cols))

#         start_idx = 0 if base == 3 else 1
#         rem_cols = all_future_cols[start_idx:start_idx + extra]
#         rem_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in rem_cols)) if rem_cols else 0.0

#         projected_totals.append(base_sum + rem_sum)

#     inventory_forecast['Projected Sales Total'] = np.rint(projected_totals).astype(int)
#     inventory_forecast['Inventory Projection'] = inventory_forecast['Projected Sales Total']
#     inventory_forecast['Dispatch'] = (
#         (inventory_forecast['Inventory Projection'] - inventory_forecast['Inventory at Month End'])
#         .clip(lower=0).pipe(np.rint).astype(int)
#     )
#     inventory_forecast['Current Inventory + Dispatch'] = (
#         inventory_forecast['Dispatch'] + inventory_forecast['Inventory at Month End']
#     ).astype(int)

#     # ========== Add totals row ==========
#     sold_cols = [f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]
#     numeric_columns = ['Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)'] + sold_cols + monthwise_forecast_cols + future_month_columns
#     numeric_columns = [c for c in numeric_columns if c in inventory_forecast.columns]

#     total_row = pd.DataFrame([np.rint(inventory_forecast[numeric_columns].sum()).astype(int)], index=['Total'])
#     total_row.insert(0, 'sku', 'Total')
#     total_row['Product Name'] = 'Total'
#     total_row['SKU Type'] = "-"
#     inventory_forecast = pd.concat([inventory_forecast, total_row]).reset_index(drop=True)

#     # ========== Ensure integer columns ==========
#     int_cols = monthwise_forecast_cols + future_month_columns + [
#         'Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)',
#         'Dispatch', 'Current Inventory + Dispatch',
#         f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"
#     ]
#     int_cols = [c for c in int_cols if c in inventory_forecast.columns]
#     for c in int_cols:
#         inventory_forecast[c] = pd.to_numeric(inventory_forecast[c], errors='coerce').fillna(0).pipe(np.rint).astype(int)

#     # ========== Final column selection ==========
#     final_columns = [
#         'sku', 'Product Name', 'SKU Type', 'Last Month Sales(Units)',
#         f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold",
#         'Projected Sales Total',
#         'Inventory at Month End',
#         'Dispatch', 'Current Inventory + Dispatch'
#     ] + monthwise_forecast_cols + future_month_columns
#     final_columns = [c for c in final_columns if c in inventory_forecast.columns]
    
#     print("\n[FINAL] Selected columns for output:", final_columns)
#     print(f"[FINAL] Inventory at Month End statistics:")
#     print(f"        Total non-zero: {(inventory_forecast['Inventory at Month End'] > 0).sum()}")
#     print(f"        Sum: {inventory_forecast['Inventory at Month End'].sum()}")

#     inventory_forecast = inventory_forecast[final_columns]

#     # ========== Save to file ==========
#     current_month = datetime.now().strftime("%b").lower()
#     inventory_output_path = os.path.join(UPLOAD_FOLDER, f'inventory_forecast_{user_id}_{country}_{current_month}+2.xlsx')
#     inventory_forecast.to_excel(inventory_output_path, index=False)
    
#     print(f"\n[SAVE] ✓ File saved: {inventory_output_path}")

#     inventory_forecast_base64 = encode_file_to_base64(inventory_output_path)
#     return jsonify({'message': 'Inventory processed successfully', 'file_path': inventory_output_path}), 200


# --- put these imports near your other imports ---
import re
from sqlalchemy import text

def _norm_sku(x: str) -> str:
    if x is None:
        return ""
    # remove all whitespace and upper-case so joins are robust
    return re.sub(r"\s+", "", str(x)).upper()

def fetch_and_merge_inventory_hotfix(forecast_totals: pd.DataFrame, engine1) -> pd.DataFrame:
    """
    Returns forecast_totals with a new column 'Inventory at Month End'
    joined from Amazon DB inventory (latest snapshot per SKU).
    """
    print("\n" + "="*60)
    print("INVENTORY DATA FETCH (hotfix: latest per SKU, no window)")
    print("="*60)

    sql_latest_per_sku = """
        SELECT DISTINCT ON (seller_sku)
               seller_sku AS "SKU",
               fulfillable_quantity AS "Ending Warehouse Balance",
               synced_at
        FROM public.inventory
        ORDER BY seller_sku, synced_at DESC
    """

    inv_df = pd.read_sql(text(sql_latest_per_sku), con=engine1)
    print(f"[INV] Rows fetched: {len(inv_df)}")
    if not inv_df.empty:
        print("[INV] Sample:")
        print(inv_df.head(10).to_string())

    # Prepare inventory frame
    inventory_totals = inv_df[['SKU', 'Ending Warehouse Balance']].copy()
    inventory_totals.rename(columns={'SKU': 'sku'}, inplace=True)
    inventory_totals['Ending Warehouse Balance'] = pd.to_numeric(
        inventory_totals['Ending Warehouse Balance'], errors='coerce'
    ).fillna(0).astype(int)
    inventory_totals['sku_norm'] = inventory_totals['sku'].map(_norm_sku)

    # Prepare forecast side
    out = forecast_totals.copy()
    out['sku_norm'] = out['sku'].map(_norm_sku)

    # Quick diagnostics
    print(f"[MERGE] Forecast SKUs (unique norm): {out['sku_norm'].nunique()}")
    print(f"[MERGE] Inventory SKUs (unique norm): {inventory_totals['sku_norm'].nunique()}")
    common = set(out['sku_norm']) & set(inventory_totals['sku_norm'])
    print(f"[MERGE] Common normalized SKUs: {len(common)}")
    if common:
        print(f"[MERGE] Example keys: {list(sorted(common))[:10]}")

    # Merge on normalized key
    out = out.merge(
        inventory_totals[['sku_norm', 'Ending Warehouse Balance']],
        on='sku_norm', how='left'
    )
    out.drop(columns=['sku_norm'], inplace=True)
    out.rename(columns={'Ending Warehouse Balance': 'Inventory at Month End'}, inplace=True)
    out['Inventory at Month End'] = (
        pd.to_numeric(out['Inventory at Month End'], errors='coerce').fillna(0).astype(int)
    )

    print(f"[MERGE] ✓ After merge: {len(out)} rows")
    print(f"[MERGE] ✓ Non-zero 'Inventory at Month End': {(out['Inventory at Month End'] > 0).sum()}")
    print(out[['sku', 'Inventory at Month End']].head(10).to_string())

    return out


# def generate_forecast(user_id, new_df, country, mv, year, hybrid_allowed: bool = True):
#     # --- imports used inside ---
#     import os, re
#     import numpy as np
#     import pandas as pd
#     from datetime import datetime
#     from dateutil.relativedelta import relativedelta
#     from concurrent.futures import ProcessPoolExecutor, as_completed
#     from sqlalchemy import create_engine, MetaData, Table, text, inspect
#     from flask import jsonify

#     engine = create_engine(db_url)
#     engine1 = create_engine(db_url2)  # Amazon DB - has inventory table
#     meta = MetaData()
#     meta.reflect(bind=engine)
#     meta.reflect(bind=engine1)

#     # --- Debug: list all tables for both DBs ---
#     def debug_list_tables(engine, label):
#         try:
#             insp = inspect(engine)
#             schemas = insp.get_schema_names()
#             print(f"\n=== TABLE LIST for {label} ===")
#             for sch in schemas:
#                 try:
#                     tables = insp.get_table_names(schema=sch)
#                     if tables:
#                         print(f"Schema: {sch}")
#                         for t in tables:
#                             print(f"  - {sch}.{t}")
#                 except Exception as e:
#                     print(f"  [!] Could not list tables for schema {sch}: {e}")
#         except Exception as e:
#             print(f"  [!] Could not inspect {label}: {e}")

#     debug_list_tables(engine,  "Main DB (db_url)")
#     debug_list_tables(engine1, "Amazon DB (db_url2)")

#     # ----------------- helpers -----------------
#     def _norm_sku(x: str) -> str:
#         if x is None:
#             return ""
#         return re.sub(r"\s+", "", str(x)).upper()

#     def _to_monthly_series(df_m: pd.DataFrame) -> pd.Series:
#         if df_m is None or df_m.empty:
#             return pd.Series(dtype=float)
#         df_m = df_m.copy()
#         month_idx = (
#             pd.to_datetime(df_m['Month'], errors='coerce')
#               .dt.to_period('M')
#               .dt.to_timestamp('M')
#         )
#         good = ~month_idx.isna()
#         if not good.any():
#             return pd.Series(dtype=float)
#         s = pd.Series(
#             pd.to_numeric(df_m.loc[good, 'Forecast'], errors='coerce'),
#             index=month_idx[good]
#         )
#         s = s.dropna()
#         s = s[~s.index.duplicated(keep='first')].sort_index()
#         return s

#     # ----------------- inputs & profile -----------------
#     req_year = int(year)
#     req_month_num = MONTHS_MAP[mv.lower()]
#     global_last_training_month = pd.Period(year=req_year, month=req_month_num, freq='M')

#     unique_skus = new_df['sku'].unique()
#     all_forecasts = pd.DataFrame()

#     profile = CountryProfile.query.filter_by(user_id=user_id, country=country).first()
#     if not profile:
#         raise ValueError(f"Country profile not found for user {user_id} and country {country}")
#     transit_time = int(profile.transit_time)
#     stock_unit = int(profile.stock_unit)
#     print(f"Transit time: {transit_time}, Stock unit: {stock_unit}")

#     # ----------------- ARIMA / HYBRID -----------------
#     tasks = [(sku, new_df.copy()) for sku in unique_skus]
#     model_winner = {}

#     with ProcessPoolExecutor() as executor:
#         futures = {
#             executor.submit(
#                 forecast_next_two_months_with_append, sku, df, global_last_training_month
#             ): (sku, df)
#             for sku, df in tasks
#         }
#         arima_results = {}
#         for future in as_completed(futures):
#             sku, df = futures[future]
#             result = future.result()
#             if result is not None:
#                 arima_results[sku] = result

#     months_in_df = new_df.index.to_period('M').nunique()
#     hybrid_globally_enabled = hybrid_allowed
#     print(f"[HYBRID Gate] distinct_months={months_in_df}, allowed_by_streak={hybrid_allowed} -> enabled={hybrid_globally_enabled}")

#     hybrid_results = {}
#     if hybrid_globally_enabled:
#         with ProcessPoolExecutor() as executor:
#             futs = {sku: executor.submit(_hybrid_forecast_for_sku, sku, new_df.copy(), transit_time, stock_unit)
#                     for sku in unique_skus}
#             for sku, fut in futs.items():
#                 try:
#                     res = fut.result()
#                     if res is not None:
#                         hybrid_results[sku] = res
#                     else:
#                         print(f"[HYBRID] SKU={sku}: returned None (will fall back to ARIMA if present)")
#                 except Exception as e:
#                     print(f"[HYBRID][ERROR] SKU={sku}: {e} (will fall back to ARIMA if present)")
#     else:
#         print("[HYBRID] Disabled — ARIMA-only path based on streak gate.")

#     # ----------------- Adjudicate & assemble -----------------
#     for sku in unique_skus:
#         arima_res = arima_results.get(sku)
#         hybrid_res = hybrid_results.get(sku)

#         if (arima_res is None) and (hybrid_res is None):
#             continue

#         s_daily = new_df[new_df['sku'] == sku][['quantity']]
#         s_daily = s_daily.resample('D').sum().astype(float).fillna(0.0)['quantity']
#         h_start = s_daily.index.max() - pd.DateOffset(months=ROLLING_HISTORY_MONTHS)
#         lastN_daily = s_daily[s_daily.index > h_start]

#         if (arima_res is not None) and (hybrid_res is not None):
#             _, a_monthly_df, _ = arima_res
#             _, h_monthly_df, _ = hybrid_res

#             arima_series = _to_monthly_series(a_monthly_df)
#             hybrid_series = _to_monthly_series(h_monthly_df)

#             lastN_m = _mk_monthly(lastN_daily).tail(ROLLING_HISTORY_MONTHS).astype(float).tolist()
#             a_list = a_monthly_df.sort_values('Month')['Forecast'].astype(float).tolist()[:3] if a_monthly_df is not None else []
#             h_list = h_monthly_df.sort_values('Month')['Forecast'].astype(float).tolist()[:4] if h_monthly_df is not None else []

#             gpt_choice = call_chatgpt_adjudicator(
#                 lastN_months=lastN_m,
#                 arima_months=a_list,
#                 hybrid_months=h_list,
#                 transit_time=transit_time,
#                 stock_unit=stock_unit,
#                 sku=sku,
#                 country=country
#             )

#             if gpt_choice in ("ARIMA", "HYBRID"):
#                 winner = gpt_choice
#                 print(f"[GPT] Winner for {sku}: {winner}")
#             else:
#                 winner = _adjudicate_by_history_trend(lastN_daily, arima_series, hybrid_series)
#                 print(f"[Expert] Winner for {sku}: {winner}")

#             model_winner[sku] = winner
#             chosen_df = h_monthly_df if winner == 'HYBRID' else a_monthly_df

#         elif arima_res is not None:
#             model_winner[sku] = 'ARIMA'
#             _, chosen_df, _ = arima_res
#         else:
#             model_winner[sku] = 'HYBRID'
#             _, chosen_df, _ = hybrid_res

#         chosen_df_sorted = (chosen_df.sort_values('Month').copy()
#                             if chosen_df is not None and not chosen_df.empty
#                             else pd.DataFrame(columns=['Month','Forecast','sku']))
#         if model_winner.get(sku) == 'ARIMA':
#             chosen_df_sorted = chosen_df_sorted.iloc[:3]

#         try:
#             price_gbp_value = new_df[new_df['sku'] == sku]['price_in_gbp'].iloc[0]
#         except IndexError:
#             price_gbp_value = None

#         chosen_df_sorted['price_in_gbp'] = price_gbp_value
#         chosen_df_sorted['sku'] = sku
#         chosen_df_sorted['Forecast'] = (
#             pd.to_numeric(chosen_df_sorted['Forecast'], errors='coerce')
#               .fillna(0)
#               .pipe(np.rint)
#               .astype(int)
#         )

#         all_forecasts = pd.concat(
#             [all_forecasts, chosen_df_sorted[['Month','Forecast','sku','price_in_gbp']]],
#             ignore_index=True
#         )

#     forecast_path = os.path.join(UPLOAD_FOLDER, f'forecasts_for_{user_id}_{country}.xlsx')
#     _af = all_forecasts.copy()
#     _af.rename(columns={'Month': 'month', 'Forecast': 'forecast'}, inplace=True)
#     _af[['sku', 'month', 'forecast', 'price_in_gbp']].to_excel(forecast_path, index=False)

#     all_forecasts['Month'] = pd.to_datetime(all_forecasts['Month'], errors='coerce')
#     all_forecasts = all_forecasts.dropna(subset=['Month'])
#     all_forecasts['Month'] = all_forecasts['Month'].dt.strftime("%b'%y")
#     arima_months = target_forecast_labels(mv, req_year, n=3)

#     forecast_pivot = (
#         all_forecasts.pivot_table(index='sku', columns='Month', values='Forecast', aggfunc='sum')
#         .reset_index()
#         .fillna(0)
#         .round()
#     )
#     forecast_pivot.columns.name = None
#     for col in arima_months:
#         if col not in forecast_pivot.columns:
#             forecast_pivot[col] = 0
#     monthwise_forecast_cols = [c for c in forecast_pivot.columns if c != 'sku']
#     monthwise_forecast_cols = sorted(monthwise_forecast_cols, key=lambda s: datetime.strptime(s, "%b'%y"))
#     forecast_totals = forecast_pivot[['sku'] + monthwise_forecast_cols].copy()

#     # ============================================================
#     # INVENTORY (DB): Fetch from Amazon DB (engine1)  — FIXED
#     # ============================================================
#     print("\n" + "="*60)
#     print("INVENTORY DATA FETCH (fixed)")
#     print("="*60)

#     month_start = datetime(req_year, req_month_num, 1)
#     month_end = (month_start + relativedelta(months=1)).replace(day=1)

#     print(f"[INV] Window: {month_start:%Y-%m-%d} -> {month_end:%Y-%m-%d}")
#     inv_sql_window = """
#         SELECT DISTINCT ON (seller_sku)
#                seller_sku AS "SKU",
#                fulfillable_quantity AS "Ending Warehouse Balance",
#                synced_at
#         FROM public.inventory
#         WHERE synced_at >= :start AND synced_at < :end
#         ORDER BY seller_sku, synced_at DESC
#     """
#     inv_sql_fallback = """
#         SELECT DISTINCT ON (seller_sku)
#                seller_sku AS "SKU",
#                fulfillable_quantity AS "Ending Warehouse Balance",
#                synced_at
#         FROM public.inventory
#         ORDER BY seller_sku, synced_at DESC
#     """
#     params = {"start": month_start, "end": month_end}

#     print("[INV] Executing windowed SQL…")
#     try:
#         inv_df = pd.read_sql(text(inv_sql_window), con=engine1, params=params)
#         if inv_df.empty:
#             print("[INV] No rows in the month window — falling back to latest overall snapshot.")
#             inv_df = pd.read_sql(text(inv_sql_fallback), con=engine1)
#         print(f"[INV] Rows fetched: {len(inv_df)}")
#         if not inv_df.empty:
#             print(inv_df.head(5).to_string())

#         inventory_totals = inv_df[['SKU', 'Ending Warehouse Balance']].copy()
#         inventory_totals.rename(columns={'SKU': 'sku'}, inplace=True)
#         inventory_totals['Ending Warehouse Balance'] = pd.to_numeric(
#             inventory_totals['Ending Warehouse Balance'], errors='coerce'
#         ).fillna(0).astype(int)

#         # normalized key for robust join
#         inventory_totals['sku_norm'] = inventory_totals['sku'].map(_norm_sku)
#         print(f"[INV] Unique normalized SKUs: {inventory_totals['sku_norm'].nunique()}")

#     except Exception as e:
#         print(f"[INV] ✗ ERROR querying inventory: {e}")
#         import traceback; traceback.print_exc()
#         inventory_totals = pd.DataFrame({"sku": [], "Ending Warehouse Balance": [], "sku_norm": []})

#     print("="*60 + "\n")

#     # ========== Sales summary + product names ==========
#     table_name = f"user_{user_id}_{country}_{mv}{year}_data"
#     if table_name in meta.tables:
#         sales_table = Table(table_name, meta, autoload_with=engine)
#         with engine.connect() as conn:
#             sales_data = pd.read_sql(sales_table.select(), conn)
#         sales_summary = (sales_data.groupby('sku')['quantity']
#                          .sum().reset_index()
#                          .rename(columns={'quantity': 'Last Month Sales(Units)'}))
#         product_names = (sales_data.groupby('sku')['product_name']
#                          .first().reset_index()
#                          .rename(columns={'product_name': 'Product Name'}))
#     else:
#         sales_summary = pd.DataFrame(columns=['sku', 'Last Month Sales(Units)'])
#         product_names = pd.DataFrame(columns=['sku', 'Product Name'])

#     # ============================================================
#     # MERGING FORECAST WITH INVENTORY — FIXED
#     # ============================================================
#     print("\n" + "="*60)
#     print("MERGING FORECAST WITH INVENTORY (fixed)")
#     print("="*60)

#     # normalize forecast side
#     forecast_totals = forecast_totals.copy()
#     forecast_totals['sku_norm'] = forecast_totals['sku'].map(_norm_sku)

#     print(f"[MERGE] Forecast unique norm SKUs: {forecast_totals['sku_norm'].nunique()}")
#     print(f"[MERGE] Inventory unique norm SKUs: {inventory_totals['sku_norm'].nunique()}")

#     common = set(forecast_totals['sku_norm']) & set(inventory_totals['sku_norm'])
#     print(f"[MERGE] Common (normalized) SKUs: {len(common)}")
#     if common:
#         print(f"[MERGE] Example keys: {list(sorted(common))[:5]}")

#     # join on normalized key; keep original sku for display
#     inventory_forecast = forecast_totals.merge(
#         inventory_totals[['sku_norm', 'Ending Warehouse Balance']],
#         on='sku_norm', how='left'
#     ).drop(columns=['sku_norm'])

#     inventory_forecast.rename(
#         columns={'Ending Warehouse Balance': 'Inventory at Month End'},
#         inplace=True
#     )

#     inventory_forecast['Inventory at Month End'] = (
#         pd.to_numeric(inventory_forecast['Inventory at Month End'], errors='coerce')
#           .fillna(0)
#           .astype(int)
#     )

#     print(f"[MERGE] ✓ After inventory merge: {len(inventory_forecast)} rows")
#     print(f"[MERGE] ✓ Non-zero inventory rows: "
#           f"{(inventory_forecast['Inventory at Month End'] > 0).sum()}")
#     print(inventory_forecast[['sku', 'Inventory at Month End']].head(10).to_string())


#     # forecast_totals already built above
#     inventory_forecast = fetch_and_merge_inventory_hotfix(forecast_totals, engine1)

#     # Merge sales summary & product names
#     inventory_forecast = inventory_forecast.merge(sales_summary, on='sku', how='left').fillna(0)
#     inventory_forecast = inventory_forecast.merge(product_names, on='sku', how='left').fillna("")

#     print("="*60 + "\n")

#     # ----------------- Classification -----------------
#     sku_classification = classify_skus_from_inventory(
#         user_id, country, mv, year, engine1, sales_df=new_df
#     )
#     inventory_forecast['SKU Type'] = (
#         inventory_forecast['sku'].map(sku_classification).fillna('Irregular')
#     )

#     # ----------------- Recent monthly actuals -----------------
#     monthly_actuals = (
#         new_df.groupby('sku')['quantity']
#         .resample('M')
#         .sum()
#         .rename_axis(index=['sku', 'Month'])
#         .reset_index()
#     )
#     recent_hist_map = {}
#     for sku, g in monthly_actuals.groupby('sku'):
#         last4 = g.sort_values('Month').tail(4)['quantity'].tolist()
#         if len(last4) >= 2:
#             recent_hist_map[sku] = last4

#     req_anchor_dt = datetime(req_year, req_month_num, 1)
#     sold_m3 = month_label(add_months(req_anchor_dt, -3))
#     sold_m2 = month_label(add_months(req_anchor_dt, -2))
#     sold_m1 = month_label(add_months(req_anchor_dt, -1))
#     sold_labels = [sold_m3, sold_m2, sold_m1]

#     monthly_actuals['Label'] = pd.to_datetime(monthly_actuals['Month']).dt.strftime("%b'%y")
#     last3_sold_pivot = (
#         monthly_actuals[monthly_actuals['Label'].isin(sold_labels)]
#         .pivot_table(index='sku', columns='Label', values='quantity', aggfunc='sum')
#         .reset_index()
#         .fillna(0)
#     )
#     for lbl in sold_labels:
#         if lbl not in last3_sold_pivot.columns:
#             last3_sold_pivot[lbl] = 0.0
#     rename_map = {lbl: f"{lbl} Sold" for lbl in sold_labels}
#     last3_sold_pivot = last3_sold_pivot.rename(columns=rename_map)

#     inventory_forecast = inventory_forecast.merge(
#         last3_sold_pivot[['sku', f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]],
#         on='sku', how='left'
#     ).fillna(0)

#     # ----------------- Remaining months -----------------
#     extra_months = max(transit_time + stock_unit - 3, 0)
#     start_after_third = add_months(datetime(req_year, req_month_num, 1), 4)
#     future_month_columns = [month_label(add_months(start_after_third, i)) for i in range(extra_months)]
#     future_month_columns = [m for m in future_month_columns if m not in monthwise_forecast_cols]
#     for m in future_month_columns:
#         if m not in inventory_forecast.columns:
#             inventory_forecast[m] = 0.0

#     base_months_map = {sku: (4 if model_winner.get(sku) == 'HYBRID' else 3)
#                        for sku in inventory_forecast['sku'].tolist() if sku != 'Total'}

#     inventory_forecast = calculate_remaining_months_v2(
#         user_id, country, inventory_forecast, transit_time, stock_unit, recent_hist_map,
#         base_months_map=base_months_map,
#         anchor_months_all=monthwise_forecast_cols
#     )

#     all_future_cols = future_month_columns[:]
#     anchor_cols_sorted = monthwise_forecast_cols

#     # ----------------- Projected totals -----------------
#     # projected_totals = []
#     # for _, row in inventory_forecast.iterrows():
#     #     sku = row['sku']
#     #     if sku == 'Total':
#     #         projected_totals.append(0.0)
#     #         continue

#     #     base = 4 if model_winner.get(sku) == 'HYBRID' else 3
#     #     window = int(transit_time + stock_unit)
#     #     extra = max(window - base, 0)

#     #     base_cols = anchor_cols_sorted[:base]
#     #     base_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in base_cols))

#     #     start_idx = 0 if base == 3 else 1
#     #     rem_cols = all_future_cols[start_idx:start_idx + extra]
#     #     rem_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in rem_cols)) if rem_cols else 0.0

#     #     projected_totals.append(base_sum + rem_sum)

#     # inventory_forecast['Projected Sales Total'] = np.rint(projected_totals).astype(int)
#     # inventory_forecast['Inventory Projection'] = inventory_forecast['Projected Sales Total']
#     # inventory_forecast['Dispatch'] = (
#     #     (inventory_forecast['Inventory Projection'] - inventory_forecast['Inventory at Month End'])
#     #     .clip(lower=0).pipe(np.rint).astype(int)
#     # )
#     # inventory_forecast['Current Inventory + Dispatch'] = (
#     #     inventory_forecast['Dispatch'] + inventory_forecast['Inventory at Month End']
#     # ).astype(int)
    
    
#     # # ==== Coverage Ratio (before dispatch) ====
#     # # months of cover using last month's sales; show "-" when undefined or divisor=0
#     # divisor = inventory_forecast['Last Month Sales(Units)'].replace(0, np.nan)
#     # coverage = (inventory_forecast['Inventory at Month End'] / divisor).round(2)
#     # inventory_forecast['Inventory Coverage Ratio Before Dispatch'] = coverage.where(coverage.notna(), "-")


#     # # ----------------- Totals row -----------------
#     # sold_cols = [f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]
#     # numeric_columns = ['Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)'] + sold_cols + monthwise_forecast_cols + future_month_columns
#     # numeric_columns = [c for c in numeric_columns if c in inventory_forecast.columns]

#     # total_row = pd.DataFrame([np.rint(inventory_forecast[numeric_columns].sum()).astype(int)], index=['Total'])
#     # total_row.insert(0, 'sku', 'Total')
#     # total_row['Product Name'] = 'Total'
#     # total_row['SKU Type'] = "-"
#     # total_row['Inventory Coverage Ratio Before Dispatch'] = "-"
#     # inventory_forecast = pd.concat([inventory_forecast, total_row]).reset_index(drop=True)

#     # # ----------------- Ensure integer cols -----------------
#     # int_cols = monthwise_forecast_cols + future_month_columns + [
#     #     'Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)',
#     #     'Dispatch', 'Current Inventory + Dispatch',
#     #     f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"
#     # ]
#     # int_cols = [c for c in int_cols if c in inventory_forecast.columns]
#     # for c in int_cols:
#     #     inventory_forecast[c] = pd.to_numeric(inventory_forecast[c], errors='coerce').fillna(0).pipe(np.rint).astype(int)

#     # # ----------------- Final selection -----------------
#     # # final_columns = [
#     # #     'sku', 'Product Name', 'SKU Type', 'Last Month Sales(Units)',
#     # #     f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold",
#     # #     'Projected Sales Total',
#     # #     'Inventory at Month End',
#     # #     'Dispatch', 'Current Inventory + Dispatch'
#     # # ] + monthwise_forecast_cols + future_month_columns
#     # # final_columns = [c for c in final_columns if c in inventory_forecast.columns]
#     # final_columns = [
#     #     'sku', 'Product Name', 'SKU Type', 'Last Month Sales(Units)',
#     #     f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold",
#     #     'Projected Sales Total',
#     #     'Inventory at Month End',
#     #     'Inventory Coverage Ratio Before Dispatch',
#     #     'Dispatch', 'Current Inventory + Dispatch'
#     # ] + monthwise_forecast_cols + future_month_columns
#     # final_columns = [c for c in final_columns if c in inventory_forecast.columns]
#     # print("Selected columns passed to frontend:", final_columns)

#     # print("\n[FINAL] Selected columns for output:", final_columns)
#     # print(f"[FINAL] Non-zero Inventory at Month End: {(inventory_forecast['Inventory at Month End'] > 0).sum()}")
#     # print(f"[FINAL] Sum Inventory at Month End: {inventory_forecast['Inventory at Month End'].sum()}")

#     # inventory_forecast = inventory_forecast[final_columns]
#         # ----------------- Projected totals -----------------
#     # ----------------- Projected totals -----------------
#     projected_totals = []
#     for _, row in inventory_forecast.iterrows():
#         sku = row['sku']
#         if sku == 'Total':
#             projected_totals.append(0.0)
#             continue

#         base = 4 if model_winner.get(sku) == 'HYBRID' else 3
#         window = int(transit_time + stock_unit)
#         extra = max(window - base, 0)

#         base_cols = anchor_cols_sorted[:base]
#         base_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in base_cols))

#         start_idx = 0 if base == 3 else 1
#         rem_cols = all_future_cols[start_idx:start_idx + extra]
#         rem_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in rem_cols)) if rem_cols else 0.0

#         projected_totals.append(base_sum + rem_sum)

#     # Save projected sales totals
#     inventory_forecast['Projected Sales Total'] = np.rint(projected_totals).astype(int)

#     # ==== Dispatch & balances ====
#     inventory_forecast['Dispatch'] = (
#         (inventory_forecast['Projected Sales Total'] - inventory_forecast['Inventory at Month End'])
#         .clip(lower=0)
#         .pipe(np.rint)
#         .astype(int)
#     )
#     inventory_forecast['Current Inventory + Dispatch'] = (
#         inventory_forecast['Dispatch'] + inventory_forecast['Inventory at Month End']
#     ).astype(int)

#     # ==== Coverage Ratio (before dispatch) ====
#     # months of cover using last month's sales; show "-" when undefined or divisor=0
#     divisor = inventory_forecast['Last Month Sales(Units)'].replace(0, np.nan)
#     coverage = (inventory_forecast['Inventory at Month End'] / divisor).round(2)
#     inventory_forecast['Inventory Coverage Ratio Before Dispatch'] = coverage.where(coverage.notna(), "-")

#     # ----------------- Totals row -----------------
#     sold_cols = [f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]
#     numeric_columns = ['Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)'] \
#                       + sold_cols + monthwise_forecast_cols + future_month_columns
#     numeric_columns = [c for c in numeric_columns if c in inventory_forecast.columns]

#     total_row = pd.DataFrame([np.rint(inventory_forecast[numeric_columns].sum()).astype(int)], index=['Total'])
#     total_row.insert(0, 'sku', 'Total')
#     total_row['Product Name'] = 'Total'
#     total_row['SKU Type'] = '-'
#     # Put a friendly marker for ratio in the Total row
#     total_row['Inventory Coverage Ratio Before Dispatch'] = '-'

#     inventory_forecast = pd.concat([inventory_forecast, total_row], ignore_index=True)

#     # ----------------- Ensure integer cols -----------------
#     int_cols = monthwise_forecast_cols + future_month_columns + [
#         'Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)',
#         'Dispatch', 'Current Inventory + Dispatch',
#         f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"
#     ]
#     int_cols = [c for c in int_cols if c in inventory_forecast.columns]
#     for c in int_cols:
#         inventory_forecast[c] = (
#             pd.to_numeric(inventory_forecast[c], errors='coerce')
#               .fillna(0)
#               .pipe(np.rint)
#               .astype(int)
#         )

#     # ✅ Remove legacy column if it exists
#     inventory_forecast.drop(columns=['Inventory Projection'], errors='ignore', inplace=True)

#     # ----------------- Final selection -----------------
#     final_columns = [
#         'sku', 'Product Name', 'SKU Type', 'Last Month Sales(Units)',
#         f"{sold_m3} Sold", f"{sold_m2} Sold",
#         'Projected Sales Total',
#         'Inventory at Month End',
#         'Inventory Coverage Ratio Before Dispatch',
#         'Dispatch', 'Current Inventory + Dispatch'
#     ] + monthwise_forecast_cols + future_month_columns
#     final_columns = [c for c in final_columns if c in inventory_forecast.columns]
#     print("Selected columns passed to frontend:", final_columns)

#     inventory_forecast = inventory_forecast[final_columns]

#     # ----------------- Save -----------------
#     current_month = datetime.now().strftime("%b").lower()
#     inventory_output_path = os.path.join(
#         UPLOAD_FOLDER, f'inventory_forecast_{user_id}_{country}_{current_month}+2.xlsx'
#     )
#     inventory_forecast.to_excel(inventory_output_path, index=False)
#     print(f"\n[SAVE] ✓ File saved: {inventory_output_path}")

#     inventory_forecast_base64 = encode_file_to_base64(inventory_output_path)
#     return jsonify({'message': 'Inventory processed successfully', 'file_path': inventory_output_path}), 200

def generate_forecast(user_id, new_df, country, mv, year, hybrid_allowed: bool = True):
    # --- imports used inside ---
    import os, re
    import numpy as np
    import pandas as pd
    from datetime import datetime
    from dateutil.relativedelta import relativedelta
    from concurrent.futures import ProcessPoolExecutor, as_completed
    from sqlalchemy import create_engine, MetaData, Table, text, inspect
    from flask import jsonify

    engine = create_engine(db_url)
    engine1 = create_engine(db_url2)  # Amazon DB - has inventory table
    meta = MetaData()
    meta.reflect(bind=engine)
    meta.reflect(bind=engine1)

    # --- Debug: list all tables for both DBs ---
    def debug_list_tables(engine, label):
        try:
            insp = inspect(engine)
            schemas = insp.get_schema_names()
            print(f"\n=== TABLE LIST for {label} ===")
            for sch in schemas:
                try:
                    tables = insp.get_table_names(schema=sch)
                    if tables:
                        print(f"Schema: {sch}")
                        for t in tables:
                            print(f"  - {sch}.{t}")
                except Exception as e:
                    print(f"  [!] Could not list tables for schema {sch}: {e}")
        except Exception as e:
            print(f"  [!] Could not inspect {label}: {e}")

    debug_list_tables(engine,  "Main DB (db_url)")
    debug_list_tables(engine1, "Amazon DB (db_url2)")

    # ----------------- helpers -----------------
    def _norm_sku(x: str) -> str:
        if x is None:
            return ""
        return re.sub(r"\s+", "", str(x)).upper()

    def _to_monthly_series(df_m: pd.DataFrame) -> pd.Series:
        if df_m is None or df_m.empty:
            return pd.Series(dtype=float)
        df_m = df_m.copy()
        month_idx = (
            pd.to_datetime(df_m['Month'], errors='coerce')
              .dt.to_period('M')
              .dt.to_timestamp('M')
        )
        good = ~month_idx.isna()
        if not good.any():
            return pd.Series(dtype=float)
        s = pd.Series(
            pd.to_numeric(df_m.loc[good, 'Forecast'], errors='coerce'),
            index=month_idx[good]
        )
        s = s.dropna()
        s = s[~s.index.duplicated(keep='first')].sort_index()
        return s

    # ----------------- inputs & profile -----------------
    req_year = int(year)
    req_month_num = MONTHS_MAP[mv.lower()]

    # 🔴 Anchor ARIMA on actual last training month from data (not on mv/year)
    last_training_ts = new_df.index.max()
    global_last_training_month = last_training_ts.to_period('M')
    print(f"[ARIMA] global_last_training_month from data: {global_last_training_month}")

    unique_skus = new_df['sku'].unique()
    all_forecasts = pd.DataFrame()

    profile = CountryProfile.query.filter_by(user_id=user_id, country=country).first()
    if not profile:
        raise ValueError(f"Country profile not found for user {user_id} and country {country}")
    transit_time = int(profile.transit_time)
    stock_unit = int(profile.stock_unit)
    print(f"Transit time: {transit_time}, Stock unit: {stock_unit}")

    # ----------------- ARIMA / HYBRID -----------------
    tasks = [(sku, new_df.copy()) for sku in unique_skus]
    model_winner = {}

    with ProcessPoolExecutor() as executor:
        futures = {
            executor.submit(
                forecast_next_two_months_with_append, sku, df, global_last_training_month
            ): (sku, df)
            for sku, df in tasks
        }
        arima_results = {}
        for future in as_completed(futures):
            sku, df = futures[future]
            result = future.result()
            if result is not None:
                arima_results[sku] = result

    months_in_df = new_df.index.to_period('M').nunique()
    hybrid_globally_enabled = hybrid_allowed
    print(f"[HYBRID Gate] distinct_months={months_in_df}, allowed_by_streak={hybrid_allowed} -> enabled={hybrid_globally_enabled}")

    hybrid_results = {}
    if hybrid_globally_enabled:
        with ProcessPoolExecutor() as executor:
            futs = {sku: executor.submit(_hybrid_forecast_for_sku, sku, new_df.copy(), transit_time, stock_unit)
                    for sku in unique_skus}
            for sku, fut in futs.items():
                try:
                    res = fut.result()
                    if res is not None:
                        hybrid_results[sku] = res
                    else:
                        print(f"[HYBRID] SKU={sku}: returned None (will fall back to ARIMA if present)")
                except Exception as e:
                    print(f"[HYBRID][ERROR] SKU={sku}: {e} (will fall back to ARIMA if present)")
    else:
        print("[HYBRID] Disabled — ARIMA-only path based on streak gate.")

    # ----------------- Adjudicate & assemble -----------------
    for sku in unique_skus:
        arima_res = arima_results.get(sku)
        hybrid_res = hybrid_results.get(sku)

        if (arima_res is None) and (hybrid_res is None):
            continue

        s_daily = new_df[new_df['sku'] == sku][['quantity']]
        s_daily = s_daily.resample('D').sum().astype(float).fillna(0.0)['quantity']
        h_start = s_daily.index.max() - pd.DateOffset(months=ROLLING_HISTORY_MONTHS)
        lastN_daily = s_daily[s_daily.index > h_start]

        if (arima_res is not None) and (hybrid_res is not None):
            _, a_monthly_df, _ = arima_res
            _, h_monthly_df, _ = hybrid_res

            arima_series = _to_monthly_series(a_monthly_df)
            hybrid_series = _to_monthly_series(h_monthly_df)

            lastN_m = _mk_monthly(lastN_daily).tail(ROLLING_HISTORY_MONTHS).astype(float).tolist()
            a_list = a_monthly_df.sort_values('Month')['Forecast'].astype(float).tolist()[:3] if a_monthly_df is not None else []
            h_list = h_monthly_df.sort_values('Month')['Forecast'].astype(float).tolist()[:4] if h_monthly_df is not None else []

            gpt_choice = call_chatgpt_adjudicator(
                lastN_months=lastN_m,
                arima_months=a_list,
                hybrid_months=h_list,
                transit_time=transit_time,
                stock_unit=stock_unit,
                sku=sku,
                country=country
            )

            if gpt_choice in ("ARIMA", "HYBRID"):
                winner = gpt_choice
                print(f"[GPT] Winner for {sku}: {winner}")
            else:
                winner = _adjudicate_by_history_trend(lastN_daily, arima_series, hybrid_series)
                print(f"[Expert] Winner for {sku}: {winner}")

            model_winner[sku] = winner
            chosen_df = h_monthly_df if winner == 'HYBRID' else a_monthly_df

        elif arima_res is not None:
            model_winner[sku] = 'ARIMA'
            _, chosen_df, _ = arima_res
        else:
            model_winner[sku] = 'HYBRID'
            _, chosen_df, _ = hybrid_res

        chosen_df_sorted = (chosen_df.sort_values('Month').copy()
                            if chosen_df is not None and not chosen_df.empty
                            else pd.DataFrame(columns=['Month','Forecast','sku']))
        if model_winner.get(sku) == 'ARIMA':
            chosen_df_sorted = chosen_df_sorted.iloc[:3]

        try:
            price_gbp_value = new_df[new_df['sku'] == sku]['price_in_gbp'].iloc[0]
        except IndexError:
            price_gbp_value = None

        chosen_df_sorted['price_in_gbp'] = price_gbp_value
        chosen_df_sorted['sku'] = sku
        chosen_df_sorted['Forecast'] = (
            pd.to_numeric(chosen_df_sorted['Forecast'], errors='coerce')
              .fillna(0)
              .pipe(np.rint)
              .astype(int)
        )

        all_forecasts = pd.concat(
            [all_forecasts, chosen_df_sorted[['Month','Forecast','sku','price_in_gbp']]],
            ignore_index=True
        )

    forecast_path = os.path.join(UPLOAD_FOLDER, f'forecasts_for_{user_id}_{country}.xlsx')
    _af = all_forecasts.copy()
    _af.rename(columns={'Month': 'month', 'Forecast': 'forecast'}, inplace=True)
    _af[['sku', 'month', 'forecast', 'price_in_gbp']].to_excel(forecast_path, index=False)

    all_forecasts['Month'] = pd.to_datetime(all_forecasts['Month'], errors='coerce')
    all_forecasts = all_forecasts.dropna(subset=['Month'])
    all_forecasts['Month'] = all_forecasts['Month'].dt.strftime("%b'%y")

    # 🔴 ARIMA month labels now based on global_last_training_month (last full month in data)
    anchor_dt = global_last_training_month.to_timestamp()
    arima_months = [month_label(add_months(anchor_dt, i)) for i in range(1, 3 + 1)]

    forecast_pivot = (
        all_forecasts.pivot_table(index='sku', columns='Month', values='Forecast', aggfunc='sum')
        .reset_index()
        .fillna(0)
        .round()
    )
    forecast_pivot.columns.name = None
    for col in arima_months:
        if col not in forecast_pivot.columns:
            forecast_pivot[col] = 0
    monthwise_forecast_cols = [c for c in forecast_pivot.columns if c != 'sku']
    monthwise_forecast_cols = sorted(monthwise_forecast_cols, key=lambda s: datetime.strptime(s, "%b'%y"))
    forecast_totals = forecast_pivot[['sku'] + monthwise_forecast_cols].copy()

    # ============================================================
    # INVENTORY (DB): Fetch from Amazon DB (engine1)  — FIXED
    # ============================================================
    print("\n" + "="*60)
    print("INVENTORY DATA FETCH (fixed)")
    print("="*60)

    month_start = datetime(req_year, req_month_num, 1)
    month_end = (month_start + relativedelta(months=1)).replace(day=1)

    print(f"[INV] Window: {month_start:%Y-%m-%d} -> {month_end:%Y-%m-%d}")
    inv_sql_window = """
        SELECT DISTINCT ON (seller_sku)
               seller_sku AS "SKU",
               fulfillable_quantity AS "Ending Warehouse Balance",
               synced_at
        FROM public.inventory
        WHERE synced_at >= :start AND synced_at < :end
        ORDER BY seller_sku, synced_at DESC
    """
    inv_sql_fallback = """
        SELECT DISTINCT ON (seller_sku)
               seller_sku AS "SKU",
               fulfillable_quantity AS "Ending Warehouse Balance",
               synced_at
        FROM public.inventory
        ORDER BY seller_sku, synced_at DESC
    """
    params = {"start": month_start, "end": month_end}

    print("[INV] Executing windowed SQL…")
    try:
        inv_df = pd.read_sql(text(inv_sql_window), con=engine1, params=params)
        if inv_df.empty:
            print("[INV] No rows in the month window — falling back to latest overall snapshot.")
            inv_df = pd.read_sql(text(inv_sql_fallback), con=engine1)
        print(f"[INV] Rows fetched: {len(inv_df)}")
        if not inv_df.empty:
            print(inv_df.head(5).to_string())

        inventory_totals = inv_df[['SKU', 'Ending Warehouse Balance']].copy()
        inventory_totals.rename(columns={'SKU': 'sku'}, inplace=True)
        inventory_totals['Ending Warehouse Balance'] = pd.to_numeric(
            inventory_totals['Ending Warehouse Balance'], errors='coerce'
        ).fillna(0).astype(int)

        # normalized key for robust join
        inventory_totals['sku_norm'] = inventory_totals['sku'].map(_norm_sku)
        print(f"[INV] Unique normalized SKUs: {inventory_totals['sku_norm'].nunique()}")

    except Exception as e:
        print(f"[INV] ✗ ERROR querying inventory: {e}")
        import traceback; traceback.print_exc()
        inventory_totals = pd.DataFrame({"sku": [], "Ending Warehouse Balance": [], "sku_norm": []})

    print("="*60 + "\n")

    # ========== Sales summary + product names ==========
    table_name = f"user_{user_id}_{country}_{mv}{year}_data"
    if table_name in meta.tables:
        sales_table = Table(table_name, meta, autoload_with=engine)
        with engine.connect() as conn:
            sales_data = pd.read_sql(sales_table.select(), conn)
        sales_summary = (sales_data.groupby('sku')['quantity']
                         .sum().reset_index()
                         .rename(columns={'quantity': 'Last Month Sales(Units)'}))
        product_names = (sales_data.groupby('sku')['product_name']
                         .first().reset_index()
                         .rename(columns={'product_name': 'Product Name'}))
    else:
        sales_summary = pd.DataFrame(columns=['sku', 'Last Month Sales(Units)'])
        product_names = pd.DataFrame(columns=['sku', 'Product Name'])

    # ============================================================
    # MERGING FORECAST WITH INVENTORY — FIXED
    # ============================================================
    print("\n" + "="*60)
    print("MERGING FORECAST WITH INVENTORY (fixed)")
    print("="*60)

    # normalize forecast side
    forecast_totals = forecast_totals.copy()
    forecast_totals['sku_norm'] = forecast_totals['sku'].map(_norm_sku)

    print(f"[MERGE] Forecast unique norm SKUs: {forecast_totals['sku_norm'].nunique()}")
    print(f"[MERGE] Inventory unique norm SKUs: {inventory_totals['sku_norm'].nunique()}")

    common = set(forecast_totals['sku_norm']) & set(inventory_totals['sku_norm'])
    print(f"[MERGE] Common (normalized) SKUs: {len(common)}")
    if common:
        print(f"[MERGE] Example keys: {list(sorted(common))[:5]}")

    # join on normalized key; keep original sku for display
    inventory_forecast = forecast_totals.merge(
        inventory_totals[['sku_norm', 'Ending Warehouse Balance']],
        on='sku_norm', how='left'
    ).drop(columns=['sku_norm'])

    inventory_forecast.rename(
        columns={'Ending Warehouse Balance': 'Inventory at Month End'},
        inplace=True
    )

    inventory_forecast['Inventory at Month End'] = (
        pd.to_numeric(inventory_forecast['Inventory at Month End'], errors='coerce')
          .fillna(0)
          .astype(int)
    )

    print(f"[MERGE] ✓ After inventory merge: {len(inventory_forecast)} rows")
    print(f"[MERGE] ✓ Non-zero inventory rows: "
          f"{(inventory_forecast['Inventory at Month End'] > 0).sum()}")
    print(inventory_forecast[['sku', 'Inventory at Month End']].head(10).to_string())

    # forecast_totals already built above — apply hotfix join (latest per SKU)
    inventory_forecast = fetch_and_merge_inventory_hotfix(forecast_totals, engine1)

    # Merge sales summary & product names
    inventory_forecast = inventory_forecast.merge(sales_summary, on='sku', how='left').fillna(0)
    inventory_forecast = inventory_forecast.merge(product_names, on='sku', how='left').fillna("")

    print("="*60 + "\n")

    # ----------------- Classification -----------------
    sku_classification = classify_skus_from_inventory(
        user_id, country, mv, year, engine1, sales_df=new_df
    )
    inventory_forecast['SKU Type'] = (
        inventory_forecast['sku'].map(sku_classification).fillna('Irregular')
    )

    # ----------------- Recent monthly actuals -----------------
    monthly_actuals = (
        new_df.groupby('sku')['quantity']
        .resample('M')
        .sum()
        .rename_axis(index=['sku', 'Month'])
        .reset_index()
    )
    recent_hist_map = {}
    for sku, g in monthly_actuals.groupby('sku'):
        last4 = g.sort_values('Month').tail(4)['quantity'].tolist()
        if len(last4) >= 2:
            recent_hist_map[sku] = last4

    # Yeh sold columns still mv/year pe based hain (3 months back from requested month)
    req_anchor_dt = datetime(req_year, req_month_num, 1)
    sold_m3 = month_label(add_months(req_anchor_dt, -3))
    sold_m2 = month_label(add_months(req_anchor_dt, -2))
    sold_m1 = month_label(add_months(req_anchor_dt, -1))
    sold_labels = [sold_m3, sold_m2, sold_m1]

    monthly_actuals['Label'] = pd.to_datetime(monthly_actuals['Month']).dt.strftime("%b'%y")
    last3_sold_pivot = (
        monthly_actuals[monthly_actuals['Label'].isin(sold_labels)]
        .pivot_table(index='sku', columns='Label', values='quantity', aggfunc='sum')
        .reset_index()
        .fillna(0)
    )
    for lbl in sold_labels:
        if lbl not in last3_sold_pivot.columns:
            last3_sold_pivot[lbl] = 0.0
    rename_map = {lbl: f"{lbl} Sold" for lbl in sold_labels}
    last3_sold_pivot = last3_sold_pivot.rename(columns=rename_map)

    inventory_forecast = inventory_forecast.merge(
        last3_sold_pivot[['sku', f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]],
        on='sku', how='left'
    ).fillna(0)

    # ----------------- Remaining months -----------------
    extra_months = max(transit_time + stock_unit - 3, 0)

    # 🔴 Start extra months after the 3 ARIMA anchor months (based on training anchor)
    anchor_dt_for_future = global_last_training_month.to_timestamp()
    start_after_third = add_months(anchor_dt_for_future, 4)  # month after 3rd forecast month

    future_month_columns = [month_label(add_months(start_after_third, i)) for i in range(extra_months)]
    future_month_columns = [m for m in future_month_columns if m not in monthwise_forecast_cols]
    for m in future_month_columns:
        if m not in inventory_forecast.columns:
            inventory_forecast[m] = 0.0

    base_months_map = {sku: (4 if model_winner.get(sku) == 'HYBRID' else 3)
                       for sku in inventory_forecast['sku'].tolist() if sku != 'Total'}

    inventory_forecast = calculate_remaining_months_v2(
        user_id, country, inventory_forecast, transit_time, stock_unit, recent_hist_map,
        base_months_map=base_months_map,
        anchor_months_all=monthwise_forecast_cols
    )

    all_future_cols = future_month_columns[:]
    anchor_cols_sorted = monthwise_forecast_cols

    # ----------------- Projected totals -----------------
    projected_totals = []
    for _, row in inventory_forecast.iterrows():
        sku = row['sku']
        if sku == 'Total':
            projected_totals.append(0.0)
            continue

        base = 4 if model_winner.get(sku) == 'HYBRID' else 3
        window = int(transit_time + stock_unit)
        extra = max(window - base, 0)

        base_cols = anchor_cols_sorted[:base]
        base_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in base_cols))

        start_idx = 0 if base == 3 else 1
        rem_cols = all_future_cols[start_idx:start_idx + extra]
        rem_sum = float(sum(row[c] if c in inventory_forecast.columns else 0.0 for c in rem_cols)) if rem_cols else 0.0

        projected_totals.append(base_sum + rem_sum)

    # Save projected sales totals
    inventory_forecast['Projected Sales Total'] = np.rint(projected_totals).astype(int)

    # ==== Dispatch & balances ====
    inventory_forecast['Dispatch'] = (
        (inventory_forecast['Projected Sales Total'] - inventory_forecast['Inventory at Month End'])
        .clip(lower=0)
        .pipe(np.rint)
        .astype(int)
    )
    inventory_forecast['Current Inventory + Dispatch'] = (
        inventory_forecast['Dispatch'] + inventory_forecast['Inventory at Month End']
    ).astype(int)

    # ==== Coverage Ratio (before dispatch) ====
    divisor = inventory_forecast['Last Month Sales(Units)'].replace(0, np.nan)
    coverage = (inventory_forecast['Inventory at Month End'] / divisor).round(2)
    inventory_forecast['Inventory Coverage Ratio Before Dispatch'] = coverage.where(coverage.notna(), "-")

    # ----------------- Totals row -----------------
    sold_cols = [f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"]
    numeric_columns = ['Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)'] \
                      + sold_cols + monthwise_forecast_cols + future_month_columns
    numeric_columns = [c for c in numeric_columns if c in inventory_forecast.columns]

    total_row = pd.DataFrame([np.rint(inventory_forecast[numeric_columns].sum()).astype(int)], index=['Total'])
    total_row.insert(0, 'sku', 'Total')
    total_row['Product Name'] = 'Total'
    total_row['SKU Type'] = '-'
    total_row['Inventory Coverage Ratio Before Dispatch'] = '-'

    inventory_forecast = pd.concat([inventory_forecast, total_row], ignore_index=True)

    # ----------------- Ensure integer cols -----------------
    int_cols = monthwise_forecast_cols + future_month_columns + [
        'Projected Sales Total', 'Inventory at Month End', 'Last Month Sales(Units)',
        'Dispatch', 'Current Inventory + Dispatch',
        f"{sold_m3} Sold", f"{sold_m2} Sold", f"{sold_m1} Sold"
    ]
    int_cols = [c for c in int_cols if c in inventory_forecast.columns]
    for c in int_cols:
        inventory_forecast[c] = (
            pd.to_numeric(inventory_forecast[c], errors='coerce')
              .fillna(0)
              .pipe(np.rint)
              .astype(int)
        )

    # ✅ Remove legacy column if it exists
    inventory_forecast.drop(columns=['Inventory Projection'], errors='ignore', inplace=True)

    # ----------------- Final selection -----------------
    final_columns = [
        'sku', 'Product Name', 'SKU Type', 'Last Month Sales(Units)',
        f"{sold_m3} Sold", f"{sold_m2} Sold",
        'Projected Sales Total',
        'Inventory at Month End',
        'Inventory Coverage Ratio Before Dispatch',
        'Dispatch', 'Current Inventory + Dispatch'
    ] + monthwise_forecast_cols + future_month_columns
    final_columns = [c for c in final_columns if c in inventory_forecast.columns]
    print("Selected columns passed to frontend:", final_columns)

    inventory_forecast = inventory_forecast[final_columns]

    # ----------------- Save -----------------
    current_month = datetime.now().strftime("%b").lower()
    inventory_output_path = os.path.join(
        UPLOAD_FOLDER, f'inventory_forecast_{user_id}_{country}_{current_month}+2.xlsx'
    )
    inventory_forecast.to_excel(inventory_output_path, index=False)
    print(f"\n[SAVE] ✓ File saved: {inventory_output_path}")

    inventory_forecast_base64 = encode_file_to_base64(inventory_output_path)
    return jsonify({'message': 'Inventory processed successfully', 'file_path': inventory_output_path}), 200




# ============================== FILE ENCODER ==============================
def encode_file_to_base64(file_path):
    try:
        with open(file_path, "rb") as file:
            return base64.b64encode(file.read()).decode("utf-8")
    except Exception as e:
        print(f"Error encoding file to base64: {e}")
        return None

