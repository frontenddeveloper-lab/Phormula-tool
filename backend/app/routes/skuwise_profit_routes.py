from datetime import datetime
from flask import Blueprint, request, jsonify
import jwt
from sqlalchemy import create_engine, text
from sqlalchemy import inspect
import os
from config import Config
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = Config.SECRET_KEY
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/phormula')
db_url1 = os.getenv('DATABASE_ADMIN_URL', 'postgresql://postgres:password@localhost:5432/admin_db')

skuwise_bp = Blueprint('skuwise_bp', __name__)


@skuwise_bp.route('/ProductwisePerformance', methods=['POST'])
def productwise_performance():
    try:
        # ---------------- AUTH ------------------
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token missing'}), 401

        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = str(payload.get('user_id'))

        # ---------------- INPUT ------------------
        data = request.get_json()
        product_name = data.get('product_name')
        time_range = data.get('time_range', 'Yearly')      # 'Quarterly' or 'Yearly'
        year = str(data.get('year', datetime.now().year))
        quarter = data.get('quarter')                      # '1','2','3','4' if Quarterly
        if quarter is not None:
            quarter = str(quarter)

        # Countries to return; you can add 'us', etc later if needed
        requested_countries = data.get('countries', ['uk', 'global'])

        if not product_name:
            return jsonify({'error': 'Product name required'}), 400

        # ---------------- DB ---------------------
        engine = create_engine(db_url)
        conn = engine.connect()
        inspector = inspect(engine)
        all_tables = [t.lower() for t in inspector.get_table_names()]

        # ---------------- MONTH MAP ----------------
        month_mapping = {
            'january': '01', 'february': '02', 'march': '03',
            'april': '04', 'may': '05', 'june': '06',
            'july': '07', 'august': '08', 'september': '09',
            'october': '10', 'november': '11', 'december': '12'
        }
        quarter_months = {
            '1': ['january', 'february', 'march'],
            '2': ['april', 'may', 'june'],
            '3': ['july', 'august', 'september'],
            '4': ['october', 'november', 'december']
        }

        if time_range == "Quarterly" and quarter in quarter_months:
            months_to_fetch = quarter_months[quarter]
        else:
            months_to_fetch = list(month_mapping.keys())

        # ============================================================
        # ⭐ FUNCTION TO GET CORRECT SKU-WISE TABLES
        # ============================================================
        def find_tables(country: str, month: str):
            month_year = month + year
            matches = []

            # UK tables (NO "_table" suffix in your DB)
            if country.lower() == "uk":
                table_name = f"skuwisemonthly_{user_id}_uk_{month_year}".lower()
                if table_name in all_tables:
                    matches.append(table_name)

            # GLOBAL table – ONLY USE FINAL MERGED TABLE
            elif country.lower() == "global":
                table_name = f"skuwisemonthly_{user_id}_global_{month_year}_table".lower()
                if table_name in all_tables:
                    matches.append(table_name)

            # You can add more country rules here (us, global_inr, etc.)
            return matches

        # ============================================================
        # PROCESS EACH COUNTRY
        # ============================================================
        final_output = {}

        for country in requested_countries:
            country_rows = []

            total_qty_country = 0
            total_sales_country = 0.0
            total_profit_country = 0.0

            for month in months_to_fetch:
                tables = find_tables(country, month)

                total_qty = 0
                total_sales = 0.0
                total_profit = 0.0

                for table_name in tables:
                    query = text(f"""
                        SELECT quantity, net_sales, profit
                        FROM "{table_name}"
                        WHERE LOWER(TRIM(product_name)) = LOWER(TRIM(:p))
                    """)
                    rows = conn.execute(query, {"p": product_name}).fetchall()

                    for q, s, p in rows:
                        total_qty += int(q or 0)
                        total_sales += float(s or 0)
                        total_profit += float(p or 0)

                # accumulate to country totals (for summary)
                total_qty_country += total_qty
                total_sales_country += total_sales
                total_profit_country += total_profit

                gross_margin = (total_profit / total_sales * 100) if total_sales > 0 else 0.0

                country_rows.append({
                    "month": month.capitalize(),
                    "month_num": month_mapping[month],
                    "net_sales": total_sales,
                    "quantity": total_qty,
                    "profit": total_profit,
                    "gross_margin": gross_margin,
                    "year": year
                })

            # sort by month order
            country_rows.sort(key=lambda x: x["month_num"])

            # --------- summary for cards (net sales, ASP, CM1%, best month) ----------
            if total_sales_country > 0 and total_qty_country > 0:
                asp = total_sales_country / total_qty_country
            else:
                asp = 0.0

            cm1_pct = (total_profit_country / total_sales_country * 100) if total_sales_country > 0 else 0.0

            # Best performance month by net sales
            best_month_row = max(country_rows, key=lambda x: x["net_sales"], default=None)
            if best_month_row:
                best_month = {
                    "month": best_month_row["month"],
                    "sales": best_month_row["net_sales"],
                    "units": best_month_row["quantity"],
                    "profit": best_month_row["profit"],
                }
            else:
                best_month = None

            final_output[country] = {
                "summary": {
                    "net_sales": total_sales_country,
                    "units": total_qty_country,
                    "profit": total_profit_country,
                    "avg_monthly_sales": (total_sales_country / len(months_to_fetch)) if months_to_fetch else 0.0,
                    "avg_selling_price": asp,
                    "cm1_pct": cm1_pct,
                    "best_month": best_month,
                },
                "monthly": country_rows
            }

        conn.close()

        return jsonify({
            "success": True,
            "product_name": product_name,
            "time_range": time_range,
            "year": year,
            "quarter": quarter,
            "data": final_output
        })

    except Exception as e:
        print("Error in ProductwisePerformance:", str(e))
        return jsonify({"error": str(e)}), 500


# ---------------- PRODUCT SEARCH ------------------

@skuwise_bp.route('/Product_search', methods=['GET'])
def product_search():
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

    search_query = request.args.get('query', '').strip()
    if not search_query:
        return jsonify({'error': 'Search query is required'}), 400

    try:
        engine = create_engine(db_url)
        conn = engine.connect()

        table_name = f"sku_{user_id}_data_table"

        inspector = inspect(engine)
        if not inspector.has_table(table_name):
            return jsonify({'error': 'No data found for this user.'}), 404

        query = text(f"""
            SELECT DISTINCT product_name
            FROM {table_name}
            WHERE LOWER(product_name) LIKE LOWER(:search_query)
            ORDER BY product_name
            LIMIT 10
        """)

        results = conn.execute(query, {'search_query': f'%{search_query}%'}).fetchall()
        products = [{'product_name': row[0]} for row in results]

        conn.close()

        return jsonify({'products': products}), 200

    except Exception as e:
        print(f"Error searching products: {str(e)}")
        return jsonify({'error': f'Error searching products: {str(e)}'}), 500
