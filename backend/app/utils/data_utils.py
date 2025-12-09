from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import Config
SECRET_KEY = Config.SECRET_KEY
UPLOAD_FOLDER = Config.UPLOAD_FOLDER
import os
import pandas as pd
import numpy as np 
from app.models.user_models import User
from flask_mail import Message
from flask import current_app
from app import mail

from dotenv import load_dotenv

import warnings
warnings.filterwarnings("ignore") 


load_dotenv()
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/phormula')


MONTHS_REVERSE_MAP = {
    1: "january", 2: "february", 3: "march", 4: "april", 5: "may", 6: "june",
    7: "july", 8: "august", 9: "september", 10: "october", 11: "november", 12: "december"
}


MONTHS_MAP = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12
}


def create_user_session(db_url):
    user_engine = create_engine(db_url)
    UserSession = sessionmaker(bind=user_engine)
    return UserSession()




def generate_pnl_report(year: int, month: str) -> dict:
    """
    Generate a simple P&L (profit and Loss) report for a given month and year.

    Parameters:
        year (int): The year for the report.
        month (str): The month for the report.

    Returns:
        dict: A dictionary containing sales, expenses, FBA fees, and calculated profit.
    """
    
    # Placeholder data - replace this with actual database queries in a real scenario
    sales_data = {
        'sales': 10000,
        'expenses': 5000,
        'fba_fees': 1000,
    }
    
    # Calculate profit
    profit = sales_data['sales'] - sales_data['expenses'] - sales_data['fba_fees']
    
    return {
        'year': year,
        'month': month,
        'sales': sales_data['sales'],
        'expenses': sales_data['expenses'],
        'fba_fees': sales_data['fba_fees'],
        'profit': profit,
    }


def send_forecast_email(user_id, file_name, month, year):
    try:
        # Get the user's email from the database using the user_id
        user = User.query.filter_by(id=user_id).first()
        if not user:
            raise ValueError(f"No user found with ID {user_id}")

        user_email = user.email

        # Create the message
        msg = Message(
            'Your Forecast Report',
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user_email]
        )
        
        msg.body = f"""
        Dear {user.email},

        Please find attached the forecast report for {month} {year} that you requested.

        Best regards,
        The Phormula Team
        """

        # File path of the forecast to be attached
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file_name)

        # Attach the file
        with open(file_path, 'rb') as f:
            msg.attach(file_name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', f.read())

        # Send the email
        mail.send(msg)
        print(f"Forecast email sent to user {user_email}")

    except Exception as e:
        print(f"Failed to send forecast email: {e}")
        raise e  # Propagate the exception to be handled in the route


def send_pnlforecast_email(user_id, file_name, month, year):
    try:
        # Get the user's email from the database using the user_id
        user = User.query.filter_by(id=user_id).first()
        if not user:
            raise ValueError(f"No user found with ID {user_id}")

        user_email = user.email

        # Create the message
        msg = Message(
            'Your Forecast Report',
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user_email]
        )
        
        msg.body = f"""
        Dear {user.email},

        Please find attached the PNL forecast report for next 3 months of {month} {year} that you requested.

        Best regards,
        The Phormula Team
        """

        # File path of the forecast to be attached
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file_name)

        # Attach the file
        with open(file_path, 'rb') as f:
            msg.attach(file_name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', f.read())

        # Send the email
        mail.send(msg)
        print(f"Forecast email sent to user {user_email}")

    except Exception as e:
        print(f"Failed to send forecast email: {e}")
        raise e  # Propagate the exception to be handled in the route




def get_previous_month_year(month, year):
    """Calculate the previous month and year."""

    print(f" Previous_Month1: {month}, Previous Year: {year}")
    year = int(year)
    prev_month_num = MONTHS_MAP[month] - 1
    if prev_month_num == 0:
        prev_month_num = 12
        year -= 1
    prev_month = MONTHS_REVERSE_MAP[prev_month_num]

    print(f"Previous Month: {prev_month}, Previous Year: {year}")
   

    return prev_month, year
















# def forecast_next_two_months_with_append(sku_id, data):  
#     try:
#         from pmdarima import auto_arima
#         import pandas as pd
#         import numpy as np

#         sku_data = data[data['sku'] == sku_id].copy()
#         if sku_data.empty:
#             print(f"No data found for SKU: {sku_id}")
#             return None

#         sku_name = sku_data['sku'].iloc[0]
#         sku_data = sku_data.drop(columns=['sku'])
#         sku_data.index = pd.to_datetime(sku_data.index)
#         sku_data = sku_data.resample('D').sum()
#         sku_data['quantity'] = sku_data['quantity'].interpolate(method='linear').fillna(0)

#         print(f"Fitting ARIMA model for SKU: {sku_name}")
#         auto_model = auto_arima(
#             sku_data['quantity'], 
#             seasonal=True, 
#             trace=False,
#             suppress_warnings=True, 
#             stepwise=True
#         )
#         model = auto_model.fit(sku_data['quantity'])

#         forecast_steps = 90  
#         full_forecast = []
#         current_data = sku_data['quantity'].copy()

#         for step in range(forecast_steps):
#             forecast, conf_int = model.predict(n_periods=1, return_conf_int=True, alpha=0.5)

#             next_forecast = max(forecast[0], 0)
#             lower = max(conf_int[0][0], 0)
#             upper = max(conf_int[0][1], 0)

#             forecast_date = current_data.index[-1] + pd.Timedelta(days=1)
#             current_data.loc[forecast_date] = next_forecast
#             full_forecast.append((forecast_date, next_forecast, lower, upper))

#             model = auto_arima(
#                 current_data,
#                 seasonal=True,
#                 trace=False,
#                 error_action='ignore',
#                 suppress_warnings=True,
#                 stepwise=True
#             ).fit(current_data)

#         # Build forecast DataFrame
#         forecast_df = pd.DataFrame(full_forecast, columns=['Date', 'Forecast', 'Lower95', 'Upper95'])
#         forecast_df = forecast_df.set_index('Date')

#         # Monthly summary
#         monthly_summary = forecast_df.resample('M').agg({
#             'Forecast': 'sum',
#             'Lower95': 'sum',
#             'Upper95': 'sum'
#         }).iloc[:3].reset_index()

#         # Rename index for clarity
#         monthly_summary.rename(columns={'Date': 'Month'}, inplace=True)

#         # Add SKU column
#         monthly_summary['sku'] = sku_id

#         print(f"\nMonthly Forecast for SKU {sku_name} (Next 3 Months):")
#         print(monthly_summary)

#         return sku_id, monthly_summary

#     except Exception as e:
#         print(f"Error occurred for SKU {sku_id}: {e}")
#         return None
