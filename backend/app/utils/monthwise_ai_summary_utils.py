from flask import Blueprint, request, jsonify
import jwt
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from config import Config
from calendar import month_abbr, monthrange
from datetime import date, datetime, timedelta
from openai import OpenAI
import json
import pandas as pd
from app.models.user_models import HistoricAISummary
from app.utils.formulas_utils import safe_num
from app import db




load_dotenv()
SECRET_KEY = Config.SECRET_KEY

db_url = os.getenv("DATABASE_URL")
db_url2 = os.getenv("DATABASE_Chatbot_URL")
db_url3 = os.getenv("DATABASE_AMAZON_URL")
phormula_engine = create_engine(db_url)
chatbot_engine = create_engine(db_url2)
amazon_engine = create_engine(db_url3)



MONTH_NUM_TO_NAME = {
    1: "january",
    2: "february",
    3: "march",
    4: "april",
    5: "may",
    6: "june",
    7: "july",
    8: "august",
    9: "september",
    10: "october",
    11: "november",
    12: "december",
}



def get_latest_completed_month(today=None):
    today = today or date.today()
    if today.month == 1:
        return today.year - 1, 12
    return today.year, today.month - 1


def get_latest_completed_quarter(today=None):
    today = today or date.today()
    q = (today.month - 1) // 3 + 1
    if q == 1:
        return today.year - 1, 4
    return today.year, q - 1


def is_latest_period(period, timeline, year):
    if period == "monthly":
        y, m = get_latest_completed_month()
        return str(m) == timeline and y == year

    if period == "quarterly":
        y, q = get_latest_completed_quarter()
        return f"Q{q}" == timeline and y == year

    if period == "yearly":
        return year == date.today().year - 1

    return False


def fetch_existing_summary(user_id, country, marketplace_id, period, timeline, year):
    return HistoricAISummary.query.filter_by(
        user_id=user_id,
        country=country,
        marketplace_id=marketplace_id,
        period=period,
        timeline=timeline,
        year=year
    ).first()


def save_summary_to_db(data):
    record = HistoricAISummary(
        user_id=data["user_id"],
        country=data["country"],
        marketplace_id=data["marketplace_id"],
        period=data["period"],
        timeline=data["timeline"],
        year=data["year"],
        summary=data["summary"],
        recommendations=data["recommendations"]
    )
    db.session.add(record)
    db.session.commit()

def month_name_from_timeline(timeline: str) -> str:
    # timeline is like "12"
    return MONTH_NUM_TO_NAME[int(timeline)]  # returns "december"

def build_table_name(user_id: int, country: str, period: str, timeline: str, year: int) -> str:
    c = str(country).lower()

    if period == "monthly":
        mn = month_name_from_timeline(timeline)   # "december"
        return f"skuwisemonthly_{user_id}_{c}_{mn}{year}"

    if period == "quarterly":
        q = int(str(timeline).replace("Q", ""))   # Q1 -> 1
        return f"quarter{q}_{user_id}_{c}_{year}_table"

    if period == "yearly":
        return f"skuwiseyearly_{user_id}_{c}_{year}_table"

    raise ValueError("Invalid period")

def fetch_precalc_table(user_id: int, country: str, period: str, timeline: str, year: int) -> pd.DataFrame:
    table = build_table_name(user_id, country, period, timeline, year)
    query = f'SELECT * FROM public."{table}"'

    try:
        return pd.read_sql(query, phormula_engine)
    except Exception as e:
        print(f"[WARN] Could not read table {table}: {e}")
        return pd.DataFrame()

def _normalize_sku_col(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    df = df.copy()
    if "sku" not in df.columns and "SKU" in df.columns:
        df.rename(columns={"SKU": "sku"}, inplace=True)
    return df

METRIC_COLUMNS = {
    "quantity",
    "return_quantity",
    "total_quantity",

    "gross_sales",
    "refund_sales",
    "net_sales",

    "cost_of_unit_sold",
    "selling_fees",
    "fba_fees",
    "amazon_fee",
    "platform_fee",
    "platformfeenew",
    "platform_fee_inventory_storage",
    "other_transaction_fees",
    "misc_transaction",

    "tex_and_credits",
    "net_taxes",
    "net_credits",

    "promotional_rebates",
    "visible_ads",
    "dealsvouchar_ads",
    "advertising_total",

    "lost_total",
    "rembursement_fee",

    "profit",
    "cm2_profit",
}

def get_metric_columns(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c.lower() in METRIC_COLUMNS]


def compute_sku_precalc(df: pd.DataFrame) -> dict:
    if df.empty:
        return {}
    df = _normalize_sku_col(df)
    if "sku" not in df.columns:
        return {}

    num_cols = get_metric_columns(df)


    other_cols = [c for c in df.columns if c not in num_cols and c != "sku"]

    agg = {c: "sum" for c in num_cols}
    for c in other_cols:
        agg[c] = "first"

    g = df.groupby("sku", dropna=False).agg(agg).reset_index()

    out = {}
    for _, r in g.iterrows():
        sku = str(r["sku"])
        out[sku] = {}
        for col in g.columns:
            if col == "sku":
                continue
            val = r[col]
            if isinstance(val, (int, float)) and pd.notna(val):
                out[sku][col.lower()] = round(float(val), 2)
            else:
                out[sku][col.lower()] = None if pd.isna(val) else val
    return out







def fetch_inventory_aged_by_user(user_id: int) -> pd.DataFrame:
    query = text("""
        SELECT
            sku,
            "inv-age-0-to-90-days"        AS age_0_90,
            "inv-age-91-to-180-days"      AS age_91_180,
            "inv-age-181-to-270-days"     AS age_181_270,
            "inv-age-271-to-365-days"     AS age_271_365,
            "inv-age-365-plus-days"       AS age_365_plus,
            "estimated-storage-cost-next-month" AS storage_cost_next_month,
            "unfulfillable-quantity"      AS unfulfillable_qty
        FROM public.inventory_aged
        WHERE user_id = :user_id
    """)

    with amazon_engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"user_id": user_id})

    return df

def build_inventory_alerts(df: pd.DataFrame) -> dict:
    if df.empty:
        return {}

    df = df.copy()

    # Safe numeric coercion
    for col in [
        "age_0_90", "age_91_180", "age_181_270",
        "age_271_365", "age_365_plus",
        "storage_cost_next_month", "unfulfillable_qty"
    ]:
        if col in df.columns:
            df[col] = safe_num(df[col])

    alerts = {}

    # ---------------- EXPIRED INVENTORY ----------------
    expired_df = df[df["age_365_plus"] > 0]
    if not expired_df.empty:
        alerts["expired_inventory"] = {
            "total_units": int(expired_df["age_365_plus"].sum()),
            "top_skus": (
                expired_df
                .groupby("sku")["age_365_plus"]
                .sum()
                .sort_values(ascending=False)
                .head(5)
                .to_dict()
            )
        }

    # ---------------- CRITICALLY AGED (181+ DAYS) ----------------
    df["aged_181_plus"] = df["age_181_270"] + df["age_271_365"]
    aged_critical = df[df["aged_181_plus"] > 0]

    if not aged_critical.empty:
        alerts["aged_inventory_181_plus"] = {
            "total_units": int(aged_critical["aged_181_plus"].sum()),
            "top_skus": (
                aged_critical
                .groupby("sku")["aged_181_plus"]
                .sum()
                .sort_values(ascending=False)
                .head(5)
                .to_dict()
            )
        }

    # ---------------- UNFULFILLABLE INVENTORY ----------------
    unfulfillable = df[df["unfulfillable_qty"] > 0]
    if not unfulfillable.empty:
        alerts["unfulfillable_inventory"] = {
            "total_units": int(unfulfillable["unfulfillable_qty"].sum()),
            "top_skus": (
                unfulfillable
                .groupby("sku")["unfulfillable_qty"]
                .sum()
                .sort_values(ascending=False)
                .head(5)
                .to_dict()
            )
        }

    # ---------------- STORAGE COST RISK ----------------
    total_storage_cost = float(df["storage_cost_next_month"].sum())
    if total_storage_cost > 0:
        alerts["storage_cost_risk"] = {
            "estimated_next_month_cost": round(total_storage_cost, 2)
        }

    return alerts






def compare_sku_metrics(current: dict, previous: dict) -> dict:
    output = {}

    all_skus = set(current.keys()) | set(previous.keys())

    for sku in all_skus:
        curr_metrics = current.get(sku, {})
        prev_metrics = previous.get(sku, {})

        sku_out = {}
        all_metrics = set(curr_metrics.keys()) | set(prev_metrics.keys())

        for metric in all_metrics:
            curr_val = float(curr_metrics.get(metric, 0.0))
            prev_val = float(prev_metrics.get(metric, 0.0))

            delta = curr_val - prev_val
            pct = (delta / prev_val * 100) if prev_val != 0 else None

            sku_out[metric] = {
                "current": round(curr_val, 2),
                "previous": round(prev_val, 2),
                "delta": round(delta, 2),
                "delta_pct": round(pct, 2) if pct is not None else None
            }

        output[sku] = sku_out

    return output




def compare_metrics(current, previous):
    out = {}
    for k, v in current.items():
        prev = previous.get(k, 0.0)
        delta = v - prev
        pct = (delta / prev * 100) if prev != 0 else None

        out[k] = {
            "current": round(v, 2),
            "previous": round(prev, 2),
            "delta": round(delta, 2),
            "delta_pct": round(pct, 2) if pct else None
        }
    return out


def resolve_comparison(period, timeline, year):
    if period == "monthly":
        m = int(timeline)
        prev = ("monthly", "12", year - 1) if m == 1 else ("monthly", str(m - 1), year)
        yoy = ("monthly", timeline, year - 1)
        return prev, yoy

    if period == "quarterly":
        q = int(timeline.replace("Q", ""))
        prev = ("quarterly", "Q4", year - 1) if q == 1 else ("quarterly", f"Q{q-1}", year)
        yoy = ("quarterly", timeline, year - 1)
        return prev, yoy

    if period == "yearly":
        return ("yearly", "ALL", year - 1), None

    raise ValueError("Invalid period")


def generate_ai_summary(payload, allow_recommendations):
    summary = f"Summary generated for {payload['period']}."
    recommendations = None

    if allow_recommendations:
        recommendations = "Action items generated."

    return {
        "summary": summary,
        "recommendations": recommendations
    }


def get_or_create_summary(
    user_id,
    country,
    marketplace_id,
    period,
    timeline,
    year
):
    cached = fetch_existing_summary(
        user_id, country, marketplace_id, period, timeline, year
    )

    if cached:
        return {
            "summary": cached.summary,
            "recommendations": cached.recommendations,
            "source": "db"
        }

    allow_reco = is_latest_period(period, timeline, year)

    # ---------------- CURRENT PERIOD ----------------
    df_current = fetch_precalc_table(user_id, country, period, timeline, year)

    current = {}
    if not df_current.empty:
        for col in get_metric_columns(df_current):
            current[col.lower()] = round(
                float(pd.to_numeric(df_current[col], errors="coerce").fillna(0).sum()), 2
            )
    print("METRICS USED:", list(current.keys()))
    sku_current = compute_sku_precalc(df_current)

    inventory_lost = 0
    if not df_current.empty:
        for col in ["lost_total"]:
            if col in df_current.columns:
                inventory_lost = int(pd.to_numeric(df_current[col], errors="coerce").fillna(0).sum())
                break

    inventory_alerts = {}

    # =====================================================
    # 🔴 INVENTORY AGEING LOGIC (latest period only) 🔴
    # =====================================================
    if allow_reco:
        inventory_aged_df = fetch_inventory_aged_by_user(user_id)
        if not inventory_aged_df.empty:
            inventory_alerts = build_inventory_alerts(inventory_aged_df)
        else:
            inventory_alerts = {}

    # ---------------- PREVIOUS PERIOD (MoM / QoQ) ----------------
    (p_period, p_timeline, p_year), yoy_key = resolve_comparison(period, timeline, year)

    df_prev = fetch_precalc_table(user_id, country, p_period, p_timeline, p_year)

    prev = {}
    if not df_prev.empty:
        for col in get_metric_columns(df_prev):
            prev[col.lower()] = round(
                float(pd.to_numeric(df_prev[col], errors="coerce").fillna(0).sum()), 2
            )

    mom = compare_metrics(current, prev)

    sku_prev = compute_sku_precalc(df_prev)
    sku_mom = compare_sku_metrics(sku_current, sku_prev)

    # ---------------- YOY (SAFE) ----------------
    yoy = None
    sku_yoy = None

    if yoy_key:
        y_period, y_timeline, y_year = yoy_key
        df_yoy = fetch_precalc_table(user_id, country, y_period, y_timeline, y_year)

        if not df_yoy.empty:
            yoy_base = {}
            for col in get_metric_columns(df_yoy):
                yoy_base[col.lower()] = round(
                    float(pd.to_numeric(df_yoy[col], errors="coerce").fillna(0).sum()), 2
                )

            yoy = compare_metrics(current, yoy_base)

            sku_yoy = compare_sku_metrics(
                sku_current,
                compute_sku_precalc(df_yoy)
            )

    # ---- everything below stays same (debug/ai/save/return) ----

    ai_payload = {
        "period": f"{period} {timeline} {year}",
        "mom": mom,
        "yoy": yoy,
        "inventory_lost": inventory_lost,
        "inventory_alerts": inventory_alerts,
        "sku_mom": sku_mom,
        "sku_yoy": sku_yoy,
    }

    ai_output = generate_ai_summary(ai_payload, allow_reco)

    save_summary_to_db({
        "user_id": user_id,
        "country": country,
        "marketplace_id": marketplace_id,
        "period": period,
        "timeline": timeline,
        "year": year,
        "summary": ai_output["summary"],
        "recommendations": ai_output["recommendations"]
    })

    return {
        "summary": ai_output["summary"],
        "recommendations": ai_output["recommendations"],
        "inventory_lost": inventory_lost,
        "inventory_alerts": inventory_alerts,
        "sku_current": sku_current,
        "sku_mom": sku_mom,
        "sku_yoy": sku_yoy,
        "source": "ai"
    }



