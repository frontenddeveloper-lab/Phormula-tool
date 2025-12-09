# from flask import Blueprint, redirect, request, jsonify
# import os
# import requests
# from dotenv import load_dotenv
# from app.models.user_models import ShopifyStore
# from config import Config
# SECRET_KEY = Config.SECRET_KEY
# from sqlalchemy import text
# import json
# import io
# import pandas as pd
# from sqlalchemy import inspect
# from app import db
# import calendar
# from sqlalchemy.exc import IntegrityError
# from flask import current_app
# import os,jwt
# import csv
# from datetime import datetime
# from sqlalchemy import create_engine
# from datetime import datetime, timedelta


# # Load environment variables
# load_dotenv()

# # Create a blueprint for Shopify routes
# shopify_bp = Blueprint('shopify', __name__)

# # Shopify credentials from .env
# SHOPIFY_API_KEY = os.getenv("SHOPIFY_API_KEY")
# SHOPIFY_API_SECRET = os.getenv("SHOPIFY_API_SECRET")
# REDIRECT_URI = os.getenv("REDIRECT_URI")
# SCOPES = os.getenv("SCOPES")
# FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000")  # fallback if not set


# # ✅ Step 1: Start OAuth - redirect user to Shopify
# @shopify_bp.route('/shopify/install', methods=['GET'])
# def install():
#     auth_header = request.headers.get('Authorization')
#     if auth_header and auth_header.startswith('Bearer '):
#         token = auth_header.split(' ')[1]
#     else:
#         # Fallback to query param
#         token = request.args.get('user_token')
#         if not token:
#             return jsonify({'error': 'Authorization token is missing or invalid'}), 401

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
#         user_id = payload['user_id']
#         print(f"[DEBUG] User ID from token1: {user_id}")
#     except jwt.ExpiredSignatureError:
#         return jsonify({'error': 'Token has expired'}), 401
#     except jwt.InvalidTokenError:
#         return jsonify({'error': 'Invalid token'}), 401

#     shop = request.args.get("shop")
#     user_token=request.args.get("user_token")
#     print(user_token)
#     if not shop:
#         return jsonify({"error": "Shop parameter missing (use ?shop=storename.myshopify.com)"}), 400

#     oauth_url = (
#     f"https://{shop}/admin/oauth/authorize"
#     f"?client_id={SHOPIFY_API_KEY}&scope={SCOPES}&redirect_uri={REDIRECT_URI}"
#     )
#     return redirect(oauth_url)

# # ✅ Step 2: Handle callback - exchange code for access token
# @shopify_bp.route('/shopify/callback', methods=['GET'])
# def callback():

#     # auth_header = request.headers.get('Authorization')
#     # if auth_header and auth_header.startswith('Bearer '):
#     #     token = auth_header.split(' ')[1]
#     # else:
#     #     # Fallback to query param
#     #     token = request.args.get('user_token')
#     #     if not token:
#     #         return jsonify({'error': 'Authorization token is missing or invalid'}), 401

#     # try:
#     #     payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
#     #     user_id = payload['user_id']
#     #     print(f"[DEBUG] User ID from token2: {user_id}")
#     # except jwt.ExpiredSignatureError:
#     #     return jsonify({'error': 'Token has expired'}), 401
#     # except jwt.InvalidTokenError:
#     #     return jsonify({'error': 'Invalid token'}), 401

#     shop = request.args.get("shop")
#     code = request.args.get("code")

#     if not shop or not code:
#         error_message = "Shopify authorization failed. Please log in with the correct account."
#         return redirect(f"{FRONTEND_BASE_URL}/shopify-error?message={error_message}")


#     # Step 1: Get access token
#     token_url = f"https://{shop}/admin/oauth/access_token"
#     payload = {
#         "client_id": SHOPIFY_API_KEY,
#         "client_secret": SHOPIFY_API_SECRET,
#         "code": code
#     }

#     response = requests.post(token_url, json=payload)
#     token_data = response.json()

#     if 'access_token' not in token_data:
#         error_message = "Unauthorized Access. Please log in using the Shopify store owner account."
#         return redirect(f"{FRONTEND_BASE_URL}/shopify-error?message={error_message}")

#     access_token = token_data['access_token']

#     # ✅ Step 2: Get email from Shopify shop API
#     headers = {"X-Shopify-Access-Token": access_token}
#     shop_info_res = requests.get(f"https://{shop}/admin/api/2024-07/shop.json", headers=headers)
#     if shop_info_res.status_code != 200:
#         error_message = "Unable to fetch shop details. Please try again."
#         return redirect(f"{FRONTEND_BASE_URL}/shopify-error?message={error_message}")
#     shop_info = shop_info_res.json()
#     email = shop_info.get('shop', {}).get('email')

#     # ✅ Step 3: Save to DB (handle duplicates)
#     try:
#         existing_store = ShopifyStore.query.filter_by(shop_name=shop).first()
#         if existing_store:
#             existing_store.access_token = access_token
#             existing_store.email = email
#             existing_store.is_active = True
#         else:
#             new_store = ShopifyStore(shop_name=shop, access_token=access_token, email=email)
#             db.session.add(new_store)
#         db.session.commit()
#     except Exception as e:
#         db.session.rollback()
#         error_message = "Database error while saving store details."
#         return redirect(f"{FRONTEND_BASE_URL}/shopify-error?message={error_message}")

#     # ✅ Step 4: Redirect to frontend with shop, token, and email
#     frontend_url = f"http://localhost:3000/orders?shop={shop}&token={access_token}&email={email}"
#     return redirect(frontend_url)


# import math

# def safe_float(value):
#     return 0.0 if value is None or isinstance(value, float) and math.isnan(value) else value


# @shopify_bp.route('/shopify/dropdown', methods=['GET'])
# def get_dropdown_filters():

#     auth_header = request.headers.get('Authorization')
#     if auth_header and auth_header.startswith('Bearer '):
#         token = auth_header.split(' ')[1]
#     else:
#         # Fallback to query param
#         token = request.args.get('user_token')
#         if not token:
#             return jsonify({'error': 'Authorization token is missing or invalid'}), 401

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
#         user_id = payload['user_id']
#         print(f"[DEBUG] User ID from token3: {user_id}")
#     except jwt.ExpiredSignatureError:
#         return jsonify({'error': 'Token has expired'}), 401
#     except jwt.InvalidTokenError:
#         return jsonify({'error': 'Invalid token'}), 401

#     try:
#         # ✅ Get data from frontend
#         range_type = request.args.get("range")
#         month = request.args.get("month")      # e.g. "January"
#         quarter = request.args.get("quarter")  # e.g. "1"
#         year = request.args.get("year")        # e.g. "2025"
#         shop = request.args.get("shop")
#         token = request.args.get("token")

#         if not shop or not token:
#             return jsonify({"error": "Shop and token are required"}), 400

#         # ✅ Fetch Shopify orders
#         url = (
#             f"https://{shop}/admin/api/2024-07/orders.json"
#             f"?limit=250&status=any"
#             f"&fields=id,name,email,financial_status,created_at,"
#             f"fulfillment_status,subtotal_price,total_price,total_discounts,"
#             f"total_line_items_price,total_tax,total_price_usd,currency,"
#             f"shipping_lines,line_items,discount_codes"
#         )
#         headers = {"X-Shopify-Access-Token": token}

#         all_orders = []
#         while url:
#             response = requests.get(url, headers=headers)
#             data_res = response.json()
#             orders = data_res.get("orders", [])
#             all_orders.extend(orders)

#             # Pagination
#             link_header = response.headers.get("Link")
#             next_url = None
#             if link_header:
#                 for part in link_header.split(","):
#                     if 'rel="next"' in part:
#                         next_url = part.split(";")[0].strip("<>")
#                         break
#             url = next_url

#         if not all_orders:
#             return jsonify({"error": "No orders found"}), 404

#         # ✅ Convert to DataFrame
#         df = pd.json_normalize(all_orders)
#         df['created_at'] = pd.to_datetime(df['created_at'])

#         # ✅ Filter based on range and create table name
#         if range_type == "monthly" and month and year:
#             month_number = list(calendar.month_name).index(month.capitalize())
#             df = df[(df['created_at'].dt.month == month_number) & (df['created_at'].dt.year == int(year))]
#             table_name = f"shopify_{month.lower()}_{year}_table"

#         elif range_type == "quarterly" and quarter and year:
#             quarter = int(quarter)
#             months_in_quarter = [(quarter - 1) * 3 + i for i in range(1, 4)]
#             df = df[(df['created_at'].dt.month.isin(months_in_quarter)) & (df['created_at'].dt.year == int(year))]
#             table_name = f"shopify_quarter{quarter}_{year}_table"

#         elif range_type == "yearly" and year:
#             df = df[df['created_at'].dt.year == int(year)]
#             table_name = f"shopify_{year}_table"

#         else:
#             return jsonify({"error": "Invalid filters"}), 400

#         if df.empty:
#             return jsonify({"message": "No data for selected range"}), 200

#         # ✅ Compute sales summary
#         total_sales = df['total_price'].astype(float).sum()
#         total_discounts = df['total_discounts'].astype(float).sum()
#         total_tax = df['total_tax'].astype(float).sum() if 'total_tax' in df.columns else 0
#         total_orders = len(df)
#         net_sales = total_sales - total_discounts

#         # # ✅ Add summary row
#         # summary_row = {
#         #     "id": "SUMMARY",
#         #     "name": None,
#         #     "email": None,
#         #     "financial_status": None,
#         #     "created_at": "",  # ✅ Use empty string instead of None to avoid NaT
#         #     "fulfillment_status": None,
#         #     "subtotal_price": None,
#         #     "total_price": total_sales,
#         #     "total_discounts": total_discounts,
#         #     "total_line_items_price": None,
#         #     "total_tax": total_tax,
#         #     "currency": df.iloc[0]['currency'] if 'currency' in df.columns else 'N/A',
#         #     "shipping_lines": None,
#         #     "line_items": None,
#         #     "discount_codes": None,
#         #     "summary_type": "Totals",
#         #     "total_orders": total_orders,
#         #     "net_sales": net_sales
#         # }
#         summary_row = {
#             "currency": df.iloc[0]['currency'] if 'currency' in df.columns else 'N/A',
#             "total_tax": total_tax,
#             "total_discounts": total_discounts,
#             "net_sales": net_sales,
#             # "total_price": round(last_row.get('total_price', 0), 2)
#         }



#         df = pd.concat([df, pd.DataFrame([summary_row])], ignore_index=True)

#         json_columns = ['line_items', 'shipping_lines', 'discount_codes']
#         for col in json_columns:
#             if col in df.columns:
#                 df[col] = df[col].apply(lambda x: json.dumps(x) if x is not None and not (isinstance(x, float) and pd.isna(x)) else None)

#         # Replace NaT values in datetime columns
#         for col in df.select_dtypes(include=["datetime64[ns]"]).columns:
#             df[col] = df[col].where(df[col].notna(), None)


#         # Limit returned rows if needed to avoid huge payloads
#         table_data = df.fillna('').to_dict(orient='records')

#         # Save only real orders to DB
#         df_orders_only = df[df['id'] != 'SUMMARY']

#         # Replace NaT values
#         for col in df_orders_only.select_dtypes(include=["datetime64[ns]"]).columns:
#             df_orders_only[col] = df_orders_only[col].where(df_orders_only[col].notna(), None)

#         # Save to DB
#         engine = db.get_engine(bind='shopify')
#         df_orders_only.to_sql(table_name, con=db.engine, if_exists='replace', index=False)

#         # Define the columns you want to return
#         columns_to_return = ['currency', 'total_price', 'total_discounts', 'total_tax', 'net_sales']

#         # Ensure all requested columns exist (e.g., in summary row or regular data)
#         for col in columns_to_return:
#             if col not in df.columns:
#                 df[col] = ''

#         # Filter the DataFrame to get only the last row of selected columns
#         last_row = df[columns_to_return].iloc[-1] if not df.empty else {}

#         # Prepare the data for the response
#         response_data = {
#             "currency": last_row.get('currency', ''),
#             "total_price": round(last_row.get('total_price', 0), 2),
#             "total_discounts": round(last_row.get('total_discounts', 0), 2),
#             "total_tax": round(last_row.get('total_tax', 0), 2),
#             "net_sales": round(last_row.get('net_sales', 0), 2),
#         }
#         print(last_row.get('net_sales', 0))
#         print("Last row data:", response_data)
#         if (
#             range_type == "monthly"
#             and month
#             and year
#             and str(year).isdigit()
#         ):
#             def safe_sql_float(val):
#                 return float(val) if pd.notnull(val) else None
#                 print("[DEBUG] Cleaned values before DB insert:")
#                 print("total_discounts:", safe_float(response_data.get("total_discounts")))
#                 print("total_price:", safe_float(response_data.get("total_price")))
#                 print("total_tax:", safe_float(response_data.get("total_tax")))
#                 print("net_sales:", safe_float(response_data.get("net_sales")))
#             upload_summary_to_shopify_db(
#                 user_id=user_id,
#                 month=month.capitalize(),
#                 year=int(year),
#                 total_discounts=safe_float(response_data.get("total_discounts")),
#                 total_price=safe_float(response_data.get("total_price")),
#                 total_tax=safe_float(response_data.get("total_tax")),
#                 total_orders=total_orders,
#                 net_sales=safe_float(response_data.get("net_sales"))
#             )
        
#         elif range_type == "quarterly" and quarter and year:
#             quarter = int(quarter)
#             months_in_quarter = [(quarter - 1) * 3 + i for i in range(1, 4)]

#             for m in months_in_quarter:
#                 month_df = df[(df['created_at'].dt.month == m) & (df['created_at'].dt.year == int(year))]
#                 if not month_df.empty:
#                     total_sales = month_df['total_price'].astype(float).sum()
#                     total_discounts = month_df['total_discounts'].astype(float).sum()
#                     total_tax = month_df['total_tax'].astype(float).sum() if 'total_tax' in month_df.columns else 0
#                     net_sales = total_sales - total_discounts
#                     total_orders = len(month_df)

#                     upload_summary_to_shopify_db(
#                         user_id=user_id,
#                         month=calendar.month_name[m],
#                         year=int(year),
#                         total_discounts=safe_float(total_discounts),
#                         total_price=safe_float(total_sales),
#                         total_tax=safe_float(total_tax),
#                         total_orders=total_orders,
#                         net_sales=safe_float(net_sales)
#                     )

#         elif range_type == "yearly" and year:
#             for m in range(1, 13):
#                 month_df = df[(df['created_at'].dt.month == m) & (df['created_at'].dt.year == int(year))]
#                 if not month_df.empty:
#                     total_sales = month_df['total_price'].astype(float).sum()
#                     total_discounts = month_df['total_discounts'].astype(float).sum()
#                     total_tax = month_df['total_tax'].astype(float).sum() if 'total_tax' in month_df.columns else 0
#                     net_sales = total_sales - total_discounts
#                     total_orders = len(month_df)

#                     upload_summary_to_shopify_db(
#                         user_id=user_id,
#                         month=calendar.month_name[m],
#                         year=int(year),
#                         total_discounts=safe_float(total_discounts),
#                         total_price=safe_float(total_sales),
#                         total_tax=safe_float(total_tax),
#                         total_orders=total_orders,
#                         net_sales=safe_float(net_sales)
#                     )

            



       


#         # Return the response with only the last row's data
#         return jsonify({
#             "message": f"Data saved in {table_name}",
#             "table_name": table_name,
#             "orders": total_orders,
#             "total_sales": round(total_sales, 2),
#             "net_sales": round(net_sales, 2),
#             "last_row_data": response_data  # Send only the last row data
#         }), 200
        


#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
    
    
# @shopify_bp.route('/shopify/get_orders', methods=['GET'])
# def get_orders():

#     shop = request.args.get("shop")
#     token = request.args.get("token")

#     if not shop or not token:
#         return jsonify({"error": "Missing shop or token"}), 400

#     end_date = datetime.utcnow()
#     start_date = end_date - timedelta(days=365)

#     created_at_min = start_date.strftime("%Y-%m-%dT%H:%M:%S%z")  # e.g., 2024-08-01T00:00:00+00:00
#     created_at_max = end_date.strftime("%Y-%m-%dT%H:%M:%S%z")


#     # Add more fields for sales terms
#     url = (
#         f"https://{shop}/admin/api/2024-07/orders.json"
#         f"?limit=250&status=any"
#         f"&created_at_min={created_at_min}&created_at_max={created_at_max}"
#         f"&fields=id,name,email,financial_status,created_at,"
#         f"fulfillment_status,subtotal_price,total_price,total_discounts,"
#         f"total_line_items_price,total_tax,total_price_usd,currency,"
#         f"shipping_lines,line_items,discount_codes"
#     )

#     headers = {"X-Shopify-Access-Token": token}
    
#     all_orders = []
#     total_sales = 0.0
#     total_discounts = 0.0
#     total_tax = 0.0
#     total_shipping = 0.0

#     while url:
#         response = requests.get(url, headers=headers)
#         data = response.json()
#         orders = data.get("orders", [])

#         for order in orders:
#             # Aggregate sales data
#             total_sales += float(order.get("total_price", 0))
#             total_discounts += float(order.get("total_discounts", 0))
#             total_tax += float(order.get("total_tax", 0))

#             # Shipping charges
#             for ship in order.get("shipping_lines", []):
#                 total_shipping += float(ship.get("price", 0))

#         all_orders.extend(orders)

#         # Handle pagination
#         link_header = response.headers.get("Link")
#         next_url = None
#         if link_header:
#             parts = link_header.split(",")
#             for part in parts:
#                 if 'rel="next"' in part:
#                     next_url = part.split(";")[0].strip("<>")
#                     break

#         url = next_url

#     summary = {
#         "total_sales": round(total_sales, 2),
#         "total_discounts": round(total_discounts, 2),
#         "total_tax": round(total_tax, 2),
#         "total_shipping": round(total_shipping, 2),
#         "net_sales": round(total_sales - total_discounts, 2),
#         "currency": all_orders[0]["currency"] if all_orders else "N/A",
#         "total_orders": len(all_orders)
#     }

#     return jsonify({"summary": summary, "orders": all_orders})

# def upload_summary_to_shopify_db(user_id, month, year, total_discounts, total_price, total_tax, total_orders, net_sales):
#     try:
#         print("[DEBUG] Entered upload_summary_to_shopify_db")
#         print(f"[DEBUG] DB URI (shopify):", current_app.config['SQLALCHEMY_BINDS']['shopify'])
#         print(f"[DEBUG] Values to insert/update => user_id: {user_id}, month: {month}, year: {year}")
#         print(f"[DEBUG] total_discounts: {total_discounts}, total_price: {total_price}, total_tax: {total_tax}, total_orders: {total_orders}, net_sales: {net_sales}")

#         engine = db.get_engine(bind='shopify')
#         with engine.begin() as conn: 
#             # ✅ Create table if not exists
#             conn.execute(text("""
#                 CREATE TABLE IF NOT EXISTS upload_shopify (
#                     id SERIAL PRIMARY KEY,
#                     user_id INTEGER,
#                     month TEXT,
#                     year INTEGER,
#                     total_discounts FLOAT,
#                     total_price FLOAT,
#                     total_tax FLOAT,
#                     total_orders INTEGER,
#                     net_sales FLOAT,
#                     UNIQUE (user_id, month, year)
#                 )
#             """))
#             print("[DEBUG] Table creation check passed")

#             # ✅ Insert or update the record
#             upsert_query = text("""
#                 INSERT INTO upload_shopify (user_id, month, year, total_discounts, total_price, total_tax, total_orders, net_sales)
#                 VALUES (:user_id, :month, :year, :total_discounts, :total_price, :total_tax, :total_orders, :net_sales)
#                 ON CONFLICT (user_id, month, year)
#                 DO UPDATE SET
#                     total_discounts = EXCLUDED.total_discounts,
#                     total_price = EXCLUDED.total_price,
#                     total_tax = EXCLUDED.total_tax,
#                     total_orders = EXCLUDED.total_orders,
#                     net_sales = EXCLUDED.net_sales
#             """)
#             result = conn.execute(upsert_query, {
#                 "user_id": user_id,
#                 "month": month,
#                 "year": year,
#                 "total_discounts": total_discounts,
#                 "total_price": total_price,
#                 "total_tax": total_tax,
#                 "total_orders": total_orders,
#                 "net_sales": net_sales
#             })

#             print(f"[DB] Summary uploaded/updated for user {user_id}. Result: {result}")
#     except Exception as e:
#         print(f"[ERROR] Failed to upload summary to upload_shopify: {e}")
       

# from flask import Blueprint, request, jsonify, current_app
# from sqlalchemy import text
# import jwt
# from datetime import datetime

# @shopify_bp.route('/upload_historyofshopify', methods=['GET'])
# def get_shopify_upload_history():
#     # ------------------ AUTH ------------------
#     auth_header = request.headers.get('Authorization')
#     if auth_header and auth_header.startswith('Bearer '):
#         token = auth_header.split(' ')[1]
#     else:
#         token = request.args.get('user_token')
#         if not token:
#             return jsonify({'error': 'Authorization token is missing or invalid'}), 401

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
#         user_id = payload['user_id']
#     except jwt.ExpiredSignatureError:
#         return jsonify({'error': 'Token has expired'}), 401
#     except jwt.InvalidTokenError:
#         return jsonify({'error': 'Invalid token'}), 401

#     # ------------------ PARAMS ------------------
#     year = request.args.get('year')
#     quarter = request.args.get('quarter')  # optional

#     if not year:
#         return jsonify({'error': 'Year is required'}), 400

#     try:
#         year = int(year)
#     except ValueError:
#         return jsonify({'error': 'Year must be a number'}), 400

#     # ------------------ DB QUERY ------------------
#     try:
#         engine = db.get_engine(bind='shopify')
#         with engine.connect() as conn:
#             query = """
#                 SELECT month, year, total_discounts, total_price, total_tax, total_orders, net_sales
#                 FROM upload_shopify
#                 WHERE user_id = :user_id AND year = :year
#             """
#             params = {"user_id": user_id, "year": year}

#             if quarter:
#                 quarters = {
#                     "Q1": ["January", "February", "March"],
#                     "Q2": ["April", "May", "June"],
#                     "Q3": ["July", "August", "September"],
#                     "Q4": ["October", "November", "December"]
#                 }
#                 months = quarters.get(quarter)
#                 if not months:
#                     return jsonify({"error": "Invalid quarter"}), 400
#                 query += " AND month IN :months"
#                 params["months"] = tuple(months)

#             result = conn.execute(text(query), params)
#             columns = result.keys()  # Fetch column names

#             # ✅ Properly convert rows to dict
#             rows = [dict(zip(columns, row)) for row in result]

#         return jsonify({"data": rows}), 200

#     except Exception as e:
#         print(f"[ERROR] Failed to fetch shopify data: {e}")
#         return jsonify({"error": "Internal server error"}), 500
    

from flask import Blueprint, redirect, request, jsonify, current_app
import os
import requests
from dotenv import load_dotenv
from app.models.user_models import ShopifyStore
from config import Config
from sqlalchemy import text
import json
import pandas as pd
from app import db
import calendar
import jwt
from datetime import datetime, timedelta
import math

# =============================
# Setup / config
# =============================
load_dotenv()

shopify_bp = Blueprint('shopify', __name__)

SECRET_KEY = Config.SECRET_KEY

SHOPIFY_API_KEY = os.getenv("SHOPIFY_API_KEY")
SHOPIFY_API_SECRET = os.getenv("SHOPIFY_API_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SCOPES = os.getenv("SCOPES")
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000")  # fallback

def safe_float(value):
    """Convert to float; handle None/NaN safely."""
    if value is None:
        return 0.0
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return 0.0
    try:
        return float(value)
    except Exception:
        return 0.0

# =============================
# OAuth: install / callback
# =============================
@shopify_bp.route('/shopify/install', methods=['GET'])
def install():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    else:
        token = request.args.get('user_token')
        if not token:
            return jsonify({'error': 'Authorization token is missing or invalid'}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        _user_id = payload['user_id']
        print(f"[DEBUG] User ID from token1: {_user_id}")
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

    shop = request.args.get("shop")
    if not shop:
        return jsonify({"error": "Shop parameter missing (use ?shop=storename.myshopify.com)"}), 400

    oauth_url = (
        f"https://{shop}/admin/oauth/authorize"
        f"?client_id={SHOPIFY_API_KEY}&scope={SCOPES}&redirect_uri={REDIRECT_URI}"
    )
    return redirect(oauth_url)


@shopify_bp.route('/shopify/callback', methods=['GET'])
def callback():
    shop = request.args.get("shop")
    code = request.args.get("code")

    if not shop or not code:
        error_message = "Shopify authorization failed. Please log in with the correct account."
        return redirect(f"{FRONTEND_BASE_URL}/shopify-error?message={error_message}")

    # Exchange code for token
    token_url = f"https://{shop}/admin/oauth/access_token"
    payload = {"client_id": SHOPIFY_API_KEY, "client_secret": SHOPIFY_API_SECRET, "code": code}
    response = requests.post(token_url, json=payload)
    token_data = response.json()

    if 'access_token' not in token_data:
        error_message = "Unauthorized Access. Please log in using the Shopify store owner account."
        return redirect(f"{FRONTEND_BASE_URL}/shopify-error?message={error_message}")

    access_token = token_data['access_token']

    # Fetch shop info to get email
    headers = {"X-Shopify-Access-Token": access_token}
    shop_info_res = requests.get(f"https://{shop}/admin/api/2024-07/shop.json", headers=headers)
    if shop_info_res.status_code != 200:
        error_message = "Unable to fetch shop details. Please try again."
        return redirect(f"{FRONTEND_BASE_URL}/shopify-error?message={error_message}")
    shop_info = shop_info_res.json()
    email = shop_info.get('shop', {}).get('email')

    # Upsert store
    try:
        existing_store = ShopifyStore.query.filter_by(shop_name=shop).first()
        if existing_store:
            existing_store.access_token = access_token
            existing_store.email = email
            existing_store.is_active = True
        else:
            new_store = ShopifyStore(shop_name=shop, access_token=access_token, email=email)
            db.session.add(new_store)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("[ERROR] DB upsert store:", e)
        error_message = "Database error while saving store details."
        return redirect(f"{FRONTEND_BASE_URL}/shopify-error?message={error_message}")

    # Redirect to frontend
    frontend_url = f"http://localhost:3000/orders?shop={shop}&token={access_token}&email={email}"
    return redirect(frontend_url)

# =============================
# Core: dropdown -> fetch exact window
# =============================
def _to_iso_utc(dt: datetime) -> str:
    # Shopify accepts "+00:00" style. We format as UTC (naive -> pretend UTC).
    return dt.strftime("%Y-%m-%dT%H:%M:%S+00:00")

@shopify_bp.route('/shopify/dropdown', methods=['GET'])
def get_dropdown_filters():
    # Auth
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token_jwt = auth_header.split(' ')[1]
    else:
        token_jwt = request.args.get('user_token')
        if not token_jwt:
            return jsonify({'error': 'Authorization token is missing or invalid'}), 401

    try:
        payload = jwt.decode(token_jwt, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        print(f"[DEBUG] User ID from token3: {user_id}")
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

    try:
        # Inputs
        range_type = request.args.get("range")        # monthly | quarterly | yearly
        month = request.args.get("month")             # "january" .. "december"
        quarter = request.args.get("quarter")         # "1".."4"
        year = request.args.get("year")               # "2025"
        shop = request.args.get("shop")
        token = request.args.get("token")

        if not shop or not token:
            return jsonify({"error": "Shop and token are required"}), 400
        if not range_type:
            return jsonify({"error": "Range is required"}), 400

        # Compute exact time window in UTC for Shopify API
        created_at_min = None
        created_at_max = None

        if range_type == "monthly" and month and year:
            month_num = list(calendar.month_name).index(month.capitalize())
            start = datetime(int(year), month_num, 1)
            end = (start.replace(day=28) + timedelta(days=4)).replace(day=1)  # next month 1st
            created_at_min, created_at_max = _to_iso_utc(start), _to_iso_utc(end)
            table_name = f"shopify_{month.lower()}_{year}_table"

        elif range_type == "quarterly" and quarter and year:
            q = int(quarter)
            start_month = (q - 1) * 3 + 1
            start = datetime(int(year), start_month, 1)
            end_month = start_month + 3
            end = datetime(int(year) + (1 if end_month > 12 else 0),
                           (end_month - 12) if end_month > 12 else end_month, 1)
            created_at_min, created_at_max = _to_iso_utc(start), _to_iso_utc(end)
            table_name = f"shopify_quarter{q}_{year}_table"

        elif range_type == "yearly" and year:
            start = datetime(int(year), 1, 1)
            end = datetime(int(year) + 1, 1, 1)
            created_at_min, created_at_max = _to_iso_utc(start), _to_iso_utc(end)
            table_name = f"shopify_{year}_table"

        else:
            return jsonify({"error": "Invalid filters"}), 400

        # Shopify query for EXACT window (faster + precise)
        url = (
            f"https://{shop}/admin/api/2024-07/orders.json"
            f"?limit=250&status=any"
            f"&created_at_min={created_at_min}&created_at_max={created_at_max}"
            f"&fields=id,name,email,financial_status,created_at,"
            f"fulfillment_status,subtotal_price,total_price,total_discounts,"
            f"total_line_items_price,total_tax,total_price_usd,currency,"
            f"shipping_lines,line_items,discount_codes"
        )
        headers = {"X-Shopify-Access-Token": token}

        # Pagination
        all_orders = []
        while url:
            response = requests.get(url, headers=headers)
            data_res = response.json()
            orders = data_res.get("orders", [])
            all_orders.extend(orders)

            link_header = response.headers.get("Link")
            next_url = None
            if link_header:
                for part in link_header.split(","):
                    if 'rel="next"' in part:
                        next_url = part.split(";")[0].strip("<>")
                        break
            url = next_url

        if not all_orders:
            return jsonify({"message": "No data for selected range"}), 200

        # DataFrame
        df = pd.json_normalize(all_orders)
        df['created_at'] = pd.to_datetime(df['created_at'])

        # Re-guard (should already be in exact window)
        if range_type == "monthly":
            month_num = list(calendar.month_name).index(month.capitalize())
            df = df[(df['created_at'].dt.month == month_num) & (df['created_at'].dt.year == int(year))]
        elif range_type == "quarterly":
            q = int(quarter)
            months_in_quarter = [(q - 1) * 3 + i for i in range(1, 4)]
            df = df[(df['created_at'].dt.month.isin(months_in_quarter)) & (df['created_at'].dt.year == int(year))]
        elif range_type == "yearly":
            df = df[df['created_at'].dt.year == int(year)]

        if df.empty:
            return jsonify({"message": "No data for selected range"}), 200

        # Totals
        total_sales = df['total_price'].astype(float).sum()
        total_discounts = df['total_discounts'].astype(float).sum()
        total_tax = df['total_tax'].astype(float).sum() if 'total_tax' in df.columns else 0.0
        total_orders = len(df)
        net_sales = total_sales - total_discounts

        # summary row (last_row_data)
        summary_row = {
            "currency": df.iloc[0]['currency'] if 'currency' in df.columns and len(df) else 'N/A',
            "total_tax": total_tax,
            "total_discounts": total_discounts,
            "net_sales": net_sales,
        }
        df = pd.concat([df, pd.DataFrame([summary_row])], ignore_index=True)

        # JSONify nested
        for col in ['line_items', 'shipping_lines', 'discount_codes']:
            if col in df.columns:
                df[col] = df[col].apply(
                    lambda x: json.dumps(x) if x is not None and not (isinstance(x, float) and pd.isna(x)) else None
                )

        # NaT -> None for JSON safety
        for col in df.select_dtypes(include=["datetime64[ns]"]).columns:
            df[col] = df[col].where(df[col].notna(), None)

        # Persist only real orders (not the summary row)
        df_orders_only = df[df['id'] != 'SUMMARY'] if 'id' in df.columns else df.iloc[:-1]
        for col in df_orders_only.select_dtypes(include=["datetime64[ns]"]).columns:
            df_orders_only[col] = df_orders_only[col].where(df_orders_only[col].notna(), None)

        # IMPORTANT: use the bound engine for 'shopify'
        engine = db.get_engine(bind='shopify')
        df_orders_only.to_sql(table_name, con=engine, if_exists='replace', index=False)

        # Build the single-line response for the top table
        columns_to_return = ['currency', 'total_price', 'total_discounts', 'total_tax', 'net_sales']
        for col in columns_to_return:
            if col not in df.columns:
                df[col] = ''
        last_row = df[columns_to_return].iloc[-1] if not df.empty else {}

        response_data = {
            "currency": last_row.get('currency', ''),
            "total_price": round(safe_float(last_row.get('total_price')), 2),
            "total_discounts": round(safe_float(last_row.get('total_discounts')), 2),
            "total_tax": round(safe_float(last_row.get('total_tax')), 2),
            "net_sales": round(safe_float(last_row.get('net_sales')), 2),
        }

        # Upload monthly breakdowns to upload_shopify for graphs
        if range_type == "monthly":
            upload_summary_to_shopify_db(
                user_id=user_id,
                month=month.capitalize(),
                year=int(year),
                total_discounts=safe_float(response_data["total_discounts"]),
                total_price=safe_float(response_data["total_price"]),
                total_tax=safe_float(response_data["total_tax"]),
                total_orders=total_orders,
                net_sales=safe_float(response_data["net_sales"]),
            )

        elif range_type == "quarterly":
            q = int(quarter)
            months_in_quarter = [(q - 1) * 3 + i for i in range(1, 4)]
            for m in months_in_quarter:
                month_df = df[(pd.to_datetime(df['created_at']).dt.month == m) & (pd.to_datetime(df['created_at']).dt.year == int(year))]
                if not month_df.empty:
                    ts = month_df['total_price'].astype(float).sum()
                    td = month_df['total_discounts'].astype(float).sum()
                    tt = month_df['total_tax'].astype(float).sum() if 'total_tax' in month_df.columns else 0.0
                    ns = ts - td
                    upload_summary_to_shopify_db(
                        user_id=user_id,
                        month=calendar.month_name[m],
                        year=int(year),
                        total_discounts=safe_float(td),
                        total_price=safe_float(ts),
                        total_tax=safe_float(tt),
                        total_orders=len(month_df),
                        net_sales=safe_float(ns),
                    )

        elif range_type == "yearly":
            for m in range(1, 13):
                month_df = df[(pd.to_datetime(df['created_at']).dt.month == m) & (pd.to_datetime(df['created_at']).dt.year == int(year))]
                if not month_df.empty:
                    ts = month_df['total_price'].astype(float).sum()
                    td = month_df['total_discounts'].astype(float).sum()
                    tt = month_df['total_tax'].astype(float).sum() if 'total_tax' in month_df.columns else 0.0
                    ns = ts - td
                    upload_summary_to_shopify_db(
                        user_id=user_id,
                        month=calendar.month_name[m],
                        year=int(year),
                        total_discounts=safe_float(td),
                        total_price=safe_float(ts),
                        total_tax=safe_float(tt),
                        total_orders=len(month_df),
                        net_sales=safe_float(ns),
                    )

        return jsonify({
            "message": f"Data saved in {table_name}",
            "table_name": table_name,
            "orders": total_orders,
            "total_sales": round(total_sales, 2),
            "net_sales": round(net_sales, 2),
            "last_row_data": response_data
        }), 200

    except Exception as e:
        print("[ERROR] /shopify/dropdown:", e)
        return jsonify({"error": str(e)}), 500

# =============================
# Orders (kept as is: last 365 days)
# =============================
@shopify_bp.route('/shopify/get_orders', methods=['GET'])
def get_orders():
    shop = request.args.get("shop")
    token = request.args.get("token")
    if not shop or not token:
        return jsonify({"error": "Missing shop or token"}), 400

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=365)
    created_at_min = start_date.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    created_at_max = end_date.strftime("%Y-%m-%dT%H:%M:%S+00:00")

    url = (
        f"https://{shop}/admin/api/2024-07/orders.json"
        f"?limit=250&status=any"
        f"&created_at_min={created_at_min}&created_at_max={created_at_max}"
        f"&fields=id,name,email,financial_status,created_at,"
        f"fulfillment_status,subtotal_price,total_price,total_discounts,"
        f"total_line_items_price,total_tax,total_price_usd,currency,"
        f"shipping_lines,line_items,discount_codes"
    )
    headers = {"X-Shopify-Access-Token": token}

    all_orders = []
    totals = dict(total_sales=0.0, total_discounts=0.0, total_tax=0.0, total_shipping=0.0)

    while url:
        response = requests.get(url, headers=headers)
        data = response.json()
        orders = data.get("orders", [])

        for order in orders:
            totals["total_sales"] += safe_float(order.get("total_price", 0))
            totals["total_discounts"] += safe_float(order.get("total_discounts", 0))
            totals["total_tax"] += safe_float(order.get("total_tax", 0))
            for ship in order.get("shipping_lines", []):
                totals["total_shipping"] += safe_float(ship.get("price", 0))

        all_orders.extend(orders)

        link_header = response.headers.get("Link")
        next_url = None
        if link_header:
            for part in link_header.split(","):
                if 'rel="next"' in part:
                    next_url = part.split(";")[0].strip("<>")
                    break
        url = next_url

    summary = {
        "total_sales": round(totals["total_sales"], 2),
        "total_discounts": round(totals["total_discounts"], 2),
        "total_tax": round(totals["total_tax"], 2),
        "total_shipping": round(totals["total_shipping"], 2),
        "net_sales": round(totals["total_sales"] - totals["total_discounts"], 2),
        "currency": all_orders[0]["currency"] if all_orders else "N/A",
        "total_orders": len(all_orders),
    }
    return jsonify({"summary": summary, "orders": all_orders})

# =============================
# Persist monthly summaries used by graphs
# =============================
def upload_summary_to_shopify_db(user_id, month, year, total_discounts, total_price, total_tax, total_orders, net_sales):
    try:
        print("[DEBUG] Entered upload_summary_to_shopify_db")
        print(f"[DEBUG] Values => user_id:{user_id}, {month} {year}, "
              f"disc:{total_discounts}, price:{total_price}, tax:{total_tax}, "
              f"orders:{total_orders}, net:{net_sales}")

        engine = db.get_engine(bind='shopify')
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS upload_shopify (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    month TEXT,
                    year INTEGER,
                    total_discounts FLOAT,
                    total_price FLOAT,
                    total_tax FLOAT,
                    total_orders INTEGER,
                    net_sales FLOAT,
                    UNIQUE (user_id, month, year)
                )
            """))

            upsert_query = text("""
                INSERT INTO upload_shopify (user_id, month, year, total_discounts, total_price, total_tax, total_orders, net_sales)
                VALUES (:user_id, :month, :year, :total_discounts, :total_price, :total_tax, :total_orders, :net_sales)
                ON CONFLICT (user_id, month, year) DO UPDATE SET
                    total_discounts = EXCLUDED.total_discounts,
                    total_price     = EXCLUDED.total_price,
                    total_tax       = EXCLUDED.total_tax,
                    total_orders    = EXCLUDED.total_orders,
                    net_sales       = EXCLUDED.net_sales
            """)

            conn.execute(upsert_query, {
                "user_id": user_id,
                "month": month,
                "year": year,
                "total_discounts": safe_float(total_discounts),
                "total_price": safe_float(total_price),
                "total_tax": safe_float(total_tax),
                "total_orders": int(total_orders),
                "net_sales": safe_float(net_sales),
            })

            print(f"[DB] Summary uploaded/updated for user {user_id} - {month} {year}")
    except Exception as e:
        print(f"[ERROR] Failed to upload summary to upload_shopify: {e}")

# =============================
# History endpoint for charts
# =============================
@shopify_bp.route('/upload_historyofshopify', methods=['GET'])
def get_shopify_upload_history():
    # Auth
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token_jwt = auth_header.split(' ')[1]
    else:
        token_jwt = request.args.get('user_token')
        if not token_jwt:
            return jsonify({'error': 'Authorization token is missing or invalid'}), 401

    try:
        payload = jwt.decode(token_jwt, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

    # Params
    year = request.args.get('year')
    quarter = request.args.get('quarter')  # expects "Q1".."Q4" if present
    if not year:
        return jsonify({'error': 'Year is required'}), 400

    try:
        year = int(year)
    except ValueError:
        return jsonify({'error': 'Year must be a number'}), 400

    try:
        engine = db.get_engine(bind='shopify')
        with engine.connect() as conn:
            query = """
                SELECT month, year, total_discounts, total_price, total_tax, total_orders, net_sales
                FROM upload_shopify
                WHERE user_id = :user_id AND year = :year
            """
            params = {"user_id": user_id, "year": year}

            if quarter:
                quarters = {
                    "Q1": ("January", "February", "March"),
                    "Q2": ("April", "May", "June"),
                    "Q3": ("July", "August", "September"),
                    "Q4": ("October", "November", "December"),
                }
                months = quarters.get(quarter)
                if not months:
                    return jsonify({"error": "Invalid quarter"}), 400
                query += " AND month IN :months"
                params["months"] = months

            result = conn.execute(text(query), params)
            cols = result.keys()
            rows = [dict(zip(cols, r)) for r in result]

        return jsonify({"data": rows}), 200

    except Exception as e:
        print(f"[ERROR] Failed to fetch shopify data: {e}")
        return jsonify({"error": "Internal server error"}), 500


