from __future__ import annotations
import base64, io, os,time, gzip, csv, logging
import pandas as pd
from datetime import datetime
from decimal import Decimal, InvalidOperation
from sqlalchemy.dialects.postgresql import insert as pg_insert
import jwt, requests
from Crypto.Cipher import AES
from dotenv import find_dotenv, load_dotenv
from flask import Blueprint,  jsonify, request
from app import db
from app.models.user_models import CountryProfile, Category
from app.utils.amazon_utils import amazon_client, _apply_region_and_marketplace_from_request
from sqlalchemy import and_, or_
import numpy as np 
from config import Config
SECRET_KEY = Config.SECRET_KEY
from sqlalchemy import create_engine
from sqlalchemy import MetaData, Table, Column, Integer, String, Float, text
from app.models.user_models import db,Fee
from sqlalchemy.orm import sessionmaker


from dotenv import load_dotenv
from sqlalchemy import MetaData
# App config / auth
from config import Config
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func

SECRET_KEY = Config.SECRET_KEY

# --- load .env robustly (works no matter where you run `flask run`) ---
dotenv_path = find_dotenv(filename=".env", usecwd=True)
load_dotenv(dotenv_path, override=True)

logger = logging.getLogger("amazon_sp_api")
logging.basicConfig(level=logging.INFO)
load_dotenv()
db_url  = os.getenv('DATABASE_URL')
db_url1 = os.getenv('DATABASE_ADMIN_URL') or db_url  # fallback


if not db_url:
    raise RuntimeError("DATABASE_URL is not set")
if not db_url1:
    # optional: log a warning if using fallback
    print("[WARN] DATABASE_ADMIN_URL not set; falling back to DATABASE_URL")

fee_preview_bp = Blueprint("fee_preview", __name__)






# ------------------------------------------- Fee Preview header map ----------------------------------------


# --------------------------
# Header map & type coercion
# --------------------------
FEE_PREVIEW_HEADER_MAP = {
    'sku':                       'sku',
    'fnsku':                     'fnsku',
    'asin':                      'asin',
    'amazon-store':              'amazon_store',
    'product-name':              'product_name',
    'product-group':             'product_group',
    'brand':                     'brand',
    'fulfilled-by':              'fulfilled_by',
    'has-local-inventory':       'has_local_inventory',
    'your-price':                'your_price',
    'sales-price':               'sales_price',
    'longest-side':              'longest_side',
    'median-side':               'median_side',
    'shortest-side':             'shortest_side',
    'length-and-girth':          'length_and_girth',
    'unit-of-dimension':         'unit_of_dimension',
    'item-package-weight':       'item_package_weight',
    'unit-of-weight':            'unit_of_weight',
    'product-size-weight-band':  'product_size_weight_band',
    'currency':                  'currency',
    'estimated-fee-total':                           'estimated_fee_total',
    'estimated-referral-fee-per-unit':               'estimated_referral_fee_per_unit',
    'estimated-variable-closing-fee':                'estimated_variable_closing_fee',
    'estimated-order-handling-fee-per-order':        'estimated_order_handling_fee_per_order',
    'expected-domestic-fulfilment-fee-per-unit':     'expected_domestic_fulfilment_fee_per_unit',
    'expected-efn-fulfilment-fee-per-unit-uk':       'expected_efn_fulfilment_fee_per_unit_uk',
    'expected-efn-fulfilment-fee-per-unit-de':       'expected_efn_fulfilment_fee_per_unit_de',
    'expected-efn-fulfilment-fee-per-unit-fr':       'expected_efn_fulfilment_fee_per_unit_fr',
    'expected-efn-fulfilment-fee-per-unit-it':       'expected_efn_fulfilment_fee_per_unit_it',
    'expected-efn-fulfilment-fee-per-unit-es':       'expected_efn_fulfilment_fee_per_unit_es',
    'expected-efn-fulfilment-fee-per-unit-se':       'expected_efn_fulfilment_fee_per_unit_se',
}
# common aliases found in other exports
FEE_PREVIEW_HEADER_MAP.update({
    'seller-sku': 'sku',
    'item-name': 'product_name',
    'price': 'your_price',
    'item-price': 'your_price',
})

_NUMERIC_COLS = {
    'your_price','sales_price','longest_side','median_side','shortest_side','length_and_girth',
    'item_package_weight','estimated_fee_total','estimated_referral_fee_per_unit',
    'estimated_variable_closing_fee','estimated_order_handling_fee_per_order',
    'expected_domestic_fulfilment_fee_per_unit',
    'expected_efn_fulfilment_fee_per_unit_uk','expected_efn_fulfilment_fee_per_unit_de',
    'expected_efn_fulfilment_fee_per_unit_fr','expected_efn_fulfilment_fee_per_unit_it',
    'expected_efn_fulfilment_fee_per_unit_es','expected_efn_fulfilment_fee_per_unit_se',
}

def _coerce_bool(v):
    if v is None: return None
    s = str(v).strip().lower()
    if s in ('true','t','1','yes','y'): return True
    if s in ('false','f','0','no','n'): return False
    return None

def _coerce_decimal(v):
    if v is None or v == '': return None
    try:
        return Decimal(str(v).replace(',', '').strip())
    except InvalidOperation:
        return None

# --------------------------
# CSV/TSV parsing
# --------------------------
def _read_fee_bytes(raw: bytes):
    """
    Detects delimiter (tab vs comma). Returns list of dicts with normalized keys.
    """
    sample = raw[:4096].decode('utf-8', errors='replace')
    delim = '\t' if sample.count('\t') > sample.count(',') else ','
    rdr = csv.DictReader(io.StringIO(raw.decode('utf-8', errors='replace')), delimiter=delim)

    def _norm_key(k: str) -> str:
        # normalize headers to expected keys
        return (k or '').strip().lower().replace('  ', ' ').replace(' ', '-')

    rows = []
    for r in rdr:
        rows.append({_norm_key(k): (v or '').strip() for k, v in r.items()})
    return rows

# --------------------------
# Normalization & dedupe
# --------------------------
def _normalize_fee_row(r: dict, user_id: int, marketplace_id: str) -> dict:
    sku = (r.get("sku") or "").strip()
    mp  = (marketplace_id or "").strip()
    out = {
        "user_id": user_id,
        "sku": sku or None,
        "marketplace_id": mp,
        "synced_at": datetime.utcnow(),
    }
    for src, dst in FEE_PREVIEW_HEADER_MAP.items():
        if src not in r:
            continue
        val = r.get(src)
        if dst == 'has_local_inventory':
            out[dst] = _coerce_bool(val)
        elif dst in _NUMERIC_COLS:
            out[dst] = _coerce_decimal(val)
        else:
            out[dst] = (val or None)
    return out

def _dedupe_fee_rows(rows: list[dict]) -> list[dict]:
    """
    Deduplicate on (user_id, sku, marketplace_id). Last row wins.
    Skips rows with missing keys.
    """
    by_key = {}
    for r in rows:
        k = (r.get("user_id"), r.get("sku"), r.get("marketplace_id"))
        if not k[0] or not k[1] or not k[2]:
            continue
        by_key[k] = r
    return list(by_key.values())

# --------------------------
# Upsert (fixes cardinality)
# --------------------------
def _upsert_fee_preview(rows: list[dict]) -> int:
    """
    Upsert on (user_id, sku, marketplace_id) using uq_fee_user_sku_mkt.
    We DEDUPE the batch first to avoid the Postgres "affect row a second time" error.
    """
    if not rows:
        return 0
    unique_rows = _dedupe_fee_rows(rows)
    if not unique_rows:
        return 0

    stmt = pg_insert(Fee).values(unique_rows)

    excluded = stmt.excluded
    # Build SET mapping only for columns that exist on excluded
    update_cols = {}
    for col in set(FEE_PREVIEW_HEADER_MAP.values()):
        if hasattr(excluded, col):
            update_cols[col] = getattr(excluded, col)

    # always refresh timestamps
    if hasattr(excluded, "synced_at"):
        update_cols["synced_at"] = getattr(excluded, "synced_at")
    update_cols["updated_at"] = datetime.utcnow()

    stmt = stmt.on_conflict_do_update(
        constraint="uq_fee_user_sku_mkt",
        set_=update_cols,
    )

    db.session.execute(stmt)
    db.session.commit()
    return len(unique_rows)

# --------------------------
# SP-API document helpers
# --------------------------
REPORTS_BASE = "/reports/2021-06-30"
# Valid fee-preview types (Amazon returns error for invalid types)
FEE_PREVIEW_REPORT_TYPES = [
    "GET_REFERRAL_FEE_PREVIEW_REPORT",
    "GET_FBA_ESTIMATED_FBA_FEES_TXT_DATA",
]

def _strip_pkcs7(data: bytes) -> bytes:
    pad = data[-1]
    if 1 <= pad <= 16:
        return data[:-pad]
    return data

def _decrypt_report_bytes(enc_details: dict, raw: bytes) -> bytes:
    key_b = base64.b64decode(enc_details.get("key", ""))
    iv_b  = base64.b64decode(enc_details.get("initializationVector", ""))
    cipher = AES.new(key_b, AES.MODE_CBC, iv_b)
    dec = cipher.decrypt(raw)
    return _strip_pkcs7(dec)

def _download_report_document(doc: dict) -> bytes:
    url = doc.get("url")
    if not url:
        raise RuntimeError("Missing report document URL")
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()
    blob = resp.content
    enc = doc.get("encryptionDetails")
    if enc:
        blob = _decrypt_report_bytes(enc, blob)
    if (doc.get("compressionAlgorithm") or "").upper() == "GZIP":
        blob = gzip.decompress(blob)
    return blob

def _create_and_fetch_fee_preview_bytes(marketplace_id: str, timeout_seconds: int = 180) -> bytes:
    """
    Try both supported report types. Return raw bytes of the CSV/TSV/TXT.
    """
    last_err = None
    for rtype in FEE_PREVIEW_REPORT_TYPES:
        try:
            created = amazon_client.make_api_call(
                f"{REPORTS_BASE}/reports", "POST",
                data={"reportType": rtype, "marketplaceIds": [marketplace_id]}
            )
            if not created or "error" in created:
                last_err = created
                continue

            report_id = (
                created.get("reportId")
                or (created.get("payload") or {}).get("reportId")
                or created.get("ReportId")
            )
            if not report_id:
                last_err = {"error": "No reportId in create response", "body": created}
                continue

            t0 = time.time()
            while True:
                status_res = amazon_client.make_api_call(f"{REPORTS_BASE}/reports/{report_id}", "GET")
                if not status_res or "error" in status_res:
                    raise RuntimeError(f"Failed status for {rtype}: {status_res}")
                payload = status_res.get("payload") or status_res
                proc = payload.get("processingStatus")

                if proc == "DONE":
                    doc_id = payload.get("reportDocumentId")
                    if not doc_id:
                        raise RuntimeError(f"Report DONE without document id: {payload}")
                    doc = amazon_client.make_api_call(f"{REPORTS_BASE}/documents/{doc_id}", "GET")
                    if not doc or "error" in doc:
                        raise RuntimeError(f"Failed to get report document: {doc}")
                    return _download_report_document(doc.get("payload") or doc)

                if proc in ("CANCELLED", "FATAL"):
                    raise RuntimeError(f"{rtype} failed with status: {proc}")

                if time.time() - t0 > timeout_seconds:
                    raise TimeoutError(f"Timed out waiting for {rtype} to complete.")
                time.sleep(2)
        except Exception as e:
            last_err = str(e)
            continue
    raise RuntimeError(f"All fee preview report types failed. Last error: {last_err}")

# --------------------------
# Routes
# --------------------------
@fee_preview_bp.route("/amazon_api/fees/sync", methods=["POST", "GET"])
def fees_sync():
    """
    POST:
      - source=upload + file=<csv|tsv|csv.gz>  -> parse & store
      - source=report (or omit)                -> SP-API report, parse & store
      - marketplace_id=<id> (optional; defaults from client)
    GET:
      - source=report (default)                -> SP-API report, parse & store
      - marketplace_id=<id> (optional)
    """
    # auth
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'error': 'Authorization token is missing or invalid'}), 401
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401

    _apply_region_and_marketplace_from_request()

    if request.method == "GET":
        mp = request.args.get("marketplace_id") or amazon_client.marketplace_id
        source = (request.args.get("source") or "report").lower()
    else:
        mp = request.form.get("marketplace_id") or request.args.get("marketplace_id") or amazon_client.marketplace_id
        source = (request.form.get("source") or request.args.get("source") or "auto").lower()

    try:
        rows, used_source = [], None

        # Upload path (POST only)
        if request.method == "POST" and (source in ("auto", "upload")) and 'file' in request.files:
            f = request.files['file']
            raw = f.read()
            try:
                if raw[:2] == b"\x1f\x8b":  # gzip magic
                    raw = gzip.decompress(raw)
            except Exception:
                pass
            rows = _read_fee_bytes(raw)
            used_source = "upload"

        # SP-API report path (GET or POST)
        if not rows and source in ("auto", "report"):
            blob = _create_and_fetch_fee_preview_bytes(mp)
            rows = _read_fee_bytes(blob)
            used_source = "report"

        if not rows:
            return jsonify({"success": False, "error": "No rows found from source"}), 400

        normalized = [_normalize_fee_row(r, user_id, mp) for r in rows if (r.get('sku') or '').strip()]
        saved = _upsert_fee_preview(normalized)

        sample = [{
            "sku": r.get("sku"),
            "asin": r.get("asin"),
            "currency": r.get("currency"),
            "your_price": (str(r.get("your_price")) if r.get("your_price") is not None else None),
            "estimated_fee_total": (str(r.get("estimated_fee_total")) if r.get("estimated_fee_total") is not None else None),
        } for r in normalized[:5]]

        resp = jsonify({
            "success": True,
            "source": used_source,
            "marketplace_id": mp,
            "count_in_file": len(normalized),
            "saved": saved,
            "sample": sample,
        })
        if request.method == "GET":
            resp.headers["Cache-Control"] = "no-store"
        return resp, 200

    except TimeoutError as te:
        db.session.rollback()
        return jsonify({"success": False, "error": f"Timeout: {str(te)}"}), 504
    except Exception as e:
        logger.exception("fees_sync failed")
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@fee_preview_bp.route("/amazon_api/fees", methods=["GET"])
def list_fees():
    """
    List stored fees for a marketplace (and optional sku filter).
    Query:
      - marketplace_id (optional) defaults from client
      - sku (optional, exact or prefix match if endswith '*')
      - limit (default 100)
    """
    auth_header = request.headers.get('Authorization')
    user_id = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
        except Exception:
            pass  # allow anonymous listing if you want

    _apply_region_and_marketplace_from_request()
    mp = request.args.get("marketplace_id") or amazon_client.marketplace_id
    sku = request.args.get("sku")
    limit = max(1, min(int(request.args.get("limit", 100)), 1000))

    q = Fee.query.filter(Fee.marketplace_id == mp)
    if user_id is not None:
        q = q.filter(Fee.user_id == user_id)
    if sku:
        if sku.endswith("*"):
            q = q.filter(Fee.sku.ilike(sku[:-1] + "%"))
        else:
            q = q.filter(Fee.sku == sku)

    items = q.order_by(Fee.updated_at.desc()).limit(limit).all()

    def _row(x: Fee):
        return {
            "sku": x.sku,
            "asin": x.asin,
            "fnsku": x.fnsku,
            "marketplace_id": x.marketplace_id,
            "product_name": x.product_name,
            "brand": x.brand,
            "fulfilled_by": x.fulfilled_by,
            "has_local_inventory": x.has_local_inventory,
            "currency": x.currency,
            "your_price": str(x.your_price) if x.your_price is not None else None,
            "sales_price": str(x.sales_price) if x.sales_price is not None else None,
            "estimated_fee_total": str(x.estimated_fee_total) if x.estimated_fee_total is not None else None,
            "estimated_referral_fee_per_unit": str(x.estimated_referral_fee_per_unit) if x.estimated_referral_fee_per_unit is not None else None,
            "expected_domestic_fulfilment_fee_per_unit": str(x.expected_domestic_fulfilment_fee_per_unit) if x.expected_domestic_fulfilment_fee_per_unit is not None else None,
            "expected_efn_fulfilment_fee_per_unit_uk": str(x.expected_efn_fulfilment_fee_per_unit_uk) if x.expected_efn_fulfilment_fee_per_unit_uk is not None else None,
            "updated_at": x.updated_at.isoformat() if x.updated_at else None,
        }

    return jsonify({
        "success": True,
        "marketplace_id": mp,
        "count": len(items),
        "items": [_row(i) for i in items]
    }), 200


def _run_feepreview_upload_pipeline_from_fee_table(
    user_id: int,
    country: str,
    marketplace: str,
    transit_time: int,
    stock_unit: int,
    
    filename_hint: str = "SPAPI_FEE_PREVIEW"
):
    mp = marketplace
    """
    Pull rows FROM Fee table (user_id + marketplace),
    and insert INTO user_{user_id}_{country}_table
    then run Category referral fee mapping + SKU join + create CountryProfile.
    """
    # 1) Pull rows from Fee table
    fee_rows = (
        Fee.query
        .filter(Fee.user_id == user_id, Fee.marketplace_id == marketplace)
        .all()
    )
    if not fee_rows:
        return {"inserted": 0, "deleted": 0, "message": "No Fee rows for user/marketplace"}

    # 2) Build a DataFrame (mirror the Excel columns your old route expected)
    def _val(x):  # helper to convert Decimal -> float or None
        if x is None: return None
        try: return float(x)
        except Exception: return None

    rows = []
    for f in fee_rows:
        rows.append({
            # names SAME as your old Excel-based DF expected:
            'sku': f.sku or '',
            'fnsku': f.fnsku or '',
            'asin': f.asin or '',
            'amazon-store': f.amazon_store or '',
            'product-name': f.product_name or '',
            'product-group': f.product_group or '',
            'brand': f.brand or '',
            'your-price': _val(f.your_price) or 0,
            'estimated-fee-total': _val(f.estimated_fee_total) or 0,
            'estimated-referral-fee-per-unit': _val(f.estimated_referral_fee_per_unit),
            'fulfilled-by': f.fulfilled_by or '',
            'has-local-inventory': str(f.has_local_inventory) if f.has_local_inventory is not None else '',
            'sales-price': _val(f.sales_price),
            'longest-side': _val(f.longest_side),
            'median-side': _val(f.median_side),
            'shortest-side': _val(f.shortest_side),
            'length-and-girth': _val(f.length_and_girth),
            'unit-of-dimension': f.unit_of_dimension or '',
            'item-package-weight': _val(f.item_package_weight),
            'unit-of-weight': f.unit_of_weight or '',
            'product-size-weight-band': f.product_size_weight_band or '',
            'currency': f.currency or '',
            'estimated-variable-closing-fee': _val(f.estimated_variable_closing_fee),
            'expected-domestic-fulfilment-fee-per-unit': _val(f.expected_domestic_fulfilment_fee_per_unit),
            'expected-efn-fulfilment-fee-per-unit-uk': _val(f.expected_efn_fulfilment_fee_per_unit_uk),
            'expected-efn-fulfilment-fee-per-unit-de': _val(f.expected_efn_fulfilment_fee_per_unit_de),
            'expected-efn-fulfilment-fee-per-unit-fr': _val(f.expected_efn_fulfilment_fee_per_unit_fr),
            'expected-efn-fulfilment-fee-per-unit-it': _val(f.expected_efn_fulfilment_fee_per_unit_it),
            'expected-efn-fulfilment-fee-per-unit-es': _val(f.expected_efn_fulfilment_fee_per_unit_es),
            'expected-efn-fulfilment-fee-per-unit-se': _val(f.expected_efn_fulfilment_fee_per_unit_se),
        })

    df = pd.DataFrame(rows)

    # 3) Cleaning: reuse same logic as old route
    def clean_numeric(value):
        if value == '--' or pd.isna(value):
            return 0
        try:
            return float(value)
        except ValueError:
            return 0

    float_cols = [
        'price','estimated_fees','estimated_referral_fee','sales_price','longest_side','median_side',
        'shortest_side','length_and_girth','item_package_weight','estimated_variable_closing_fee',
        'expected_domestic_fulfilment_fee_per_unit','expected_efn_fulfilment_fee_per_unit_uk',
        'expected_efn_fulfilment_fee_per_unit_de','expected_efn_fulfilment_fee_per_unit_fr',
        'expected_efn_fulfilment_fee_per_unit_it','expected_efn_fulfilment_fee_per_unit_es',
        'expected_efn_fulfilment_fee_per_unit_se'
    ]

    # Map incoming keys -> your old DF column names
    rename_map = {
        'your-price': 'price',
        'estimated-fee-total': 'estimated_fees',
        'estimated-referral-fee-per-unit': 'estimated_referral_fee',
    }
    df = df.rename(columns=rename_map)
    for col in float_cols:
        if col in df.columns:
            df[col] = df[col].apply(clean_numeric)

    country = (country or '').lower()
    table_name = f'user_{user_id}_{country}_table'

    # 4) Create engine/session + dynamic table (same as old)
    user_engine = create_engine(db_url)
    metadata = MetaData()
    metadata.bind = user_engine
    user_session = sessionmaker(bind=user_engine)()
    admin_engine = create_engine(db_url1)
    AdminSession = sessionmaker(bind=admin_engine)
    admin_session = AdminSession()


    user_specific_table = Table(
        table_name, metadata,
        Column('id', Integer, primary_key=True),
        Column('user_id', Integer, nullable=False),
        Column('country', String(255), nullable=False),
        Column('transit_time', Integer, nullable=False),
        Column('stock_unit', Integer, nullable=False),
        Column('product_group', String(255), nullable=False),
        Column('estimated_fees', Float, nullable=False),
        Column('referral_fee', Float, nullable=True),
        Column('estimated_referral_fee', Float, nullable=True),
        Column('marketplace', String(255), nullable=False),
        Column('file_name', String(255), nullable=False),
        Column('sku', String(255), nullable=False),
        Column('fnsku', String(255), nullable=False),
        Column('amazon_store', String(255), nullable=False),
        Column('asin', String(255), nullable=False),
        Column('product_barcode', String(255), nullable=True),
        Column('sku_cost_price', Float, nullable=True),
        Column('product_name', String(255), nullable=False),
        Column('brand', String(255), nullable=False),
        Column('price', Float, nullable=False),
        Column('fulfilled_by', String(255), nullable=True),
        Column('has_local_inventory', String(255), nullable=True),
        Column('sales_price', Float, nullable=True),
        Column('longest_side', Float, nullable=True),
        Column('median_side', Float, nullable=True),
        Column('shortest_side', Float, nullable=True),
        Column('length_and_girth', Float, nullable=True),
        Column('unit_of_dimension', String(50), nullable=True),
        Column('item_package_weight', Float, nullable=True),
        Column('unit_of_weight', String(50), nullable=True),
        Column('product_size_weight_band', String(255), nullable=True),
        Column('currency', String(10), nullable=True),
        Column('estimated_variable_closing_fee', Float, nullable=True),
        Column('expected_domestic_fulfilment_fee_per_unit', Float, nullable=True),
        Column('expected_efn_fulfilment_fee_per_unit_uk', Float, nullable=True),
        Column('expected_efn_fulfilment_fee_per_unit_de', Float, nullable=True),
        Column('expected_efn_fulfilment_fee_per_unit_fr', Float, nullable=True),
        Column('expected_efn_fulfilment_fee_per_unit_it', Float, nullable=True),
        Column('expected_efn_fulfilment_fee_per_unit_es', Float, nullable=True),
        Column('expected_efn_fulfilment_fee_per_unit_se', Float, nullable=True),
    )
    metadata.create_all(user_engine)

    # 5) Clear existing for this (user,country,marketplace)
    with user_engine.begin() as conn:
        conn.execute(
            text(f"DELETE FROM {table_name} WHERE user_id = :user_id AND country = :country AND marketplace = :marketplace"),
            {"user_id": user_id, "country": country, "marketplace": marketplace}
        )

    # 6) Insert all rows
    # df = df.fillna('')
    df.replace('--', np.nan, inplace=True)

    def _num(v):
    # normalize numeric values for DB: float or None
        if v is None or v == '' or v == '--':
            return None
        try:
            return float(v)
        except Exception:
            return None

    def _txt(v):
        # normalize text values for DB: string ('' allowed)
        return '' if v is None else str(v)

    # 6) Insert all rows
# df = df.fillna('')   # ❌ is line ko HATA do (numeric me '' aa jayega)
# df.replace('--', np.nan, inplace=True)  # optional; agar use karna ho to theek hai

    to_insert = []
    for _, r in df.iterrows():
        to_insert.append({
            'user_id': user_id,
            'country': country,
            'transit_time': int(transit_time),
            'stock_unit': int(stock_unit),
            'marketplace': mp,
            'file_name': filename_hint,

            # text fields
            'sku': _txt(r.get('sku')),
            'fnsku': _txt(r.get('fnsku')),
            'asin': _txt(r.get('asin')),
            'amazon_store': _txt(r.get('amazon-store')),
            'product_name': _txt(r.get('product-name')),
            'product_group': _txt(r.get('product-group')),
            'brand': _txt(r.get('brand')),
            'fulfilled_by': _txt(r.get('fulfilled-by')),
            'has_local_inventory': _txt(r.get('has-local-inventory')),
            'unit_of_dimension': _txt(r.get('unit-of-dimension')),
            'unit_of_weight': _txt(r.get('unit-of-weight')),
            'product_size_weight_band': _txt(r.get('product-size-weight-band')),
            'currency': _txt(r.get('currency')),
            'product_barcode': None,  # will fill later
            'sku_cost_price': None,   # will fill later

            # numeric fields (ALWAYS via _num)
            'price': _num(r.get('price')),
            'estimated_fees': _num(r.get('estimated_fees')),
            'estimated_referral_fee': _num(r.get('estimated_referral_fee')),
            'sales_price': _num(r.get('sales-price')),
            'longest_side': _num(r.get('longest-side')),
            'median_side': _num(r.get('median-side')),
            'shortest_side': _num(r.get('shortest-side')),
            'length_and_girth': _num(r.get('length-and-girth')),
            'item_package_weight': _num(r.get('item-package-weight')),
            'estimated_variable_closing_fee': _num(r.get('estimated-variable-closing-fee')),
            'expected_domestic_fulfilment_fee_per_unit': _num(r.get('expected-domestic-fulfilment-fee-per-unit')),
            'expected_efn_fulfilment_fee_per_unit_uk': _num(r.get('expected-efn-fulfilment-fee-per-unit-uk')),
            'expected_efn_fulfilment_fee_per_unit_de': _num(r.get('expected-efn-fulfilment-fee-per-unit-de')),
            'expected_efn_fulfilment_fee_per_unit_fr': _num(r.get('expected-efn-fulfilment-fee-per-unit-fr')),
            'expected_efn_fulfilment_fee_per_unit_it': _num(r.get('expected-efn-fulfilment-fee-per-unit-it')),
            'expected_efn_fulfilment_fee_per_unit_es': _num(r.get('expected-efn-fulfilment-fee-per-unit-es')),
            'expected_efn_fulfilment_fee_per_unit_se': _num(r.get('expected-efn-fulfilment-fee-per-unit-se')),
        })


    inserted_rows = 0
    with user_engine.begin() as conn:
        if to_insert:
            conn.execute(user_specific_table.insert(), to_insert)
            inserted_rows = len(to_insert)

    # 7) Referral fee mapping via Category (same logic)
    with user_engine.begin() as conn:
        results = conn.execute(user_specific_table.select().where(
            user_specific_table.c.user_id == user_id
        )).mappings().all()

        for result in results:
            country_value = (result['country'] or '').strip().upper()
            product_group_value = (result['product_group'] or '')
            product_group_cleaned = product_group_value.strip()
            price_value = result['price']

            COUNTRY_MAP = {
                "uk": "United Kingdom",
                "us": "United States",
                "uae": "United Arab Emirates",
                "in": "India"
                # add more if needed
            }

            normalized_country = COUNTRY_MAP.get(country.lower(), country)


            query = admin_session.query(Category).filter_by(
                country=normalized_country,
                category=product_group_cleaned
            )
            if price_value is not None:
                query = query.filter(
                    and_(
                        or_(Category.price_from == 0, Category.price_from <= price_value),
                        or_(Category.price_to == 0, Category.price_to >= price_value)
                    )
                )
            category_obj = query.first()

            if not category_obj:
                first_word = product_group_cleaned.split('&')[0].split('/')[0].split('-')[0].strip().upper()
                queery = admin_session.query(Category).filter_by(
                    country=normalized_country.strip(),
                    category=first_word
                )
                if price_value is not None:
                    query = query.filter(
                        and_(
                            or_(Category.price_from == 0, Category.price_from <= price_value),
                            or_(Category.price_to == 0, Category.price_to >= price_value)
                        )
                    )
                category_obj = query.first()

            if category_obj:
                conn.execute(
                    user_specific_table.update()
                    .where(user_specific_table.c.id == result['id'])
                    .values(referral_fee=category_obj.referral_fee_percent_est)
                )

    # 8) Join with sku_{user_id}_data_table to fill barcode/price
    sku_table_name = f"sku_{user_id}_data_table"
    with user_engine.begin() as conn:
        # Might not exist in some envs – guard with try
        try:
            sku_data_table = Table(sku_table_name, metadata, autoload_with=user_engine)
        except Exception:
            sku_data_table = None

        if sku_data_table is not None:
            res = conn.execute(text(f"""
                SELECT asin, product_barcode, price
                FROM {sku_table_name}
                WHERE asin IN (SELECT asin FROM {table_name} WHERE user_id = :user_id)
            """), {"user_id": user_id})

            rows = [dict(zip(res.keys(), row)) for row in res.fetchall()]
            asin_mapping = {row['asin']: (row['product_barcode'], row['price']) for row in rows}

            for asin, (barcode, price) in asin_mapping.items():
                conn.execute(text(f"""
                    UPDATE {table_name}
                    SET product_barcode = :barcode, sku_cost_price = :price
                    WHERE asin = :asin AND user_id = :user_id
                """), {"barcode": barcode, "price": price, "asin": asin, "user_id": user_id})

    # 9) CountryProfile upsert (delete old like your code, then insert)
    existing_profile = CountryProfile.query.filter_by(
        user_id=user_id, country=country, marketplace=marketplace
    ).first()
    if existing_profile:
        db.session.delete(existing_profile)
        db.session.commit()

    # avoid duplication with exact same transit/stock values
    dup = CountryProfile.query.filter_by(
        user_id=user_id, country=country, marketplace=marketplace,
        transit_time=transit_time, stock_unit=stock_unit
    ).first()
    if not dup:
        new_profile = CountryProfile(
            user_id=user_id,
            country=country,
            marketplace=marketplace,
            transit_time=transit_time,
            stock_unit=stock_unit
        )
        db.session.add(new_profile)
        db.session.commit()

    return {"inserted": inserted_rows, "deleted": 0, "table": table_name}


from sqlalchemy import inspect

@fee_preview_bp.route("/amazon_api/fees/sync_and_upload", methods=["POST"])
def fees_sync_and_upload():
    
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'error': 'Authorization token is missing or invalid'}), 401
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401

    _apply_region_and_marketplace_from_request()

    data = request.get_json(silent=True) or {}
    country = (data.get('country') or request.form.get('country') or '').lower().strip()

    # ... transit_time / stock_unit parsing ...

    mp = data.get("marketplace_id") or request.form.get("marketplace_id") or request.args.get("marketplace_id") or amazon_client.marketplace_id
    source = (data.get("source") or request.form.get("source") or request.args.get("source") or "report").lower()

    if not country or not mp:
        return jsonify({"success": False, "error": "country and marketplace_id are required"}), 400

    # ---------- NEW: early-exit if user_{user_id}_{country}_table exists ----------
    try:
        table_name = f"user_{user_id}_{country}_table"
        insp = inspect(db.engine)
        if insp.has_table(table_name):
            # Table already exists; skip full sync + pipeline
            return jsonify({
                "success": True,
                "skipped": True,
                "reason": "target user table already exists",
                "table": table_name,
            }), 200
    except Exception:
        # If inspection fails, just continue with normal flow
        logger.exception("Error checking existing fee upload table")

    try:
        # 1) Sync from SP-API -> Fee table
        rows, used_source = [], None
        if source in ("auto", "report"):
            blob = _create_and_fetch_fee_preview_bytes(mp)
            rows = _read_fee_bytes(blob)
            used_source = "report"
        elif source == "upload" and 'file' in request.files:
            f = request.files['file']
            raw = f.read()
            try:
                if raw[:2] == b"\x1f\x8b":
                    raw = gzip.decompress(raw)
            except Exception:
                pass
            rows = _read_fee_bytes(raw)
            used_source = "upload"

        if not rows:
            return jsonify({"success": False, "error": "No rows found from source"}), 400

        normalized = [
            _normalize_fee_row(r, user_id, mp)
            for r in rows
            if (r.get('sku') or '').strip()
        ]
        saved = _upsert_fee_preview(normalized)

        # 2) Run upload pipeline -> user_{user_id}_{country}_table
        pip = _run_feepreview_upload_pipeline_from_fee_table(
            user_id=user_id,
            country=country,
            marketplace=mp,
            transit_time=0,
            stock_unit=0,
            filename_hint="SPAPI_FEE_PREVIEW"
        )

        sample = [{
            "sku": r.get("sku"),
            "asin": r.get("asin"),
            "currency": r.get("currency"),
            "your_price": (str(r.get("your_price")) if r.get("your_price") is not None else None),
            "estimated_fee_total": (str(r.get("estimated_fee_total")) if r.get("estimated_fee_total") is not None else None),
        } for r in normalized[:5]]

        return jsonify({
            "success": True,
            "source": used_source,
            "marketplace_id": mp,
            "count_in_file": len(normalized),
            "saved_into_fee": saved,
            "upload_pipeline": pip,
            "sample": sample,
        }), 200

    except TimeoutError as te:
        db.session.rollback()
        return jsonify({"success": False, "error": f"Timeout: {str(te)}"}), 504
    except Exception as e:
        logger.exception("fees_sync_and_upload failed")
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
