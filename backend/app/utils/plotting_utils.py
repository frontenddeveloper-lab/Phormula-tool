from flask import  jsonify, request
from config import Config
SECRET_KEY = Config.SECRET_KEY
UPLOAD_FOLDER = Config.UPLOAD_FOLDER
from config import basedir
from sqlalchemy import create_engine, MetaData, Table, select , text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import jwt
import os
import io
import seaborn as sns
import mplcursors
import pandas as pd
import numpy as np 
import base64
from app import db
from app.models.user_models import User
from sqlalchemy import MetaData, Table
from flask import current_app
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from decimal import Decimal, ROUND_HALF_UP

load_dotenv()
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/phormula')

db_url1= os.getenv('DATABASE_ADMIN_URL')



 

def aggregate_upload_data(uploads):
    total_sales = sum(upload.total_sales or 0 for upload in uploads)
    cm2_profit = sum(upload.cm2_profit or 0 for upload in uploads)
    total_expense = sum(upload.total_expense or 0 for upload in uploads)
    total_amazon_fee = sum(upload.total_amazon_fee or 0 for upload in uploads)
    unit_sold = sum(upload.unit_sold or 0 for upload in uploads)
    total_cous = sum(upload.total_cous or 0 for upload in uploads)
    otherwplatform = sum(upload.otherwplatform or 0 for upload in uploads)
    taxncredit = sum(upload.taxncredit or 0 for upload in uploads)
    advertising_total = sum(upload.advertising_total or 0 for upload in uploads)

    return {
        'unit_sold': unit_sold,
        'total_sales': total_sales,
        'cm2_profit': cm2_profit,
        'total_expense': total_expense,
        'total_amazon_fee': total_amazon_fee,
        'total_cous': total_cous,
        'otherwplatform': otherwplatform,
        'taxncredit': taxncredit,
        'advertising_total': advertising_total
    }



def get_months_for_quarter(quarter):
    """Return the months for a given quarter with lowercase month names."""
    if quarter == 'Q1':
        return ['january', 'february', 'march']
    elif quarter == 'Q2':
        return ['april', 'may', 'june']
    elif quarter == 'Q3':
        return ['july', 'august', 'september']
    elif quarter == 'Q4':
        return ['october', 'november', 'december']
    else:
        return []



# def create_sales_pie_chart(df): 
#     # Rename columns for better readability
#     renamed_columns = {
#         "product_sales": "Product Sales",
#         "postage_credits": "Postage Credits",
#         "gift_wrap_credits": "Gift Wrap Credits",
#         "promotional_rebates": "Promotional Rebates",
#         "product_sales_tax": "Sales Tax Collected"
#     }
#     df = df.rename(columns=renamed_columns)

#     # ensure string columns used by .str accessors are strings
#     for col in ["description", "type", "bucket"]:
#         if col in df.columns:
#             df[col] = df[col].astype(str).fillna("")


#     # Convert total column to numeric
#     df["total"] = pd.to_numeric(df["total"].astype(str).str.replace(",", ""), errors="coerce")
#     df["other"] = pd.to_numeric(df["other"].astype(str).str.replace(",", ""), errors="coerce")
#     othervalue = df[
#         (df["sku"].notna()) & (df["sku"] != "") & (df["sku"] != "0")
#     ]["other"].sum()

#     print(f"other  (excluding blank, None, and '0' SKU): {othervalue}")

#     # Calculate Platform Fee
#     # platform_fee = (df[df["description"].str.startswith(
#     #     ("FBA Return Fee", "FBA Long-Term Storage Fee", "FBA storage fee", "Subscription"), na=False)]["total"].sum())
#     # print(f"Platform Fee: {platform_fee}")

#     platform_fee_desc_sum = abs(
#             df[df["description"].str.startswith(
#                 ("FBA Return Fee", "FBA Long-Term Storage Fee", "FBA storage fee", "Subscription"),
#                 na=False
#             )]["total"].sum()
#     )
#     platform_fee_col_sum = df["platform_fees"].sum() if "platform_fees" in df.columns else 0
#     platform_fee = platform_fee_desc_sum + platform_fee_col_sum

    

#     # Calculate sums for relevant columns
#     product_sales_sum = df['Product Sales'].sum()
#     promotional_rebates_sum = df['Promotional Rebates'].sum()

#     # Calculate Net Sales
#     total_sales = product_sales_sum + promotional_rebates_sum + othervalue

#     # Calculate ice2 (sum of total where type is Transfer)
#     # rembursement_fee = df[df["type"] == "Transfer"]["total"].sum()
#     # rembursement_fee = abs(rembursement_fee)
#     transfer_df = df[df["type"] == "Transfer"]
#     rembursement_fee_desc_sum = abs(transfer_df["total"].sum())
#     rembursement_fee_col_sum = df["net_reimbursement"].sum() if "net_reimbursement" in df.columns else 0
#     rembursement_fee = rembursement_fee_desc_sum + rembursement_fee_col_sum
                
#     print(f"Ice2: {rembursement_fee}")

#     reimbursement_vs_sales = rembursement_fee / total_sales
#     print(f"Reimbursement vs Sales: {reimbursement_vs_sales}")

#     total_sales_dic = {
#         'Net Sales': total_sales,
#         'Platform Fee': platform_fee, # Include Platform Fee
#         'Rembursement fee': rembursement_fee,  # Include Rembursement
        

        
#     }

#     print(total_sales_dic)

#     # Store the results in a dictionary
#     total_sales_dict = {
#         'Net Sales': total_sales,
#         # 'Ice2': ice2  # Include ice2 value
#     }

#     print(total_sales_dict)  # Debugging print

#     # Convert the dictionary to a pandas Series for plotting
#     sums = pd.Series(total_sales_dict)

#     # Generate a color palette
#     colors = sns.color_palette('pastel', n_colors=len(sums))

#     # Highlight the largest segment
#     explode = [0.1 if i == sums.idxmax() else 0 for i in sums.index]

#     # Create the pie chart
#     plt.switch_backend('Agg')
#     plt.figure(figsize=(8, 6))

#     wedges, texts, autotexts = plt.pie(
#         sums,
#         labels=sums.index,
#         autopct='%1.0f%%',
#         startangle=90,
#         colors=colors,
#         explode=explode,
#         pctdistance=0.85,
#         labeldistance=1.15,
#         textprops={'fontsize': 12},
#     )

#     # Adjust label styles
#     for i, text in enumerate(texts):
#         text.set_fontsize(12)
#         text.set_fontweight('normal')
#         text.set_rotation(i * 15 - 90)

#     for autotext in autotexts:
#         autotext.set_fontsize(10)
#         autotext.set_fontweight('normal')

#     # Add a legend
#     plt.legend(wedges, sums.index, loc="center left", bbox_to_anchor=(1, 0.5), fontsize=12)
#     plt.title('Sales Distribution', fontsize=16)
#     plt.tight_layout()

#     # Save the chart
#     img = io.BytesIO()
#     plt.savefig(img, format='png', bbox_inches='tight')
#     img.seek(0)
#     plt.close()

#     chart_img = base64.b64encode(img.getvalue()).decode()

#     return chart_img, platform_fee, rembursement_fee



# def create_expense_pie_chart(df, country, month, year, sku=None):
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

#     # Retrieve user
#     Session = sessionmaker(bind=db.engine)
#     session = Session()
#     user = session.get(User, user_id)
#     conn = db.engine.connect()

    
#     if user is None:
#         return jsonify({'error': 'User not found'}), 404

#     table_name = f"user_{user_id}_{country}_{month}{year}_data"

#     from sqlalchemy import text  # 🔥 This is necessary

#     try:
#         query = f'SELECT SUM("cost_of_unit_sold") FROM {table_name}'
#         result = conn.execute(text(query))  # Safe execution
#         row = result.fetchone()
        
#         if row and row[0] is not None:
#             total_cost = row[0]
#         else:
#             total_cost = 0  # Default to 0 if no data
            
#         print(f"Total Cost of Unit Sold: {total_cost}")
#     except Exception as e:
#         print(f"Error fetching cost_of_unit_sold: {str(e)}")
#         total_cost = 0

    
#     # Close the database conn
#     conn.close()

#     # Rest of the function remains the same
#     renamed_columns = {
#         "product_sales": "Product Sales",
#         "selling_fees": "Selling Fees",
#         "fba_fees": "FBA Fees",
#         "promotional_rebates": "Promotional Rebates",
#         "marketplace_facilitator_tax": "Marketplace Facilitator Tax",
#         "postage_credits": "Postage Credits",
#         "gift_wrap_credits": "Gift Wrap Credits",
#         "giftwrap_credits_tax": "Giftwrap Credits Tax",
#         "product_sales_tax": "Product Sales Tax",
#         "promotional_rebates_tax": "Promotional Rebates Tax",
#         "other_transaction_fees": "Other Transaction Fees",
#         "shipping_credits_tax": "Shipping Credits Tax",
#         "other": "Other"
#     }
#     df = df.rename(columns=renamed_columns)
    
#     for col in ["description", "type", "bucket"]:
#         if col in df.columns:
#             df[col] = df[col].astype(str).fillna("")

#     if 'type' in df.columns and 'Other' in df.columns:
#         df.loc[df['type'].str.lower() == 'transfer', 'Other'] = 0
    
#     df["total"] = pd.to_numeric(df["total"].astype(str).str.replace(",", ""), errors="coerce")
#     df["Other"] = pd.to_numeric(df["Other"].astype(str).str.replace(",", ""), errors="coerce")

#     # Calculate Platform Fee
#     platform_fee = abs(df[df["description"].str.startswith(
#         ("FBA Return Fee", "FBA Long-Term Storage Fee", "FBA storage fee", "Subscription"), na=False)]["total"].sum())
#     platform_fee = abs(platform_fee)
#     print(f"Platform Fee: {platform_fee}")

#     rembursement_fee = df[df["type"] == "Transfer"]["total"].sum()
#     print(f"Ice2: {rembursement_fee}")

#     # Columns to ensure numeric values
#     numeric_columns = [
#         "Product Sales", "Selling Fees", "FBA Fees", "Promotional Rebates", "quantity",
#         "Shipping Credits Tax", "Marketplace Facilitator Tax", 
#         "Product Sales Tax", "Postage Credits", "Gift Wrap Credits","Giftwrap Credits Tax", 
#         "Promotional Rebates Tax", "Other Transaction Fees", "Other", "cost_of_unit_sold"
#     ]
#     missing_columns = [col for col in numeric_columns if col not in df.columns]
#     if missing_columns:
#         raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")

#     for col in numeric_columns:
#         df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

#     # Ensure numeric values
#     df[numeric_columns] = df[numeric_columns].apply(pd.to_numeric, errors='coerce').fillna(0)

#     df["sku"] = df["sku"].astype(str).str.strip()  # Remove spaces if any

#     # Filter only valid SKU rows and sum the "Other Transaction Fees"
#     othertransectionfee = df[
#         (df["sku"].notna()) & (df["sku"] != "") & (df["sku"] != "0")
#     ]["Other Transaction Fees"].sum()

#     print(f"Other Transaction Fees (excluding blank, None, and '0' SKU): {othertransectionfee}")

#     othervalue = df[
#         (df["sku"].notna()) & (df["sku"] != "") & (df["sku"] != "0")
#     ]["Other"].sum()

#     print(f"Other  (excluding blank, None, and '0' SKU): {othervalue}")
    
#     # If SKU is provided, filter the DataFrame by SKU
#     # (1) Optional SKU filter — clean compare
#     if sku:
#         sku = str(sku).strip()
#         df = df[df["sku"].astype(str).str.strip() == sku]

#     # (2) Normalize + numeric
#     df["sku"] = df["sku"].astype(str).str.strip()
#     df["type_norm"] = df["type"].astype(str).str.strip().str.lower()
#     df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0)

#     # (3) Valid SKU rows (exclude blank/'0')
#     mask_valid_sku = df["sku"].ne("").astype(bool) & df["sku"].ne("0")

#     # (4) Only order/shipment rows (exact match, case-insensitive)
#     mask_type = df["type_norm"].isin(["order", "shipment"])

#     # (5) Final sum
#     unit_sold = df.loc[mask_valid_sku & mask_type, "quantity"].sum()


#     print(f"unit_sold: {unit_sold}")
        
#     product_sales_sum = df['Product Sales'].sum()
#     promotional_rebates_sum = df['Promotional Rebates'].sum()
#     total_sales = product_sales_sum + promotional_rebates_sum + othervalue
#     print(f"Total Sales: {total_sales}")

#     reimbursement_vs_sales = (rembursement_fee / total_sales) * 100 if total_sales != 0 else 0
#     reimbursement_vs_sales = abs(reimbursement_vs_sales)
#     print(f"Reimbursement vs Sales: {reimbursement_vs_sales}")

#     # Calculate Total Credits
#     postage_credits_sum = df['Postage Credits'].sum()
#     gift_wrap_credits_sum = df['Gift Wrap Credits'].sum()
#     total_credits = postage_credits_sum + gift_wrap_credits_sum
#     print(f"Total Credits: {total_credits}")

    
#     Product_Sales_Tax = round(df['Product Sales Tax'].sum(), 2)
#     Other_Transaction_Fees = round(df['Other Transaction Fees'].sum(), 2)
#     Promotional_Rebates_Tax = round(df['Promotional Rebates Tax'].sum(), 2)
#     Marketplace_Facilitator_Tax = df['Marketplace Facilitator Tax'].sum()
#     Shipping_Credits_Tax = df['Shipping Credits Tax'].sum()
#     Gift_Wrap_Credits_Tax = round(df['Giftwrap Credits Tax'].sum(), 2)
#     fba_fees = df['FBA Fees'].sum()
#     oether = round(df['Other'].sum(), 2)
#     refund_selling_fees = df[df['type'].str.lower() == 'refund']['Selling Fees'].sum()
#     print(f"Refund Selling Fees:\n{refund_selling_fees}")
#     calculated_selling_fees = df['Selling Fees'].sum() - 2 * (refund_selling_fees)
#     print(f"Calculated Selling Fees: {calculated_selling_fees}")
    
#     print(f"Product_Sales_Tax Tax: {Product_Sales_Tax}")
#     print(f"Promotional_Rebates_Tax Tax: {Promotional_Rebates_Tax}")
#     print(f"Marketplace_Facilitator_Tax Tax: {Marketplace_Facilitator_Tax}")
#     print(f"Shipping_Credits_Tax Tax: {Shipping_Credits_Tax}")
#     print(f"Other_Transaction_Fees Tax: {Other_Transaction_Fees}")
#     print(f"fba: {fba_fees}")
#     print(f"other: {oether}")
#     print(f"Gift_Wrap_Credits_Tax Tax: {Gift_Wrap_Credits_Tax}")
#     Total_Tax = round(Product_Sales_Tax + Promotional_Rebates_Tax + Marketplace_Facilitator_Tax + Shipping_Credits_Tax + Gift_Wrap_Credits_Tax + othertransectionfee, 2)
#     print(f"Total Tax: {Total_Tax}")
    
#     # Ensure numeric conversion
#     df["total"] = pd.to_numeric(df["total"], errors="coerce")
#     df.fillna(0, inplace=True)
    
#     # Handle advertising costs
#     # Handle advertising costs (updated logic)
#     if 'description' in df.columns and 'total' in df.columns:
#         ad_keywords = ['Cost of Advertising', 'Coupon Redemption Fee', 'Deals', 'Lightning Deal']

#         # Sum based on description keywords
#         advertising_total_desc_sum = abs(
#             df[df['description'].str.contains('|'.join(ad_keywords), na=False, case=False)]['total'].sum()
#         )

#         # Sum the advertising_cost column if it exists
#         advertising_cost_col_sum = df["advertising_cost"].sum() if "advertising_cost" in df.columns else 0

#         # Final advertising total
#         advertising_total = abs(advertising_total_desc_sum + advertising_cost_col_sum)
#     else:
#         advertising_total = 0

#     df['Advertising Total'] = advertising_total

        
#     # df['Advertising Total'] = advertising_total  

#     total_profit = (float(total_sales)
#     + float(total_credits)
#     + float(Total_Tax)
#     + float(fba_fees)
#     - float(calculated_selling_fees)
#     - float(total_cost))
#     df['profit'] = total_profit
#     print(f"Total profit2: {total_profit}")

    
#     cm2_profit = total_profit - (advertising_total + platform_fee) if (advertising_total + platform_fee) != 0 else 0
#     print(f"CM2 profit: {cm2_profit}")

#     cm2_margins = (cm2_profit / total_sales) * 100 if total_sales != 0 else 0
#     print(f"CM2 Margins: {cm2_margins}")

#     acos = (advertising_total / total_sales) * 100 if total_sales != 0 else 0
#     print(f"acos: {acos}")

#     rembursment_vs_cm2_margins = (rembursement_fee / cm2_profit) * 100 if cm2_profit != 0 else 0
#     rembursment_vs_cm2_margins = abs(rembursment_vs_cm2_margins)
#     print(f"Rembursment vs CM2 Margins: {rembursment_vs_cm2_margins}")

#     # Summarize profit and Expenses
#     sums = pd.Series({
#         'profit': total_profit,
#         'Promotional Rebates': df['Promotional Rebates'].sum(),
#         'Selling Fees': calculated_selling_fees,
#         'FBA Fees': df['FBA Fees'].sum(),
#         'Marketplace Facilitator Tax': df['Marketplace Facilitator Tax'].sum(),
#         'Cost of Advertising': advertising_total,
#     })

#     sums = sums.abs()  # Include only positive sums
#     print(sums) 
    
#     sumery = pd.Series({
#         'Selling Fees': abs(calculated_selling_fees),
#         'FBA Fees': df['FBA Fees'].abs().sum(),
#         'Other Transaction Fees': df['Other Transaction Fees'].abs().sum(),
#     })
#     sumery = sumery.abs()  # Include only positive sums
#     print(sumery) 
#     print(f"gt Tax: {advertising_total}")
    
#     # total_expense = total_sales-cm2_profit 
#     total_expense = abs(float(total_credits)) + float(Total_Tax) + abs(float(fba_fees)) + abs(float(calculated_selling_fees)) + abs(float(total_cost)) + abs((float(advertising_total)) + abs(float(platform_fee)))
#     total_expense = abs(float(total_expense))
#     print(f"total expense: {total_expense}")
#     total_fba_fees = abs(df['FBA Fees'].sum())
#     otherwplatform = platform_fee
#     print(f"Otherwplatform: {otherwplatform}")
#     print(f"fba: {fba_fees}")
#     print(f"sellingfee: {calculated_selling_fees}")
#     print(f"total_cost: {total_cost}")
#     print(f"pf: {platform_fee}")

#     taxncredit = (Total_Tax) + abs(total_credits)

#     print(f"Tax and Credit->taxncredit: {taxncredit}")
#     print(f"total_credits: {abs(total_credits)}")
#     print(f"Total_Tax: {abs(Total_Tax)}")
#     print(f"platform_fee: {abs(platform_fee)}")

#     colors = ['#07b190', '#5d9ac7', '#f58a0c', '#30bfcd', '#00617a', '#febd26']
#     plt.switch_backend('Agg')
#     plt.figure(figsize=(6, 3.7))
#     plt.rcParams["font.family"] = "Arial, sans-serif"  
#     plt.rcParams["font.size"] = 12  
#     sums = sums.abs()  

#     wedges, texts, autotexts = plt.pie(
#         sums,
#         labels=None, 
#         autopct='%1.1f%%',
#         startangle=90,
#         colors=colors,
#         pctdistance=0.75,  # Place percentage labels inside
#         labeldistance=1.1,  # Move labels outside
#     )

#     # Adjust font and rotation for legend
#     for text in texts:
#         text.set_fontsize(12)
#         text.set_fontweight('normal')
#         text.set_color('red')
#     for autotext in autotexts:
#         autotext.set_fontsize(10)

#     # Add hover effect using mplcursors
#     def update_annotation(sel):
#         label = sums.index[sel.index]
#         value = sums[sel.index]
#         percentage = (value / sums.sum()) * 100
#         sel.annotation.set_text(f'{label}: {value:,.2f} ({percentage:.1f}%)')

#     mplcursors.cursor(wedges, hover=True).connect("add", update_annotation)

#     # Add legend with font, position to the right, aligned left, with padding
#     plt.legend(
#         wedges,
#         sums.index,
#         loc="center left",
#         bbox_to_anchor=(0.9, 0.5),     
#         fontsize=9.5,
#         frameon=False,
#         handleheight=1,
#         labelspacing=0.9,
#         markerscale=1,  # Adjust the size of the circle in the legend
#         handlelength=1,  # Length of the legend marker (circle)
#         markerfirst=True,  # Put marker before the text in the legend    
#     )

#     plt.tight_layout()

#     # Save the chart to an image buffer
#     img = io.BytesIO()
#     plt.savefig(img, format='png', bbox_inches='tight')
#     img.seek(0)
#     plt.close()

#     chart_img = base64.b64encode(img.getvalue()).decode()

#     # Return all the requested values
#     return chart_img, total_fba_fees, cm2_margins, acos, rembursment_vs_cm2_margins, advertising_total, reimbursement_vs_sales, unit_sold, total_sales, otherwplatform, taxncredit


# def get_referral_fees(user_id, country, sku_list):
#     try:
#         # Sanitize and prepare
#         country = country.lower().replace(" ", "_")
#         table_name = f'user_{user_id}_{country}_table'
        
#         # Set up engine and metadata
#         user_engine = create_engine(db_url)  
#         metadata = MetaData()
#         table = Table(table_name, metadata, autoload_with=user_engine)

#         # Build and execute query
#         with user_engine.connect() as conn:
#             stmt = select(table).where(table.c.sku.in_(sku_list))
#             results = conn.execute(stmt).mappings().all()

#         # Build referral fee dictionary
#         referral_fees = {row['sku']: row['referral_fee'] for row in results}
#         return referral_fees

#     except SQLAlchemyError as e:
#         print(f"Database error: {str(e)}")
#         return {}
#     except Exception as e:
#         print(f"Unexpected error: {str(e)}")
#         return {}


# # import pandas as pd

# def apply_modifications(df, country):
#     print("Applying modifications...")
#     try:
#         # NaN ko 0 se fill kar rahe ho – dhyan rahe ga strings pe bhi effect padega
#         df = df.fillna(0)
#         if 'selling_fees' in df.columns:
#             df['selling_fees'] = df['selling_fees'].abs()

#         # Ensure all expected columns exist
#         column_dtypes = {
#             'product_sales_tax': float,
#             'promotional_rebates_tax': float,
#             'difference': float,
#             'errorstatus': str,
#             'fbaerrorstatus': str,
#             'answer': float,
#             'fbaanswer': float,
#             'gift_wrap_credits': float,
#             'shipping_credits': float,   # Added for US
#             'postage_credits': float,   # Added for UK
#         }

#         for col, dtype in column_dtypes.items():
#             if col not in df.columns:
#                 df[col] = 0
#             df[col] = df[col].astype(dtype)

#         # Agar referral_fee column missing ho to abhi ke liye 0 se add kar do
#         if 'referral_fee' not in df.columns:
#             df['referral_fee'] = 0.0

#         for index, row in df.iterrows():
#             sku = row.get('sku', '')

#             # ✅ referral_fee ab DataFrame ke column se aa raha hai, dict se nahi
#             try:
#                 referral_fee = float(row.get('referral_fee', 0) or 0)
#             except (TypeError, ValueError):
#                 referral_fee = 0.0

#             # Shared fields
#             try:
#                 product_sales = float(row.get('product_sales', 0) or 0)
#             except (TypeError, ValueError):
#                 product_sales = 0.0

#             try:
#                 quantity = float(row.get('quantity', 0) or 0)
#             except (TypeError, ValueError):
#                 quantity = 0.0

#             if quantity in [None, 0]:
#                 quantity = 1  # zero quantity se divide by zero ho jayega, isliye 1

#             try:
#                 fba_fees = float(row.get('fba_fees', 0) or 0)
#             except (TypeError, ValueError):
#                 fba_fees = 0.0

#             try:
#                 selling_fees = float(row.get('selling_fees', 0) or 0)
#             except (TypeError, ValueError):
#                 selling_fees = 0.0

#             # ✅ Country-wise additions/deductions
#             if country.lower() == 'uk':
#                 product_sales_tax      = float(row.get('product_sales_tax', 0) or 0)
#                 postage_credits        = float(row.get('postage_credits', 0) or 0)
#                 promotional_rebates    = float(row.get('promotional_rebates', 0) or 0)
#                 promotional_rebates_tax = float(row.get('promotional_rebates_tax', 0) or 0)

#                 additions  = product_sales + product_sales_tax + postage_credits
#                 deductions = promotional_rebates + promotional_rebates_tax

#             elif country.lower() == 'us':
#                 gift_wrap_credits   = float(row.get('gift_wrap_credits', 0) or 0)
#                 shipping_credits    = float(row.get('shipping_credits', 0) or 0)
#                 promotional_rebates = float(row.get('promotional_rebates', 0) or 0)

#                 additions  = product_sales + gift_wrap_credits + shipping_credits
#                 deductions = promotional_rebates

#             else:
#                 # Default to only product_sales if country unknown
#                 additions  = product_sales
#                 deductions = 0.0

#             total_value = additions - deductions

#             # ✅ Referral fee amount per unit
#             if product_sales != 0 and referral_fee != 0:
#                 # (total per unit) * (percent / 100)
#                 answer = round((total_value / quantity) * (referral_fee / 100.0), 2)
#                 difference = round(selling_fees - answer, 2)
#             else:
#                 answer = 0.0
#                 difference = 0.0

#             df.at[index, 'answer'] = answer
#             df.at[index, 'difference'] = difference

#             # Default errorstatus
#             if difference == 0:
#                 df.at[index, 'errorstatus'] = 'OK'
#             else:
#                 df.at[index, 'errorstatus'] = 'cases to be inquired'

#             # ✅ FBA fee percentage vs referral_fee
#             if total_value != 0:
#                 fba_answer = round((fba_fees / total_value) * 100.0, 2)
#                 # Yahan tumne referral_fee +/- 1% range rakhi hai
#                 if referral_fee != 0 and (referral_fee - 1 <= fba_answer <= referral_fee + 1):
#                     df.at[index, 'fbaerrorstatus'] = 'OK'
#                 else:
#                     df.at[index, 'fbaerrorstatus'] = 'error'
#             else:
#                 fba_answer = 0.0
#                 df.at[index, 'fbaerrorstatus'] = 'DivideByZeroError'

#             df.at[index, 'fbaanswer'] = fba_answer

#             # ✅ Agar referral_fee hi missing/zero ho to NoReferralFee mark karo
#             if referral_fee == 0:
#                 df.at[index, 'errorstatus'] = 'NoReferralFee'
#                 df.at[index, 'fbaerrorstatus'] = 'NoReferralFee'

#         return df

#     except Exception as e:
#         print("Error in apply_modifications:", e)
#         return df

def get_referral_fees(user_id, country, sku_list):
    try:
        # Sanitize and prepare
        country = country.lower().replace(" ", "_")
        table_name = f'user_{user_id}_{country}_table'
        
        # Set up engine and metadata
        user_engine = create_engine(db_url)  
        metadata = MetaData()
        table = Table(table_name, metadata, autoload_with=user_engine)

        # Build and execute query
        with user_engine.connect() as conn:
            stmt = select(table).where(table.c.sku.in_(sku_list))
            results = conn.execute(stmt).mappings().all()

        # Build referral fee dictionary
        referral_fees = {row['sku']: row['referral_fee'] for row in results}
        return referral_fees

    except SQLAlchemyError as e:
        print(f"Database error: {str(e)}")
        return {}
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {}


# import pandas as pd

# def apply_modifications(df, country):
#     print("Applying modifications...")
#     try:
#         # NaN ko 0 se fill kar rahe ho – dhyan rahe ga strings pe bhi effect padega
#         df = df.fillna(0)

#         print("p1")



#         db_url1 = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/phormula')
#         engine_cat = create_engine(db_url1)

#         print("p2")

#         # category table contains: category, price_from, price_to, ref_fee_percentage
#         category_df = pd.read_sql("SELECT category, price_from, price_to, referral_fee_percent_est FROM category", engine_cat)
#         print("p3")

#         # Ensure numeric
#         category_df["price_from"] = pd.to_numeric(category_df["price_from"], errors="coerce").fillna(0)
#         category_df["price_to"]   = pd.to_numeric(category_df["price_to"], errors="coerce").fillna(9999999)
#         category_df["referral_fee_percent_est"] = pd.to_numeric(category_df["referral_fee_percent_est"], errors="coerce").fillna(0)

#         print("p4")

#         # ---------- ENSURE NEW COLUMN EXISTS ----------
#         df["referral_fee"] = 0.0     # new column you need
#         df["total_value"] = 0.0

#         print("p5")

#         # ---------- LOOP ALL ROWS ----------
        



#         if 'selling_fees' in df.columns:
#             df['selling_fees'] = df['selling_fees'].abs()

#         # Ensure all expected columns exist
#         column_dtypes = {
#             'product_sales_tax': float,
#             'promotional_rebates_tax': float,
#             'difference': float,
#             'errorstatus': str,
#             'fbaerrorstatus': str,
#             'answer': float,
#             'fbaanswer': float,
#             'gift_wrap_credits': float,
#             'shipping_credits': float,   # Added for US
#             'postage_credits': float,   # Added for UK
#             'shipping_credits_tax': float,
#             'product_group': str,
#         }
#         print("p7")

#         for col, dtype in column_dtypes.items():
#             if col not in df.columns:
#                 df[col] = 0
#             df[col] = df[col].astype(dtype)

#         # Agar referral_fee column missing ho to abhi ke liye 0 se add kar do
#         if 'referral_fee' not in df.columns:
#             df['referral_fee'] = 0.0
        
#         print("p8")

        

#         for index, row in df.iterrows():
#             sku = row.get('sku', '')

#             # ✅ referral_fee ab DataFrame ke column se aa raha hai, dict se nahi
#             try:
#                 referral_fee = float(row.get('referral_fee', 0) or 0)
#             except (TypeError, ValueError):
#                 referral_fee = 0.0

#             # Shared fields
#             try:
#                 product_sales = float(row.get('product_sales', 0) or 0)
#                 print("p9")
#             except (TypeError, ValueError):
#                 product_sales = 0.0
            
            

#             try:
#                 quantity = float(row.get('quantity', 0) or 0)
#                 print("p9")
#             except (TypeError, ValueError):
#                 quantity = 0.0

#             if quantity in [None, 0]:
#                 quantity = 1  # zero quantity se divide by zero ho jayega, isliye 1

#             try:
#                 fba_fees = float(row.get('fba_fees', 0) or 0)
#                 print("p9")
#             except (TypeError, ValueError):
#                 fba_fees = 0.0

#             try:
#                 selling_fees = float(row.get('selling_fees', 0) or 0)
#             except (TypeError, ValueError):
#                 selling_fees = 0.0
            
#             try:
#                 shipping_credits_tax = float(row.get('shipping_credits_tax', 0) or 0)
#             except (TypeError, ValueError):
#                 shipping_credits_tax = 0.0
            
#             print("p10")

#             # ✅ Country-wise additions/deductions
#             if country.lower() == 'uk':
#                 product_sales_tax      = float(row.get('product_sales_tax', 0) or 0)
#                 postage_credits        = float(row.get('postage_credits', 0) or 0)
#                 promotional_rebates    = float(row.get('promotional_rebates', 0) or 0)
#                 promotional_rebates_tax = float(row.get('promotional_rebates_tax', 0) or 0)
#                 shipping_credits_tax = float(row.get('shipping_credits_tax', 0) or 0)
#                 print("p11")
            


#                 if postage_credits > 0:
#                     postage_shipping_total = postage_credits + shipping_credits_tax
#                 else:
#                     postage_shipping_total = 0.0

#                 # df.at[index, 'postage_shipping_total'] = postage_shipping_total

#                 additions  = product_sales + product_sales_tax + postage_credits + promotional_rebates + promotional_rebates_tax + shipping_credits_tax
#                 deductions =  postage_shipping_total
#                 print("p12")

#             elif country.lower() == 'us':
#                 gift_wrap_credits   = float(row.get('gift_wrap_credits', 0) or 0)
#                 shipping_credits    = float(row.get('shipping_credits', 0) or 0)
#                 promotional_rebates = float(row.get('promotional_rebates', 0) or 0)
#                 print("p13")

#                 additions  = product_sales + gift_wrap_credits + shipping_credits
#                 deductions = promotional_rebates

#             else:
#                 # Default to only product_sales if country unknown
#                 additions  = product_sales
#                 deductions = 0.0

#             total_value = ((additions - deductions)/quantity)
#             print("p14")

#             df.at[index, 'total_value'] = total_value
#             print("p15")

#             for index, row in df.iterrows():

#                 product_group = str(row.get("product_group", "")).strip().lower()
#                 total_value   = float(row.get("total_value", 0) or 0)
#                 print("p17")

#                 # ================================
#                 #     MATCH CATEGORY TABLE NOW
#                 # ================================
#                 matched_row = category_df[
#                     (category_df["category"].str.lower() == product_group) &
#                     (total_value >= category_df["price_from"]) &
#                     (total_value <= category_df["price_to"])
#                 ]
#                 print("p18")

#                 if not matched_row.empty:
#                     referral_fee = float(matched_row.iloc[0]["referral_fee_percent_est"])
#                 else:
#                     referral_fee = 0.0

#                 df.at[index, "referral_fee"] = referral_fee
#                 print("p19")


#                 # now use ref_fee_per instead of referral_fee
#                 referral_fee = referral_fee



#             desc = str(row.get('description', '')).strip().lower()
            

#             # ✅ Referral fee amount per unit
#             if product_sales != 0:
#                 # (total per unit) * (percent / 100)
#                 answer = round((total_value) * (referral_fee / 100.0), 2)
#                 answer = answer*quantity
                
                   
                
#             else:
#                 answer = 0.0
#                 # difference = 0.0
            

#             if desc == 'tax':
#                     total_value = 0.0 
#                     answer = 0.0
            

#             difference = round(selling_fees - answer, 2)

#             print("p20")

#             # Default errorstatus
#             # Correct errorstatus logic
#             if difference == 0:
#                 df.at[index, 'errorstatus'] = 'OK'
#             elif difference < 0:
#                 df.at[index, 'errorstatus'] = 'undercharged'
#             else:
#                 df.at[index, 'errorstatus'] = 'overcharged'



            
#             df.at[index, 'answer'] = answer
#             df.at[index, 'difference'] = difference

#             # ✅ FBA fee percentage vs referral_fee
#             if total_value != 0:
#                 fba_answer = round((fba_fees / total_value) * 100.0, 2)
#                 # Yahan tumne referral_fee +/- 1% range rakhi hai
#                 if referral_fee != 0 and (referral_fee - 1 <= fba_answer <= referral_fee + 1):
#                     df.at[index, 'fbaerrorstatus'] = 'OK'
#                 else:
#                     df.at[index, 'fbaerrorstatus'] = 'error'
#             else:
#                 fba_answer = 0.0
#                 df.at[index, 'fbaerrorstatus'] = 'DivideByZeroError'

#             df.at[index, 'fbaanswer'] = fba_answer

#             # ✅ Agar referral_fee hi missing/zero ho to NoReferralFee mark karo
#             if referral_fee == 0:
#                 df.at[index, 'errorstatus'] = 'NoReferralFee'
#                 df.at[index, 'fbaerrorstatus'] = 'NoReferralFee'

#         return df

#     except Exception as e:
#         print("Error in apply_modifications:", e)
#         return df



def apply_modifications(df, country):
    print("Applying modifications...")
    try:
        # NaN ko 0 se fill kar rahe ho
        df = df.fillna(0)
        

        # Database connection
        db_url1 = os.getenv('DATABASE_ADMIN_URL', 'postgresql://postgres:password@localhost:5432/admin_db')
        engine_cat = create_engine(db_url1)
        
        # Category table load karo
        category_df = pd.read_sql("SELECT category, price_from, price_to, referral_fee_percent_est FROM category", engine_cat)
        

        # Ensure numeric types
        category_df["price_from"] = pd.to_numeric(category_df["price_from"], errors="coerce").fillna(0)
        category_df["price_to"] = pd.to_numeric(category_df["price_to"], errors="coerce").fillna(9999999)
        category_df["referral_fee_percent_est"] = pd.to_numeric(category_df["referral_fee_percent_est"], errors="coerce").fillna(0)
        category_df["category"] = category_df["category"].str.lower().str.strip()
        

        # Initialize new columns
        df["referral_fee"] = 0.0
        df["total_value"] = 0.0
       

        # Selling fees ko absolute value mein convert karo
        

        # Ensure all expected columns exist
        column_dtypes = {
            'product_sales_tax': float,
            'promotional_rebates_tax': float,
            'difference': float,
            'errorstatus': str,
            'fbaerrorstatus': str,
            'answer': float,
            'fbaanswer': float,
            'gift_wrap_credits': float,
            'shipping_credits': float,
            'postage_credits': float,
            'shipping_credits_tax': float,
            'product_group': str,
        }
        

        for col, dtype in column_dtypes.items():
            if col not in df.columns:
                if dtype == str:
                    df[col] = ''
                else:
                    df[col] = 0
            if dtype != str:
                df[col] = df[col].astype(dtype)
        
        

        # ✅ SINGLE LOOP - No nested loops
        for index, row in df.iterrows():
            sku = row.get('sku', '')
            

            # Get product_sales
            try:
                product_sales = float(row.get('product_sales', 0) or 0)
            except (TypeError, ValueError):
                product_sales = 0.0

            # Get quantity
            try:
                quantity = float(row.get('quantity', 0) or 0)
            except (TypeError, ValueError):
                quantity = 0.0

            if quantity in [None, 0]:
                quantity = 1

            # Get fba_fees
            try:
                fba_fees = float(row.get('fba_fees', 0) or 0)
            except (TypeError, ValueError):
                fba_fees = 0.0

            # Get selling_fees
            try:
                selling_fees = -float(row.get('selling_fees', 0) or 0)
            except (TypeError, ValueError):
                selling_fees = 0.0
            
            # Get shipping_credits_tax
            try:
                shipping_credits_tax = float(row.get('shipping_credits_tax', 0) or 0)
            except (TypeError, ValueError):
                shipping_credits_tax = 0.0
            
         

            # ✅ Country-wise calculations
            if country.lower() == 'uk':
                product_sales_tax = float(row.get('product_sales_tax', 0) or 0)
                postage_credits = float(row.get('postage_credits', 0) or 0)
                promotional_rebates = float(row.get('promotional_rebates', 0) or 0)
                promotional_rebates_tax = float(row.get('promotional_rebates_tax', 0) or 0)
                

                if postage_credits > 0:
                    postage_shipping_total = postage_credits + shipping_credits_tax
                else:
                    postage_shipping_total = 0.0
                

                    # NEW LOGIC: final_postage_shipping_total
                promo_total = promotional_rebates + promotional_rebates_tax

                if promo_total == -postage_shipping_total:
                    final_postage_shipping_total = 0
                else:
                    final_postage_shipping_total = postage_shipping_total

                df.at[index, "final_postage_shipping_total"] = final_postage_shipping_total


                additions = product_sales + product_sales_tax + postage_credits + promotional_rebates + promotional_rebates_tax + shipping_credits_tax
                deductions = final_postage_shipping_total
               

            elif country.lower() == 'us':
                gift_wrap_credits = float(row.get('gift_wrap_credits', 0) or 0)
                shipping_credits = float(row.get('shipping_credits', 0) or 0)
                promotional_rebates = float(row.get('promotional_rebates', 0) or 0)
                

                additions = product_sales + gift_wrap_credits + shipping_credits
                deductions = promotional_rebates

            else:
                additions = product_sales
                deductions = 0.0

            # Calculate total_value
            total_value = ((additions - deductions) / quantity)
            
            # Proper rounding (9.995 → 10)
            total_value = float(Decimal(total_value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            df.at[index, 'total_value'] = total_value

           
           

            # ✅ Match category table for referral_fee
            product_group = str(row.get("product_group", "")).strip().lower()
            # print(f"p17 - Product Group: {product_group}, Total Value: {total_value}")

            # Match category
            matched_row = category_df[
                (category_df["category"] == product_group) &
                (total_value >= category_df["price_from"]) &
                (total_value <= category_df["price_to"])
            ]
            # print("p18")

            if 'selling_fees' in df.columns:
                df['selling_fees'] = df['selling_fees'].abs()


            if not matched_row.empty:
                referral_fee = float(matched_row.iloc[0]["referral_fee_percent_est"])
                # print(f"Matched referral_fee: {referral_fee}%")
            else:
                referral_fee = 0.0
                # print(f"No match found for product_group: {product_group}")

            df.at[index, "referral_fee"] = referral_fee
         

            # Get description
            desc = str(row.get('description', '')).strip().lower()
            txn_type = str(row.get('type', '')).strip().lower()

            # ✅ Calculate answer (referral fee amount)
            if product_sales != 0:
                answer = round((total_value) * (referral_fee / 100.0), 2)
                answer = answer * quantity
            else:
                answer = 0.0

            # Tax row handling
            if desc == 'tax':
                total_value = 0.0
                answer = 0.0

            # Calculate difference
            difference = round(selling_fees - answer, 2)
            # print("p20")

            # Error status
            if difference == 0:
                df.at[index, 'errorstatus'] = 'OK'
            elif difference < 0:
                df.at[index, 'errorstatus'] = 'undercharged'
            else:
                df.at[index, 'errorstatus'] = 'overcharged'

            df.at[index, 'answer'] = answer
            df.at[index, 'difference'] = difference

            # ✅ FBA fee calculation
            if total_value != 0:
                fba_answer = round((fba_fees / total_value) * 100.0, 2)
                if referral_fee != 0 and (referral_fee - 1 <= fba_answer <= referral_fee + 1):
                    df.at[index, 'fbaerrorstatus'] = 'OK'
                else:
                    df.at[index, 'fbaerrorstatus'] = 'error'
            else:
                fba_answer = 0.0
                df.at[index, 'fbaerrorstatus'] = 'DivideByZeroError'

            df.at[index, 'fbaanswer'] = fba_answer


            if txn_type.lower() == "adjustment":
                df.at[index, 'errorstatus'] = "NoReferralFee"
                df.at[index, 'fbaerrorstatus'] = "NoReferralFee"
                continue

            # No referral fee status
            if referral_fee == 0:
                # df.at[index, 'errorstatus'] = 'NoReferralFee'
                # df.at[index, 'fbaerrorstatus'] = 'NoReferralFee'
                if desc == 'tax' or txn_type == 'other-transaction':
                    pass  # kuch nahi karna
                else:
                    df.at[index, 'errorstatus'] = 'NoReferralFee'
                    df.at[index, 'fbaerrorstatus'] = 'NoReferralFee'

        # print("Processing complete!")
        return df

    except Exception as e:
        print("Error in apply_modifications:", e)
        import traceback
        traceback.print_exc()
        return df
    




def apply_modifications_fatch(df, country):
    print("Applying modifications...")
    try:
        # NaN ko 0 se fill kar rahe ho
        df = df.fillna(0)
       

        # Database connection
        db_url1 = os.getenv('DATABASE_ADMIN_URL', 'postgresql://postgres:password@localhost:5432/admin_db')
        engine_cat = create_engine(db_url1)
       

        # Category table load karo
        category_df = pd.read_sql("SELECT category, price_from, price_to, referral_fee_percent_est FROM category", engine_cat)
        

        # Ensure numeric types
        category_df["price_from"] = pd.to_numeric(category_df["price_from"], errors="coerce").fillna(0)
        category_df["price_to"] = pd.to_numeric(category_df["price_to"], errors="coerce").fillna(9999999)
        category_df["referral_fee_percent_est"] = pd.to_numeric(category_df["referral_fee_percent_est"], errors="coerce").fillna(0)
        category_df["category"] = category_df["category"].str.lower().str.strip()
        

        # Initialize new columns
        df["referral_fee"] = 0.0
        df["total_value"] = 0.0
        

        # Selling fees ko absolute value mein convert karo
        if 'selling_fees' in df.columns:
            df['selling_fees'] = df['selling_fees'].abs()

        # Ensure all expected columns exist
        column_dtypes = {
            'product_sales_tax': float,
            'promotional_rebates_tax': float,
            'difference': float,
            'errorstatus': str,
            'fbaerrorstatus': str,
            'answer': float,
            'fbaanswer': float,
            'gift_wrap_credits': float,
            'shipping_credits': float,
            'postage_credits': float,
            'shipping_credits_tax': float,
            'product_group': str,
        }
      

        for col, dtype in column_dtypes.items():
            if col not in df.columns:
                if dtype == str:
                    df[col] = ''
                else:
                    df[col] = 0
            if dtype != str:
                df[col] = df[col].astype(dtype)
        
     

        # ✅ SINGLE LOOP - No nested loops
        for index, row in df.iterrows():
            sku = row.get('sku', '')
            

            # Get product_sales
            try:
                product_sales = float(row.get('product_sales', 0) or 0)
            except (TypeError, ValueError):
                product_sales = 0.0

            # Get quantity
            try:
                quantity = float(row.get('quantity', 0) or 0)
            except (TypeError, ValueError):
                quantity = 0.0

            if quantity in [None, 0]:
                quantity = 1

            # Get fba_fees
            try:
                fba_fees = float(row.get('fba_fees', 0) or 0)
            except (TypeError, ValueError):
                fba_fees = 0.0

            # Get selling_fees
            try:
                selling_fees = float(row.get('selling_fees', 0) or 0)
            except (TypeError, ValueError):
                selling_fees = 0.0
            
            # Get shipping_credits_tax
            try:
                shipping_credits_tax = float(row.get('shipping_credits_tax', 0) or 0)
            except (TypeError, ValueError):
                shipping_credits_tax = 0.0
            
            

            # ✅ Country-wise calculations
            if country.lower() == 'uk':
                product_sales_tax = float(row.get('product_sales_tax', 0) or 0)
                postage_credits = float(row.get('postage_credits', 0) or 0)
                promotional_rebates = float(row.get('promotional_rebates', 0) or 0)
                promotional_rebates_tax = float(row.get('promotional_rebates_tax', 0) or 0)
          

                if postage_credits > 0:
                    postage_shipping_total = postage_credits + shipping_credits_tax
                else:
                    postage_shipping_total = 0.0

                additions = product_sales + product_sales_tax + postage_credits + promotional_rebates + promotional_rebates_tax + shipping_credits_tax
                deductions = postage_shipping_total
                

            elif country.lower() == 'us':
                gift_wrap_credits = float(row.get('gift_wrap_credits', 0) or 0)
                shipping_credits = float(row.get('shipping_credits', 0) or 0)
                promotional_rebates = float(row.get('promotional_rebates', 0) or 0)
               

                additions = product_sales + gift_wrap_credits + shipping_credits
                deductions = promotional_rebates

            else:
                additions = product_sales
                deductions = 0.0

            # Calculate total_value
            total_value = ((additions - deductions) / quantity)
            
            df.at[index, 'total_value'] = total_value
           

            # ✅ Match category table for referral_fee
            product_group = str(row.get("product_group", "")).strip().lower()
            # print(f"p17 - Product Group: {product_group}, Total Value: {total_value}")

            # Match category
            matched_row = category_df[
                (category_df["category"] == product_group) &
                (total_value >= category_df["price_from"]) &
                (total_value <= category_df["price_to"])
            ]
            # print("p18")

            if not matched_row.empty:
                referral_fee = float(matched_row.iloc[0]["referral_fee_percent_est"])
                # print(f"Matched referral_fee: {referral_fee}%")
            else:
                referral_fee = 0.0
                # print(f"No match found for product_group: {product_group}")

            df.at[index, "referral_fee"] = referral_fee
         

            # Get description
            desc = str(row.get('description', '')).strip().lower()
            txn_type = str(row.get('type', '')).strip().lower()

            # ✅ Calculate answer (referral fee amount)
            if product_sales != 0:
                answer = round((total_value) * (referral_fee / 100.0), 2)
                answer = answer * quantity
            else:
                answer = 0.0

            # Tax row handling
            if desc == 'tax':
                total_value = 0.0
                answer = 0.0

            # Calculate difference
            difference = round(selling_fees - answer, 2)
            # print("p20")

            # Error status
            if difference == 0:
                df.at[index, 'errorstatus'] = 'OK'
            elif difference < 0:
                df.at[index, 'errorstatus'] = 'undercharged'
            else:
                df.at[index, 'errorstatus'] = 'overcharged'

            df.at[index, 'answer'] = answer
            df.at[index, 'difference'] = difference

            # ✅ FBA fee calculation
            if total_value != 0:
                fba_answer = round((fba_fees / total_value) * 100.0, 2)
                if referral_fee != 0 and (referral_fee - 1 <= fba_answer <= referral_fee + 1):
                    df.at[index, 'fbaerrorstatus'] = 'OK'
                else:
                    df.at[index, 'fbaerrorstatus'] = 'error'
            else:
                fba_answer = 0.0
                df.at[index, 'fbaerrorstatus'] = 'DivideByZeroError'

            df.at[index, 'fbaanswer'] = fba_answer

            # No referral fee status
            if referral_fee == 0:
                # df.at[index, 'errorstatus'] = 'NoReferralFee'
                # df.at[index, 'fbaerrorstatus'] = 'NoReferralFee'
                if desc == 'tax' or txn_type == 'other-transaction':
                    pass  # kuch nahi karna
                else:
                    df.at[index, 'errorstatus'] = 'NoReferralFee'
                    df.at[index, 'fbaerrorstatus'] = 'NoReferralFee'

        # print("Processing complete!")
        return df

    except Exception as e:
        print("Error in apply_modifications:", e)
        import traceback
        traceback.print_exc()
        return df