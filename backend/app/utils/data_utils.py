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

    year = int(year)
    prev_month_num = MONTHS_MAP[month] - 1
    if prev_month_num == 0:
        prev_month_num = 12
        year -= 1
    prev_month = MONTHS_REVERSE_MAP[prev_month_num]

    return prev_month, year


