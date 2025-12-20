# =================================================================================================
# ULTRA-OPTIMIZED VERSION - Target: <20 seconds
# Key points:
# - Order.selling_fees, Order.fba_fees and other finance fields are fetched DIRECTLY
#   from Amazon Finances API (plus optional settlement enrichment) and stored on the Order model.
# - Matching for finances is done BY SKU (not order_id).
# - total_amount is overridden from finance fields:
#     total_amount = product_sales
# - Profit net_sales is computed from DB: SUM(orders.total_amount) by currency.
# - No SettlementTransaction-based backfill/sync is used.
# =================================================================================================
from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache

from sqlalchemy import (
    func,
    Table,
    MetaData,
    select,
    create_engine,
    text,
    case,
    cast,
    literal,
)
from sqlalchemy.types import Date
from sqlalchemy.exc import NoSuchTableError
import jwt
from dotenv import find_dotenv, load_dotenv
from flask import Blueprint, jsonify, request
from sqlalchemy.dialects.postgresql import insert

from app import db
from app.routes.amazon_api_routes import (
    amazon_client,
    _apply_region_and_marketplace_from_request,
    _to_decimal,
    _extract_addr_field,
    _parse_dt_any,
)
from config import Config
from app.routes.amazon_sales_api_routes import (
    _collect_month_events_events_only,
    _aggregate_to_transactions_full,
    _enrich_from_settlement_report,
)

# -------------------------------------------------------------------------------------------
# Config / env
# -------------------------------------------------------------------------------------------
SECRET_KEY = Config.SECRET_KEY

dotenv_path = find_dotenv(filename=".env", usecwd=True)
load_dotenv(dotenv_path, override=True)

logger = logging.getLogger("amazon_sp_api")
logging.basicConfig(level=logging.INFO)

db_url = os.getenv("DATABASE_URL")
db_url1 = os.getenv("DATABASE_ADMIN_URL")

if not db_url:
    raise RuntimeError("DATABASE_URL is not set")

if not db_url1:
    logger.warning("[WARN] DATABASE_ADMIN_URL not set; using DATABASE_URL for admin_engine as fallback")
    db_url1 = db_url

admin_engine = create_engine(db_url1, pool_size=10, max_overflow=20, pool_pre_ping=True)

amazon_live_api_bp = Blueprint("amazon_live_api", __name__)

# # -------------------------------------------------------------------------------------------
# # Constants
# # -------------------------------------------------------------------------------------------
# ALLOWED_MARKETPLACES = {"A1F83G8C2ARO7P", "ATVPDKIKX0DER"}  # UK, US
# ALLOWED_CURRENCIES = {"GBP", "USD"}
# MAX_WORKERS = 15  # Parallel API workers


# # -------------------------------------------------------------------------------------------
# # Helper functions
# # -------------------------------------------------------------------------------------------
# def _d(x) -> Decimal:
#     try:
#         if x is None:
#             return Decimal("0")
#         return Decimal(str(x))
#     except Exception:
#         return Decimal("0")


# def _extract_state(addr: dict) -> Optional[str]:
#     return _extract_addr_field(addr or {}, "StateOrRegion", "stateOrRegion", "state", "province")


# def _compute_order_quantity(o: dict) -> int:
#     try:
#         shipped = int(o.get("NumberOfItemsShipped") or 0)
#     except Exception:
#         shipped = 0
#     try:
#         unshipped = int(o.get("NumberOfItemsUnshipped") or 0)
#     except Exception:
#         unshipped = 0
#     return shipped + unshipped


# def _ensure_bucket(d: Dict[str, Dict[str, Decimal]], cur: str) -> Dict[str, Decimal]:
#     if cur not in d:
#         d[cur] = {
#             "net_sales": Decimal("0"),
#             "net_credits": Decimal("0"),
#             "net_taxes": Decimal("0"),
#             "fba_fees": Decimal("0"),
#             "selling_fees": Decimal("0"),
#             "cogs": Decimal("0"),
#             "quantity": Decimal("0"),
#         }
#     return d[cur]


# # -------------------------------------------------------------------------------------------
# # OPTIMIZED: Get SKU from DB (skip API calls where possible)
# # -------------------------------------------------------------------------------------------
# def _get_skus_from_db(order_ids: List[str], user_id: int, marketplace_id: str) -> Dict[str, Dict[str, Any]]:
#     """
#     Get SKU and product_name from existing DB records.
#     This avoids many API calls to orderItems endpoint.
#     """
#     if not order_ids:
#         return {}
#     rows = (
#         db.session.query(Order.amazon_order_id, Order.sku, Order.product_name)
#         .filter(
#             Order.user_id == user_id,
#             Order.marketplace_id == marketplace_id,
#             Order.amazon_order_id.in_(order_ids),
#             Order.sku.isnot(None),
#         )
#         .all()
#     )
#     result = {}
#     for row in rows:
#         result[row.amazon_order_id] = {
#             "sku": row.sku,
#             "product_name": row.product_name,
#         }
#     return result


# def _fetch_order_items_batch(order_ids: List[str]) -> Dict[str, Dict[str, Any]]:
#     """
#     Parallel fetch orderItems - ONLY for new orders not in DB
#     """
#     results: Dict[str, Dict[str, Any]] = {}

#     def fetch_single(order_id: str) -> Tuple[str, Optional[Dict]]:
#         try:
#             res = amazon_client.make_api_call(
#                 f"/orders/v0/orders/{order_id}/orderItems",
#                 "GET",
#                 {},
#             )
#             if not res or "error" in res:
#                 return order_id, None

#             payload = res.get("payload") or res
#             items = payload.get("OrderItems") or []
#             if not items:
#                 return order_id, None

#             first = items[0]
#             return order_id, {
#                 "sku": first.get("SellerSKU") or first.get("SellerSku"),
#                 "product_name": first.get("Title") or first.get("ASIN"),
#             }
#         except Exception as e:
#             logger.warning(f"orderItems failed for {order_id}: {e}")
#             return order_id, None

#     with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
#         futures = {executor.submit(fetch_single, oid): oid for oid in order_ids}
#         for future in as_completed(futures):
#             order_id, data = future.result()
#             if data:
#                 results[order_id] = data

#     return results


# def _attach_sku_and_product_to_orders(
#     all_orders: List[dict],
#     user_id: int,
#     marketplace_id: str,
#     force_api: bool = True,
# ) -> None:
#     """
#     Always try to get SKU: prioritize DB but fallback to API for missing ones.
#     """
#     if not all_orders:
#         return

#     order_ids = [o.get("AmazonOrderId") for o in all_orders if o.get("AmazonOrderId")]
#     if not order_ids:
#         return

#     # Step 1: from DB
#     db_skus = _get_skus_from_db(order_ids, user_id, marketplace_id)
#     for o in all_orders:
#         oid = o.get("AmazonOrderId")
#         if oid in db_skus:
#             o["sku"] = db_skus[oid].get("sku")
#             o["product_name"] = db_skus[oid].get("product_name")

#     logger.info(f"Found {len(db_skus)} SKUs from DB (no API calls needed)")

#     # Step 2: API for missing
#     missing_sku = [o for o in all_orders if not o.get("sku") and o.get("AmazonOrderId")]
#     if missing_sku and force_api:
#         missing_ids = [o["AmazonOrderId"] for o in missing_sku]
#         logger.warning(f"⚠️  {len(missing_ids)} orders missing SKU - fetching from API")

#         api_skus = _fetch_order_items_batch(missing_ids)

#         for o in all_orders:
#             oid = o.get("AmazonOrderId")
#             if oid in api_skus:
#                 o["sku"] = api_skus[oid].get("sku")
#                 o["product_name"] = api_skus[oid].get("product_name")

#         logger.info(f"✓ Retrieved {len(api_skus)} SKUs from API")

#     still_missing = [o.get("AmazonOrderId") for o in all_orders if not o.get("sku")]
#     if still_missing:
#         logger.error(f"❌ {len(still_missing)} orders STILL missing SKU after API fetch: {still_missing[:5]}")


# # -------------------------------------------------------------------------------------------
# # OPTIMIZED: Cached price/rate lookup (for COGS)
# # -------------------------------------------------------------------------------------------
# @lru_cache(maxsize=2000)
# def _get_price_and_rate_cached(
#     sku: str,
#     marketplace_id: str,
#     year: int,
#     month: int,
# ) -> Tuple[Optional[Decimal], Optional[Decimal]]:
#     """Cached price and FX rate lookup"""
#     if marketplace_id == "A1F83G8C2ARO7P":
#         sku_col = "sku_uk"
#         target_currency = "GBP"
#         country = "uk"
#     elif marketplace_id == "ATVPDKIKX0DER":
#         sku_col = "sku_us"
#         target_currency = "USD"
#         country = "us"
#     else:
#         return None, None

#     with db.engine.connect() as conn:
#         row = conn.execute(
#             text(
#                 f"""
#                 SELECT {sku_col} AS sku, price, currency
#                 FROM sku_1_data_table
#                 WHERE {sku_col} = :sku
#                 LIMIT 1
#                 """
#             ),
#             {"sku": sku},
#         ).fetchone()

#     if not row:
#         return None, None

#     price = Decimal(str(row.price or 0))
#     price_currency = (row.currency or "").upper()

#     if price_currency == target_currency:
#         return price, Decimal("1")

#     month_name = datetime(year, month, 1).strftime("%B").lower()

#     with admin_engine.connect() as admin_conn:
#         fx_row = admin_conn.execute(
#             text(
#                 """
#                 SELECT conversion_rate
#                 FROM public.currency_conversion
#                 WHERE month = :m
#                   AND year  = :y
#                   AND country = :country
#                   AND user_currency = :user_cur
#                   AND selected_currency = :target_cur
#                 LIMIT 1
#                 """
#             ),
#             {
#                 "m": month_name,
#                 "y": year,
#                 "country": country,
#                 "user_cur": price_currency,
#                 "target_cur": target_currency,
#             },
#         ).fetchone()

#     if not fx_row:
#         return price, None

#     return price, Decimal(str(fx_row.conversion_rate))


# def _get_price_and_rate_for_sku(
#     sku: str,
#     marketplace_id: str,
#     now_utc: Optional[datetime] = None,
# ) -> Tuple[Optional[Decimal], Optional[Decimal]]:
#     now_utc = now_utc or datetime.utcnow()
#     return _get_price_and_rate_cached(sku, marketplace_id, now_utc.year, now_utc.month)


# # -------------------------------------------------------------------------------------------
# # Attach extras from DB (for returning to frontend)
# # -------------------------------------------------------------------------------------------
# def _attach_order_extras_to_orders_payload(
#     all_orders: List[dict],
#     user_id: Optional[int],
#     marketplace_id: str,
# ) -> None:
#     if not all_orders or not user_id:
#         return

#     order_ids = [o.get("AmazonOrderId") for o in all_orders if o.get("AmazonOrderId")]
#     if not order_ids:
#         return

#     rows = (
#         db.session.query(Order)
#         .filter(
#             Order.user_id == user_id,
#             Order.marketplace_id == marketplace_id,
#             Order.amazon_order_id.in_(order_ids),
#         )
#         .all()
#     )

#     by_id: Dict[str, Dict[str, Any]] = {}
#     for r in rows:
#         by_id[r.amazon_order_id] = {
#             "sku": r.sku,
#             "quantity": r.quantity,
#             "product_name": r.product_name,
#         }

#     for o in all_orders:
#         oid = o.get("AmazonOrderId")
#         extra = by_id.get(oid)
#         if extra:
#             o.update(extra)


# # -------------------------------------------------------------------------------------------
# # Monthly table helpers
# # -------------------------------------------------------------------------------------------
# def _prev_month_tokens(now_utc: Optional[datetime] = None) -> Tuple[str, str]:
#     now_utc = now_utc or datetime.utcnow()
#     first_of_month = now_utc.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
#     prev_month_dt = first_of_month - timedelta(days=1)
#     return prev_month_dt.strftime("%B").lower(), prev_month_dt.strftime("%Y")


# def _prev_month_table_name(user_id: int, country: str, now_utc: Optional[datetime] = None) -> str:
#     month_lower, year_str = _prev_month_tokens(now_utc)
#     return f"skuwisemonthly_{user_id}_{country.lower()}_{month_lower}{year_str}"


# def _sum_prev_month_net_sales(user_id: int, country: str, now_utc: Optional[datetime] = None) -> Optional[float]:
#     tname = _prev_month_table_name(user_id, country, now_utc)
#     try:
#         meta = MetaData()
#         tbl = Table(tname, meta, autoload_with=db.engine)
#         if "net_sales" not in tbl.c:
#             return None
#         with db.engine.connect() as conn:
#             total = conn.execute(select(func.sum(tbl.c.net_sales))).scalar()
#         return float(total) if total is not None else 0.0
#     except Exception:
#         return None


# def _current_month_tokens(now_utc: Optional[datetime] = None) -> Tuple[str, str]:
#     now_utc = now_utc or datetime.utcnow()
#     return now_utc.strftime("%B").lower(), now_utc.strftime("%Y")


# def _current_month_table_name(user_id: int, country: str, now_utc: Optional[datetime] = None) -> str:
#     month_lower, year_str = _current_month_tokens(now_utc)
#     return f"skuwisemonthly_{user_id}_{country.lower()}_{month_lower}{year_str}"


# def _sum_current_month_platform_and_ads(
#     user_id: int,
#     country: str,
#     now_utc: Optional[datetime] = None,
# ) -> Tuple[Optional[float], Optional[float]]:
#     now_utc = now_utc or datetime.utcnow()
#     tname = _current_month_table_name(user_id, country, now_utc)

#     try:
#         meta = MetaData()
#         tbl = Table(tname, meta, autoload_with=db.engine)

#         if "platform_fee" not in tbl.c or "advertising_total" not in tbl.c:
#             return None, None

#         with db.engine.connect() as conn:
#             row = conn.execute(
#                 select(
#                     func.coalesce(func.sum(tbl.c.platform_fee), 0).label("platform_fee_sum"),
#                     func.coalesce(func.sum(tbl.c.advertising_total), 0).label("advertising_total_sum"),
#                 )
#             ).one()

#         return float(row.platform_fee_sum or 0), float(row.advertising_total_sum or 0)

#     except NoSuchTableError:
#         logger.info("Platform/ads table %s does not exist yet; skipping.", tname)
#         return None, None

#     except Exception as e:
#         logger.exception("Failed to sum platform/ads: %s", e)
#         return None, None


# def _profit_from_buckets(by_cur: Dict[str, Dict[str, Decimal]]) -> Dict[str, str]:
#     outp: Dict[str, str] = {}
#     for cur, b in by_cur.items():
#         val = (
#             abs(b["net_sales"])
#             + abs(b["net_credits"])
#             - abs(b["net_taxes"])
#             - abs(b["fba_fees"])
#             - abs(b["selling_fees"])
#             - abs(b["cogs"])
#         ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
#         outp[cur] = str(val)
#     return outp

# def _pct_change_as_str(curr: Optional[Any], prev: Optional[Any]) -> Optional[str]:
#     """
#     Percentage change as string with % symbol:
#       (curr - prev) / prev * 100

#     Returns like '+16.82%' or '-3.25%'.
#     Returns None if prev is zero or any value is None.
#     """
#     if curr is None or prev is None:
#         return None

#     curr_dec = Decimal(str(curr))
#     prev_dec = Decimal(str(prev))

#     if prev_dec == 0:
#         return None  # avoid division by zero

#     pct = ((curr_dec - prev_dec) / prev_dec * Decimal("100")).quantize(
#         Decimal("0.01"),
#         rounding=ROUND_HALF_UP,
#     )

#     if pct > 0:
#         return f"+{pct}%"
#     return f"{pct}%"

# # -------------------------------------------------------------------------------------------
# # NEW HELPERS: previous month same-day user_{user_id}_{country}_{month}{year}_data table
# # -------------------------------------------------------------------------------------------
# def _prev_month_same_day_tokens(now_utc: Optional[datetime] = None) -> Tuple[datetime, str]:
#     """
#     Returns:
#       - target_date: same day number in previous month (clamped to month end if needed)
#       - table_suffix: e.g. 'november2025'
#     """
#     now_utc = now_utc or datetime.utcnow()

#     first_of_month = now_utc.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
#     last_prev_month = first_of_month - timedelta(days=1)

#     day = min(now_utc.day, last_prev_month.day)
#     target_date = last_prev_month.replace(day=day)

#     month_name = target_date.strftime("%B").lower()
#     year_str = target_date.strftime("%Y")
#     suffix = f"{month_name}{year_str}"
#     return target_date, suffix


# def _prev_month_same_day_user_table_name(
#     user_id: int,
#     country: str,
#     now_utc: Optional[datetime] = None,
# ) -> Tuple[str, datetime]:
#     target_date, suffix = _prev_month_same_day_tokens(now_utc)
#     tname = f"user_{user_id}_{country.lower()}_{suffix}_data"
#     return tname, target_date

# def _sum_prev_month_same_day_from_user_table(
#     user_id: int,
#     country: str,
#     now_utc: Optional[datetime] = None,
# ) -> Optional[Dict[str, Any]]:
#     """
#     Read from user_{user_id}_{country}_{month}{year}_data.

#     If now_utc = 2025-12-04:
#       - previous month is November 2025
#       - target_date = 2025-11-04
#       - window is 2025-11-01 → 2025-11-04 (inclusive)

#     If now_utc = 2025-12-05:
#       - window is 2025-11-01 → 2025-11-05, etc.

#     Returns aggregated totals plus:
#       - profit = product_sales - cost_of_unit_sold - selling_fees - fba_fees
#       - asp    = product_sales / quantity
#     """
#     now_utc = now_utc or datetime.utcnow()
#     table_name, target_date = _prev_month_same_day_user_table_name(user_id, country, now_utc)

#     # Start of previous month = day 1 of target_date's month
#     window_start = target_date.replace(day=1)

#     meta = MetaData()
#     try:
#         tbl = Table(table_name, meta, autoload_with=db.engine)
#     except NoSuchTableError:
#         logger.info("User data table %s does not exist; skipping.", table_name)
#         return None

#     # --- Decide WHERE clause: use safe date expression on date_time ---
#     if "date_time" in tbl.c:
#         # NULLIF(date_time, '0') turns the bad "0" value into NULL
#         safe_date_expr = func.date(
#             cast(func.nullif(tbl.c.date_time, "0"), Date)
#         )

#         # date BETWEEN window_start AND target_date (inclusive)
#         where_clause = safe_date_expr.between(
#             window_start.date(),
#             target_date.date(),
#         )

#         logger.info(
#             "Summing %s for previous month window using "
#             "date(NULLIF(date_time,'0')::date) BETWEEN %s AND %s",
#             table_name,
#             window_start.date(),
#             target_date.date(),
#         )
#     else:
#         where_clause = None
#         logger.warning(
#             "No date_time column found on %s; summing entire table (no date filter).",
#             table_name,
#         )

#     # Small helper: if a column is missing, treat it as 0
#     def _col_or_zero(col_name: str):
#         if col_name in tbl.c:
#             return tbl.c[col_name]
#         return literal(0)

#     stmt = select(
#         func.coalesce(func.sum(_col_or_zero("quantity")), 0).label("quantity"),
#         func.coalesce(func.sum(_col_or_zero("product_sales")), 0).label("product_sales"),
#         func.coalesce(func.sum(_col_or_zero("selling_fees")), 0).label("selling_fees"),
#         func.coalesce(func.sum(_col_or_zero("fba_fees")), 0).label("fba_fees"),
#         func.coalesce(func.sum(_col_or_zero("cost_of_unit_sold")), 0).label("cost_of_unit_sold"),
#     )

#     if where_clause is not None:
#         stmt = stmt.where(where_clause)

#     with db.engine.connect() as conn:
#         row = conn.execute(stmt).mappings().one()

#     # ---- Convert to Decimal for calculations ----
#     qty_dec = Decimal(str(row["quantity"] or 0))
#     product_sales_dec = Decimal(str(row["product_sales"] or 0))
#     selling_fees_dec = Decimal(str(row["selling_fees"] or 0))
#     fba_fees_dec = Decimal(str(row["fba_fees"] or 0))
#     cost_of_unit_sold_dec = Decimal(str(row["cost_of_unit_sold"] or 0))

#     # profit = product_sales - cost_of_unit_sold - selling_fees - fba_fees
#     profit_dec = product_sales_dec - cost_of_unit_sold_dec - selling_fees_dec + fba_fees_dec

#     # asp = product_sales / quantity (safe)
#     if qty_dec != 0:
#         asp_dec = (product_sales_dec / qty_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
#     else:
#         asp_dec = Decimal("0.00")

#     return {
#         "table": table_name,
#         "window_start": window_start.strftime("%Y-%m-%d"),   # 2025-11-01
#         "target_date": target_date.strftime("%Y-%m-%d"),      # 2025-11-04 (or 05 etc.)
#         "quantity": float(qty_dec),
#         "product_sales": float(product_sales_dec),
#         "selling_fees": float(selling_fees_dec),
#         "fba_fees": float(fba_fees_dec),
#         "cost_of_unit_sold": float(cost_of_unit_sold_dec),
#         "profit": float(profit_dec),
#         "asp": float(asp_dec),
#     }


# # -------------------------------------------------------------------------------------------
# # DIRECT FINANCIAL FIELDS FROM AMAZON FINANCES API (PER SKU)
# # -------------------------------------------------------------------------------------------
# def _fetch_order_financials_direct_from_amazon(
#     user_id: int,
#     start_date: datetime,
#     end_date: datetime,
# ) -> List[Dict[str, Any]]:
#     """
#     Fetch per-SKU financial fields directly from Amazon Finances API.

#     We aggregate by SKU (not order id) so later we can match on Order.sku.
#     Returns a list of rows:

#     {
#         "sku": "ABC-123",
#         "product_sales": Decimal,
#         "product_sales_tax": Decimal,
#         ...
#         "selling_fees": Decimal,
#         "fba_fees": Decimal,
#         "total": Decimal,
#         "order_finances": { ... }  # raw dict for debugging
#     }
#     """
#     logger.info(
#         f"Fetching direct financial data from Amazon Finances API "
#         f"for {start_date.isoformat()} → {end_date.isoformat()}"
#     )

#     raw_rows, slice_debug = _collect_month_events_events_only(
#         start_date,
#         end_date,
#         user_id,
#         initial_hours=24,
#         min_slice_minutes=30,
#         max_per_page=100,
#         debug=False,
#     )

#     logger.info(f"✓ Collected {len(raw_rows)} raw financial event rows")

#     aggregated, _sid_set = _aggregate_to_transactions_full(raw_rows, user_id)
#     logger.info(f"✓ Aggregated to {len(aggregated)} financial transactions")

#     # Optional enrichment
#     try:
#         _enrich_from_settlement_report(aggregated, start_date, end_date, logger)
#         logger.info("✓ Enriched from settlement report")
#     except Exception as e:
#         logger.warning(f"Settlement enrichment failed (non-critical): {e}")

#     financial_fields = [
#         "product_sales",
#         "product_sales_tax",
#         "postage_credits",
#         "shipping_credits_tax",
#         "gift_wrap_credits",
#         "giftwrap_credits_tax",
#         "promotional_rebates",
#         "promotional_rebates_tax",
#         "marketplace_withheld_tax",
#         "other_transaction_fees",
#         "other",
#         "total",
#         "selling_fees",
#         "fba_fees",
#     ]

#     fin_map: Dict[str, Dict[str, Decimal]] = {}

#     for row in aggregated:
#         # Try to extract SKU from different possible keys
#         sku_raw = (
#             row.get("seller_sku")
#             or row.get("SellerSKU")
#             or row.get("SellerSku")
#             or row.get("sku")
#         )
#         if not sku_raw:
#             continue

#         sku = str(sku_raw).strip()
#         if not sku:
#             continue

#         if sku not in fin_map:
#             fin_map[sku] = {f: Decimal("0") for f in financial_fields}

#         dest = fin_map[sku]
#         for f in financial_fields:
#             val = row.get(f)
#             if val is None:
#                 continue
#             try:
#                 dest[f] += Decimal(str(val))
#             except Exception as e:
#                 logger.warning(f"Failed to convert {f}={val} to Decimal for sku={sku}: {e}")

#     logger.info(f"✓ Built financial map (per SKU) for {len(fin_map)} SKUs")

#     if fin_map:
#         sample_skus = list(fin_map.keys())[:5]
#         logger.info(f"Sample SKUs with financial data: {sample_skus}")
#         for s in sample_skus:
#             logger.info(
#                 f"  {s}: selling_fees={fin_map[s].get('selling_fees')}, "
#                 f"fba_fees={fin_map[s].get('fba_fees')}"
#             )

#     out_rows: List[Dict[str, Any]] = []
#     for sku, vals in fin_map.items():
#         row = {"sku": sku}
#         row.update(vals)
#         row["order_finances"] = {
#             "sku": sku,
#             **{k: str(v) for k, v in vals.items()},
#         }
#         out_rows.append(row)

#     return out_rows


# # =================================================================================================
# # UPSERT: COGS ONLY (orders table)
# # =================================================================================================
# def _upsert_orders_to_db_cogs_only(
#     order_items: List[dict],
#     marketplace_id: str,
#     user_id: Optional[int],
# ) -> Tuple[int, Optional[datetime], Optional[datetime]]:
#     """
#     Upsert orders with COGS, without any finance fields (fees etc).
#     Finance fields (and final total_amount) are filled later by _update_orders_with_finances (per SKU).
#     """
#     if not order_items or not user_id:
#         return 0, None, None

#     rows: List[Dict[str, Any]] = []
#     now_utc = datetime.utcnow()

#     # Pre-cache SKU prices
#     unique_skus = {o.get("sku") for o in order_items if o.get("sku")}
#     sku_price_cache: Dict[str, Tuple[Optional[Decimal], Optional[Decimal]]] = {}

#     for sku in unique_skus:
#         price, rate = _get_price_and_rate_for_sku(sku, marketplace_id, now_utc)
#         sku_price_cache[sku] = (price, rate)

#     missing_sku_count = 0
#     missing_price_count = 0
#     successful_cogs_count = 0

#     for o in order_items:
#         amazon_order_id_raw = o.get("AmazonOrderId")
#         if not amazon_order_id_raw:
#             continue

#         amazon_order_id = str(amazon_order_id_raw).strip()
#         if not amazon_order_id:
#             continue

#         total = o.get("OrderTotal") or {}
#         amount = _to_decimal(total.get("Amount"))  # initial, will be overridden by finances later
#         currency = total.get("CurrencyCode")
#         qty = _compute_order_quantity(o)
#         sku_val = o.get("sku")
#         product_name = o.get("product_name")

#         cogs_value: Optional[Decimal] = None
#         if not sku_val:
#             missing_sku_count += 1
#         elif qty and sku_val in sku_price_cache:
#             price, rate = sku_price_cache[sku_val]
#             if price is not None and rate is not None:
#                 cogs_value = (Decimal(qty) * price * rate).quantize(
#                     Decimal("0.01"), rounding=ROUND_HALF_UP
#                 )
#                 successful_cogs_count += 1
#             else:
#                 missing_price_count += 1
#         else:
#             missing_price_count += 1

#         addr = o.get("ShippingAddress") or {}
#         rows.append(
#             {
#                 "user_id": user_id,
#                 "amazon_order_id": amazon_order_id,
#                 "purchase_date": _parse_dt_any(o.get("PurchaseDate") or o.get("LastUpdateDate")),
#                 "order_status": o.get("OrderStatus"),
#                 "total_amount": amount,  # temporary, overwritten by finances
#                 "currency": currency,
#                 "marketplace_id": o.get("MarketplaceId") or marketplace_id,
#                 "sales_channel": o.get("SalesChannel"),
#                 "city": _extract_addr_field(addr, "City", "city"),
#                 "state": _extract_state(addr),
#                 "postal_code": _extract_addr_field(addr, "PostalCode", "postalCode", "postal_code"),
#                 "country": _extract_addr_field(addr, "CountryCode", "countryCode", "country"),
#                 "quantity": qty,
#                 "sku": sku_val,
#                 "product_name": product_name,
#                 "cogs": cogs_value,
#                 # Finance fields left as NULL (will be filled later)
#             }
#         )

#     logger.info(
#         f"""
#     COGS Calculation Summary:
#     - Total orders: {len(rows)}
#     - Missing SKU: {missing_sku_count}
#     - Missing price/rate: {missing_price_count}
#     - Successful COGS: {successful_cogs_count}
#     - Success rate: {(successful_cogs_count / len(rows) * 100 if rows else 0):.1f}%
#     """
#     )

#     if not rows:
#         return 0, None, None

#     dates = [r["purchase_date"] for r in rows if r.get("purchase_date")]
#     if not dates:
#         min_dt = max_dt = None
#     else:
#         min_dt, max_dt = min(dates), max(dates)

#     stmt = insert(Order).values(rows)
#     stmt = stmt.on_conflict_do_update(
#         index_elements=[Order.amazon_order_id],
#         set_={
#             "user_id": stmt.excluded.user_id,
#             "purchase_date": stmt.excluded.purchase_date,
#             "order_status": stmt.excluded.order_status,
#             "total_amount": stmt.excluded.total_amount,
#             "currency": stmt.excluded.currency,
#             "marketplace_id": stmt.excluded.marketplace_id,
#             "sales_channel": stmt.excluded.sales_channel,
#             "city": stmt.excluded.city,
#             "state": stmt.excluded.state,
#             "postal_code": stmt.excluded.postal_code,
#             "country": stmt.excluded.country,
#             "quantity": stmt.excluded.quantity,
#             "sku": stmt.excluded.sku,
#             "product_name": stmt.excluded.product_name,
#             "cogs": stmt.excluded.cogs,
#             "updated_at": datetime.utcnow(),
#         },
#     )
#     db.session.execute(stmt)
#     db.session.commit()

#     logger.info(f"✓ Upserted {len(rows)} orders to database (COGS only)")

#     return len(rows), min_dt, max_dt


# # =================================================================================================
# # UPDATE: FINANCE FIELDS BY SKU  (AND OVERRIDE total_amount)
# # =================================================================================================
# def _update_orders_with_finances(
#     user_id: int,
#     marketplace_id: str,
#     start_dt: datetime,
#     end_dt: datetime,
# ) -> int:
#     """
#     Call Finances API and update finance-related columns on orders table
#     by matching on SKU.

#     IMPORTANT CHANGE:
#       - We now respect the (start_dt, end_dt) window passed in.
#       - Finances are only fetched and allocated for that exact window.
#       - This guarantees that the sum of product_sales over that window
#         matches Amazon for the same date range.
#     """
#     if not start_dt or not end_dt:
#         logger.info("No date window passed to _update_orders_with_finances; skipping.")
#         return 0

#     # --- normalize window & add small safety offset on the end ---
#     finance_start = start_dt.replace(microsecond=0)
#     now_utc = datetime.utcnow()
#     # prevent querying into the last couple minutes where events may not have posted yet
#     latest_safe = now_utc - timedelta(minutes=3)

#     finance_end = end_dt.replace(microsecond=0)
#     if finance_end > latest_safe:
#         finance_end = latest_safe

#     if finance_end <= finance_start:
#         # ensure non-zero span
#         finance_end = finance_start + timedelta(minutes=10)

#     logger.info(
#         "Calling Finances API for window (per-SKU): "
#         f"{finance_start.isoformat()} -> {finance_end.isoformat()}"
#     )

#     finance_rows = _fetch_order_financials_direct_from_amazon(
#         user_id=user_id,
#         start_date=finance_start,
#         end_date=finance_end,
#     )

#     if not finance_rows:
#         logger.info("No finance rows returned; skipping finance update")
#         return 0

#     updated_orders_total = 0
#     skipped_skus = 0

#     try:
#         for fr in finance_rows:
#             sku = fr.get("sku")
#             if not sku:
#                 continue

#             # ONLY orders for this SKU inside the same window
#             q_base = db.session.query(Order).filter(
#                 Order.user_id == user_id,
#                 Order.marketplace_id == marketplace_id,
#                 Order.sku == sku,
#                 Order.purchase_date >= finance_start,
#                 Order.purchase_date <= finance_end,
#             )

#             order_count = q_base.count()
#             if order_count == 0:
#                 skipped_skus += 1
#                 continue

#             update_dict: Dict[str, Any] = {}
#             for field in [
#                 "product_sales",
#                 "product_sales_tax",
#                 "postage_credits",
#                 "shipping_credits_tax",
#                 "gift_wrap_credits",
#                 "giftwrap_credits_tax",
#                 "promotional_rebates",
#                 "promotional_rebates_tax",
#                 "marketplace_withheld_tax",
#                 "other_transaction_fees",
#                 "other",
#                 "total",
#                 "selling_fees",
#                 "fba_fees",
#             ]:
#                 val = fr.get(field)
#                 if val is None:
#                     continue
#                 try:
#                     per_order = (Decimal(str(val)) / Decimal(order_count)).quantize(
#                         Decimal("0.01"), rounding=ROUND_HALF_UP
#                     )
#                 except Exception:
#                     per_order = None
#                 if per_order is not None:
#                     update_dict[field] = per_order

#             # Raw JSON for debugging / UI
#             update_dict["order_finances"] = fr.get("order_finances")
#             update_dict["updated_at"] = datetime.utcnow()

#             # Override total_amount: product_sales - product_sales_tax
#             ps = update_dict.get("product_sales")
#             pst = update_dict.get("product_sales_tax")

#             if ps is not None:
#                 base = ps
#                 if pst is not None:
#                     base = ps - pst

#                 update_dict["total_amount"] = base.quantize(
#                     Decimal("0.01"),
#                     rounding=ROUND_HALF_UP,
#                 )

#                 # profit = total_amount - selling_fees - fba_fees - cogs

#                 ta = update_dict.get("total_amount") or Decimal("0")
#                 sf = update_dict.get("selling_fees") or Decimal("0")
#                 ff = update_dict.get("fba_fees") or Decimal("0")

#                 # Fetch COGS from the existing order record (COGS is not in update_dict)
#                 existing_order = q_base.first()
#                 cg = existing_order.cogs if existing_order and existing_order.cogs is not None else Decimal("0")

#                 update_dict["profit"] = (ta - sf - ff - cg).quantize(
#                     Decimal("0.01"),
#                     rounding=ROUND_HALF_UP,
#                 )


#             updated_rows = q_base.update(update_dict, synchronize_session=False)
#             updated_orders_total += updated_rows

#         db.session.commit()

#     except Exception as e:
#         logger.error("Finance update failed")
#         logger.exception(e)
#         db.session.rollback()
#         return 0

#     logger.info(
#         f"Updated finance columns for {updated_orders_total} orders "
#         f"(skipped {skipped_skus} SKUs with no matching orders)"
#     )

#     # Debug sample
#     debug_orders = (
#         db.session.query(
#             Order.amazon_order_id,
#             Order.sku,
#             Order.product_sales,
#             Order.product_sales_tax,
#             Order.postage_credits,
#             Order.shipping_credits_tax,
#             Order.total_amount,
#             Order.selling_fees,
#             Order.fba_fees,
#         )
#         .filter(
#             Order.user_id == user_id,
#             Order.marketplace_id == marketplace_id,
#             Order.purchase_date >= finance_start,
#             Order.purchase_date <= finance_end,
#         )
#         .limit(5)
#         .all()
#     )
#     logger.info("DEBUG: sample orders after finance update (SKU-based, window-limited):")
#     for (
#         oid,
#         sku_val,
#         ps,
#         pst,
#         pc,
#         sct,
#         tot_amt,
#         sf,
#         ff,
#     ) in debug_orders:
#         logger.info(
#             f"  {oid} | {sku_val}: "
#             f"product_sales={ps}, product_sales_tax={pst}, "
#             f"postage_credits={pc}, shipping_credits_tax={sct}, "
#             f"total_amount={tot_amt}, selling_fees={sf}, fba_fees={ff}"
#         )

#     return updated_orders_total


# # =================================================================================================
# # UPDATED PROFIT CALCULATION - Uses fees from orders table
# # AND NET SALES = SUM(orders.total_amount) for the month (single currency per marketplace)
# # =================================================================================================
# def _calculate_profit_with_validation_updated(
#     user_id: int,
#     mp: str,
#     month_start: datetime,
#     now_utc: datetime,
#     net_sales_by_currency: Dict[str, Decimal],  # kept for backwards compat; NOT used
#     total_quantity: int,
#     plat_sum: Optional[float],  # DEPRECATED (kept for compatibility)
#     ads_sum: Optional[float],   # DEPRECATED
#     cur_month_table: str,
# ) -> dict:
#     """
#     Uses:
#       - COGS from orders.cogs
#       - Fees from orders.selling_fees / orders.fba_fees
#       - NET SALES from DB: SUM(orders.total_amount) for the current month window
#         (we assume one currency per marketplace: GBP for UK, USD for US).
#     """

#     # ---- 1) Core stats (COGS + fees) ----
#     stats = db.session.query(
#         func.count(Order.id).label("total_orders"),
#         func.sum(case((Order.cogs.isnot(None), 1), else_=0)).label("orders_with_cogs"),
#         func.sum(case((Order.sku.is_(None), 1), else_=0)).label("orders_missing_sku"),
#         func.coalesce(func.sum(Order.cogs), 0).label("total_cogs"),
#         func.coalesce(func.sum(Order.selling_fees), 0).label("total_selling_fees"),
#         func.coalesce(func.sum(Order.fba_fees), 0).label("total_fba_fees"),
#         func.sum(case((Order.selling_fees.isnot(None), 1), else_=0)).label("orders_with_fees"),
#     ).filter(
#         Order.user_id == user_id,
#         Order.marketplace_id == mp,
#         Order.purchase_date >= month_start,
#         Order.purchase_date <= now_utc,
#     ).one()

#     total_orders = int(stats.total_orders or 0)
#     orders_with_cogs = int(stats.orders_with_cogs or 0)
#     orders_missing_sku = int(stats.orders_missing_sku or 0)
#     orders_with_fees = int(stats.orders_with_fees or 0)

#     cogs_sum = Decimal(str(stats.total_cogs)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
#     selling_fees = Decimal(str(stats.total_selling_fees)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
#     fba_fees = Decimal(str(stats.total_fba_fees)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

#     cogs_coverage = (orders_with_cogs / total_orders * 100) if total_orders > 0 else 0
#     fee_coverage = (orders_with_fees / total_orders * 100) if total_orders > 0 else 0

#     # ---- 2) NET SALES from DB total_amount (single currency) ----
#     primary_currency = "GBP" if mp == "A1F83G8C2ARO7P" else "USD"

#     net_sales_total = (
#         db.session.query(func.coalesce(func.sum(Order.total_amount), 0))
#         .filter(
#             Order.user_id == user_id,
#             Order.marketplace_id == mp,
#             Order.purchase_date >= month_start,
#             Order.purchase_date <= now_utc,
#         )
#         .scalar()
#     )

#     net_sales_total_dec = Decimal(str(net_sales_total or 0)).quantize(
#         Decimal("0.01"), rounding=ROUND_HALF_UP
#     )

#     # this is what will become "net_sales": "547.15" in breakdown.GBP
#     net_sales_by_currency_db: Dict[str, Decimal] = {
#         primary_currency: net_sales_total_dec
#     }

#     logger.info(
#         f"""
#     Data Validation:
#     - Total orders: {total_orders}
#     - Orders with COGS: {orders_with_cogs} ({cogs_coverage:.1f}%)
#     - Orders with fees: {orders_with_fees} ({fee_coverage:.1f}%)
#     - Orders missing SKU: {orders_missing_sku}
#     - Total COGS: {cogs_sum}
#     - Total Selling Fees: {selling_fees}
#     - Total FBA Fees: {fba_fees}
#     - Net sales (from orders.total_amount, {primary_currency}): {net_sales_total_dec}
#     """
#     )

#     # ---- 3) Build buckets for profit ----
#     buckets: Dict[str, Dict[str, Decimal]] = {}

#     # Only one currency per marketplace
#     b = _ensure_bucket(buckets, primary_currency)
#     b["net_sales"] = net_sales_total_dec
#     b["cogs"] = cogs_sum
#     b["quantity"] = Decimal(total_quantity)
#     b["selling_fees"] = selling_fees
#     b["fba_fees"] = fba_fees

#     profit = _profit_from_buckets(buckets)

#     warnings = []
#     if cogs_coverage < 100:
#         warnings.append(f"{total_orders - orders_with_cogs} orders missing COGS")
#     if orders_missing_sku > 0:
#         warnings.append(f"{orders_missing_sku} orders have NULL SKU")
#     if fee_coverage < 50:
#         warnings.append(
#             f"Low fee coverage: only {orders_with_fees}/{total_orders} orders have fee data. "
#             f"Ensure finances sync ran successfully."
#         )

#     return {
#         "profit": profit,
#         "breakdown": {c: {k: str(v) for k, v in bucket.items()} for c, bucket in buckets.items()},
#         "fee_breakdown": {
#             "selling_fees": str(selling_fees),
#             "fba_fees": str(fba_fees),
#             "source": "orders.selling_fees + orders.fba_fees (populated directly from Amazon Finances API, per SKU)",
#         },
#         "cogs_validation": {
#             "total_orders": total_orders,
#             "orders_with_cogs": orders_with_cogs,
#             "orders_missing_sku": orders_missing_sku,
#             "cogs_coverage_percentage": round(cogs_coverage, 2),
#             "orders_with_fees": orders_with_fees,
#             "fee_coverage_percentage": round(fee_coverage, 2),
#             "warnings": warnings if warnings else None,
#         },
#         "net_sales_source": "SUM(orders.total_amount) for month window, single currency per marketplace",
#     }


# # -------------------------------------------------------------------------------------------
# # MAIN ROUTE
# # -------------------------------------------------------------------------------------------
# @amazon_live_api_bp.route("/amazon_api/orders", methods=["GET"])
# def orders_all_in_one():
#     start_time = datetime.utcnow()

#     # ---------------------------------------------------------
#     # Auth
#     # ---------------------------------------------------------
#     auth_header = request.headers.get("Authorization")
#     if not auth_header or not auth_header.startswith("Bearer "):
#         return jsonify({"error": "Authorization token is missing or invalid"}), 401

#     token = auth_header.split(" ")[1]
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
#         user_id = payload.get("user_id")
#     except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
#         return jsonify({"error": str(e)}), 401

#     _apply_region_and_marketplace_from_request()

#     mp = request.args.get("marketplace_id", amazon_client.marketplace_id)
#     if mp not in ALLOWED_MARKETPLACES:
#         return jsonify({"success": False, "error": "Unsupported marketplace"}), 400

#     out: Dict[str, Any] = {
#         "success": True,
#         "marketplace_id": mp,
#         "orders": {"count": 0, "items": []},
#         "db": {"saved_orders": 0, "saved_finances": 0},
#     }

#     # ---------------------------------------------------------
#     # Helpers
#     # ---------------------------------------------------------
#     def parse_dt_iso_z(s: Optional[str]) -> Optional[datetime]:
#         if not s:
#             return None
#         dt = _parse_dt_any(s)
#         if dt:
#             return dt
#         try:
#             return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ")
#         except Exception:
#             return None

#     start_dt = parse_dt_iso_z(request.args.get("start_date"))
#     end_dt = parse_dt_iso_z(request.args.get("end_date"))

#     all_orders: List[dict] = []

#     # ---------------------------------------------------------
#     # Fetch orders from SP-API
#     # ---------------------------------------------------------
#     try:
#         if start_dt and end_dt:
#             max_span = timedelta(days=7)
#             cur_start = start_dt
#             while cur_start < end_dt:
#                 cur_end = min(cur_start + max_span, end_dt)
#                 q = {
#                     "MarketplaceIds": [mp],
#                     "MaxResultsPerPage": 100,
#                     "CreatedAfter": cur_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
#                     "CreatedBefore": cur_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
#                 }
#                 res = amazon_client.make_api_call("/orders/v0/orders", "GET", q)
#                 if res and "error" not in res:
#                     payload = res.get("payload") or res
#                     all_orders += payload.get("Orders") or []
#                     nxt = payload.get("NextToken")
#                     while nxt:
#                         page = amazon_client.make_api_call(
#                             "/orders/v0/orders", "GET", {"NextToken": nxt}
#                         )
#                         if not page or "error" in page:
#                             break
#                         p2 = page.get("payload") or page
#                         all_orders += p2.get("Orders") or []
#                         nxt = p2.get("NextToken")
#                 cur_start = cur_end

#         elif start_dt:
#             q = {
#                 "MarketplaceIds": [mp],
#                 "MaxResultsPerPage": 100,
#                 "LastUpdatedAfter": start_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
#             }
#             res = amazon_client.make_api_call("/orders/v0/orders", "GET", q)
#             if res and "error" not in res:
#                 payload = res.get("payload") or res
#                 all_orders += payload.get("Orders") or []
#                 nxt = payload.get("NextToken")
#                 while nxt:
#                     page = amazon_client.make_api_call(
#                         "/orders/v0/orders", "GET", {"NextToken": nxt}
#                     )
#                     if not page or "error" in page:
#                         break
#                     p2 = page.get("payload") or page
#                     all_orders += p2.get("Orders") or []
#                     nxt = p2.get("NextToken")

#         else:
#             default_start = datetime.utcnow().replace(
#                 day=1,
#                 hour=0,
#                 minute=0,
#                 second=0,
#                 microsecond=0,
#             ).strftime("%Y-%m-%dT%H:%M:%SZ")
#             q = {"MarketplaceIds": [mp], "MaxResultsPerPage": 100, "CreatedAfter": default_start}
#             res = amazon_client.make_api_call("/orders/v0/orders", "GET", q)
#             if res and "error" not in res:
#                 payload = res.get("payload") or res
#                 all_orders += payload.get("Orders") or []
#                 nxt = payload.get("NextToken")
#                 while nxt:
#                     page = amazon_client.make_api_call(
#                         "/orders/v0/orders", "GET", {"NextToken": nxt}
#                     )
#                     if not page or "error" in page:
#                         break
#                     p2 = page.get("payload") or page
#                     all_orders += p2.get("Orders") or []
#                     nxt = p2.get("NextToken")

#     except Exception as e:
#         logger.exception("Orders retrieval failed")
#         out["debug"] = {"exception": str(e)}
#         return jsonify(out), 200

#     logger.info(
#         f"✓ Fetched {len(all_orders)} orders in "
#         f"{(datetime.utcnow() - start_time).total_seconds():.2f}s"
#     )

#     # ---------------------------------------------------------
#     # Quantity on payload
#     # ---------------------------------------------------------
#     for o in all_orders:
#         if o.get("quantity") is None:
#             o["quantity"] = _compute_order_quantity(o)

#     # ---------------------------------------------------------
#     # Attach SKUs to payload (DB first, then API)
#     # ---------------------------------------------------------
#     _attach_sku_and_product_to_orders(all_orders, user_id, mp, force_api=True)
#     logger.info(
#         f"✓ Attached SKUs in "
#         f"{(datetime.utcnow() - start_time).total_seconds():.2f}s"
#     )

#     # ---------------------------------------------------------
#     # Upsert orders with COGS only (total_amount temp)
#     # ---------------------------------------------------------
#     try:
#         saved_orders, min_dt, max_dt = _upsert_orders_to_db_cogs_only(all_orders, mp, user_id)
#         logger.info(
#             f"✓ Saved {saved_orders} orders in "
#             f"{(datetime.utcnow() - start_time).total_seconds():.2f}s"
#         )
#     except Exception as e:
#         logger.exception("Order upsert failed")
#         db.session.rollback()
#         saved_orders, min_dt, max_dt = 0, None, None

#     out["db"]["saved_orders"] = saved_orders

#     # ---------------------------------------------------------
#     # Finance update (per-SKU) -> fills selling_fees, fba_fees, product_sales, ..., total_amount
#     # ---------------------------------------------------------
#     saved_finances = 0
#     try:
#         if min_dt and max_dt:
#             saved_finances = _update_orders_with_finances(user_id, mp, min_dt, max_dt)
#     except Exception as e:
#         logger.error("Finance update failed in route")
#         logger.exception(e)
#         db.session.rollback()
#         saved_finances = 0

#     out["db"]["saved_finances"] = saved_finances

#     # ---------------------------------------------------------
#     # Attach extras from DB back onto payload (sku, quantity, product_name)
#     # ---------------------------------------------------------
#     try:
#         _attach_order_extras_to_orders_payload(all_orders, user_id, mp)
#     except Exception as e:
#         logger.exception("Failed to attach extras")
#         db.session.rollback()

#     out["orders"] = {"count": len(all_orders), "items": all_orders}

#     # ===================================================================================
#     # CURRENT MONTH SUMMARY  (BASED ON orders.total_amount, SINGLE CURRENCY PER MP)
#     # ===================================================================================
#     now_utc = datetime.utcnow()
#     month_start = now_utc.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

#     primary_currency = "GBP" if mp == "A1F83G8C2ARO7P" else "USD"

#     # Use orders table (total_amount) so this matches profit breakdown
#     summary_stats = (
#         db.session.query(
#             func.coalesce(func.sum(Order.total_amount), 0).label("net_sales"),
#             func.coalesce(func.sum(Order.quantity), 0).label("total_qty"),
#             func.count(Order.id).label("order_count"),
#         )
#         .filter(
#             Order.user_id == user_id,
#             Order.marketplace_id == mp,
#             Order.purchase_date >= month_start,
#             Order.purchase_date <= now_utc,
#         )
#         .one()
#     )

#     total_net_sales_dec = Decimal(str(summary_stats.net_sales or 0)).quantize(
#         Decimal("0.01"), rounding=ROUND_HALF_UP
#     )
#     total_quantity = int(summary_stats.total_qty or 0)
#     order_count = int(summary_stats.order_count or 0)

#     if total_quantity > 0:
#         asp_dec = (total_net_sales_dec / Decimal(total_quantity)).quantize(
#             Decimal("0.01"), rounding=ROUND_HALF_UP
#         )
#     else:
#         asp_dec = Decimal("0.00")

#     # This will now show 547.15 under GBP (for your example)
#     out["current_month_summary"] = {
#         "window_start_utc": month_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
#         "window_end_utc": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
#         "order_count": order_count,
#         "total_quantity": total_quantity,
#         "net_sales": {primary_currency: str(total_net_sales_dec)},
#         "asp": {primary_currency: str(asp_dec)},
#     }

#     # We can also build a net_sales_by_currency consistent with this, for profit fn
#     net_sales_by_currency = {primary_currency: total_net_sales_dec}

#     # ---------------------------------------------------------
#     # Previous month net sales (from sku-wise table)
#     # ---------------------------------------------------------
#     country = (request.args.get("country") or ("uk" if mp == "A1F83G8C2ARO7P" else "us")).lower()
#     prev_month_table = _prev_month_table_name(user_id, country, now_utc)
#     prev_month_total = _sum_prev_month_net_sales(user_id, country, now_utc)

#     if prev_month_total is not None:
#         prev_month_total = float(
#             (Decimal(str(prev_month_total)) / Decimal("2")).quantize(
#                 Decimal("0.01"), rounding=ROUND_HALF_UP
#             )
#         )

#     out["previous_month_total_net_sales"] = {
#         "table": prev_month_table,
#         "total": prev_month_total,
#     }

#     # ---------------------------------------------------------
#     # Previous month SAME-DAY totals from user_{user_id}_{country}_{month}{year}_data
#     # (e.g. if today is 2025-12-04 -> use 2025-11-04 only)
#     # ---------------------------------------------------------
#     same_day_prev_month_totals = _sum_prev_month_same_day_from_user_table(
#         user_id=user_id,
#         country=country,
#         now_utc=now_utc,
#     )

#     out["previous_month_same_day_user_totals"] = same_day_prev_month_totals

#     # ---------------------------------------------------------
#     # Current month platform/ads from skuwisemonthly (fallback info)
#     # ---------------------------------------------------------
#     cur_month_table = _current_month_table_name(user_id, country, now_utc)
#     plat_sum, ads_sum = _sum_current_month_platform_and_ads(user_id, country, now_utc)

#     out["current_month_skuwise_totals"] = {
#         "platform_fee_total": plat_sum,
#         "advertising_total": ads_sum,
#     }

#     # ---------------------------------------------------------
#     # Profit calculation using orders table (COGS + fees + total_amount-based net sales)
#     # ---------------------------------------------------------
#     logger.info("Using orders table (total_amount + fees) + skuwisemonthly for context")

#     profit_data = _calculate_profit_with_validation_updated(
#         user_id=user_id,
#         mp=mp,
#         month_start=month_start,
#         now_utc=now_utc,
#         net_sales_by_currency=net_sales_by_currency,  # now matches total_amount sum
#         total_quantity=total_quantity,
#         plat_sum=plat_sum,
#         ads_sum=ads_sum,
#         cur_month_table=cur_month_table,
#     )

#     out["current_month_profit"] = profit_data
#     out["current_month_profit"]["finance_rows_found"] = saved_finances > 0


#     # ---------------------------------------------------------
#     # Previous vs Current: percentages (with % symbol)
#     # ---------------------------------------------------------
#     percentage_block = None
#     extra_metrics = None

#     if same_day_prev_month_totals:
#         # Current values (this month)
#         curr_net_sales = total_net_sales_dec                    # Decimal
#         curr_qty = Decimal(str(total_quantity))                 # int -> Decimal
#         curr_asp = asp_dec                                      # Decimal
#         curr_profit = Decimal(str(profit_data["profit"][primary_currency]))

#         # Previous month same-day values
#         prev_product_sales = Decimal(str(same_day_prev_month_totals.get("product_sales")))
#         prev_qty = Decimal(str(same_day_prev_month_totals.get("quantity")))
#         prev_asp = Decimal(str(same_day_prev_month_totals.get("asp")))
#         prev_profit = Decimal(str(same_day_prev_month_totals.get("profit")))

#         # Standard percentage changes
#         percentage_block = {
#             "percentage_sales": _pct_change_as_str(curr_net_sales, prev_product_sales),
#             "percentage_quantity": _pct_change_as_str(curr_qty, prev_qty),
#             "percentage_asp": _pct_change_as_str(curr_asp, prev_asp),
#             "percentage_profit": _pct_change_as_str(curr_profit, prev_profit),
#         }

#         # ---------------------------------------------------------
#         # NEW METRIC: percentage_profit_percentage
#         # Formula:
#         #   (prev_profit / prev_sales)*100  -  (curr_profit / curr_sales)*100
#         # ---------------------------------------------------------
#         profit_pct_prev = None
#         profit_pct_curr = None
#         profit_pct_diff = None

#         if prev_product_sales != 0:
#             profit_pct_prev = (prev_profit / prev_product_sales * Decimal("100")).quantize(
#                 Decimal("0.01"), rounding=ROUND_HALF_UP
#             )

#         if curr_net_sales != 0:
#             profit_pct_curr = (curr_profit / curr_net_sales * Decimal("100")).quantize(
#                 Decimal("0.01"), rounding=ROUND_HALF_UP
#             )

#         if profit_pct_prev is not None and profit_pct_curr is not None:
#             diff = (profit_pct_curr - profit_pct_prev).quantize(Decimal("0.01"))
#             # Add % symbol
#             if diff > 0:
#                 profit_pct_diff = f"+{diff}%"
#             else:
#                 profit_pct_diff = f"{diff}%"

#         extra_metrics = {
#             "profit_percentage_previous_month": f"{profit_pct_prev}%" if profit_pct_prev is not None else None,
#             "profit_percentage_current_month": f"{profit_pct_curr}%" if profit_pct_curr is not None else None,
#             "percentage_profit_percentage": profit_pct_diff,
#         }

#     out["previous_month_vs_current_percentages"] = percentage_block
#     out["profit_percentage_comparison"] = extra_metrics



#     # ---------------------------------------------------------
#     # Performance
#     # ---------------------------------------------------------
#     elapsed = (datetime.utcnow() - start_time).total_seconds()
#     out["performance"] = {"total_time_seconds": round(elapsed, 2)}
#     logger.info(f"✓ Request completed in {elapsed:.2f}s")

#     return jsonify(out), 200
