from sqlalchemy import text
import calendar
from datetime import datetime
from calendar import month_name as calendar_month_name
from sqlalchemy.exc import ProgrammingError, OperationalError
import matplotlib.pyplot as plt
import base64
from io import BytesIO
import pandas as pd
import numpy as np
import io
import os
import re
from sqlalchemy import create_engine
from dotenv import load_dotenv
from app.utils.nlp_utils import match_concepts
load_dotenv()
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/phormula')

engine = create_engine(db_url)


MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12
    }
REVERSE_MONTH_MAP = {v: k for k, v in MONTH_MAP.items()}



def get_sku_line_graph_data(engine, user_id, country):
    """Get SKU sales data for line graph over last 3 months."""
    try:
        with engine.connect() as conn:
            # Get all tables that match the pattern
            result = conn.execute(text("""
                SELECT tablename
                FROM pg_tables
                WHERE tablename LIKE :pattern
            """), {'pattern': f'skuwisemonthly_{user_id}_{country}_%'})
            tables = result.fetchall()

            available = []

            for row in tables:
                name = row[0]
                try:
                    parts = name.split('_')
                    if len(parts) >= 4:
                        month_year = '_'.join(parts[3:])
                        for month_name in calendar.month_name[1:]:
                            if month_year.lower().startswith(month_name.lower()):
                                try:
                                    month_num = datetime.strptime(month_name, "%B").month
                                    year_str = month_year[len(month_name):]
                                    year_num = int(year_str)
                                    available.append((year_num, month_num, name))
                                    break
                                except ValueError:
                                    continue
                except Exception:
                    continue

            # Check if we have enough data
            if len(available) < 3:
                available.sort(reverse=True)
                found_months = [f"{calendar.month_name[m[1]]} {m[0]}" for m in available]
                return {
                    'error': f"Not enough monthly tables found to plot SKU trends. Available months: {', '.join(found_months)}",
                    'debug_tables_found': [x[2] for x in available],
                    'debug_length': len(available)
                }

            # Use last 3 sorted months
            available.sort(reverse=True)
            last3 = available[:3][::-1]

            sku_data = {}
            months = []
            monthly_sales = []

            for year_num, month_num, table in last3:
                result = conn.execute(text(f"SELECT sku, Net_Sales FROM {table}"))
                rows = result.fetchall()

                month_label = f"{calendar.month_name[month_num]} {year_num}"
                months.append(month_label)

                sku_sales = {}
                for sku, sales in rows:
                    if sku.strip().lower() == 'total':
                        continue
                    try:
                        sku_sales[sku] = float(sales)
                    except:
                        sku_sales[sku] = 0.0
                monthly_sales.append(sku_sales)

        # Get all SKUs seen across months
        all_skus = set()
        for m in monthly_sales:
            all_skus.update(m.keys())

        # Collect sales for each SKU across 3 months
        for sku in all_skus:
            sales_numbers = []
            for month_data in monthly_sales:
                sales_numbers.append(round(month_data.get(sku, 0.0), 2))
            sku_data[sku] = sales_numbers

        # Get top 5 SKUs by latest month sales
        latest_sales = monthly_sales[-1]
        top_skus = sorted(latest_sales.items(), key=lambda x: x[1], reverse=True)[:5]
        top_sku_names = [sku for sku, _ in top_skus]

        # Prepare message
        msg_lines = ["📦 Top 5 SKU Net Sales (last 3 months):"]
        for sku in top_sku_names:
            sales = sku_data[sku]
            msg_lines.append(
                f"🔹 {sku}: {months[0]}: {sales[0]:,.2f}, "
                f"{months[1]}: {sales[1]:,.2f}, {months[2]}: {sales[2]:,.2f}"
            )

        # Prepare graph data
        graph_labels = months
        datasets = [{'sku': sku, 'data': sku_data[sku]} for sku in top_sku_names]

        return {
            'message': "\n".join(msg_lines),
            'labels': graph_labels,
            'datasets': datasets,
            'month': months[-1].split()[0],
            'year': months[-1].split()[1]
        }

    except Exception as e:
        print(f"❌ Error generating SKU graph data: {e}")
        return {'error': 'Something went wrong while generating SKU graph data.'}


def get_top_cities_data(engine, user_id, country, month, year):
    """Get top 10 cities by order volume."""
    try:
        with engine.connect() as conn:
            # Build dynamic table name
            table_name_states = f"user_{user_id}_{country}_{calendar.month_name[month].lower()}{year}_data"

            # Check if the table exists
            result = conn.execute(
                text("SELECT to_regclass(:table_name)"),
                {'table_name': table_name_states}
            )
            table_exists = result.scalar()

            if not table_exists:
                return {
                    'message': f"No data available for {calendar.month_name[month].lower()} {year}."
                }

            # Query top 10 order cities
            result = conn.execute(text(f"""
                SELECT UPPER(TRIM(order_city)) AS region, COUNT(*) AS total_orders
                FROM {table_name_states}
                WHERE order_city IS NOT NULL AND TRIM(order_city) != '0'
                GROUP BY region
                ORDER BY total_orders DESC
                LIMIT 10;
            """))
            results = result.fetchall()

        if results:
            msg_lines = [f"🌍 Top 10 Cities by Order Volume ({calendar.month_name[month]} {year}):\n"]
            labels = []
            values = []

            for i, (city, count) in enumerate(results, 1):
                msg_lines.append(f"{i}. {city} – {count:,} orders")
                labels.append(city)
                values.append(count)

            return {
                'message': "\n".join(msg_lines),
                'chartType': 'pie',
                'labels': labels,
                'values': values,
                'cities_data': [{'city': city, 'orders': count} for city, count in results]
            }
        else:
            return {
                'message': f"No city-level order data found for {calendar.month_name[month]} {year}."
            }

    except Exception as e:
        print(f"❌ Error fetching top 10 cities: {e}")
        return {'error': 'Something went wrong while retrieving city data.'}


def get_coupons_discounts_data(engine, user_id, country, month, year):
    """Get sales from coupons and discounts."""
    try:
        with engine.connect() as conn:
            # Build dynamic table name
            table_name = f"user_{user_id}_{country}_{calendar.month_name[month].lower()}{year}_data"

            # Check if the table exists
            result = conn.execute(
                text("SELECT to_regclass(:table_name)"),
                {'table_name': table_name}
            )
            table_exists = result.scalar()

            if not table_exists:
                return {
                    'message': f"No data available for {calendar.month_name[month]} {year}."
                }

            # Query to sum total coupon/discount sales
            result = conn.execute(text(f"""
                SELECT 
                    COUNT(*) AS total_coupon_orders,
                    SUM(CAST("total" AS FLOAT)) AS net_coupon_total,
                    SUM(CAST("promotional_rebates" AS FLOAT)) AS total_discount_given
                FROM {table_name}
                WHERE LOWER("description") LIKE 'coupon redemption fee%'
            """))

            row = result.fetchone()
            order_count = row.total_coupon_orders or 0
            net_total = row.net_coupon_total or 0
            discount_total = row.total_discount_given or 0

        return {
            'message': (
                f"💰 Coupon & Discount Activity – {calendar.month_name[month]} {year}:\n"
                f"• Total Coupon Orders: {order_count:,}\n"
                f"• Net Total from Coupon Transactions: {net_total:,.2f}\n"
                f"• Promotional Discounts Given: {discount_total:,.2f}"
            ),
            'total_coupon_orders': order_count,
            'net_coupon_total': net_total,
            'discount_total': discount_total
        }

    except Exception as e:
        print(f"❌ Error fetching coupon/discount data: {e}")
        return {'error': 'Something went wrong while retrieving coupon/discount data.'}

def get_refunds_data(engine, user_id, country, month, year):
    """Get refunds data (tabular and summary)."""
    try:
        with engine.connect() as conn:
            # Build dynamic table name
            table_name = f"user_{user_id}_{country}_{calendar.month_name[month].lower()}{year}_data"

            # Check if the table exists
            result = conn.execute(
                text("SELECT to_regclass(:table_name)"),
                {'table_name': table_name}
            )
            table_exists = result.scalar()

            if not table_exists:
                return {
                    'message': f"No data available for {calendar.month_name[month]} {year}."
                }

            # Query individual refund records
            result = conn.execute(text(f"""
                SELECT
                    order_id,
                    CAST(quantity AS INT) AS refund_quantity,
                    CAST("product_sales" AS FLOAT) AS refund_amount
                FROM {table_name}
                WHERE LOWER(type) = 'refund'
            """))

            rows = result.fetchall()

        if not rows:
            return {
                'message': f"No refund data found for {calendar.month_name[month]} {year}.",
                'table_data': []
            }

        total_quantity = sum(row.refund_quantity or 0 for row in rows)
        total_amount = sum(row.refund_amount or 0.0 for row in rows)

        table_data = [
            {
                'Order ID': row.order_id,
                'Refund Quantity': row.refund_quantity,
                'Refund Amount': round(row.refund_amount, 2)
            }
            for row in rows
        ]

        return {
            'message': (
                f"🔄 Refund Activity – {calendar.month_name[month]} {year}:\n"
                f"• Total Refund Quantity: {total_quantity:,}\n"
                f"• Total Refund Amount: {total_amount:,.2f}"
            ),
            'refund_quantity': total_quantity,
            'refund_amount': total_amount,
            'table_data': table_data,
        }

    except Exception as e:
        print(f"❌ Error fetching refund data: {e}")
        return {'error': 'Something went wrong while retrieving refund data.'}


def format_currency_value(value, currency_info):
            """Format numerical value with appropriate currency symbol and formatting"""
            if value is None or value == '':
                return 'N/A'
            
            try:
                # Convert to float if it's a string
                if isinstance(value, str):
                    # Remove any existing currency symbols or commas
                    cleaned_value = re.sub(r'[^\d.-]', '', str(value))
                    if not cleaned_value:
                        return 'N/A'
                    numeric_value = float(cleaned_value)
                else:
                    numeric_value = float(value)
                
                # Format based on currency
                if currency_info['code'] == 'JPY':
                    # Japanese Yen - no decimal places
                    return f"{currency_info['symbol']}{numeric_value:,.0f}"
                elif currency_info['code'] in ['INR']:
                    # Indian Rupee - use Indian number system
                    if numeric_value >= 10000000:  # 1 crore
                        return f"{currency_info['symbol']}{numeric_value/10000000:.2f} Cr"
                    elif numeric_value >= 100000:  # 1 lakh
                        return f"{currency_info['symbol']}{numeric_value/100000:.2f} L"
                    else:
                        return f"{currency_info['symbol']}{numeric_value:,.2f}"
                else:
                    # Standard formatting with 2 decimal places
                    return f"{currency_info['symbol']}{numeric_value:,.2f}"
                    
            except (ValueError, TypeError):
                return str(value)
        
def format_data_with_currency(data_rows, currency_info):
            """Format monetary fields in data with appropriate currency"""
            # Fields that should be formatted as currency
            currency_fields = [
                'net_sales', 'net_credits', 'profit', 'cost_of_unit_sold', 
                'amazon_fee', 'net_taxes', 'fba_fees', 'selling_fees', 
                'platform_fee', 'rembursement_fee', 'advertising_total',
                'cm2_profit', 'asp', 'reimbursement_vs_sales', 'price_in_gbp'
            ]
            
            formatted_data = []
            for row in data_rows:
                formatted_row = row.copy()
                for field in currency_fields:
                    if field in formatted_row and formatted_row[field] is not None:
                        formatted_row[field] = format_currency_value(formatted_row[field], currency_info)
                formatted_data.append(formatted_row)
            
            return formatted_data

        
def get_latest_month_from_database(user_id, country, engine):
            """
            Get the latest month and year available in the database for the user and country
            Returns: (latest_month, latest_year)
            """
            try:
                with engine.connect() as conn:
                    # Get all tables for this user and country
                    result = conn.execute(
                        text("""
                            SELECT table_name 
                            FROM information_schema.tables 
                            WHERE table_name LIKE :pattern 
                            AND table_schema = 'public'
                            ORDER BY table_name
                        """),
                        {"pattern": f"skuwisemonthly_{user_id}_{country}_%"}
                    )

                    tables = [row[0] for row in result.fetchall()]
                    print(f"✅ Available tables: {tables}")

                    if not tables:
                        print("⚠️ No tables found, using current date as fallback")
                        import datetime
                        now = datetime.datetime.now()
                        return now.month, now.year

                    # Extract months and years from table names
                    month_year_pairs = []
                    month_mapping = {
                        'january': 1, 'february': 2, 'march': 3, 'april': 4,
                        'may': 5, 'june': 6, 'july': 7, 'august': 8,
                        'september': 9, 'october': 10, 'november': 11, 'december': 12
                    }

                    for table in tables:
                        # Parse table name: skuwisemonthly_{user_id}_{country}_{month}{year}
                        parts = table.split('_')
                        if len(parts) >= 4:
                            month_year_part = parts[-1]  # e.g., "january2025"

                            # Extract year (last 4 digits)
                            year_match = re.search(r'(\d{4})$', month_year_part)
                            if year_match:
                                year = int(year_match.group(1))
                                month_name = month_year_part.replace(str(year), '').lower()

                                if month_name in month_mapping:
                                    month_num = month_mapping[month_name]
                                    month_year_pairs.append((month_num, year))
                                    print(f"📅 Found: {month_name.title()} {year} (Month {month_num})")

                    if not month_year_pairs:
                        print("⚠️ No valid month/year pairs found, using current date as fallback")
                        import datetime
                        now = datetime.datetime.now()
                        return now.month, now.year

                    # Sort by year, then by month to get the latest
                    month_year_pairs.sort(key=lambda x: (x[1], x[0]))
                    latest_month, latest_year = month_year_pairs[-1]

                    print(f"🎯 Latest month in database: {calendar.month_name[latest_month]} {latest_year}")
                    return latest_month, latest_year

            except Exception as e:
                print(f"❌ Error getting latest month from database: {e}")
                import datetime
                now = datetime.datetime.now()
                return now.month, now.year



def extract_months_from_query(user_input, current_month, current_year, matched_concepts):


            """
            Extract months and year from user query. Handles growth/comparison queries.
            Uses database latest month as current reference.
            Returns: (months_list, year, is_comparison, is_chart_request, months_with_years)
            """
            user_input_lower = user_input.lower()

            month_mapping = {
                'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
                'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6,
                'july': 7, 'jul': 7, 'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9,
                'october': 10, 'oct': 10, 'november': 11, 'nov': 11, 'december': 12, 'dec': 12
            }

            quarter_mapping = {
                'q1': [1, 2, 3], 'q2': [4, 5, 6], 'q3': [7, 8, 9], 'q4': [10, 11, 12],
                'qtr1': [1, 2, 3], 'qtr2': [4, 5, 6], 'qtr3': [7, 8, 9], 'qtr4': [10, 11, 12],
                'quarter 1': [1, 2, 3], 'quarter 2': [4, 5, 6], 'quarter 3': [7, 8, 9], 'quarter 4': [10, 11, 12],
                'first quarter': [1, 2, 3], 'second quarter': [4, 5, 6], 'third quarter': [7, 8, 9], 'fourth quarter': [10, 11, 12]
            }

         
            is_comparison = "comparison" in matched_concepts or "growth" in matched_concepts


          
            is_chart_request = "chart" in matched_concepts


            found_months = []
            extracted_year = current_year
            months_with_years = []  # To handle multi-year ranges

            print(f"📅 Using database latest as current: {calendar.month_name[current_month]} {current_year}")

            # NEW: Handle explicit date ranges that span multiple years
            # Pattern: "from month year to month year" or "month year to month year"
            date_range_patterns = [
                r'from\s+(\w+)\s+(\d{2,4})\s+to\s+(\w+)\s+(\d{2,4})',
                r'(\w+)\s+(\d{2,4})\s+to\s+(\w+)\s+(\d{2,4})',
                r'between\s+(\w+)\s+(\d{2,4})\s+and\s+(\w+)\s+(\d{2,4})'
            ]
            
            for pattern in date_range_patterns:
                match = re.search(pattern, user_input_lower)
                if match:
                    start_month_name, start_year_str, end_month_name, end_year_str = match.groups()
                    
                    # Convert month names to numbers
                    start_month_num = month_mapping.get(start_month_name.lower())
                    end_month_num = month_mapping.get(end_month_name.lower())
                    
                    if start_month_num and end_month_num:
                        # Handle 2-digit years (24 -> 2024, 25 -> 2025)
                        start_year = int(start_year_str)
                        end_year = int(end_year_str)
                        
                        if start_year < 100:
                            start_year = 2000 + start_year
                        if end_year < 100:
                            end_year = 2000 + end_year
                        
                        print(f"🎯 Date range detected: {start_month_name.title()} {start_year} to {end_month_name.title()} {end_year}")
                        
                        # Generate all months in the range
                        current_month_iter = start_month_num
                        current_year_iter = start_year
                        
                        while (current_year_iter < end_year) or (current_year_iter == end_year and current_month_iter <= end_month_num):
                            months_with_years.append((current_month_iter, current_year_iter))
                            
                            current_month_iter += 1
                            if current_month_iter > 12:
                                current_month_iter = 1
                                current_year_iter += 1
                        
                        print(f"📅 Generated month-year pairs: {[(calendar.month_name[m], y) for m, y in months_with_years]}")
                        
                        # For backward compatibility, return months and use end year as primary
                        found_months = [m for m, y in months_with_years]
                        extracted_year = end_year
                        is_comparison = True
                        
                        # Return early with multi-year data
                        return found_months, extracted_year, is_comparison, is_chart_request, months_with_years

            # Handle fiscal year (FY) - existing logic
            fy_full_year = re.findall(r'(?:fy|fiscal year)[\s\-]?(20\d{2})', user_input_lower)
            fy_short_year = re.findall(r'(?:fy)[\s\-]?(\d{2})', user_input_lower)
            fy_range = re.findall(r'(?:fy)[\s\-]?(\d{2})[\s\-to]+(\d{2})', user_input_lower)

            if fy_full_year:
                fy_year = int(fy_full_year[0])
                extracted_year = fy_year
                found_months = list(range(1, 13))
                is_comparison = True
            elif fy_short_year:
                fy_year = 2000 + int(fy_short_year[0])
                extracted_year = fy_year
                found_months = list(range(1, 13))
                is_comparison = True
            elif fy_range:
                start, end = fy_range[0]
                fy_start_year = 2000 + int(start)
                extracted_year = fy_start_year
                found_months = list(range(1, 13))
                is_comparison = True

            # Check for quarters
            if not found_months:
                for quarter_name, quarter_months in quarter_mapping.items():
                    if quarter_name in user_input_lower:
                        found_months.extend(quarter_months)
                        is_comparison = True
                        break


            # NEW: Handle phrases like "in June 2025 compared to January 2025"
            month_year_matches = re.findall(r'\b(?:in|on|for|of|versus|vs|compared to)?\s*([a-zA-Z]+)\s+(\d{4})', user_input_lower)
            if len(month_year_matches) >= 2:
                print("📌 Detected multiple month-year phrases for comparison")
            
                for month_name, year_str in month_year_matches:
                    month_num = month_mapping.get(month_name.lower())
                    if not month_num:
                        continue
                    year = int(year_str)
                    months_with_years.append((month_num, year))
            
                # Deduplicate and sort chronologically
                months_with_years = sorted(set(months_with_years), key=lambda x: (x[1], x[0]))
                found_months = [m for m, y in months_with_years]
                extracted_year = months_with_years[-1][1]
                is_comparison = True
            
                return found_months, extracted_year, is_comparison, is_chart_request, months_with_years


            # FIXED: Relative month phrases using database latest as reference
            if not found_months:
                last_months_pattern = r'(?:last|past)\s+(\d+)\s+months?'
                match = re.search(last_months_pattern, user_input_lower)
                if match:
                    num_months = int(match.group(1))
                    num_months = min(max(num_months, 1), 24)
                    print(f"🔍 Looking for last {num_months} months from database latest: {current_month}/{current_year}")

                    for i in range(num_months):
                        month_to_add = current_month - i
                        year_to_use = current_year

                        # Handle year rollback
                        while month_to_add <= 0:
                            month_to_add += 12
                            year_to_use -= 1

                        months_with_years.append((month_to_add, year_to_use))

                    # Sort chronologically (oldest first)
                    months_with_years.sort(key=lambda x: (x[1], x[0]))

                    print(f"📅 Calculated months with years: {[(calendar.month_name[m], y) for m, y in months_with_years]}")

                    # For now, return months from the most recent year that has data
                    # You might need to enhance this based on your needs
                    latest_year_in_range = max(year for _, year in months_with_years)
                    found_months = [month for month, year in months_with_years if year == latest_year_in_range]
                    extracted_year = latest_year_in_range

                    # If the range spans multiple years, you might want to handle this differently
                    unique_years = set(year for _, year in months_with_years)
                    if len(unique_years) > 1:
                        print(f"⚠️ Query spans multiple years: {sorted(unique_years)}")
                        print(f"📅 Using most recent year: {latest_year_in_range}")
                        # Return the full multi-year data
                        return found_months, extracted_year, is_comparison, is_chart_request, months_with_years

                    is_comparison = True

                elif 'last month' in user_input_lower or 'past month' in user_input_lower:
                    last_month = current_month - 1
                    last_year = current_year
                    if last_month <= 0:
                        last_month += 12
                        last_year -= 1
                    found_months = [last_month]
                    extracted_year = last_year
                    months_with_years = [(last_month, last_year)]
                    print(f"📅 Last month: {calendar.month_name[last_month]} {last_year}")

            # Explicit month names
            if not found_months:
                for month_name, month_num in month_mapping.items():
                    if month_name in user_input_lower:
                        found_months.append(month_num)

            found_months = sorted(set(found_months))

            # 4-digit year in query overrides everything (but only for single-year queries)
            if not months_with_years:  # Only apply if we don't have multi-year data
                year_match = re.search(r'\b(20\d{2})\b', user_input)
                if year_match:
                    extracted_year = int(year_match.group(1))
                    print(f"📅 Year override from query: {extracted_year}")

            if not found_months:
                found_months = [current_month]
                print(f"📅 No specific months found, using database latest: {calendar.month_name[current_month]}")

            # If we don't have multi-year data, create it from single-year data
            if not months_with_years:
                months_with_years = [(month, extracted_year) for month in found_months]

            return found_months, extracted_year, is_comparison, is_chart_request, months_with_years
        

def extract_requested_sku(user_input):
            """
            Try to extract SKU from user input text (e.g., 'SKU123' or 'sku 12345')
            """
            sku_pattern = re.search(r'\bsku[:\-]?\s*(\w+)', user_input, re.IGNORECASE)
            return sku_pattern.group(1).strip().upper() if sku_pattern else None
            
        
# 🆕 Function to determine chart type based on user query
def determine_chart_type(matched_concepts):
    """
    Determine the most appropriate chart type based on NLP matched concepts
    """
    if isinstance(matched_concepts, list):
        concepts = [c.lower() for c in matched_concepts]
    elif isinstance(matched_concepts, str):
        concepts = matched_concepts.lower().split()
    else:
        concepts = []

    if any(keyword in concepts for keyword in ['pie', 'distribution', 'breakdown', 'share']):
        return 'pie'
    elif any(keyword in concepts for keyword in ['trend', 'line', 'over time', 'growth', 'change']):
        return 'line'
    elif any(keyword in concepts for keyword in ['bar', 'compare', 'comparison', 'top', 'vs']):
        return 'bar'
    elif any(keyword in concepts for keyword in ['scatter', 'correlation', 'relationship']):
        return 'scatter'
    else:
        return 'bar'  # Default fallback


def generate_chart_image(all_month_data, user_input, currency_info, chart_type, sku=None):
            
            try:
                print(f"🔍 DEBUG: all_month_data keys: {list(all_month_data.keys())}")
                
                if not all_month_data:
                    print("❌ No data available for chart generation")
                    return None

                data_keys = list(all_month_data.keys())

                # Sort keys chronologically if multi-month
                sorted_keys = sorted(data_keys, key=lambda x: (int(x.split('_')[1]), int(x.split('_')[0])) if '_' in x else (2025, int(x)))
                
                plt.style.use('seaborn-v0_8')
                fig, ax = plt.subplots(figsize=(10, 8))

                # If SKU is provided, handle SKU-specific charts
                if sku:
                    sku = sku.strip().lower()
                    multi_month = len(all_month_data) > 1

                    if multi_month:
                        # SKU trend over multiple months
                        month_names = []
                        sales_data = []
                        profit_data = []
                        quantity_data = []

                        for key in sorted_keys:
                            month_info = all_month_data[key]
                            if month_info.get('is_missing', False):
                                continue

                            month_names.append(f"{month_info['month_name']} {month_info['year']}")
                            month_data = month_info.get('data', [])

                            total_sales = 0
                            total_profit = 0
                            total_quantity = 0

                            for row in month_data:
                                row_sku = str(row.get('sku', '')).strip().lower()
                                if row_sku != sku:
                                    continue

                                # Parse sales
                                try:
                                    sales_str = str(row.get('net_sales', '0')).replace(currency_info['symbol'], '').replace(',', '').strip()
                                    if sales_str and sales_str not in ['', 'N/A', 'None']:
                                        total_sales += float(sales_str)
                                except:
                                    pass

                                # Parse profit
                                try:
                                    profit_str = str(row.get('profit', '0')).replace(currency_info['symbol'], '').replace(',', '').strip()
                                    if profit_str and profit_str not in ['', 'N/A', 'None']:
                                        total_profit += float(profit_str)
                                except:
                                    pass

                                # Parse quantity
                                try:
                                    qty = row.get('quantity', 0)
                                    if qty and str(qty) not in ['', 'N/A', 'None']:
                                        total_quantity += int(float(str(qty)))
                                except:
                                    pass

                            sales_data.append(round(total_sales, 2))
                            profit_data.append(round(total_profit, 2))
                            quantity_data.append(total_quantity)

                        if not sales_data or all(v == 0 for v in sales_data):
                            print(f"❌ No data found for SKU '{sku}'")
                            return None

                        # Plot SKU trend
                        ax.plot(month_names, sales_data, marker='o', linewidth=3, label=f'Net Sales ({currency_info["symbol"]})', color='#3b82f6')
                        ax.plot(month_names, profit_data, marker='s', linewidth=3, label=f'Profit ({currency_info["symbol"]})', color='#10b981')

                        ax2 = ax.twinx()
                        ax2.plot(month_names, quantity_data, marker='^', linewidth=3, label='Quantity Sold', color='#f59e0b')
                        ax2.set_ylabel('Quantity', fontsize=12)
                        ax2.legend(loc='upper right')

                        ax.set_title(f"Performance of SKU '{sku}' Over Time\n({currency_info['name']})", fontsize=16, fontweight='bold')
                        ax.set_xlabel('Month', fontsize=12)
                        ax.set_ylabel(f'Amount ({currency_info["symbol"]})', fontsize=12)
                        ax.legend(loc='upper left')
                        ax.grid(True, alpha=0.3)
                        plt.xticks(rotation=45)

                    else:
                        # Single month SKU bar chart
                        single_key = sorted_keys[0]
                        month_info = all_month_data[single_key]
                        if month_info.get('is_missing', False):
                            print(f"❌ No data for month '{single_key}'")
                            return None

                        month_data = month_info.get('data', [])
                        total_sales = 0
                        total_profit = 0
                        total_quantity = 0

                        for row in month_data:
                            row_sku = str(row.get('sku', '')).strip().lower()
                            if row_sku != sku:
                                continue

                            try:
                                sales_str = str(row.get('net_sales', '0')).replace(currency_info['symbol'], '').replace(',', '').strip()
                                if sales_str and sales_str not in ['', 'N/A', 'None']:
                                    total_sales += float(sales_str)
                            except:
                                pass

                            try:
                                profit_str = str(row.get('profit', '0')).replace(currency_info['symbol'], '').replace(',', '').strip()
                                if profit_str and profit_str not in ['', 'N/A', 'None']:
                                    total_profit += float(profit_str)
                            except:
                                pass

                            try:
                                qty = row.get('quantity', 0)
                                if qty and str(qty) not in ['', 'N/A', 'None']:
                                    total_quantity += int(float(str(qty)))
                            except:
                                pass

                        if total_sales == 0 and total_profit == 0 and total_quantity == 0:
                            print(f"❌ No performance data found for SKU '{sku}' in month '{single_key}'")
                            return None

                        # Plot bar chart for single month SKU
                        metrics = ['Net Sales', 'Profit', 'Quantity Sold']
                        values = [total_sales, total_profit, total_quantity]
                        colors = ['#3b82f6', '#10b981', '#f59e0b']

                        bars = ax.bar(metrics, values, color=colors, alpha=0.8)

                        ax.set_title(f"Performance of SKU '{sku}' for {month_info['month_name']} {month_info['year']}\n({currency_info['name']})", fontsize=14, fontweight='bold')
                        ax.set_ylabel(f"Amount / Quantity ({currency_info['symbol']})", fontsize=12)

                        for bar, val in zip(bars, values):
                            height = bar.get_height()
                            if height > 0:
                                label = f"{val:,.2f}" if isinstance(val, float) else f"{val}"
                                ax.text(bar.get_x() + bar.get_width()/2, height + height*0.01, label, ha='center', va='bottom', fontsize=10)

                        plt.tight_layout()

                else:
                    # For multi-month data (trend analysis)
                    if len(all_month_data) > 1:
                        # Sort keys to maintain chronological order
                        sorted_keys = sorted(data_keys, key=lambda x: (int(x.split('_')[1]), int(x.split('_')[0])) if '_' in x else (2025, int(x)))
                        
                        months = []
                        month_names = []
                        sales_data = []
                        profit_data = []
                        quantity_data = []

                        for key in sorted_keys:
                            month_info = all_month_data[key]
                            month_data = month_info['data']
                            
                            # Skip if missing data
                            if month_info.get('is_missing', False):
                                continue
                            
                            months.append(key)
                            month_names.append(f"{month_info['month_name']} {month_info['year']}")

                            # Calculate totals for the month - FIXED to handle TOTAL row properly
                            total_sales = 0
                            total_profit = 0
                            total_quantity = 0
                            
                            for row in month_data:
                                sku_val = str(row.get('sku', '')).strip().lower()
                                # Skip total rows more robustly
                                if sku_val in ['total', 'grand total', 'overall total'] or 'total' in sku_val:
                                    continue
                                
                                # Parse sales
                                try:
                                    sales_str = str(row.get('net_sales', '0')).replace(currency_info['symbol'], '').replace(',', '').strip()
                                    if sales_str and sales_str not in ['', 'N/A', 'None']:
                                        total_sales += float(sales_str)
                                except (ValueError, TypeError):
                                    pass
                                
                                # Parse profit
                                try:
                                    profit_str = str(row.get('profit', '0')).replace(currency_info['symbol'], '').replace(',', '').strip()
                                    if profit_str and profit_str not in ['', 'N/A', 'None']:
                                        total_profit += float(profit_str)
                                except (ValueError, TypeError):
                                    pass
                                
                                # Parse quantity
                                try:
                                    qty = row.get('quantity', 0)
                                    if qty and str(qty) not in ['', 'N/A', 'None']:
                                        total_quantity += int(float(str(qty)))
                                except (ValueError, TypeError):
                                    pass

                            sales_data.append(round(total_sales, 2))
                            profit_data.append(round(total_profit, 2))
                            quantity_data.append(total_quantity)

                        if not sales_data:
                            print("❌ No valid data found for multi-month chart")
                            return None

                        if chart_type == 'line':
                            ax.plot(month_names, sales_data, marker='o', linewidth=3, label=f'Net Sales ({currency_info["symbol"]})', color='#3b82f6')
                            ax.plot(month_names, profit_data, marker='s', linewidth=3, label=f'Profit ({currency_info["symbol"]})', color='#10b981')

                            # Create secondary y-axis for quantity
                            ax2 = ax.twinx()
                            ax2.plot(month_names, quantity_data, marker='^', linewidth=3, label='Quantity Sold', color='#f59e0b')
                            ax2.set_ylabel('Quantity', fontsize=12)
                            ax2.legend(loc='upper right')

                            ax.set_title(f'Monthly Trend Analysis - {currency_info["name"]}', fontsize=16, fontweight='bold')
                            ax.set_xlabel('Month', fontsize=12)
                            ax.set_ylabel(f'Amount ({currency_info["symbol"]})', fontsize=12)
                            ax.legend(loc='upper left')
                            ax.grid(True, alpha=0.3)
                            plt.xticks(rotation=45)

                        else:  # bar chart for multi-month
                            x = np.arange(len(month_names))
                            width = 0.35

                            bars1 = ax.bar(x - width/2, sales_data, width, label=f'Net Sales ({currency_info["symbol"]})', color='#3b82f6', alpha=0.8)
                            bars2 = ax.bar(x + width/2, profit_data, width, label=f'Profit ({currency_info["symbol"]})', color='#10b981', alpha=0.8)

                            ax.set_title(f'Monthly Comparison - {currency_info["name"]}', fontsize=16, fontweight='bold')
                            ax.set_xlabel('Month', fontsize=12)
                            ax.set_ylabel(f'Amount ({currency_info["symbol"]})', fontsize=12)
                            ax.set_xticks(x)
                            ax.set_xticklabels(month_names, rotation=45)
                            ax.legend()
                            ax.grid(True, alpha=0.3)

                            # Add value labels on bars
                            for bar in bars1 + bars2:
                                height = bar.get_height()
                                if height > 0:
                                    ax.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                                            f'{height:,.0f}', ha='center', va='bottom', fontsize=9)

                    # For single month data
                    else:
                        single_key = data_keys[0]
                        month_info = all_month_data[single_key]
                        month_data = month_info['data']
                        month_name = f"{month_info['month_name']} {month_info['year']}"

                        if month_info.get('is_missing', False) or not month_data:
                            print("❌ No data available for the selected month")
                            return None

                        if chart_type == 'pie':
                            sku_profit = {}
                            
                            for row in month_data:
                                sku_val = str(row.get('sku', 'Unknown')).strip()
                                
                                sku_lower = sku_val.lower()
                                if (sku_lower in ['total', 'grand total', 'overall total', 'sum', 'aggregate'] or 
                                    'total' in sku_lower or 
                                    sku_val == '' or 
                                    sku_val == 'Unknown'):
                                    print(f"⏭️  Skipping total/empty row: '{sku_val}'")
                                    continue
                                
                                try:
                                    profit_value = row.get('profit', '0')
                                    if profit_value is None or profit_value == '':
                                        continue
                                        
                                    profit_str = str(profit_value).replace(currency_info['symbol'], '').replace(',', '').strip()
                                    
                                    if profit_str and profit_str not in ['N/A', 'None', '0', '0.0', '0.00']:
                                        profit = float(profit_str)
                                        if profit > 0:
                                            sku_profit[sku_val] = sku_profit.get(sku_val, 0) + profit
                                            print(f"✅ Added SKU '{sku_val}': £{profit}")
                                except (ValueError, TypeError) as e:
                                    print(f"⚠️  Could not parse profit for SKU '{sku_val}': {row.get('profit')} - Error: {e}")
                                    continue

                            print(f"🎯 Total SKUs with positive profit: {len(sku_profit)}")
                            print(f"📊 SKU profits: {sku_profit}")

                            if not sku_profit:
                                print("❌ No valid profit data found for pie chart")
                                return None

                            top_skus = sorted(sku_profit.items(), key=lambda x: x[1], reverse=True)[:8]

                            if not top_skus:
                                print("❌ No SKUs found after filtering")
                                return None

                            labels = [sku for sku, _ in top_skus]
                            sizes = [profit for _, profit in top_skus]
                            colors = plt.cm.Set3(np.linspace(0, 1, len(labels)))

                            wedges, texts, autotexts = ax.pie(sizes, labels=labels, autopct='%1.1f%%', 
                                                            colors=colors, startangle=90, 
                                                            textprops={'fontsize': 10})
                            ax.set_title(f'Profit Mix by SKU - {month_name}\n({currency_info["name"]})', 
                                    fontsize=16, fontweight='bold', pad=20)

                            for autotext in autotexts:
                                autotext.set_color('white')
                                autotext.set_fontweight('bold')
                                autotext.set_fontsize(9)

                            legend_labels = [f'{sku}: {currency_info["symbol"]}{profit:,.2f}' for sku, profit in top_skus]
                            ax.legend(wedges, legend_labels, title="SKU Profits", loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))

                        else:  # bar chart for single month
                            sku_metrics = {}
                            
                            for row in month_data:
                                sku_val = str(row.get('sku', 'Unknown')).strip()
                                
                                sku_lower = sku_val.lower()
                                if (sku_lower in ['total', 'grand total', 'overall total'] or 
                                    'total' in sku_lower or 
                                    sku_val == '' or 
                                    sku_val == 'Unknown'):
                                    continue
                                
                                try:
                                    sales_str = str(row.get('net_sales', '0')).replace(currency_info['symbol'], '').replace(',', '').strip()
                                    sales = float(sales_str) if sales_str else 0
                                    
                                    profit_str = str(row.get('profit', '0')).replace(currency_info['symbol'], '').replace(',', '').strip()
                                    profit = float(profit_str) if profit_str else 0

                                    if sku_val not in sku_metrics:
                                        sku_metrics[sku_val] = {'sales': 0, 'profit': 0}

                                    sku_metrics[sku_val]['sales'] += sales
                                    sku_metrics[sku_val]['profit'] += profit
                                    
                                except (ValueError, TypeError) as e:
                                    print(f"⚠️  Could not parse data for SKU '{sku_val}': {e}")
                                    continue

                            if not sku_metrics:
                                print("❌ No valid SKU data found for bar chart")
                                return None

                            top_skus = sorted(sku_metrics.items(), key=lambda x: x[1]['sales'], reverse=True)[:10]

                            if not top_skus:
                                print("❌ No SKUs found after filtering for bar chart")
                                return None

                            skus = [sku for sku, _ in top_skus]
                            sales_values = [metrics['sales'] for _, metrics in top_skus]
                            profit_values = [metrics['profit'] for _, metrics in top_skus]

                            x = np.arange(len(skus))
                            width = 0.35

                            bars1 = ax.bar(x - width/2, sales_values, width, label=f'Net Sales ({currency_info["symbol"]})', color='#3b82f6', alpha=0.8)
                            bars2 = ax.bar(x + width/2, profit_values, width, label=f'Profit ({currency_info["symbol"]})', color='#10b981', alpha=0.8)

                            ax.set_title(f'Top SKUs Performance - {month_name}\n({currency_info["name"]})', fontsize=16, fontweight='bold')
                            ax.set_xlabel('SKU', fontsize=12)
                            ax.set_ylabel(f'Amount ({currency_info["symbol"]})', fontsize=12)
                            ax.set_xticks(x)
                            ax.set_xticklabels(skus, rotation=45, ha='right')
                            ax.legend()
                            ax.grid(True, alpha=0.3)

                            for bar in bars1 + bars2:
                                height = bar.get_height()
                                if height > 0:
                                    ax.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                                            f'{height:,.0f}', ha='center', va='bottom', fontsize=8)

                    plt.tight_layout()

                # Convert plot to base64 string
                buffer = io.BytesIO()
                plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight', facecolor='white')
                buffer.seek(0)
                image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                plt.close(fig)

                print("✅ Chart generated successfully")
                return image_base64

            except Exception as e:
                print(f"❌ Error generating chart: {e}")
                import traceback
                traceback.print_exc()
                return None

# 🆕 Simple function to create empty month data when table doesn't exist
def create_empty_month_data(month, year, country, user_id):
            """
            Create empty data structure for missing months - just returns empty list
            """
            return {
                'month_name': calendar.month_name[month],
                'year': year,
                'data': [],  # Empty data list - OpenAI will treat as 0
                'table_name': f"skuwisemonthly_{user_id}_{country}_{calendar.month_name[month].lower()}{year}",
                'is_missing': True  # Flag to indicate missing data
            }
