from flask import request, jsonify, send_file, Blueprint
import os
import psycopg2
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import io
import base64
import jwt
from config import Config
SECRET_KEY = Config.SECRET_KEY

db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/phormula')

pie_chart_bp = Blueprint('pie_chart_bp', __name__)

# Define quarters
QUARTER_MONTHS = {
    "quarter1": ["january", "february", "march"],
    "quarter2": ["april", "may", "june"],
    "quarter3": ["july", "august", "september"],
    "quarter4": ["october", "november", "december"]
}

# Quarter mapping for Q1, Q2, Q3, Q4 format
QUARTER_MAPPING = {
    "Q1": "quarter1",
    "Q2": "quarter2", 
    "Q3": "quarter3",
    "Q4": "quarter4"
}

def get_quarter_from_month(month):
    """Get quarter name from month"""
    if not month:
        return None
    
    month_lower = month.lower().strip()
    for quarter, months in QUARTER_MONTHS.items():
        if month_lower in months:
            return quarter
    return None


def get_quarter_from_quarter_param(quarter_param):
    """Convert Q1, Q2, Q3, Q4 to quarter1, quarter2, quarter3, quarter4"""
    if not quarter_param:
        return None
    
    quarter_upper = quarter_param.upper().strip()
    return QUARTER_MAPPING.get(quarter_upper)


def is_quarter_format(param):
    """Check if parameter is in Q1, Q2, Q3, Q4 format"""
    if not param:
        return False
    return param.upper().strip() in QUARTER_MAPPING


def get_db_connection():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


def generate_table_names(user_id, country, month=None, year=None, quarter=None, range_type=None):
    """Generate all possible table names based on the parameters"""
    tables = []
    
    # Handle quarterly range specifically
    if range_type == 'quarterly':
        if quarter and year:
            quarter_name = get_quarter_from_quarter_param(quarter)
            if quarter_name:
                quarterly_table = f"{quarter_name}_{user_id}_{country.lower()}_{year}_table"
                tables.append(quarterly_table)
                return tables
        elif month:
            # Check if month is actually a quarter (Q1, Q2, etc.)
            if is_quarter_format(month):
                quarter_name = get_quarter_from_quarter_param(month)
                if quarter_name and year:
                    quarterly_table = f"{quarter_name}_{user_id}_{country.lower()}_{year}_table"
                    tables.append(quarterly_table)
                    return tables
            else:
                # Regular month, get its quarter
                quarter_name = get_quarter_from_month(month)
                if quarter_name and year:
                    quarterly_table = f"{quarter_name}_{user_id}_{country.lower()}_{year}_table"
                    tables.append(quarterly_table)
                    return tables
    
    # Handle when month is provided
    if month and year and not is_quarter_format(month):
        # Monthly table (country-specific)
        monthly_table = f"skuwisemonthly_{user_id}_{country.lower()}_{month.lower()}{year}"
        tables.append(monthly_table)
        
        # Monthly table (global)
        global_monthly_table = f"skuwisemonthly_{user_id}_global_{month.lower()}{year}_table"
        tables.append(global_monthly_table)
        
        # Quarterly table from month
        quarter_name = get_quarter_from_month(month)
        if quarter_name:
            quarterly_table = f"{quarter_name}_{user_id}_{country.lower()}_{year}_table"
            tables.append(quarterly_table)
    
    # Handle when quarter is provided directly (Q1, Q2, etc.)
    elif month and is_quarter_format(month) and year:
        quarter_name = get_quarter_from_quarter_param(month)
        if quarter_name:
            quarterly_table = f"{quarter_name}_{user_id}_{country.lower()}_{year}_table"
            tables.append(quarterly_table)
    
    # Handle when quarter parameter is provided directly
    elif quarter and year:
        quarter_name = get_quarter_from_quarter_param(quarter)
        if quarter_name:
            quarterly_table = f"{quarter_name}_{user_id}_{country.lower()}_{year}_table"
            tables.append(quarterly_table)
    
    # Yearly table
    if year:
        yearly_table = f"skuwiseyearly_{user_id}_{country.lower()}_{year}_table"
        tables.append(yearly_table)
    
    return tables


def get_table_name_by_type(user_id, country, table_type, month=None, year=None, quarter=None):
    """Get specific table name based on table type"""
    
    if table_type == 'monthly' and month and year and not is_quarter_format(month):
        # Return both country-specific and global monthly tables
        tables = []
        # Country-specific monthly table
        country_monthly = f"skuwisemonthly_{user_id}_{country.lower()}_{month.lower()}{year}"
        tables.append(country_monthly)
        
        # Global monthly table
        global_monthly = f"skuwisemonthly_{user_id}_global_{month.lower()}{year}_table"
        tables.append(global_monthly)
        
        return tables
    
    elif table_type == 'yearly' and year:
        return [f"skuwiseyearly_{user_id}_{country.lower()}_{year}_table"]
    
    elif table_type == 'quarterly':
        # Handle quarterly by quarter parameter (Q1, Q2, Q3, Q4)
        if quarter and year:
            quarter_name = get_quarter_from_quarter_param(quarter)
            if quarter_name:
                return [f"{quarter_name}_{user_id}_{country.lower()}_{year}_table"]
        
        # Handle quarterly by month parameter (could be Q1, Q2, etc. or actual month)
        elif month and year:
            if is_quarter_format(month):
                quarter_name = get_quarter_from_quarter_param(month)
            else:
                quarter_name = get_quarter_from_month(month)
            
            if quarter_name:
                return [f"{quarter_name}_{user_id}_{country.lower()}_{year}_table"]
        
        return None  # Invalid parameters for quarterly
    
    return None  # Invalid parameters

def check_table_exists(cursor, table_name):
    """Check if table exists in database"""
    try:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = %s
            );
        """, (table_name,))
        return cursor.fetchone()[0]
    except Exception as e:
        print(f"Error checking table existence: {e}")
        return False

def fetch_data_from_table(table_name):
    """Fetch product data from specified table"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Check if table exists
        if not check_table_exists(cursor, table_name):
            print(f"Table {table_name} does not exist")
            return None
        
        # Fetch data - adjust column names as per your actual table structure
        query = f"""
            SELECT product_name, profit 
            FROM {table_name} 
            WHERE profit IS NOT NULL 
            AND product_name IS NOT NULL
            AND LOWER(product_name) != 'total'
            AND profit > 0
            ORDER BY profit DESC
        """
        
        cursor.execute(query)
        data = cursor.fetchall()
        
        if data:
            df = pd.DataFrame(data, columns=['product_name', 'profit'])
            return df
        else:
            return None
            
    except Exception as e:
        print(f"Error fetching data from {table_name}: {e}")
        return None
    finally:
        if conn:
            conn.close()

def prepare_pie_chart_data(df):
    """Prepare data for pie chart - top 5 products + others"""
    if df is None or df.empty:
        return None, None
    
    # Sort by profit in descending order
    df_sorted = df.sort_values('profit', ascending=False)
    
    # Get top 5 products
    top_5 = df_sorted.head(5)
    
    # Calculate sum of remaining products
    remaining = df_sorted.iloc[5:]
    
    # Prepare data for pie chart
    labels = top_5['product_name'].tolist()
    values = top_5['profit'].tolist()
    
    # Add "Others" if there are more than 5 products
    if len(remaining) > 0:
        others_sum = remaining['profit'].sum()
        if others_sum > 0:  # Only add if sum is positive
            labels.append('Others')
            values.append(others_sum)
    
    return labels, values

def create_pie_chart(labels, values, title="Top 5 Products by Profit"):
    """Create pie chart and return as base64 image"""
    if not labels or not values:
        return None
    
    # Create figure and axis
    plt.figure(figsize=(12, 8))
    
    # Define colors
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    
    # Create pie chart
    wedges, texts, autotexts = plt.pie(
        values, 
        labels=labels, 
        autopct='%1.1f%%',
        startangle=90,
        colors=colors[:len(labels)],
        explode=[0.05] * len(labels)  # Slightly separate all slices
    )
    
    # Customize the chart
    plt.title(title, fontsize=16, fontweight='bold', pad=20)
    
    # Customize text
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')
        autotext.set_fontsize(10)
    
    for text in texts:
        text.set_fontsize(9)
    
    # Add legend with values
    legend_labels = [f'{label}: ${value:,.2f}' for label, value in zip(labels, values)]
    plt.legend(wedges, legend_labels, title="Products", loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
    
    plt.tight_layout()
    
    # Save to bytes
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
    img_buffer.seek(0)
    
    # Convert to base64
    img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
    
    plt.close()  # Close the figure to free memory
    
    return img_base64


@pie_chart_bp.route('/pie-chart', methods=['GET', 'POST'])
def generate_pie_chart():
    """
    Generate pie chart for product profit data
    
    Parameters:
    - country: Country name
    - month: Month name or Quarter (Q1, Q2, Q3, Q4) (optional)
    - year: Year (optional)
    - quarter: Quarter (Q1, Q2, Q3, Q4) (optional)
    - range: 'quarterly', 'monthly', 'yearly' (optional)
    - table_type: 'auto', 'monthly', 'yearly', 'quarterly' (optional, default: 'auto')
    - format: 'json' or 'image' (optional, default: 'json')
    """
    
    # Authentication check
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization token is missing or invalid'}), 401

    token = auth_header.split(' ')[1]
    try:
        # Decode the JWT token to check the user
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

    try:
        # Get parameters from request
        if request.method == 'POST':
            data = request.get_json()
            country = data.get('country')
            month = data.get('month')
            year = data.get('year')
            quarter = data.get('quarter')
            range_type = data.get('range')
            table_type = data.get('table_type', 'auto')
            response_format = data.get('format', 'json')
        else:
            country = request.args.get('country')
            month = request.args.get('month')
            year = request.args.get('year')
            quarter = request.args.get('quarter')
            range_type = request.args.get('range')
            table_type = request.args.get('table_type', 'auto')
            response_format = request.args.get('format', 'json')
        
        # Validate required parameters
        if not user_id or not country:
            return jsonify({
                'error': 'user_id and country are required parameters'
            }), 400
        
        # Convert year to string if provided
        if year:
            year = str(year)
        
        print(f"Generating pie chart for User: {user_id}, Country: {country}")
        print(f"Parameters - Month: {month}, Year: {year}, Quarter: {quarter}, Range: {range_type}")
        
        # Get data from database
        df = None
        used_table = None
        
        if table_type == 'auto':
            # Try to get data from available tables
            table_names = generate_table_names(user_id, country, month, year, quarter, range_type)
            
            for table_name in table_names:
                print(f"Trying table: {table_name}")
                df = fetch_data_from_table(table_name)
                if df is not None and not df.empty:
                    used_table = table_name
                    break
        else:
            # Use specific table type
            table_names = get_table_name_by_type(user_id, country, table_type, month, year, quarter)
            
            if not table_names:
                return jsonify({'error': 'Invalid parameters for specified table type'}), 400
            
            # Try each table in the list
            for table_name in table_names:
                print(f"Trying specific table: {table_name}")
                df = fetch_data_from_table(table_name)
                if df is not None and not df.empty:
                    used_table = table_name
                    break
        
        if df is None or df.empty:
            tables_checked = generate_table_names(user_id, country, month, year, quarter, range_type) if table_type == 'auto' else get_table_name_by_type(user_id, country, table_type, month, year, quarter)
            return jsonify({
                'error': 'No data found in any of the available tables',
                'tables_checked': tables_checked,
                'parameters': {
                    'user_id': user_id,
                    'country': country,
                    'month': month,
                    'year': year,
                    'quarter': quarter,
                    'range_type': range_type
                }
            }), 404
        
        # Prepare pie chart data
        labels, values = prepare_pie_chart_data(df)
        
        if not labels or not values:
            return jsonify({
                'error': 'No valid data available for pie chart'
            }), 404
        
        # Create title
        title_parts = ["Top 5 Products by Profit"]
        
        # Handle title based on what data we're showing
        if range_type == 'quarterly' or quarter:
            quarter_display = quarter if quarter else (month if is_quarter_format(month) else None)
            if quarter_display and year:
                title_parts.append(f"({quarter_display} {year})")
        elif month and not is_quarter_format(month):
            if year:
                title_parts.append(f"({month.title()} {year})")
            else:
                title_parts.append(f"({month.title()})")
        elif year:
            title_parts.append(f"({year})")
        
        # Add country or global indicator to title
        if 'global' in used_table.lower():
            title_parts.append("- Global")
        elif country:
            title_parts.append(f"- {country.title()}")
        
        title = " ".join(title_parts)
        
        # Generate chart
        chart_base64 = create_pie_chart(labels, values, title)
        
        if not chart_base64:
            return jsonify({'error': 'Failed to generate chart'}), 500
        
        # Prepare response data
        response_data = {
            'success': True,
            'data': {
                'labels': labels,
                'values': values,
                'total_products': len(df),
                'top_5_count': min(5, len(df)),
                'others_count': max(0, len(df) - 5),
                'total_profit': sum(values),
                'table_used': used_table,
                'title': title,
                'is_global_data': 'global' in used_table.lower() if used_table else False
            }
        }
        
        if response_format == 'image':
            response_data['data']['chart_image'] = f"data:image/png;base64,{chart_base64}"
        else:
            response_data['data']['chart_base64'] = chart_base64
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in generate_pie_chart: {str(e)}")
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@pie_chart_bp.route('/pie-chart/image', methods=['GET', 'POST'])
def get_pie_chart_image():
    """
    Generate and return pie chart as image file
    """
    try:
        # Get chart data
        response = generate_pie_chart()
        
        if response[1] != 200:  # If there's an error
            return response
        
        # Extract base64 image from response
        response_data = response[0].get_json()
        chart_base64 = response_data['data']['chart_base64']
        
        # Convert base64 to bytes
        img_data = base64.b64decode(chart_base64)
        img_buffer = io.BytesIO(img_data)
        img_buffer.seek(0)
        
        return send_file(
            img_buffer,
            mimetype='image/png',
            as_attachment=True,
            download_name='pie_chart.png'
        )
        
    except Exception as e:
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500