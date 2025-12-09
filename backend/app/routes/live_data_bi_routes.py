from flask import Blueprint, request, jsonify
import jwt
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from config import Config
from calendar import month_name, month_abbr, monthrange
from datetime import date, datetime, timedelta
import pandas as pd
import numpy as np
from openai import OpenAI
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from app.utils.formulas_utils import (
    uk_sales,
    uk_credits,
    uk_profit,
    sku_mask,
    safe_num,
)
from app.utils.email_utils import send_live_bi_email , get_user_email_by_id, has_recent_bi_email, mark_bi_email_sent
# -----------------------------------------------------------------------------
# ENV / DB SETUP
# -----------------------------------------------------------------------------

load_dotenv()
SECRET_KEY = Config.SECRET_KEY

db_url = os.getenv("DATABASE_URL")           # historical / settlement-style
db_url2 = os.getenv("DATABASE_AMAZON_URL")   # amazon orders (Order model)

engine_hist = create_engine(db_url)
engine_live = create_engine(db_url2)

# 🔹 NEW: OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
oa_client = OpenAI(api_key=OPENAI_API_KEY)

live_data_bi_bp = Blueprint("live_data_bi_bp", __name__)


# -----------------------------------------------------------------------------
# DATE HELPERS
# -----------------------------------------------------------------------------



# ENV / DB SETUP ke paas, jaha engine_hist / engine_live define hua hai
def is_blank_str(x):
    return x is None or (isinstance(x, str) and x.strip() == "")

def fetch_sku_product_mapping(user_id: int) -> pd.DataFrame:
    """
    sku_{user_id}_data_table se sku_uk -> product_name mapping uthata hai.
    Sirf VALID mappings return karega:
      - sku_uk present ho
      - product_name present ho (non-null, non-empty)
    """
    table_name = f"sku_{user_id}_data_table"

    query = text(f"""
        SELECT
            sku_uk,
            product_name
        FROM {table_name}
    """)

    with engine_hist.connect() as conn:
        df = pd.read_sql(query, conn)

    # null / duplicate clean up
    if df.empty:
        return df

    # ✅ sku must exist
    df = df.dropna(subset=["sku_uk"])

    # ✅ product_name must exist and must not be blank
    df = df.dropna(subset=["product_name"])
    df["product_name"] = df["product_name"].astype(str)
    df = df[df["product_name"].str.strip() != ""]

    # ✅ normalize sku column for joining
    df = df.rename(columns={"sku_uk": "sku"})

    # optional: sku as string (safer for joins if orders.sku is string)
    df["sku"] = df["sku"].astype(str).str.strip()

    # ✅ remove duplicates
    df = df.drop_duplicates(subset=["sku"])

    return df


def get_mtd_and_prev_ranges(as_of=None, start_day=None, end_day=None):
    """
    Default:
      - current: current month 1st -> today (MTD)
      - previous: previous month 1st -> previous month LAST day (full month)

    Agar start_day & end_day diye gaye hain (frontend date range se):
      - current: current month [start_day, end_day] (clamped to month length & today)
      - previous: previous month [start_day, end_day] (clamped to that month length)
    """
    # --- resolve today / as_of ---
    if as_of is None:
        today = date.today()
    else:
        if isinstance(as_of, str):
            today = datetime.strptime(as_of, "%Y-%m-%d").date()
        elif isinstance(as_of, date):
            today = as_of
        else:
            today = date.today()

    # prev month/year
    if today.month == 1:
        prev_month = 12
        prev_year = today.year - 1
    else:
        prev_month = today.month - 1
        prev_year = today.year

    # ---------- custom day range ----------
    if start_day and end_day:
        sd = int(min(start_day, end_day))
        ed = int(max(start_day, end_day))

        # current month clamp
        last_day_curr = monthrange(today.year, today.month)[1]
        sd_curr = max(1, min(sd, last_day_curr))
        # end ko month & today dono se clamp kar do (future days avoid)
        ed_curr = max(1, min(ed, last_day_curr, today.day))

        current_period_start = date(today.year, today.month, sd_curr)
        current_period_end = date(today.year, today.month, ed_curr)

        # previous month clamp
        last_day_prev = monthrange(prev_year, prev_month)[1]
        sd_prev = max(1, min(sd, last_day_prev))
        ed_prev = max(1, min(ed, last_day_prev))

        prev_month_start = date(prev_year, prev_month, sd_prev)
        prev_month_end = date(prev_year, prev_month, ed_prev)

    # ---------- default behaviour (no range) ----------
    else:
        current_period_start = date(today.year, today.month, 1)
        current_period_end = today

        prev_month_start = date(prev_year, prev_month, 1)
        last_day_prev = monthrange(prev_year, prev_month)[1]

        # ✅ Align previous end day to current MTD day (clamp to prev month length)
        prev_end_day = min(today.day, last_day_prev)
        prev_month_end = date(prev_year, prev_month, prev_end_day)

    return {
        "current": {
            "start": current_period_start,
            "end": current_period_end,
        },
        "previous": {
            "start": prev_month_start,
            "end": prev_month_end,
        },
        "meta": {
            "today": today,
            "current_month": today.month,
            "current_year": today.year,
            "previous_month": prev_month,
            "previous_year": prev_year,
        },
    }


def month_num_to_name(m):
    try:
        m_int = int(m)
        return month_name[m_int].lower() if 1 <= m_int <= 12 else None
    except Exception:
        return None


def construct_prev_table_name(user_id, country, month, year):
    """
    user_{user_id}_{country_lower}_{monthname}{year}_data
    e.g. user_10_uk_october2025_data
    """
    month_str = month_num_to_name(month)
    if not month_str:
        raise ValueError("Invalid month")
    return f"user_{user_id}_{country.lower()}_{month_str}{year}_data"


# -----------------------------------------------------------------------------
# METRIC COMPUTATION PER SKU (using formula_utils)
# -----------------------------------------------------------------------------

def compute_sku_metrics_from_df(df: pd.DataFrame) -> list:
    """
    Given a raw settlement-style DataFrame with columns like:

      sku, quantity, product_sales, cost_of_unit_sold, etc.

    compute per-SKU metrics:

      quantity
      net_sales
      profit
      asp
      unit_wise_profitability
      sales_mix
      product_name
    """
    if df is None or df.empty:
        return []

    df = df.copy()

    # Keep only valid SKUs (same rule as formula_utils)
    if "sku" in df.columns:
        df = df.loc[sku_mask(df)]

    if df.empty:
        return []

    # ---- quantity per SKU ----
    if "quantity" in df.columns:
        qty_df = (
            df.assign(quantity=safe_num(df["quantity"]))
              .groupby("sku", as_index=False)["quantity"]
              .sum()
        )
    else:
        qty_df = pd.DataFrame(columns=["sku", "quantity"])

    # ---- product_name per SKU (first non-null) ----
    if "product_name" in df.columns:
        name_df = (
            df[["sku", "product_name"]]
            .dropna(subset=["sku"])
            .groupby("sku", as_index=False)
            .first()
        )
    else:
        name_df = pd.DataFrame(columns=["sku", "product_name"])

    # ---- sales, credits, profit per SKU via formula_utils ----
    _, sales_by, _ = uk_sales(df)
    _, credits_by, _ = uk_credits(df)
    _, profit_by, _ = uk_profit(df)

    if not sales_by.empty:
        sales_by = sales_by.rename(columns={"__metric__": "sales_metric"})
    if not credits_by.empty:
        credits_by = credits_by.rename(columns={"__metric__": "credits_metric"})
    if not profit_by.empty:
        profit_by = profit_by.rename(columns={"__metric__": "profit_metric"})

    # ---- merge everything ----
    metrics = (
        qty_df.merge(name_df, on="sku", how="left")
              .merge(
                  sales_by[["sku", "sales_metric"]]
                  if not sales_by.empty
                  else pd.DataFrame(columns=["sku", "sales_metric"]),
                  on="sku", how="left"
              )
              .merge(
                  credits_by[["sku", "credits_metric"]]
                  if not credits_by.empty
                  else pd.DataFrame(columns=["sku", "credits_metric"]),
                  on="sku", how="left"
              )
              .merge(
                  profit_by[["sku", "profit_metric"]]
                  if not profit_by.empty
                  else pd.DataFrame(columns=["sku", "profit_metric"]),
                  on="sku", how="left"
              )
    )

    # ---- compute final fields ----
    metrics["quantity"] = safe_num(metrics["quantity"])
    metrics["sales_metric"] = safe_num(metrics.get("sales_metric", 0.0))
    metrics["credits_metric"] = safe_num(metrics.get("credits_metric", 0.0))
    metrics["profit_metric"] = safe_num(metrics.get("profit_metric", 0.0))

    metrics["net_sales"] = metrics["sales_metric"] + metrics["credits_metric"]
    metrics["profit"] = metrics["profit_metric"]

    # asp & per-unit profitability
    qty_nonzero = metrics["quantity"].replace(0, np.nan)
    metrics["asp"] = metrics["net_sales"] / qty_nonzero
    metrics["unit_wise_profitability"] = metrics["profit"] / qty_nonzero

    # sales_mix (% of net_sales)
    total_net_sales = float(metrics["net_sales"].sum())
    if total_net_sales != 0:
        metrics["sales_mix"] = (metrics["net_sales"] / total_net_sales) * 100.0
    else:
        metrics["sales_mix"] = 0.0

    # final list of dicts expected by growth logic
    out_cols = [
        "sku",
        "product_name",
        "quantity",
        "asp",
        "profit",
        "sales_mix",
        "net_sales",
        "unit_wise_profitability",
    ]
    return (
        metrics[out_cols]
        .replace({np.nan: None})
        .to_dict(orient="records")
    )


# -----------------------------------------------------------------------------
# FETCH DATA: PREVIOUS PERIOD (historical table) + CURRENT MTD (orders)
# -----------------------------------------------------------------------------

def fetch_previous_period_data(user_id, country, prev_start: date, prev_end: date):
    """
    Return:
      sku_metrics: list of per-SKU metrics (for growth calc)
      daily_series: list of {date, quantity, net_sales} for line chart
    """
    table_name = construct_prev_table_name(
        user_id=user_id,
        country=country,
        month=prev_start.month,
        year=prev_start.year,
    )

    # Debug: show constructed table name
    print(f"[DEBUG] Previous Period Table: {table_name}")

    # Safer approach:
    #  - build a subquery that casts date_time to date_ts
    #  - use NULLIF to avoid casting '0' / '' values
    query = text(f"""
        SELECT *
        FROM (
            SELECT
                *,
                NULLIF(NULLIF(date_time, '0'), '')::timestamp AS date_ts
            FROM {table_name}
        ) t
        WHERE date_ts >= :start_date
          AND date_ts < :end_date_plus_one
    """)

    params = {
        "start_date": datetime.combine(prev_start, datetime.min.time()),
        "end_date_plus_one": datetime.combine(prev_end + timedelta(days=1), datetime.min.time()),
    }

    # Debug: show SQL + params
    print("[DEBUG] SQL for previous period:")
    print(query)
    print("[DEBUG] Params:", params)

    with engine_hist.connect() as conn:
        result = conn.execute(query, params)
        rows = result.fetchall()

        # Debug: row count
        print(f"[DEBUG] Fetched {len(rows)} rows from {table_name}")

        if len(rows) > 0:
            # Show first 2 rows for sanity
            print("[DEBUG] First rows:", rows[:2])

        if not rows:
            print("[DEBUG] No previous period data found.")
            return [], []

        df = pd.DataFrame(rows, columns=result.keys())

    # Debug: DataFrame shape
    print(f"[DEBUG] DataFrame shape: {df.shape}")
    print(f"[DEBUG] DataFrame columns: {list(df.columns)}")

    # ---- per-SKU metrics (existing behaviour) ----
    sku_metrics = compute_sku_metrics_from_df(df)

    # Debug: Number of SKU items returned
    print(f"[DEBUG] SKU Metrics Count: {len(sku_metrics)}")

    # ---- daily series for line chart (quantity + net_sales) ----
    daily_series = []

    # Prefer using the parsed timestamp column if present
    date_col_for_series = None
    if "date_ts" in df.columns:
        date_col_for_series = "date_ts"
    elif "date_time" in df.columns:
        date_col_for_series = "date_time"

    if date_col_for_series:
        tmp = df.copy()
        tmp["date_only"] = pd.to_datetime(tmp[date_col_for_series]).dt.date

        # quantity per day (agar column hai)
        if "quantity" in tmp.columns:
            tmp["quantity"] = safe_num(tmp["quantity"])
            daily_qty = (
                tmp.groupby("date_only", as_index=False)["quantity"]
                   .sum()
            )
            qty_map = {
                d: float(q)
                for d, q in zip(daily_qty["date_only"], daily_qty["quantity"])
            }
        else:
            qty_map = {}

        # net_sales per day (yahan simple approx: product_sales ka sum)
        if "product_sales" in tmp.columns:
            tmp["product_sales"] = safe_num(tmp["product_sales"])
            daily_sales = (
                tmp.groupby("date_only", as_index=False)["product_sales"]
                   .sum()
            )
            sales_map = {
                d: float(v)
                for d, v in zip(daily_sales["date_only"], daily_sales["product_sales"])
            }
        else:
            sales_map = {}

        all_dates = sorted(set(qty_map.keys()) | set(sales_map.keys()))

        for d in all_dates:
            daily_series.append(
                {
                    "date": d.isoformat(),
                    "quantity": qty_map.get(d, 0.0) if qty_map else None,
                    "net_sales": sales_map.get(d, 0.0) if sales_map else None,
                }
            )

        # Debug: line chart points
        print(f"[DEBUG] Daily series points: {len(daily_series)}")

    return sku_metrics, daily_series


def fetch_current_mtd_data(user_id, country, curr_start: date, curr_end: date, is_global: bool):
    """
    Return:
      sku_metrics: list of per-SKU metrics (manual aggregation, no formula utils)
      daily_series: list of {date, quantity, net_sales} for line chart

    Notes:
      - NO country/is_global filtering is applied here (as requested).
      - Uses orders.profit and orders.cogs directly (assumes cogs is TOTAL per row).
      - Manually calculates:
          asp = net_sales / quantity
          unit_wise_profitability = profit / quantity
          profit_per_unit = profit / quantity
          sales_mix = net_sales share %
    """
    table_name = "orders"

    query = text(f"""
        SELECT
            sku,
            product_name,
            quantity,
            cogs,
            total_amount,
            profit,
            country,
            purchase_date,
            order_status
        FROM {table_name}
        WHERE user_id = :user_id
          AND purchase_date >= :start_date
          AND purchase_date < :end_date_plus_one
    """)

    params = {
        "user_id": user_id,
        "start_date": datetime.combine(curr_start, datetime.min.time()),
        "end_date_plus_one": datetime.combine(curr_end + timedelta(days=1), datetime.min.time()),
    }

    print("\n[DEBUG] CURRENT MTD QUERY")
    print(query)
    print("[DEBUG] Params:", params)

    with engine_live.connect() as conn:
        result = conn.execute(query, params)
        rows = result.fetchall()
        print(f"[DEBUG] Current MTD rows fetched (full filter): {len(rows)}")

        if not rows:
            print("[DEBUG] No current MTD data found in orders table.")

            diag1 = conn.execute(text("""
                SELECT MIN(purchase_date), MAX(purchase_date), COUNT(*)
                FROM orders
                WHERE user_id = :user_id
            """), {"user_id": user_id}).fetchone()
            print("[DEBUG] User-level date range in orders:", diag1)

            diag2 = conn.execute(text("""
                SELECT DISTINCT country
                FROM orders
                WHERE user_id = :user_id
            """), {"user_id": user_id}).fetchall()
            print("[DEBUG] Countries for this user in orders:", diag2)

            diag3 = conn.execute(text("""
                SELECT DISTINCT order_status
                FROM orders
                WHERE user_id = :user_id
            """), {"user_id": user_id}).fetchall()
            print("[DEBUG] Order statuses for this user in orders:", diag3)

            return [], []

        df = pd.DataFrame(rows, columns=result.keys())

    # ✅ default assume "unmapped"
    df["__has_mapping__"] = False

    # 🔹 SKU mapping se product_name override + __has_mapping__ flag set
    try:
        sku_map_df = fetch_sku_product_mapping(user_id)  # only valid mappings
        if not sku_map_df.empty:
            print(f"[DEBUG] Merging SKU mapping for user_id={user_id}")

            df["sku"] = df["sku"].astype(str).str.strip()
            sku_map_df = sku_map_df.copy()
            sku_map_df["sku"] = sku_map_df["sku"].astype(str).str.strip()

            mapped_skus = set(sku_map_df["sku"].dropna())
            df["__has_mapping__"] = df["sku"].isin(mapped_skus)

            df = df.merge(
                sku_map_df,
                on="sku",
                how="left",
                suffixes=("", "_from_sku_table"),
            )

            if "product_name_from_sku_table" in df.columns:
                df["product_name"] = df["product_name_from_sku_table"].combine_first(df.get("product_name"))
                df.drop(columns=["product_name_from_sku_table"], inplace=True)
        else:
            print("[DEBUG] SKU mapping DF empty, using product_name from orders table only.")
    except Exception as e:
        print("[WARN] Failed to fetch/merge SKU product mapping:", e)

    # ----------------------------
    # ✅ Manual prep (no formula utils)
    # ----------------------------
    df["quantity"] = safe_num(df.get("quantity", 0))
    df["total_amount"] = safe_num(df.get("total_amount", 0))
    df["profit"] = safe_num(df.get("profit", 0))
    df["cogs"] = safe_num(df.get("cogs", 0))  # assumed TOTAL COGS per row

    # ----------------------------
    # ---- per-SKU metrics (manual but compatible with growth pipeline) ----
    # ----------------------------
    sku_agg = (
        df.groupby("sku", as_index=False)
          .agg(
              product_name=("product_name", "first"),
              quantity=("quantity", "sum"),
              net_sales=("total_amount", "sum"),
              profit=("profit", "sum"),
              cogs=("cogs", "sum"),
              __has_mapping__=("__has_mapping__", "max"),
          )
    )

    qty_nonzero = sku_agg["quantity"].replace(0, np.nan)

    # Required by existing growth + AI logic
    sku_agg["asp"] = (sku_agg["net_sales"] / qty_nonzero).fillna(0.0)
    sku_agg["unit_wise_profitability"] = (sku_agg["profit"] / qty_nonzero).fillna(0.0)

    total_net_sales = float(sku_agg["net_sales"].sum())
    sku_agg["sales_mix"] = (sku_agg["net_sales"] / total_net_sales * 100.0) if total_net_sales else 0.0

    # Your requested metric
    sku_agg["profit_per_unit"] = sku_agg["unit_wise_profitability"]

    sku_metrics = sku_agg.to_dict(orient="records")

    # ----------------------------
    # ---- daily series for line chart (quantity + net_sales) ----
    # ----------------------------
    daily_series = []
    if "purchase_date" in df.columns:
        tmp = df.copy()
        tmp["date_only"] = pd.to_datetime(tmp["purchase_date"]).dt.date

        daily_qty = tmp.groupby("date_only", as_index=False)["quantity"].sum()
        qty_map = {d: float(q) for d, q in zip(daily_qty["date_only"], daily_qty["quantity"])}

        daily_sales = tmp.groupby("date_only", as_index=False)["total_amount"].sum()
        sales_map = {d: float(v) for d, v in zip(daily_sales["date_only"], daily_sales["total_amount"])}

        for d in sorted(set(qty_map.keys()) | set(sales_map.keys())):
            daily_series.append(
                {
                    "date": d.isoformat(),
                    "quantity": qty_map.get(d, 0.0),
                    "net_sales": sales_map.get(d, 0.0),
                }
            )

    return sku_metrics, daily_series

# -----------------------------------------------------------------------------
# GROWTH METRIC CALCULATION (same formulas as Business Insights)
# -----------------------------------------------------------------------------

growth_field_mapping = {
    "quantity": "Unit Growth (%)",
    "asp": "ASP Growth (%)",
    "net_sales": "Sales Growth (%)",
    "sales_mix": "Sales Mix Change (%)",
    "unit_wise_profitability": "Profit Per Unit (%)",
    "profit": "CM1 Profit Impact (%)",
}


def categorize_growth(value):
    if value is None:
        return "No Data"
    if value >= 5:
        return "High Growth"
    elif value > 0.5:
        return "Low Growth"
    elif value < -0.5:
        return "Negative Growth"
    else:
        return "No Growth"


def safe_float_local(val):
    try:
        if val is None:
            return None
        return float(val)
    except (ValueError, TypeError):
        return None

def round_numeric_values(obj, ndigits=2):
    """
    Recursively walk any dict/list and:
    - round floats to `ndigits`
    - convert None / NaN to 0.0 (so UI blanks don't appear)
    """

    # ✅ None -> 0
    if obj is None:
        return 0.0

    # ✅ NaN (python float) -> 0
    if isinstance(obj, float) and np.isnan(obj):
        return 0.0

    # float -> round
    if isinstance(obj, float):
        return round(obj, ndigits)

    # numpy floats -> round (NaN safe)
    if isinstance(obj, (np.floating,)):
        v = float(obj)
        if np.isnan(v):
            return 0.0
        return round(v, ndigits)

    # numpy ints -> normal int
    if isinstance(obj, (np.integer,)):
        return int(obj)

    # dict -> recurse values
    if isinstance(obj, dict):
        return {k: round_numeric_values(v, ndigits) for k, v in obj.items()}

    # list/tuple -> recurse items
    if isinstance(obj, (list, tuple)):
        return [round_numeric_values(v, ndigits) for v in obj]

    # strings/bool/etc as-is
    return obj


def build_segment_total_row(prev_segment, curr_segment, key="sku", label="Total"):
    """
    prev_segment / curr_segment: subset of prev_data / curr_data
    (sirf woh SKUs jo top_80 me hain, etc.)

    Return: ek row jaisa calculate_growth deta hai, bas aggregated.
    """
    # ---- totals for quantity / net_sales / profit ----
    prev_qty = prev_net = prev_prof = 0.0
    curr_qty = curr_net = curr_prof = 0.0

    # previous
    for r in prev_segment:
        q = safe_float_local(r.get("quantity"))
        s = safe_float_local(r.get("net_sales"))
        p = safe_float_local(r.get("profit"))
        if q is not None: prev_qty += q
        if s is not None: prev_net += s
        if p is not None: prev_prof += p

    # current
    for r in curr_segment:
        q = safe_float_local(r.get("quantity"))
        s = safe_float_local(r.get("net_sales"))
        p = safe_float_local(r.get("profit"))
        if q is not None: curr_qty += q
        if s is not None: curr_net += s
        if p is not None: curr_prof += p

    # ASP / unit profit indexes (portfolio level)
    prev_asp = prev_net / prev_qty if prev_qty else None
    curr_asp = curr_net / curr_qty if curr_qty else None

    prev_up = prev_prof / prev_qty if prev_qty else None
    curr_up = curr_prof / curr_qty if curr_qty else None

    # sales mix (sum of sku-wise mix)
    prev_mix = sum(
        (safe_float_local(r.get("sales_mix")) or 0.0) for r in prev_segment
    )
    curr_mix = sum(
        (safe_float_local(r.get("sales_mix")) or 0.0) for r in curr_segment
    )

    # pseudo SKU rows
    seg_id = f"{label.upper().replace(' ', '_')}_SEGMENT"

    prev_row = {
        key: seg_id,
        "product_name": label,
        "quantity": prev_qty,
        "net_sales": prev_net,
        "profit": prev_prof,
        "asp": prev_asp,
        "unit_wise_profitability": prev_up,
        "sales_mix": prev_mix,
    }

    curr_row = {
        key: seg_id,
        "product_name": label,
        "quantity": curr_qty,
        "net_sales": curr_net,
        "profit": curr_prof,
        "asp": curr_asp,
        "unit_wise_profitability": curr_up,
        "sales_mix": curr_mix,
    }

    # existing logic reuse
    seg_growth_list = calculate_growth([prev_row], [curr_row], key=key)
    return seg_growth_list[0] if seg_growth_list else None


def calculate_growth(prev_data, curr_data, key="sku", numeric_fields=None) -> list:
    """
    prev_data / curr_data: list[dict] with keys
      quantity, asp, net_sales, sales_mix, unit_wise_profitability, profit, product_name, sku

    Returns, per SKU:
      - <field>_prev  (previous period raw value)
      - <field>_curr  (current MTD raw value)
      - % growth mapped via growth_field_mapping
      - Sales Mix (Current)  (for categorization / frontend)
      - new_or_reviving flag
    """
    if numeric_fields is None:
        numeric_fields = list(growth_field_mapping.keys())

    prev_dict = {row.get(key): row for row in prev_data if row.get(key)}
    results = []

    for row2 in curr_data:
        item_key = row2.get(key)
        if not item_key:
            continue

        growth_row = {
            "product_name": row2.get("product_name"),
            key: item_key,
        }

        # ---- Month2 / current sales mix ----
        sales_mix_curr = safe_float_local(row2.get("sales_mix"))
        growth_row["Sales Mix (Current)"] = round(sales_mix_curr, 2) if sales_mix_curr is not None else 0.0

        # -----------------------------
        # Case 1: Existing SKU (in prev_data)
        # -----------------------------
        if item_key in prev_dict:
            row1 = prev_dict[item_key]

            for field in numeric_fields:
                val1 = safe_float_local(row1.get(field))  # previous period
                val2 = safe_float_local(row2.get(field))  # current period

                # ✅ raw values for Excel/UI (no blanks)
                growth_row[f"{field}_prev"] = 0.0 if val1 is None else val1
                growth_row[f"{field}_curr"] = 0.0 if val2 is None else val2

                # ✅ % growth calculation (no blanks)
                if val1 is None or val2 is None:
                    growth = 0.0
                elif val1 != 0:
                    growth = round(((val2 - val1) / val1) * 100.0, 2)
                else:
                    # prev = 0 => undefined, but as per requirement send 0
                    growth = 0.0

                label = growth_field_mapping[field]  # e.g. "Unit Growth (%)"
                growth_row[label] = {
                    "category": categorize_growth(growth),
                    "value": growth,
                }

        # -----------------------------
        # Case 2: New / Reviving SKU
        # -----------------------------
        else:
            growth_row["new_or_reviving"] = True

            # prev row agar mil jaye (edge case: sku new_or_reviving mark hua, but prev_dict me row present ho sakta)
            row1 = prev_dict.get(item_key, {})  # {} => prev missing

            for field in numeric_fields:
                val1 = safe_float_local(row1.get(field))  # previous
                val2 = safe_float_local(row2.get(field))  # current

                # raw values
                growth_row[f"{field}_prev"] = 0.0 if val1 is None else val1
                growth_row[f"{field}_curr"] = 0.0 if val2 is None else val2

                label = growth_field_mapping[field]

                # ✅ RULE:
                # if prev > 0 => calculate growth %
                # if prev == 0 (or missing) => don't calculate, keep as "No Data"
                if val1 is not None and val1 > 0 and val2 is not None:
                    growth = round(((val2 - val1) / val1) * 100.0, 2)
                    growth_row[label] = {
                        "category": categorize_growth(growth),
                        "value": growth,
                    }
                else:
                    # prev is 0 / missing => keep "as-is" behavior
                    growth_row[label] = {
                        "category": "No Data",
                        "value": 0.0,
                    }


        results.append(growth_row)

    return results


#-----------------------------------------------------------------------------
# AI SUMMARY (overall header) – now via ChatGPT with numeric fallback
#-----------------------------------------------------------------------------
summary_numeric_fields = [
    "quantity",
    "net_sales",
    "profit",
    "asp",
    "unit_wise_profitability"
]


def aggregate_totals(rows, fields=None):
    """
    Sum key numeric fields across a list of SKU dicts.
    Used to get total units / sales / profit for each period.
    """
    if fields is None:
        fields = summary_numeric_fields

    totals = {f: 0.0 for f in fields}
    for row in rows:
        for f in fields:
            v = safe_float_local(row.get(f))
            if v is not None:
                totals[f] += v
    return totals


def pct_change(prev, curr):
    if prev is None or prev == 0:
        return None
    return round(((curr - prev) / prev) * 100.0, 1)


def describe_movement(pct):
    """
    Turn a % into a human phrase like 'up 4.2%' / 'strongly down 18.3%' / 'roughly flat'
    """
    if pct is None:
        return "roughly flat"

    abs_v = abs(pct)
    if abs_v < 1:
        return "roughly flat"

    direction = "up" if pct > 0 else "down"
    if abs_v < 5:
        intensity = ""
    elif abs_v < 15:
        intensity = "moderately "
    else:
        intensity = "strongly "

    return f"{intensity}{direction} {abs_v:.1f}%"


def _build_rule_based_summary(prev_totals, curr_totals, top_80_skus, new_reviving,
                              prev_label, curr_label):
    """
    Old numeric summary logic (fallback when AI fails).
    """
    qty_change = pct_change(prev_totals.get("quantity"),   curr_totals.get("quantity"))
    sales_change = pct_change(prev_totals.get("net_sales"), curr_totals.get("net_sales"))
    profit_change = pct_change(prev_totals.get("profit"),   curr_totals.get("profit"))

    bullets = []

    # 1) Overall movement
    bullets.append(
        f"{curr_label} vs {prev_label}: units are {describe_movement(qty_change)}, "
        f"sales are {describe_movement(sales_change)}, and CM1 profit is {describe_movement(profit_change)}."
    )

    # 2) Concentration in top SKUs
    bullets.append(
        f"{len(top_80_skus)} SKUs account for roughly 80% of current sales."
    )

    # 3) New / reviving SKUs
    if new_reviving:
        bullets.append(
            f"{len(new_reviving)} new or reviving SKUs are contributing incremental volume."
        )
    else:
        bullets.append(
            "No material contribution from new or reviving SKUs this period."
        )

    # keep between 2 and 4 bullet points
    return bullets[:4]

def build_sku_context(sku_rows, max_items=5):
    """
    Poore portfolio (ya jo bhi SKU list tum pass karo) ko kuch logical buckets
    me todta hai taaki AI summary/action bullets specific products ka naam
    le sake.

    Ye function AI ko product-focused labels deta hai — sirf product_name.
    """

    # ------------------------
    # IMPORTANT: Only product name as label
    # ------------------------
    def make_label(row):
        name = (row.get("product_name") or "").strip()
        sku = (row.get("sku") or "").strip()

        if name:
            return name   # ✅ product name first
        # fallback if product_name missing
        return "Unnamed SKU"

    fast_growing_profitable = []
    declining_high_mix = []
    flat_but_large = []

    def get_pct(row, key):
        obj = row.get(key) or {}
        return safe_float_local(obj.get("value"))

    # ------------------------
    # Build list of items with metrics
    # ------------------------
    for row in sku_rows:
        mix = safe_float_local(row.get("Sales Mix (Current)"))
        if mix is None:
            continue

        unit_g = get_pct(row, "Unit Growth (%)")
        asp_g = get_pct(row, "ASP Growth (%)")
        sales_g = get_pct(row, "Sales Growth (%)")
        mix_g = get_pct(row, "Sales Mix Change (%)")
        up_g   = get_pct(row, "Profit Per Unit (%)")
        prof_g = get_pct(row, "CM1 Profit Impact (%)")

        item = {
            "label": make_label(row),            # ✅ AI ab product name se refer karega
            "sku": row.get("sku"),
            "product_name": row.get("product_name"),

            # current mix
            "sales_mix_curr": mix,

            # % growth
            "unit_growth_pct": unit_g,
            "asp_growth_pct": asp_g,
            "sales_growth_pct": sales_g,
            "mix_change_pct": mix_g,
            "unit_profit_pct": up_g,
            "profit_growth_pct": prof_g,

            # raw previous/current values
            "quantity_prev": safe_float_local(row.get("quantity_prev")),
            "quantity_curr": safe_float_local(row.get("quantity_curr")),
            "asp_prev": safe_float_local(row.get("asp_prev")),
            "asp_curr": safe_float_local(row.get("asp_curr")),
            "net_sales_prev": safe_float_local(row.get("net_sales_prev")),
            "net_sales_curr": safe_float_local(row.get("net_sales_curr")),
            "sales_mix_prev": safe_float_local(row.get("sales_mix_prev")),
            "sales_mix_curr_raw": safe_float_local(row.get("sales_mix_curr")),
            "unit_profit_prev": safe_float_local(row.get("unit_wise_profitability_prev")),
            "unit_profit_curr": safe_float_local(row.get("unit_wise_profitability_curr")),
            "profit_prev": safe_float_local(row.get("profit_prev")),
            "profit_curr": safe_float_local(row.get("profit_curr")),
        }

        # ------------------------
        # Categorization
        # ------------------------
        if (
            sales_g is not None
            and prof_g is not None
            and sales_g > 5
            and prof_g > 5
            and mix >= 2
        ):
            fast_growing_profitable.append(item)

        elif sales_g is not None and sales_g < -5 and mix >= 2:
            declining_high_mix.append(item)

        elif mix >= 5 and (sales_g is None or abs(sales_g) <= 2):
            flat_but_large.append(item)

    # ------------------------
    # Sort & trim
    # ------------------------
    fast_growing_profitable = sorted(
        fast_growing_profitable,
        key=lambda x: x["sales_growth_pct"] or 0,
        reverse=True,
    )[:max_items]

    declining_high_mix = sorted(
        declining_high_mix,
        key=lambda x: x["sales_growth_pct"] or 0,
    )[:max_items]

    flat_but_large = sorted(
        flat_but_large,
        key=lambda x: x["sales_mix_curr"] or 0,
        reverse=True,
    )[:max_items]

    return {
        "fast_growing_profitable": fast_growing_profitable,
        "declining_high_mix": declining_high_mix,
        "flat_but_large": flat_but_large,
    }


def build_ai_summary(
    prev_totals,
    curr_totals,
    top_80_skus,
    new_reviving,
    prev_label,
    curr_label,
    sku_context=None,
):
    def safe0(x):
        v = safe_float_local(x)
        return v if v is not None else 0.0

    # Overall numeric values
    qty_prev = safe0(prev_totals.get("quantity"))
    qty_curr = safe0(curr_totals.get("quantity"))

    sales_prev = safe0(prev_totals.get("net_sales"))
    sales_curr = safe0(curr_totals.get("net_sales"))

    prof_prev = safe0(prev_totals.get("profit"))
    prof_curr = safe0(curr_totals.get("profit"))

    asp_prev_idx = safe0(prev_totals.get("asp"))
    asp_curr_idx = safe0(curr_totals.get("asp"))

    up_prev_idx = safe0(prev_totals.get("unit_wise_profitability"))
    up_curr_idx = safe0(curr_totals.get("unit_wise_profitability"))

    qty_pct = pct_change(qty_prev, qty_curr)
    sales_pct = pct_change(sales_prev, sales_curr)
    prof_pct = pct_change(prof_prev, prof_curr)
    asp_pct = pct_change(asp_prev_idx, asp_curr_idx)
    up_pct = pct_change(up_prev_idx, up_curr_idx)

    if sku_context is None:
        sku_context = {
            "fast_growing_profitable": [],
            "declining_high_mix": [],
            "flat_but_large": [],
        }

    # ✅ IMPORTANT: include SKU rows so product_name is available to the model
    payload = {
        "periods": {
            "previous": {
                "label": prev_label,
                "quantity_total": qty_prev,
                "net_sales_total": sales_prev,
                "profit_total": prof_prev,
                "asp_sum_index": asp_prev_idx,
                "unit_profit_sum_index": up_prev_idx,
            },
            "current": {
                "label": curr_label,
                "quantity_total": qty_curr,
                "net_sales_total": sales_curr,
                "profit_total": prof_curr,
                "asp_sum_index": asp_curr_idx,
                "unit_profit_sum_index": up_curr_idx,
            },
        },
        "pct_changes": {
            "quantity_pct": qty_pct,
            "net_sales_pct": sales_pct,
            "profit_pct": prof_pct,
            "asp_index_pct": asp_pct,
            "unit_profit_index_pct": up_pct,
        },
        "portfolio": {
            "top_80_skus_count": len(top_80_skus),
            "new_reviving_skus_count": len(new_reviving),
        },
        "sku_context": sku_context,
        "sku_tables": {
            "top_80_skus": top_80_skus,
            "new_reviving_skus": new_reviving,
        },
    }

    data_block = json.dumps(payload, indent=2)

    prompt = f"""
You are a senior ecommerce business analyst.

You receive JSON containing:
- Overall totals and % change for units, net sales, profit, ASP index and unit profit index
- SKU tables in sku_tables.top_80_skus and sku_tables.new_reviving_skus including product_name and SKU-wise metrics

GOAL
Produce:
1) A short overall business summary (3–5 bullets)
2) Exactly 5 detailed SKU-wise recommendations in the EXACT format below.

====================
SUMMARY (3–5 bullets)
====================
Write 3–5 short bullets describing, in simple language:
- How overall units, sales and profit moved (using quantity_pct, net_sales_pct, profit_pct)
- Any big change in ASP or unit profit (asp_index_pct, unit_profit_index_pct)
- Whether performance is coming more from volume, pricing, or a few big SKUs

====================
ACTIONS (exactly 5)
====================

Pick SKUs only from:
- sku_tables.top_80_skus
- sku_tables.new_reviving_skus

Return EXACTLY 5 action bullets.

✅ EACH action bullet MUST follow this exact layout with line breaks:

Line 1: "Product name - <product_name>"
Line 2-3: One paragraph of exactly 2 sentences (metrics + causal chain + mix)
Line 4: (blank line)
Line 5: One action sentence ONLY

So the action_bullet string must look like:
Product name - Classic

The increase in ASP by 13.27% resulted in a dip in units by 25.91%, which also resulted in sales falling by 16.08%. The sales mix is down by 15.93%, reducing its contribution, and profit is up by 10.74%.

Reduce ASP slightly to improve traction.

-----------------------------
Metrics paragraph rules (Line 2-3)
-----------------------------
- Exactly 2 sentences.

- Sentence 1: Use ONLY the SKU metrics for ASP, Units and Sales (where values exist).
  Use the same flow as the original causal chain, but adjust tone only in this special case:
  - Default tone:
    "The increase/decrease in ASP by X% resulted in a dip/growth in units by Y%, which also resulted in sales falling/increasing by Z%."
  - If ASP, Units, and Sales are ALL negative (all down), do NOT imply ASP caused units. Use this co-movement tone instead:
    "There is a decrease in ASP by X% and also a dip in units by Y%, which resulted in sales falling by Z%."

- Sentence 2: Must mention Sales Mix Change (%) if available (up or down) in the same original style:
  "The sales mix is up/down by M%, increasing/reducing its contribution."
  If profitability metrics are available for that SKU, append ONLY ONE of them to the SAME sentence without breaking flow and without using "while/since/because":
  Prefer in this order:
  1) Profit (%)
  2) Profit Per Unit (%)
  Append as:
  ", and profit is up/down by A%."
  OR ", and profit per unit is up/down by B%."
  (If profitability metric is not available, skip it.)

- Do NOT invent numbers and do NOT add extra reasons.

-----------------------------
Allowed action sentences (Line 5 only)
-----------------------------
Use exactly ONE of these sentences, verbatim:
- "Check ads and visibility campaigns for this product."
- "Review the visibility setup for this product."
- "Reduce ASP slightly to improve traction."
- "Increase ASP slightly to strengthen margins."
- "Maintain current ASP and monitor performance."
- "Monitor performance closely for now."
- "Check Amazon fees or taxes for this product as profit is down despite growth."

Decision guidance:
- If ASP is strongly up and units are down: prefer "Reduce ASP slightly to improve traction."
- If units and sales are down and ASP is flat or slightly up: prefer visibility lines.
- If profit/unit profit is very strong and units are stable/slightly down: prefer maintain/increase ASP.
- If ASP, units, sales, and sales mix are up but profit is down: prefer "Check Amazon fees or taxes for this product as profit is down despite growth."

Ignore:
- Any row where product_name is "Total" or contains "Total".


OUTPUT FORMAT
Return ONLY valid JSON:
{{
  "summary_bullets": ["...", "..."],
  "action_bullets": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"]
}}
Do not add any extra keys. Do not wrap in Markdown.

DATA
{data_block}
"""

    try:
        ai_response = oa_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior ecommerce analyst. "
                        "Return only valid JSON with summary_bullets and action_bullets. "
                        "Each action_bullet must follow the exact 3-block layout: "
                        "Product name line, blank line, 2-sentence metrics paragraph, blank line, one action line."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=900,
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        content = ai_response.choices[0].message.content.strip()
        parsed = json.loads(content)

        sum_bullets = parsed.get("summary_bullets", []) or []
        act_bullets = parsed.get("action_bullets", []) or []

        sum_clean = [str(b).strip() for b in sum_bullets if str(b).strip()]
        act_clean = [str(b).strip() for b in act_bullets if str(b).strip()]

        return {
            "summary_bullets": sum_clean[:5],
            "action_bullets": act_clean[:5],
        }

    except Exception as e:
        print("[ERROR] AI summary generation failed, falling back:", e)

    fallback_summary = _build_rule_based_summary(
        prev_totals,
        curr_totals,
        top_80_skus,
        new_reviving,
        prev_label,
        curr_label,
    )

    fallback_actions = [
        "Product name - Key SKUs\n\nUnits and sales have softened this period. The sales mix has also weakened, reducing contribution.\n\nReview the visibility setup for this product.",
        "Product name - Key SKUs\n\nPricing changes appear to be impacting volume and sales movement. The sales mix change indicates shifting contribution.\n\nMaintain current ASP and monitor performance.",
        "Product name - Key SKUs\n\nSome high-mix SKUs show volume decline impacting sales outcomes. The sales mix has moved down, reducing contribution.\n\nCheck ads and visibility campaigns for this product.",
        "Product name - Key SKUs\n\nProfitability is improving even where sales are softer across some SKUs. The sales mix change shows contribution movement.\n\nMonitor performance closely for now.",
        "Product name - Key SKUs\n\nA few SKUs may need pricing support to improve traction. The sales mix indicates contribution shifts.\n\nReduce ASP slightly to improve traction.",
    ]

    return {
        "summary_bullets": fallback_summary,
        "action_bullets": fallback_actions[:5],
    }


#-----------------------------------------------------------------------------
# ChatGPT insight generator for live MTD vs previous (per-SKU)
#-----------------------------------------------------------------------------

def generate_live_insight(item, country, is_global, prev_label, curr_label):
    """
    Generate AI insight for a single SKU row from live_mtd_vs_previous growth_data.
    item: one dict from growth_data/top_80_skus/new_reviving/etc.
    """
    sku = item.get("sku")
    product_name = (item.get("product_name") or "this product").strip()

    # Decide key: for global without SKU, fall back to product_name
    if is_global and not sku:
        key = product_name
    elif sku:
        key = sku
    else:
        key = product_name

    is_new_or_reviving = item.get("new_or_reviving", False)

    # Data for the model (includes fields like quantity_prev/curr, net_sales_prev/curr, growth %, etc.)
    data_block = json.dumps(item, indent=2)

    if is_new_or_reviving:
        # New / reviving SKU prompt
        prompt = f"""
You are a senior ecommerce business analyst. The following is a new or reviving product (no meaningful previous-period baseline).
Compare it only within the current period and talk about its launch strength.

Context:
- Country: {country}
- Previous period label: {prev_label}
- Current period label: {curr_label}

Details for '{product_name}'

Observations:
- List the 2–3 most important observations about this product's current performance
  (units sold, ASP, net sales, profit per unit, etc.) using absolute values from the data.
- Comment on launch/return momentum—e.g., strong debut, moderate start, slow start.
- Call out any potential red flags (e.g., high ASP but very low volume, low unit profitability, etc.).

Improvements:
- Suggest clear, concrete next actions for:
  • Marketing
  • Sales / Commercial
  • Operations / Supply
- Make each action specific and easy to execute.

Sales Volume:
• Comment on volume and what it says about early traction.
• Suggest one commercial lever to improve or scale volume.

ASP:
• Comment on price positioning; suggest whether to test price up/down or hold.

Profitability:
• Comment on profit per unit or total profit; suggest if costs or pricing need optimization.

End with one line:
• Verdict: should this SKU be scaled quickly, tested more, or carefully repositioned? And why?

Instructions:
- Use plain text with bullet points only.
- DO NOT use Markdown formatting (no **bold**, no headings).
- Do NOT compare to previous periods (assume no baseline).
- Use actual numbers or percentages from the data whenever they are present.

Data:
{data_block}
"""
    else:
        # Existing SKU with prev vs current
        prompt = f"""
You are a senior ecommerce business analyst. The data below shows a product's performance
comparing a previous period vs the current MTD.

Context:
- Country: {country}
- Previous period: {prev_label}
- Current period: {curr_label}

Details for '{product_name}'

Observations:
- List the 2–3 most important changes using ONLY the given metrics:
  • quantity_prev vs quantity_curr
  • net_sales_prev vs net_sales_curr
  • profit_prev vs profit_curr
  • asp_prev vs asp_curr
  • unit_wise_profitability_prev vs unit_wise_profitability_curr
  • and % fields like "Unit Growth (%)", "Sales Growth (%)", etc.
- Use the exact causal tone wherever % values exist:
  "The increase/decrease in ASP by X% resulted in a dip/growth in units by Y%, which also resulted in sales falling/increasing by Z%."
- In at least one observation, mention Sales Mix Change (%) direction if present (up/down).
- Do NOT add assumptions like stock issues, supply constraints, replenishment, OOS, or fulfillment problems.

Improvements:
- Provide exactly 3–5 action bullets.
- Each action bullet MUST be exactly ONE sentence and MUST be chosen ONLY from the list below, verbatim (no edits):
  • "Check ads and visibility campaigns for this product."
  • "Review the visibility setup for this product."
  • "Reduce ASP slightly to improve traction."
  • "Increase ASP slightly to strengthen margins."
  • "Monitor performance closely and reassess next steps."
  • "Monitor performance closely for now."
- Do NOT add any other recommendations, explanations, or extra words.
- Do NOT mention stock, inventory, supply, operations, OOS, logistics, replenishment, or warehousing.
- Decision guidance:
  • If ASP is strongly up and units are down: prefer "Reduce ASP slightly to improve traction."
  • If units and sales are down and ASP is flat or slightly up: prefer visibility lines.
  • If profit/unit profit is very strong and units are stable/slightly down: prefer maintain/increase ASP.

Then, for each metric, add:

Unit Growth:
• [Explain reasons for the growth/decline using ONLY available signals like unit trend vs ASP trend and what that implies about demand/visibility/conversion.]
• [Choose ONE action bullet from the Improvements list that best fits the unit pattern and paste it verbatim.]

ASP:
• [Explain why ASP changed using ONLY available signals like pricing changes, discounting intensity, or product/pack/channel mix shifts (premium vs value) without referencing costs.]
• [Choose ONE action bullet from the Improvements list that best fits the ASP direction and paste it verbatim.]

Sales:
• [Describe sales trend by explicitly tying it to Units × ASP (e.g., “sales down mainly due to units decline while ASP was flat/up” or “sales up driven by ASP lift with stable units”).]
• [Choose ONE action bullet from the Improvements list that best fits the sales pattern and paste it verbatim.]

Profit:
• [Explain profit change using ONLY available signals like sales movement plus realized pricing/discounting/mix impact, and avoid any mention of COGS or cost changes.]
• [Choose ONE action bullet from the Improvements list that best aligns with protecting/improving profitability given the observed trend and paste it verbatim.]

Unit Profitability:
• [Explain per-unit profit change using ONLY available signals like realized price/discounting and mix (higher-priced variants) impact, without mentioning COGS.]
• [Choose ONE action bullet from the Improvements list that best fits per-unit profit strength/weakness and paste it verbatim.]



Instructions:
- Use plain text with bullets only.
- DO NOT use Markdown formatting (no **bold**, no italics, no headers).
- Avoid labels like "Root cause:" or "Action item:". Just use bullet points.
- Use % values and trends from the data for every observation.
- Make all insights easy for business teams to act on.

Data:
{data_block}
"""

    try:
        ai_response = oa_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior ecommerce analyst. "
                        "Respond in plain text with bullet points only. "
                        "Do not use Markdown formatting."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=900,
            temperature=0.4,
        )

        ai_text = ai_response.choices[0].message.content.strip()

        # ===== DEBUG: print exactly what model returned =====
        print("\n================ AI INSIGHT DEBUG ================")
        print("KEY:", key, "| SKU:", sku, "| Product:", product_name, "| Global:", is_global, "| New/Reviving:", is_new_or_reviving)
        print("INSIGHT (raw):\n", ai_text)
        print("INSIGHT (repr):\n", repr(ai_text))   # shows \n, \t etc clearly
        print("==================================================\n")

        return key, {
            "sku": sku,
            "product_name": product_name,
            "insight": ai_text,
            "key_used": key,
            "is_global": is_global,
            "is_new_or_reviving": is_new_or_reviving,
        }
    except Exception as e:
        # In case of API error, return a debug-friendly insight
        return key, {
            "sku": sku,
            "product_name": product_name,
            "insight": f"Error generating insight: {str(e)}",
            "key_used": key,
            "is_global": is_global,
            "is_new_or_reviving": is_new_or_reviving,
        }


# -----------------------------------------------------------------------------
# MAIN ROUTE: LIVE MTD vs PREVIOUS-MONTH-SAME-PERIOD BI
# # -----------------------------------------------------------------------------

@live_data_bi_bp.route("/live_mtd_bi", methods=["GET"])
def live_mtd_vs_previous():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authorization token is missing or invalid"}), 401

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            return jsonify({"error": "Invalid token payload: user_id missing"}), 401

        country = request.args.get("countryName", "uk")
        as_of = request.args.get("as_of")

        # optional custom day range
        start_day_str = request.args.get("start_day")
        end_day_str = request.args.get("end_day")
        try:
            start_day = int(start_day_str) if start_day_str else None
            end_day = int(end_day_str) if end_day_str else None
        except ValueError:
            start_day = None
            end_day = None

        generate_ai_insights = (
            request.args.get("generate_ai_insights", "false").lower()
            in ("true", "1", "yes")
        )

        ranges = get_mtd_and_prev_ranges(
            as_of=as_of,
            start_day=start_day,
            end_day=end_day,
        )
        prev_start = ranges["previous"]["start"]
        prev_end = ranges["previous"]["end"]
        curr_start = ranges["current"]["start"]
        curr_end = ranges["current"]["end"]

        # ✅ FULL previous month ONLY for graph
        prev_full_start = date(
            ranges["meta"]["previous_year"],
            ranges["meta"]["previous_month"],
            1
        )
        last_day_prev = monthrange(prev_full_start.year, prev_full_start.month)[1]
        prev_full_end = date(prev_full_start.year, prev_full_start.month, last_day_prev)

        is_global = country.lower() == "global"
        key_column = "sku"

        # 1) fetch previous period (ALIGNED) -> table/growth/totals/AI
        prev_data_aligned, prev_daily_aligned = fetch_previous_period_data(
            user_id, country, prev_start, prev_end
        )

        # 1b) fetch previous period (FULL MONTH) -> graph only
        _, prev_daily_full = fetch_previous_period_data(
            user_id, country, prev_full_start, prev_full_end
        )

        # 2) fetch current MTD (✅ now includes __has_mapping__ in each row)
        curr_data, curr_daily = fetch_current_mtd_data(
            user_id, country, curr_start, curr_end, is_global
        )

        # 3) growth calculation (use ALIGNED prev)
        growth_data = calculate_growth(prev_data_aligned, curr_data, key=key_column)

        # 4) categorization (use ALIGNED prev)
        prev_keys = {row.get(key_column) for row in prev_data_aligned if row.get(key_column)}

        # ==========================================================
        # ✅ STEP 5: Force "unmapped product_name" SKUs into New/Reviving
        # ==========================================================

        # lookup: sku -> has_mapping (based on curr_data from fetch_current_mtd_data)
        curr_map_flag = {
            str(r.get(key_column)): bool(r.get("__has_mapping__", False))
            for r in curr_data
            if r.get(key_column) is not None
        }

        # optional: copy mapping flag into growth rows (debugging / frontend badge)
        for gr in growth_data:
            sku = gr.get(key_column)
            if sku is not None:
                gr["__has_mapping__"] = curr_map_flag.get(str(sku), False)

        # existing "new/reviving" (prev missing)
        new_reviving_prev_missing = [row for row in growth_data if row.get("new_or_reviving")]

        # unmapped (mapping missing) => force to new/reviving
        unmapped_growth = [
            r for r in growth_data
            if r.get(key_column) is not None
            and not curr_map_flag.get(str(r.get(key_column)), False)
        ]

        # merge + dedupe by sku
        seen = set()
        new_reviving = []
        for r in (new_reviving_prev_missing + unmapped_growth):
            k = r.get(key_column)
            if not k or k in seen:
                continue
            seen.add(k)
            r["new_or_reviving"] = True  # force
            new_reviving.append(r)

        # ==========================================================
        # ✅ STEP 6: Exclude new_reviving (incl. unmapped) from Top80/Other pipeline
        # ==========================================================

        new_reviving_keys = {r.get(key_column) for r in new_reviving if r.get(key_column)}

        existing = [
            row
            for row in growth_data
            if row.get(key_column) in prev_keys
            and row.get("Sales Mix (Current)") is not None
            and row.get(key_column) not in new_reviving_keys   # ✅ exclude
        ]

        existing_sorted = sorted(
            existing, key=lambda x: x["Sales Mix (Current)"], reverse=True
        )

        total_sales_mix = sum(
            row["Sales Mix (Current)"]
            for row in existing_sorted
            if row["Sales Mix (Current)"] is not None
        )

        cumulative = 0.0
        top_80_skus, other_skus = [], []

        for row in existing_sorted:
            mix = row["Sales Mix (Current)"]
            if mix is None:
                continue
            proportion = cumulative / total_sales_mix if total_sales_mix else 0
            if proportion <= 0.8:
                top_80_skus.append(row)
                cumulative += mix
            else:
                other_skus.append(row)

        # ------- segment subsets (prev / curr data) -------
        top_keys = {row.get(key_column) for row in top_80_skus}
        other_keys = {row.get(key_column) for row in other_skus}
        new_keys = {row.get(key_column) for row in new_reviving if row.get(key_column)}

        prev_top = [r for r in prev_data_aligned if r.get(key_column) in top_keys]
        curr_top = [r for r in curr_data if r.get(key_column) in top_keys]

        prev_other = [r for r in prev_data_aligned if r.get(key_column) in other_keys]
        curr_other = [r for r in curr_data if r.get(key_column) in other_keys]

        prev_new = [r for r in prev_data_aligned if r.get(key_column) in new_keys]
        curr_new = [r for r in curr_data if r.get(key_column) in new_keys]

        # ------- segment total rows -------
        top_80_total_row = build_segment_total_row(
            prev_top, curr_top, key=key_column, label="Total"
        )
        new_reviving_total_row = (
            build_segment_total_row(
                prev_new, curr_new, key=key_column, label="Total"
            )
            if new_reviving
            else None
        )
        other_total_row = (
            build_segment_total_row(
                prev_other, curr_other, key=key_column, label="Total"
            )
            if other_skus
            else None
        )

        # labels
        prev_label = (
            f"{month_abbr[prev_start.month].capitalize()}"
            f"'{str(prev_start.year)[-2:]} {prev_start.day}–{prev_end.day}"
        )
        curr_label = (
            f"{month_abbr[curr_start.month].capitalize()}"
            f"'{str(curr_start.year)[-2:]} {curr_start.day}–{curr_end.day}"
        )
        prev_label_full = (
            f"{month_abbr[prev_full_start.month].capitalize()}"
            f"'{str(prev_full_start.year)[-2:]} 1–{prev_full_end.day}"
        )

        # ============================
        # OVERALL SUMMARY + ACTIONS
        # ============================
        prev_totals = aggregate_totals(prev_data_aligned)
        curr_totals = aggregate_totals(curr_data)

        all_for_context = growth_data
        sku_context = build_sku_context(all_for_context, max_items=5)

        overall = build_ai_summary(
            prev_totals,
            curr_totals,
            top_80_skus,
            new_reviving,
            prev_label,
            curr_label,
            sku_context=sku_context,
        )

        overall_summary = overall.get("summary_bullets", [])
        overall_actions = overall.get("action_bullets", [])

        # ============================
        # SEND EMAIL WITH AI SUMMARY
        # ============================

        # 1) Try to read email from JWT payload, else from query param
        user_email = payload.get("email") or request.args.get("email")
        if not user_email:
            user_email = get_user_email_by_id(user_id)


        if user_email:
            # 3) Throttle: only once in 24 hours per user+country
            if has_recent_bi_email(user_id, country, hours=24):
                print(f"[INFO] BI email already sent in last 24h for user_id={user_id}, country={country}; skipping.")
            else:
                # 4) Generate a fresh token for this user for deep-link
                email_token_payload = {
                    "user_id": user_id,
                    "email": user_email,
                    "scope": "live_mtd_bi",
                    "exp": datetime.utcnow() + timedelta(hours=24),
                }
                email_token = jwt.encode(email_token_payload, SECRET_KEY, algorithm="HS256")

                try:
                    send_live_bi_email(
                        to_email=user_email,
                        overall_summary=overall_summary,
                        overall_actions=overall_actions,
                        country=country,
                        prev_label=prev_label,
                        curr_label=curr_label,
                        deep_link_token=email_token,
                    )
                    mark_bi_email_sent(user_id, country)
                except Exception as e:
                    # Don't break the API if email fails
                    print(f"[WARN] Error sending live BI email: {e}")
        else:
            print("[WARN] No user email found in token, query params, or DB; skipping BI email.")



        # ============================
        # AI INSIGHTS (SKU-wise)
        # ============================
        skus_for_ai = top_80_skus + new_reviving + other_skus
        insights = {}

        if generate_ai_insights and skus_for_ai:
            with ThreadPoolExecutor(max_workers=10) as executor:
                future_to_item = {
                    executor.submit(
                        generate_live_insight,
                        item,
                        country,
                        is_global,
                        prev_label,
                        curr_label,
                    ): item
                    for item in skus_for_ai
                }

                for future in as_completed(future_to_item):
                    try:
                        key, result = future.result()
                        insights[key] = result
                    except Exception as e:
                        item = future_to_item[future]
                        print(
                            f"Error generating AI insight for SKU={item.get('sku')} "
                            f"Product={item.get('product_name')}: {e}"
                        )

        # ============================
        # RESPONSE
        # ============================
        response_payload = {
            "message": "Live MTD vs previous-month-same-period comparison",
            "periods": {
                "previous": {
                    "label": prev_label,
                    "start_date": prev_start.isoformat(),
                    "end_date": prev_end.isoformat(),
                },
                "previous_full": {
                    "label": prev_label_full,
                    "start_date": prev_full_start.isoformat(),
                    "end_date": prev_full_end.isoformat(),
                },
                "current_mtd": {
                    "label": curr_label,
                    "start_date": curr_start.isoformat(),
                    "end_date": curr_end.isoformat(),
                },
            },
            "categorized_growth": {
                "top_80_skus": top_80_skus,
                "top_80_total": top_80_total_row,
                "new_or_reviving_skus": new_reviving,  # ✅ includes unmapped now
                "new_or_reviving_total": new_reviving_total_row,
                "other_skus": other_skus,
                "other_total": other_total_row,
            },
            "daily_series": {
                "previous": prev_daily_full,
                "current_mtd": curr_daily,
            },
            "daily_series_aligned": {
                "previous": prev_daily_aligned,
                "current_mtd": curr_daily,
            },
            "ai_insights": insights,
            "overall_summary": overall_summary,
            "overall_actions": overall_actions,
        }

        response_payload = round_numeric_values(response_payload, ndigits=2)
        return jsonify(response_payload), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        print("Unexpected error in /live_mtd_bi:", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500


