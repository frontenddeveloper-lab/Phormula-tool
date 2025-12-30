from flask import Blueprint, request, jsonify
import jwt
import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from config import Config
from calendar import month_abbr, monthrange
from datetime import date, datetime, timedelta
from openai import OpenAI
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from app.utils.live_bi_utils import (build_inventory_signals, get_mtd_and_prev_ranges,fetch_previous_period_data,fetch_current_mtd_data,calculate_growth,aggregate_totals,build_segment_total_row,build_sku_context,build_ai_summary,generate_live_insight,fetch_historical_skus_last_6_months,round_numeric_values,totals_from_daily_series,construct_prev_table_name,compute_sku_metrics_from_df,
                                     compute_inventory_coverage_ratio)
from app.utils.email_utils import (send_live_bi_email,get_user_email_by_id,has_recent_bi_email,mark_bi_email_sent,)


# -----------------------------------------------------------------------------
# ENV / DB SETUP
# -----------------------------------------------------------------------------

load_dotenv()
SECRET_KEY = Config.SECRET_KEY

db_url = os.getenv("DATABASE_URL")
db_url2 = os.getenv("DATABASE_AMAZON_URL")

engine_hist = create_engine(db_url)
engine_live = create_engine(db_url2)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
oa_client = OpenAI(api_key=OPENAI_API_KEY)
# simple process-level debounce (survives hot reload)
_SENT_EMAIL_CACHE = set()


live_data_bi_bp = Blueprint("live_data_bi_bp", __name__)



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

        country = (request.args.get("countryName", "uk") or "uk").strip().lower()
        as_of = request.args.get("as_of")

        # ---------------------------
        # DATE RANGE
        # ---------------------------
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

        ranges = get_mtd_and_prev_ranges(as_of=as_of, start_day=start_day, end_day=end_day)
        prev_start = ranges["previous"]["start"]
        prev_end = ranges["previous"]["end"]
        curr_start = ranges["current"]["start"]
        curr_end = ranges["current"]["end"]

        # FULL previous month (charts)
        prev_full_start = date(
            ranges["meta"]["previous_year"],
            ranges["meta"]["previous_month"],
            1
        )
        last_day_prev = monthrange(prev_full_start.year, prev_full_start.month)[1]
        prev_full_end = date(prev_full_start.year, prev_full_start.month, last_day_prev)

        key_column = "sku"

        # ---------------------------
        # FETCH DATA
        # ---------------------------
        prev_data_aligned, prev_daily_aligned = fetch_previous_period_data(
            user_id, country, prev_start, prev_end
        )

        _, prev_daily_full = fetch_previous_period_data(
            user_id, country, prev_full_start, prev_full_end
        )

        prev_full_totals = totals_from_daily_series(prev_daily_full)
        total_previous_net_sales_full_month = float(
            prev_full_totals.get("net_sales", 0) or 0
        )

        curr_data, curr_daily = fetch_current_mtd_data(
            user_id, country, curr_start, curr_end
        )

        # ---------------------------
        # PLATFORM FEES + ADS (SUMMARY ONLY)
        # ---------------------------
        prev_fee_totals = totals_from_daily_series(prev_daily_aligned)
        curr_fee_totals = totals_from_daily_series(curr_daily)

        # ---------------------------
        # GROWTH
        # ---------------------------
        growth_data = calculate_growth(prev_data_aligned, curr_data, key=key_column)

        prev_keys = {r.get(key_column) for r in prev_data_aligned if r.get(key_column)}
        curr_keys = {r.get(key_column) for r in curr_data if r.get(key_column)}

        # ---------------------------
        # NEW / REVIVING
        # ---------------------------
        historical_6m_keys = fetch_historical_skus_last_6_months(
            user_id=user_id,
            country=country,
            ref_date=curr_start
        )

        reviving_keys = curr_keys - prev_keys
        newly_launched_keys = curr_keys - historical_6m_keys
        new_reviving_keys = reviving_keys | newly_launched_keys

        new_reviving = [
            r for r in growth_data
            if r.get(key_column) in new_reviving_keys
        ]

        # ---------------------------
        # TOP 80 / OTHER
        # ---------------------------
        existing = [
            r for r in growth_data
            if r.get(key_column) in prev_keys
            and r.get("Sales Mix (Current)") is not None
            and r.get(key_column) not in new_reviving_keys
        ]

        existing_sorted = sorted(
            existing, key=lambda x: x["Sales Mix (Current)"], reverse=True
        )

        total_sales_mix = sum(
            r["Sales Mix (Current)"]
            for r in existing_sorted
            if r["Sales Mix (Current)"] is not None
        )

        cumulative = 0.0
        top_80_skus, other_skus = [], []

        for r in existing_sorted:
            mix = r["Sales Mix (Current)"]
            if mix is None:
                continue
            proportion = cumulative / total_sales_mix if total_sales_mix else 0
            if proportion <= 0.8:
                top_80_skus.append(r)
                cumulative += mix
            else:
                other_skus.append(r)

        # ---------------------------
        # SEGMENT TOTALS
        # ---------------------------
        top_keys = {r.get(key_column) for r in top_80_skus}
        other_keys = {r.get(key_column) for r in other_skus}
        new_keys = {r.get(key_column) for r in new_reviving}

        prev_top = [r for r in prev_data_aligned if r.get(key_column) in top_keys]
        curr_top = [r for r in curr_data if r.get(key_column) in top_keys]

        prev_other = [r for r in prev_data_aligned if r.get(key_column) in other_keys]
        curr_other = [r for r in curr_data if r.get(key_column) in other_keys]

        prev_new = [r for r in prev_data_aligned if r.get(key_column) in new_keys]
        curr_new = [r for r in curr_data if r.get(key_column) in new_keys]

        top_80_total_row = build_segment_total_row(prev_top, curr_top, key=key_column, label="Total")
        other_total_row = build_segment_total_row(prev_other, curr_other, key=key_column, label="Total") if other_skus else None
        new_reviving_total_row = build_segment_total_row(prev_new, curr_new, key=key_column, label="Total") if new_reviving else None

        # ---------------------------
        # INVENTORY SIGNALS (NEW)
        # ---------------------------
        try:
            inventory_signals_all = build_inventory_signals(user_id, country)
            selected_skus = {r.get(key_column) for r in (top_80_skus + new_reviving) if r.get(key_column)}
            inventory_signals = {
                sku: sig for sku, sig in inventory_signals_all.items()
                if sku in selected_skus
            }
        except Exception as e:
            print("[WARN] Failed to build inventory signals:", e)
            inventory_signals = {}

        # ---------------------------
        # LABELS
        # ---------------------------
        prev_label = f"{month_abbr[prev_start.month].capitalize()}'{str(prev_start.year)[-2:]} {prev_start.day}–{prev_end.day}"
        curr_label = f"{month_abbr[curr_start.month].capitalize()}'{str(curr_start.year)[-2:]} {curr_start.day}–{curr_end.day}"
        prev_label_full = f"{month_abbr[prev_full_start.month].capitalize()}'{str(prev_full_start.year)[-2:]} 1–{prev_full_end.day}"

        # ---------------------------
        # AI SUMMARY
        # ---------------------------
        prev_totals = aggregate_totals(prev_data_aligned)
        curr_totals = aggregate_totals(curr_data)

        sku_context = build_sku_context(growth_data, max_items=5)

        overall = build_ai_summary(
            prev_totals,
            curr_totals,
            top_80_skus,
            new_reviving,
            prev_label,
            curr_label,
            sku_context=sku_context,
            inventory_signals=inventory_signals,
            prev_fee_totals=prev_fee_totals,
            curr_fee_totals=curr_fee_totals,
        )

        overall_summary = overall.get("summary_bullets", [])
        overall_actions = overall.get("action_bullets", [])
        # ============================
        # SEND EMAIL WITH AI SUMMARY
        # ============================

        user_email = payload.get("email") or request.args.get("email")
        if not user_email:
            user_email = get_user_email_by_id(user_id)

        if user_email:
            cache_key = (user_id, country)

            # ✅ dev reload/double hit protection
            if cache_key in _SENT_EMAIL_CACHE:
                print("[INFO] Email already sent in this process, skipping.")
            else:
                # ✅ DB throttle: only once per 24h per user+country
                if has_recent_bi_email(user_id, country, hours=24):
                    print(f"[INFO] BI email already sent in last 24h for user_id={user_id}, country={country}; skipping.")
                    _SENT_EMAIL_CACHE.add(cache_key)  # optional: prevents repeated DB hits in same process
                else:
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
                            sku_actions=None,
                            country=country,
                            prev_label=prev_label,
                            curr_label=curr_label,
                            deep_link_token=email_token,
                        )

                        mark_bi_email_sent(user_id, country)
                        _SENT_EMAIL_CACHE.add(cache_key)

                    except Exception as e:
                        print(f"[WARN] Error sending live BI email: {e}")
                        # ✅ DO NOT mark as sent on send failure
        else:
            print("[WARN] No user email found in token, query params, or DB; skipping BI email.")

        # ---------------------------
        # AI INSIGHTS (SKU LEVEL)
        # ---------------------------
        insights = {}
        if generate_ai_insights:
            skus_for_ai = top_80_skus + new_reviving + other_skus
            with ThreadPoolExecutor(max_workers=10) as executor:
                for future in as_completed([
                    executor.submit(generate_live_insight, item, country, prev_label, curr_label)
                    for item in skus_for_ai
                ]):
                    key, res = future.result()
                    insights[key] = res

        # ---------------------------
        # TOTALS (ALIGNED)
        # ---------------------------
        prev_aligned_totals = totals_from_daily_series(prev_daily_aligned)
        curr_aligned_totals = totals_from_daily_series(curr_daily)

        aligned_totals_payload = {
            "total_current_profit": curr_aligned_totals["profit"],
            "total_previous_profit": prev_aligned_totals["profit"],
            "total_current_platform_fees": curr_aligned_totals["platform_fee"],
            "total_previous_platform_fees": prev_aligned_totals["platform_fee"],
            "total_current_advertising": curr_aligned_totals["advertising"],
            "total_previous_advertising": prev_aligned_totals["advertising"],
            "total_current_net_sales": curr_aligned_totals["net_sales"],
            "total_previous_net_sales": prev_aligned_totals["net_sales"],
            "total_previous_net_sales_full_month": total_previous_net_sales_full_month,
        }

        # ---------------------------
        # RESPONSE (FULL CONTRACT)
        # ---------------------------
        response_payload = {
            "message": "Live MTD vs previous-month-same-period comparison",

            "periods": {
                "previous": {"label": prev_label},
                "previous_full": {"label": prev_label_full},
                "current_mtd": {"label": curr_label},
            },

            "aligned_totals": aligned_totals_payload,

            "categorized_growth": {
                "top_80_skus": top_80_skus,
                "top_80_total": top_80_total_row,
                "new_or_reviving_skus": new_reviving,
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

        return jsonify(round_numeric_values(response_payload, ndigits=2)), 200

    except Exception as e:
        print("Unexpected error in /live_mtd_bi:", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500

