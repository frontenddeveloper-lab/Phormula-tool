# current_inventory.py

from flask import Blueprint, request, jsonify
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import jwt
import os
import base64
import pandas as pd
from config import Config
from app.models.user_models import User, CountryProfile
from app import db
from dotenv import load_dotenv
from datetime import datetime
from calendar import monthrange
from sqlalchemy.exc import ProgrammingError

# ===== Setup =====
SECRET_KEY = Config.SECRET_KEY
UPLOAD_FOLDER = Config.UPLOAD_FOLDER

load_dotenv()
# Primary app DB (where your per-user SKU tables & sales tables live)
db_url = os.getenv('DATABASE_URL')
db_url1 = os.getenv('DATABASE_AMAZON_URL')   # not used directly, amazon bind used instead

current_inventory_bp = Blueprint('current_inventory_bp', __name__)


def encode_file_to_base64(file_path):
    with open(file_path, "rb") as file:
        return base64.b64encode(file.read()).decode('utf-8')


# Fallback marketplace IDs (used if CountryProfile doesn't have one)
MARKETPLACE_BY_COUNTRY = {
    'us': 'ATVPDKIKX0DER',
    'uk': 'A1F83G8C2ARO7P',
}


@current_inventory_bp.route('/current_inventory', methods=['POST', 'OPTIONS'])
def current_inventory():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS Preflight OK'}), 200

    # --- Auth ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization token is missing or invalid'}), 401

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

    # --- Inputs ---
    data = request.get_json() or {}
    month = (data.get('month') or '').strip()
    year = data.get('year')
    country = (data.get('country') or '').strip()

    if not month or not year or not country:
        return jsonify({'error': 'Month, year, and country must be provided'}), 400

    try:
        month_name = datetime.strptime(month.capitalize(), "%B").strftime("%B")
        year = int(year)
    except ValueError:
        return jsonify({'error': 'Invalid month or year format'}), 400

    # --- DB session (primary) ---
    SessionLocal = sessionmaker(bind=db.engine)
    db_session = SessionLocal()
    user = db_session.get(User, user_id)
    if user is None:
        return jsonify({'error': f'User not found for ID {user_id}'}), 404

    # --- Resolve marketplace_id for the country/user ---
    country_key = country.lower()
    marketplace_id = None

    try:
        profile = db_session.query(CountryProfile).filter_by(user_id=user_id, country=country_key).first()
        if profile and getattr(profile, 'marketplace_id', None):
            marketplace_id = profile.marketplace_id
    except Exception:
        pass

    if not marketplace_id:
        marketplace_id = MARKETPLACE_BY_COUNTRY.get(country_key)

    if not marketplace_id:
        db_session.close()
        return jsonify({'error': f'Unknown marketplace for country "{country}"'}), 400

    # --- Load product/sku master from your per-user table (primary DB) ---
    engine_primary = create_engine(db_url)
    sku_table_name = f"sku_{user_id}_data_table"
    try:
        sku_df = pd.read_sql_table(sku_table_name, engine_primary)
    except Exception as e:
        db_session.close()
        return jsonify({'error': f'Could not read SKU table "{sku_table_name}": {e}'}), 500

    sku_column_name = f"sku_{country_key}"
    if sku_column_name not in sku_df.columns:
        db_session.close()
        return jsonify({'error': f"SKU column '{sku_column_name}' not found in {sku_table_name}"}), 400

    sku_df = sku_df[[sku_column_name, 'product_name']].copy()
    sku_df.rename(columns={sku_column_name: 'sku'}, inplace=True)
    sku_df['sku'] = sku_df['sku'].astype(str).str.strip()

    # =========================
    # Sales for selected month FROM orders (amazon bind)
    # =========================
    month_number = datetime.strptime(month_name, "%B").month
    month_start = datetime(year, month_number, 1)
    month_end = datetime(
        year,
        month_number,
        monthrange(year, month_number)[1],
        23, 59, 59
    )

    current_month_col = f"Current Month Units Sold ({month_name})"

    # use the amazon engine (same bind as your Order model)
    amazon_engine = db.get_engine(bind='amazon')

    sales_sql = text(f"""
        SELECT
            sku,
            SUM(quantity) AS "{current_month_col}"
        FROM orders
        WHERE user_id = :uid
          AND marketplace_id = :mkt
          AND purchase_date >= :start
          AND purchase_date <= :end
        GROUP BY sku
    """)

    current_month_sales_df = pd.read_sql_query(
        sales_sql,
        amazon_engine,
        params={
            'uid': user_id,
            'mkt': marketplace_id,
            'start': month_start,
            'end': month_end
        }
    )

    current_month_sales_df['sku'] = current_month_sales_df['sku'].astype(str).str.strip()

    # --- Inventory from amazon bind ---
    try:
        inv_sql = text("""
            SELECT seller_sku,
                   total_quantity,
                   inbound_quantity,
                   available_quantity,
                   reserved_quantity,
                   fulfillable_quantity,
                   synced_at
            FROM inventory
            WHERE user_id = :uid
              AND marketplace_id = :mkt
        """)
        inv_df = pd.read_sql_query(inv_sql, amazon_engine, params={'uid': user_id, 'mkt': marketplace_id})
    except Exception as e:
        db_session.close()
        return jsonify({'error': f'Could not read inventory from amazon DB: {e}'}), 500

    inv_df['seller_sku'] = inv_df['seller_sku'].astype(str).str.strip()

    # --- Aged inventory (sales-rank, inv-age-*, etc.) from amazon bind ---
    # inventory_aged has columns: user_id, sku, available, inv-age-*, sales-rank, estimated-storage-cost-next-month
    try:
        aged_sql = text("""
            SELECT
                sku AS seller_sku,
                available,
                "inv-age-0-to-90-days",
                "inv-age-91-to-180-days",
                "inv-age-181-to-270-days",
                "inv-age-271-to-365-days",
                "inv-age-365-plus-days",
                "sales-rank",
                "estimated-storage-cost-next-month"
            FROM inventory_aged
            WHERE user_id = :uid
        """)
        aged_df = pd.read_sql_query(
            aged_sql,
            amazon_engine,
            params={'uid': user_id}
        )
        aged_df['seller_sku'] = aged_df['seller_sku'].astype(str).str.strip()
    except ProgrammingError:
        aged_df = pd.DataFrame(columns=[
            'seller_sku',
            'available',
            'inv-age-0-to-90-days',
            'inv-age-91-to-180-days',
            'inv-age-181-to-270-days',
            'inv-age-271-to-365-days',
            'inv-age-365-plus-days',
            'sales-rank',
            'estimated-storage-cost-next-month'
        ])
    except Exception:
        aged_df = pd.DataFrame(columns=[
            'seller_sku',
            'available',
            'inv-age-0-to-90-days',
            'inv-age-91-to-180-days',
            'inv-age-181-to-270-days',
            'inv-age-271-to-365-days',
            'inv-age-365-plus-days',
            'sales-rank',
            'estimated-storage-cost-next-month'
        ])

    # --- Merge master + sales + inventory + aged inventory ---
    final_df = sku_df[['sku', 'product_name']].merge(
        current_month_sales_df[['sku', current_month_col]], on='sku', how='left'
    ).merge(
        inv_df, left_on='sku', right_on='seller_sku', how='left'
    )

    if not aged_df.empty:
        final_df = final_df.merge(
            aged_df[
                [
                    'seller_sku',
                    'available',
                    'inv-age-0-to-90-days',
                    'inv-age-91-to-180-days',
                    'inv-age-181-to-270-days',
                    'inv-age-271-to-365-days',
                    'inv-age-365-plus-days',
                    'sales-rank',
                    'estimated-storage-cost-next-month',
                ]
            ],
            on='seller_sku',
            how='left'
        )

    # --- Business logic (END = fulfillable, BEGINNING solved) ---
    final_df[current_month_col] = final_df[current_month_col].fillna(0)
    final_df['inbound_quantity'] = final_df['inbound_quantity'].fillna(0)

    # End-of-month equals fulfillable_quantity from Amazon
    final_df['Inventory at the end of the month'] = final_df['fulfillable_quantity'].fillna(0)

    # =========================
    # compute "Others" from previous-month user_{id}_{country}_{month}{year}_data
    # =========================
    today = datetime.now().date()
    today_day = today.day

    # Determine previous month/year relative to the selected report month
    if month_number == 1:
        prev_month_number = 12
        prev_year = year - 1
    else:
        prev_month_number = month_number - 1
        prev_year = year

    prev_month_name_full = datetime(prev_year, prev_month_number, 1).strftime("%B")
    prev_month_name_lower = prev_month_name_full.lower()

    prev_last_day = monthrange(prev_year, prev_month_number)[1]
    start_day = today_day + 1
    if start_day > prev_last_day:
        start_day = prev_last_day

    prev_start = datetime(prev_year, prev_month_number, start_day, 0, 0, 0)
    prev_end = datetime(prev_year, prev_month_number, prev_last_day, 23, 59, 59)

    # Table name: user_{user_id}_{country}_{month}{year}_data
    prev_table_name = f"user_{user_id}_{country_key}_{prev_month_name_lower}{prev_year}_data"

    # Default Others = 0 in case anything fails
    final_df['Others'] = 0

    try:
        monthly_engine = engine_primary

        prev_sql = text(f"""
            SELECT sku,
                SUM(quantity) AS others_qty
            FROM {prev_table_name}
            WHERE date_time <> '0'
              AND replace(date_time, 'Z', '+00')::timestamptz >= :start
              AND replace(date_time, 'Z', '+00')::timestamptz <= :end
            GROUP BY sku
        """)

        prev_df = pd.read_sql_query(
            prev_sql,
            monthly_engine,
            params={'start': prev_start, 'end': prev_end}
        )

        prev_df['sku'] = prev_df['sku'].astype(str).str.strip()

        final_df = final_df.merge(
            prev_df[['sku', 'others_qty']],
            on='sku',
            how='left'
        )
        final_df['Others'] = final_df['others_qty'].fillna(0)
        final_df.drop(columns=['others_qty'], inplace=True)

    except ProgrammingError:
        pass
    except Exception:
        pass

    # Inventory Inwarded = inbound from Amazon
    final_df['Inventory Inwarded'] = final_df['inbound_quantity']

    # Solve for beginning:
    final_df['Inventory at the beginning of the month'] = (
        final_df['Inventory at the end of the month']
        - final_df['Inventory Inwarded']
        + final_df[current_month_col]
        - final_df['Others']
    ).fillna(0).clip(lower=0)

    # --- Rename & tidy up for Excel / UI ---
    final_df.rename(columns={
        'sku': 'SKU',
        'product_name': 'Product Name',
    }, inplace=True)

    # Remove merge helper
    if 'seller_sku' in final_df.columns:
        final_df.drop(columns=['seller_sku'], inplace=True)

    # Add S.No. before reordering
    final_df.insert(0, 'Sno.', range(1, len(final_df) + 1))

    # Column order for export/UI
    desired_order = [
        'Sno.',
        'SKU',
        'Product Name',

        # Standard Inventory Columns
        'total_quantity',
        'inbound_quantity',
        'available_quantity',
        'reserved_quantity',
        'fulfillable_quantity',
        'synced_at',

        # NEW AGED INVENTORY COLUMNS
        'available',
        'inv-age-0-to-90-days',
        'inv-age-91-to-180-days',
        'inv-age-181-to-270-days',
        'inv-age-271-to-365-days',
        'inv-age-365-plus-days',
        'sales-rank',
        'estimated-storage-cost-next-month',

        # Calculated Inventory Movement
        'Inventory at the beginning of the month',
        current_month_col,
        'Inventory Inwarded',
        'Others',
        'Inventory at the end of the month',
    ]
    ordered_cols = [c for c in desired_order if c in final_df.columns] + \
                   [c for c in final_df.columns if c not in desired_order]
    final_df = final_df.reindex(columns=ordered_cols)

    # --- Total row ---
    numeric_columns = final_df.select_dtypes(include=['number']).columns
    total_row = {
        col: (final_df[col].sum() if col in numeric_columns and col != 'Sno.' else '')
        for col in final_df.columns
    }
    total_row['Product Name'] = 'Total'
    final_df = pd.concat([final_df, pd.DataFrame([total_row])], ignore_index=True)

    # --- Save & return ---
    out_name = f'currentinventory_{user_id}_{country_key}_{month_name.lower()}{year}.xlsx'
    out_path = os.path.join(UPLOAD_FOLDER, out_name)
    final_df.to_excel(out_path, index=False)

    output_base64 = encode_file_to_base64(out_path)
    db_session.close()

    return jsonify({
        'message': 'Current inventory report generated successfully',
        'data': output_base64
    }), 200


# # @current_inventory_bp.route('/current_inventory_global', methods=['POST', 'OPTIONS'])
# # def current_inventory_global():
#     if request.method == 'OPTIONS':
#         return jsonify({'message': 'CORS Preflight OK'}), 200

#     # Authentication
#     auth_header = request.headers.get('Authorization')
#     if not auth_header or not auth_header.startswith('Bearer '):
#         return jsonify({'error': 'Authorization token is missing or invalid'}), 401

#     token = auth_header.split(' ')[1]
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
#         user_id = payload['user_id']
#     except jwt.ExpiredSignatureError:
#         return jsonify({'error': 'Token has expired'}), 401
#     except jwt.InvalidTokenError:
#         return jsonify({'error': 'Invalid token'}), 401

#     # Get request data
#     data = request.get_json()
#     month = data.get('month')
#     year = data.get('year')

#     if not month or not year:
#         return jsonify({'error': 'Month and year must be provided'}), 400

#     try:
#         month_name = datetime.strptime(month, "%B").strftime("%B")
#         year = int(year)
#     except ValueError:
#         return jsonify({'error': 'Invalid month or year format'}), 400

#     # Setup DB session
#     SessionLocal = sessionmaker(bind=db.engine)
#     db_session = SessionLocal()
#     user = db_session.get(User, user_id)
#     if user is None:
#         return jsonify({'error': f'User not found for ID {user_id}'}), 404

#     engine = create_engine(db_url)
#     country_profiles = CountryProfile.query.filter_by(user_id=user_id).all()
#     if not country_profiles:
#         return jsonify({'error': 'No country profiles found for the user'}), 404

#     all_dataframes = []

#     for profile in country_profiles:
#         country = profile.country.lower()
#         filename = f'currentinventory_{user_id}_{country}_{month_name.lower()}{year}.xlsx'
#         filepath = os.path.join(UPLOAD_FOLDER, filename)

#         if not os.path.exists(filepath):
#             continue  # Skip if file not found

#         try:
#             df = pd.read_excel(filepath)
#             df.columns = [col.strip() for col in df.columns]

#             # Clean rows and columns - exclude total row
#             df = df[df['SKU'].astype(str).str.strip() != '-']
#             df = df[df['Product Name'].astype(str).str.strip().str.lower() != 'total']  # Exclude total row
#             df = df.dropna(subset=['SKU', 'Product Name'])

#             # Normalize product names
#             df['Product Name'] = df['Product Name'].str.replace(r'\s*\+\s*', ' + ', regex=True).str.strip()

#             all_dataframes.append(df)

#         except Exception as e:
#             print(f"Error processing file {filepath}: {e}")
#             continue

#     if not all_dataframes:
#         return jsonify({'error': 'No inventory files found for any country'}), 404

#     # Combine all data
#     combined_df = pd.concat(all_dataframes, ignore_index=True)

#     # Sum all numeric columns based on Product Name
#     numeric_cols = combined_df.select_dtypes(include='number').columns.tolist()
#     # Remove Sno. from numeric columns if present
#     if 'Sno.' in numeric_cols:
#         numeric_cols.remove('Sno.')
    
#     grouped_df = combined_df.groupby('Product Name', as_index=False)[numeric_cols].sum()

#     # For display: Get first SKU for each Product Name (optional for global view)
#     # Reorder columns and add S.No.
#     column_order = ['Product Name'] + numeric_cols
#     grouped_df = grouped_df[column_order]
#     grouped_df.insert(0, 'Sno.', range(1, len(grouped_df) + 1))

#     # Add total row with proper handling
#     numeric_columns_for_total = grouped_df.select_dtypes(include=['number']).columns
#     total_row = pd.Series(index=grouped_df.columns, dtype=object)
    
#     # Fill numeric columns with sums
#     for col in numeric_columns_for_total:
#         if col != 'Sno.':  # Don't sum the serial number column
#             total_row[col] = grouped_df[col].sum()
    
#     # Fill non-numeric columns appropriately
#     total_row['Sno.'] = ''  # Empty for total row
#     total_row['Product Name'] = 'Total'
    
#     # Convert to DataFrame and concatenate
#     total_row_df = pd.DataFrame([total_row])
#     grouped_df = pd.concat([grouped_df, total_row_df], ignore_index=True)

#     # Save to Excel
#     output_filename = f'global_currentinventory_{user_id}_{month_name.lower()}{year}.xlsx'
#     output_path = os.path.join(UPLOAD_FOLDER, output_filename)
#     grouped_df.to_excel(output_path, index=False)

#     output_base64 = encode_file_to_base64(output_path)
#     db_session.close()

#     return jsonify({
#         'message': 'Global inventory report generated successfully',
#         'data': output_base64
#     }), 200