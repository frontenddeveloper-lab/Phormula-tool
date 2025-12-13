from sqlalchemy import create_engine,  text
from sqlalchemy.orm import sessionmaker
from config import Config
SECRET_KEY = Config.SECRET_KEY
UPLOAD_FOLDER = Config.UPLOAD_FOLDER
import os
import pandas as pd
import numpy as np 
from dotenv import load_dotenv



# Load environment variables
load_dotenv()
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/phormula')



# def process_global_monthly_skuwise_data(user_id, country, year, month):
#     from sqlalchemy import create_engine, text
#     import pandas as pd
#     import numpy as np

#     engine = create_engine(db_url)
#     conn = engine.connect()
#     # country = "global"
#     # quarter_table = f"skuwisemonthly_{user_id}_{country}_{month}{year}_table"
#     # source_table = f"skuwisemonthly_{user_id}"
#     print("enter in globar monthly")
#     config_list = [
#         (f"skuwisemonthly_{user_id}",      "global"),       # USD (pehle se)
#         (f"skuwisemonthlyind_{user_id}",  "global_inr"),   # INR
#         (f"skuwisemonthlycan_{user_id}",  "global_cad"),   # CAD
#         (f"skuwisemonthlygbp_{user_id}",  "global_gbp"),   # GBP base
#     ]

#     try:
#         for source_table, logical_country in config_list:
#             print(f"\n==== Processing global monthly for source_table={source_table}, country={logical_country} ====")

#             quarter_table = f"skuwisemonthly_{user_id}_{logical_country}_{month}{year}_table"
#         # ------------------- Main Data Processing -------------------
#             query = f"""
#                 SELECT "user_id","price_in_gbp", "product_sales", "promotional_rebates", "promotional_rebates_tax",
#                 "product_sales_tax", "selling_fees", "refund_selling_fees", "fba_fees", "other",
#                 "marketplace_facilitator_tax", "shipping_credits_tax", "giftwrap_credits_tax",
#                 "postage_credits", "gift_wrap_credits", "net_sales", "net_taxes", "net_credits",
#                 "profit", "profit_percentage", "amazon_fee", "sales_mix", "profit_mix", "quantity",
#                 "cost_of_unit_sold", "other_transaction_fees", "platform_fee", "rembursement_fee",
#                 "advertising_total", "reimbursement_vs_sales", "cm2_profit", "cm2_margins", "acos",
#                 "asp", "rembursment_vs_cm2_margins", "product_name", "shipment_charges","unit_wise_profitability"
#                 FROM {source_table}
#                 WHERE year = '{year}' AND month = '{month}'
#             """


#             try:
#                     df = pd.read_sql(query, conn)
#             except Exception as e:
#                 print(f"❌ Failed to read from {source_table}: {e}")
#                 continue



#             if df.empty:
#                 print(f"⚠️ No data found for {month}/{year} in {source_table}")
#                 continue

#             print(df.columns)
        


#             sku_grouped = df.groupby('product_name').agg({
#                 "price_in_gbp": "mean",
#                 "product_sales": "sum",
#                 "promotional_rebates": "sum",
#                 "promotional_rebates_tax": "sum",
#                 "product_sales_tax": "sum",
#                 "selling_fees": "sum",
#                 "refund_selling_fees": "sum",  # Add this column to df before grouping if needed
#                 "fba_fees": "sum",
#                 "other": "sum",
#                 "marketplace_facilitator_tax": "sum",
#                 "shipping_credits_tax": "sum",
#                 "giftwrap_credits_tax": "sum",
#                 "postage_credits": "sum",
#                 "gift_wrap_credits": "sum",
#                 "net_sales": "sum",  # Calculate these columns before grouping
#                 "net_taxes": "sum",
#                 "net_credits": "sum",
#                 "profit": "sum",
#                 # "profit_percentage": "sum",
#                 "amazon_fee": "sum",
#                 # "sales_mix": "sum",
#                 # "profit_mix": "sum",
#                 "quantity": "sum",
#                 "cost_of_unit_sold": "sum",
#                 "other_transaction_fees": "sum",
#                 "platform_fee": "sum",
#                 "rembursement_fee": "sum",
#                 "advertising_total": "sum",
#                 # "reimbursement_vs_sales": "sum",
#                 "cm2_profit": "sum",
#                 # "cm2_margins": "sum",
#                 # "acos": "sum",
#                 # "asp": "sum",
#                 # "rembursment_vs_cm2_margins": "sum",
#                 "shipment_charges": "sum",
#                 "unit_wise_profitability": "sum",  # Add this column to df before grouping if needed
#                 "user_id": "first"  # or "sum" if you want to repeat user_id for each group
#             }).reset_index()
#             # total_sales = abs(sku_grouped["Net Sales"].sum())
#             # total_profit = abs(sku_grouped["profit"].sum())
#             # print(total_profit)
#             # print(total_sales)
#             sku_grouped["product_name"] = sku_grouped["product_name"].astype(str).str.strip()
#             sku_grouped["cm2_margins"] = sku_grouped.apply(
#                 lambda row: (row["cm2_profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
#                 axis=1
#             )
#             print(sku_grouped[["product_name", "cm2_margins"]])
#             sku_grouped["acos"] = sku_grouped.apply(
#                 lambda row: (row["advertising_total"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
#                 axis=1
#             )
#             print(sku_grouped[["product_name", "acos"]])
#             sku_grouped["rembursment_vs_cm2_margins"] = sku_grouped.apply(
#                 lambda row: (row["rembursement_fee"] / row["cm2_profit"]) * 100 if row["cm2_profit"] != 0 else 0,
#                 axis=1
#             )
#             print(sku_grouped[["product_name", "rembursment_vs_cm2_margins"]])
#             sku_grouped["reimbursement_vs_sales"] = sku_grouped.apply(
#                 lambda row: (row["rembursement_fee"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
#                 axis=1
#             )
#             print(sku_grouped[["product_name", "reimbursement_vs_sales"]])
#             sku_grouped["profit_percentage"] = sku_grouped.apply(
#                 lambda row: (row["profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
#                 axis=1
#             )
#             print(sku_grouped[["product_name", "profit_percentage"]])

#             sku_grouped["asp"] = sku_grouped.apply(
#                 lambda row: (row["net_sales"] / row["quantity"])  if row["quantity"] != 0 else 0,
#                 axis=1
#             )
#             print(sku_grouped[["product_name", "asp"]])
#             sku_grouped["unit_wise_profitability"] = sku_grouped.apply(
#                 lambda row: (row["profit"] / row["quantity"])  if row["quantity"] != 0 else 0,
#                 axis=1
#             )
#             print(sku_grouped[["product_name", "unit_wise_profitability"]])

#             total_sales = abs(sku_grouped["net_sales"].sum())  # lowercase column name
#             total_profit = abs(sku_grouped["profit"].sum())
#             print(total_profit)
#             print(total_sales)

#             sku_grouped["profit_mix"] = sku_grouped.apply(
#                 lambda row: (row["profit"] / total_profit) * 100 if total_profit != 0 else 0,
#                 axis=1
#             )

#             sku_grouped["sales_mix"] = sku_grouped.apply(
#                 lambda row: (row["net_sales"] / total_sales) * 100 if total_sales != 0 else 0,
#                 axis=1
#             )

            
            
#             print(sku_grouped[["product_name", "profit_mix"]])
            
            
#             print(sku_grouped[["product_name", "sales_mix"]])



#             total_row = sku_grouped[sku_grouped["product_name"].str.lower() == "total"]
#             other_rows = sku_grouped[sku_grouped["product_name"].str.lower() != "total"]

#             # Sort other rows by profit in ascending order
#             other_rows = other_rows.sort_values(by="profit", ascending=False)

#             # Concatenate the sorted rows with the total row at the end
#             sku_grouped = pd.concat([other_rows, total_row], ignore_index=True)

#             conn.execute(text(f"DROP TABLE IF EXISTS {quarter_table}"))

#             create_table_query = f"""
#                 CREATE TABLE IF NOT EXISTS {quarter_table} (
#                     id SERIAL PRIMARY KEY,
#                     product_name TEXT,
#                     price_in_gbp DOUBLE PRECISION,
#                     product_sales DOUBLE PRECISION,
#                     promotional_rebates DOUBLE PRECISION,
#                     promotional_rebates_tax DOUBLE PRECISION,
#                     product_sales_tax DOUBLE PRECISION,
#                     selling_fees DOUBLE PRECISION,
#                     refund_selling_fees DOUBLE PRECISION,
#                     fba_fees DOUBLE PRECISION,
#                     other DOUBLE PRECISION,
#                     marketplace_facilitator_tax DOUBLE PRECISION,
#                     shipping_credits_tax DOUBLE PRECISION,
#                     giftwrap_credits_tax DOUBLE PRECISION,
#                     postage_credits DOUBLE PRECISION,
#                     gift_wrap_credits DOUBLE PRECISION,
#                     net_sales DOUBLE PRECISION,
#                     net_taxes DOUBLE PRECISION,
#                     net_credits DOUBLE PRECISION,
#                     profit DOUBLE PRECISION,
#                     profit_percentage DOUBLE PRECISION,
#                     amazon_fee DOUBLE PRECISION,
#                     sales_mix DOUBLE PRECISION,
#                     profit_mix DOUBLE PRECISION,
#                     quantity INTEGER,
#                     cost_of_unit_sold DOUBLE PRECISION,
#                     other_transaction_fees DOUBLE PRECISION,
#                     platform_fee DOUBLE PRECISION,
#                     rembursement_fee DOUBLE PRECISION,
#                     advertising_total DOUBLE PRECISION,
#                     reimbursement_vs_sales DOUBLE PRECISION,
#                     cm2_profit DOUBLE PRECISION,
#                     cm2_margins DOUBLE PRECISION,
#                     acos DOUBLE PRECISION,
#                     asp DOUBLE PRECISION,
#                     rembursment_vs_cm2_margins DOUBLE PRECISION,
#                     shipment_charges DOUBLE PRECISION,
#                     unit_wise_profitability DOUBLE PRECISION,
#                     user_id INTEGER
#                 )
#             """
#             conn.execute(text(create_table_query))


#             sku_grouped.columns = [col.lower() for col in sku_grouped.columns]
#             sku_grouped.to_sql(quarter_table, conn, if_exists="replace", index=False, schema="public", method="multi", chunksize=1000)
#             conn.commit()
#             print(f"global monthly SKU-wise data saved in {quarter_table}!")

#     # except Exception as e:
#     #     print(f"Error during processing: {e}")
#     #     conn.rollback()
#     # finally:
#     #     conn.close()

#         # ------------------- Upload History Section -------------------
#             from app.models.user_models import UploadHistory
#             from sqlalchemy.orm import sessionmaker
#             import numpy as np 

#             Session = sessionmaker(bind=engine)
#             session = Session()

#             def convert_value(val):
            
#                 if isinstance(val, (np.int64, np.int32)):
#                     return int(val)
#                 elif isinstance(val, (np.float64, np.float32)):
#                     return float(val)
#                 return val

#             try:
#                 total_row_data = sku_grouped[sku_grouped["product_name"].str.lower() == "total"].iloc[0]
#                 total_sales = convert_value(total_row_data.get("net_sales", 0))
#                 total_profit = convert_value(total_row_data.get("profit", 0))
#                 fba_fees = convert_value(total_row_data.get("fba_fees", 0))
#                 platform_fee = convert_value(total_row_data.get("platform_fee", 0))
#                 rembursement_fee = convert_value(total_row_data.get("rembursement_fee", 0))
#                 cm2_profit = convert_value(total_row_data.get("cm2_profit", 0))
#                 cm2_margins = convert_value(total_row_data.get("cm2_margins", 0))
#                 acos = convert_value(total_row_data.get("acos", 0))
#                 rembursment_vs_cm2_margins = convert_value(total_row_data.get("rembursment_vs_cm2_margins", 0))
#                 advertising_total = convert_value(total_row_data.get("advertising_total", 0))
#                 reimbursement_vs_sales = convert_value(total_row_data.get("reimbursement_vs_sales", 0))
#                 unit_sold = convert_value(total_row_data.get("quantity", 0))
#                 total_cous = convert_value(total_row_data.get("cost_of_unit_sold", 0))
#                 total_amazon_fee = convert_value(total_row_data.get("amazon_fee", 0))
                

#                 total_credits = convert_value(total_row_data.get("net_credits", 0))
#                 total_tax = convert_value(total_row_data.get("net_taxes", 0))

#                 total_expense = total_sales - cm2_profit
#                 otherwplatform = abs(platform_fee)
#                 taxncredit = (total_tax) + abs(total_credits)

#                 # Step 1: Delete existing entry (same user_id, country, year, month)
#                 existing_entry = session.query(UploadHistory).filter_by(
#                     user_id=user_id,
#                     country="global",
#                     year=year,
#                     month=month
#                 ).first()

#                 if existing_entry:
#                     session.delete(existing_entry)
#                     session.commit()
#                     print("Existing upload history entry deleted.")

#                 # Step 2: Create and insert new entry
#                 upload_history_entry = UploadHistory(
#                     user_id=int(user_id),
#                     year=str(year),
#                     month=str(month),
#                     country="global",
#                     file_name=None,
#                     sales_chart_img=None,
#                     expense_chart_img=None,
#                     qtd_pie_chart=None,
#                     ytd_pie_chart=None,
#                     profit_chart_img=None,
#                     total_sales=total_sales,
#                     total_profit=total_profit,
#                     otherwplatform=otherwplatform,
#                     taxncredit=taxncredit,
#                     total_expense=total_expense,
#                     total_fba_fees=fba_fees,
#                     platform_fee=platform_fee,
#                     rembursement_fee=rembursement_fee,
#                     cm2_profit=cm2_profit,
#                     cm2_margins=cm2_margins,
#                     acos=acos,
#                     rembursment_vs_cm2_margins=rembursment_vs_cm2_margins,
#                     advertising_total=advertising_total,
#                     reimbursement_vs_sales=reimbursement_vs_sales,
#                     unit_sold=unit_sold,
#                     total_cous=total_cous,
#                     total_amazon_fee=total_amazon_fee,
#                     pnl_email_sent=False,
#                 )

#                 session.add(upload_history_entry)
#                 session.commit()
#                 print("New upload history entry saved successfully.")

#             except Exception as e:
#                 print(f"Failed to save upload history: {e}")
#                 session.rollback()

#             finally:
#                 session.close()
def process_global_monthly_skuwise_data(user_id, country, year, month):
    from sqlalchemy import create_engine, text
    import pandas as pd
    import numpy as np

    engine = create_engine(db_url)
    conn = engine.connect()
    print("enter in global monthly")

    # 4 source tables + unke logical country names
    config_list = [
        (f"skuwisemonthly_{user_id}",      "global"),       # USD (pehle se)
        (f"skuwisemonthlyind_{user_id}",  "global_inr"),   # INR
        (f"skuwisemonthlycan_{user_id}",  "global_cad"),   # CAD
        (f"skuwisemonthlygbp_{user_id}",  "global_gbp"),   # GBP base
    ]

    try:
        for source_table, logical_country in config_list:
            print(f"\n==== Processing global monthly for source_table={source_table}, country={logical_country} ====")

            quarter_table = f"skuwisemonthly_{user_id}_{logical_country}_{month}{year}_table"

            # ------------------- Main Data Processing -------------------
            query = f"""
                SELECT "user_id","price_in_gbp", "product_sales", "promotional_rebates", "promotional_rebates_tax",
                    "product_sales_tax", "selling_fees", "refund_selling_fees", "fba_fees", "other",
                    "marketplace_facilitator_tax", "shipping_credits_tax", "giftwrap_credits_tax",
                    "postage_credits", "gift_wrap_credits", "net_sales", "net_taxes", "net_credits",
                    "profit", "profit_percentage", "amazon_fee", "sales_mix", "profit_mix", "quantity",
                    "cost_of_unit_sold", "other_transaction_fees", "platform_fee", "rembursement_fee",
                    "advertising_total", "reimbursement_vs_sales", "cm2_profit", "cm2_margins", "acos",
                    "asp", "rembursment_vs_cm2_margins", "product_name", "shipment_charges","unit_wise_profitability"
                FROM {source_table}
                WHERE year = '{year}' AND month = '{month}'
            """

            try:
                df = pd.read_sql(query, conn)
            except Exception as e:
                print(f"❌ Failed to read from {source_table}: {e}")
                continue

            if df.empty:
                print(f"⚠️ No data found for {month}/{year} in {source_table}")
                continue

            print(df.columns)

            # Group by product_name (global MTD)
            sku_grouped = df.groupby('product_name').agg({
                "price_in_gbp": "mean",
                "product_sales": "sum",
                "promotional_rebates": "sum",
                "promotional_rebates_tax": "sum",
                "product_sales_tax": "sum",
                "selling_fees": "sum",
                "refund_selling_fees": "sum",
                "fba_fees": "sum",
                "other": "sum",
                "marketplace_facilitator_tax": "sum",
                "shipping_credits_tax": "sum",
                "giftwrap_credits_tax": "sum",
                "postage_credits": "sum",
                "gift_wrap_credits": "sum",
                "net_sales": "sum",
                "net_taxes": "sum",
                "net_credits": "sum",
                "profit": "sum",
                "amazon_fee": "sum",
                "quantity": "sum",
                "cost_of_unit_sold": "sum",
                "other_transaction_fees": "sum",
                "platform_fee": "sum",
                "rembursement_fee": "sum",
                "advertising_total": "sum",
                "cm2_profit": "sum",
                "shipment_charges": "sum",
                "unit_wise_profitability": "sum",
                "user_id": "first"
            }).reset_index()

            sku_grouped["product_name"] = sku_grouped["product_name"].astype(str).str.strip()
            sku_grouped["cm2_margins"] = sku_grouped.apply(
                lambda row: (row["cm2_profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "cm2_margins"]])
            sku_grouped["acos"] = sku_grouped.apply(
                lambda row: (row["advertising_total"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "acos"]])
            sku_grouped["rembursment_vs_cm2_margins"] = sku_grouped.apply(
                lambda row: (row["rembursement_fee"] / row["cm2_profit"]) * 100 if row["cm2_profit"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "rembursment_vs_cm2_margins"]])
            sku_grouped["reimbursement_vs_sales"] = sku_grouped.apply(
                lambda row: (row["rembursement_fee"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "reimbursement_vs_sales"]])
            sku_grouped["profit_percentage"] = sku_grouped.apply(
                lambda row: (row["profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "profit_percentage"]])

            sku_grouped["asp"] = sku_grouped.apply(
                lambda row: (row["net_sales"] / row["quantity"])  if row["quantity"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "asp"]])
            sku_grouped["unit_wise_profitability"] = sku_grouped.apply(
                lambda row: (row["profit"] / row["quantity"])  if row["quantity"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "unit_wise_profitability"]])

            temp = sku_grouped[sku_grouped["product_name"].str.lower() != "total"]

            total_sales = abs(temp["net_sales"].sum())
            total_profit = abs(temp["profit"].sum())

            print(total_profit)
            print(total_sales)
            sku_grouped["profit_mix"] = sku_grouped.apply(
                lambda row: (row["profit"] / total_profit) * 100 if total_profit != 0 else 0,
                axis=1
            )

            sku_grouped["sales_mix"] = sku_grouped.apply(
                lambda row: (row["net_sales"] / total_sales) * 100 if total_sales != 0 else 0,
                axis=1
            )

            
            
            print(sku_grouped[["product_name", "profit_mix"]])
            
            
            print(sku_grouped[["product_name", "sales_mix"]])



            total_row = sku_grouped[sku_grouped["product_name"].str.lower() == "total"]
            other_rows = sku_grouped[sku_grouped["product_name"].str.lower() != "total"]

            # Sort other rows by profit in ascending order
            other_rows = other_rows.sort_values(by="profit", ascending=False)

            # Concatenate the sorted rows with the total row at the end
            sku_grouped = pd.concat([other_rows, total_row], ignore_index=True)


            # Recreate quarter_table
            conn.execute(text(f"DROP TABLE IF EXISTS {quarter_table}"))

            create_table_query = f"""
                CREATE TABLE IF NOT EXISTS {quarter_table} (
                    id SERIAL PRIMARY KEY,
                    product_name TEXT,
                    price_in_gbp DOUBLE PRECISION,
                    product_sales DOUBLE PRECISION,
                    promotional_rebates DOUBLE PRECISION,
                    promotional_rebates_tax DOUBLE PRECISION,
                    product_sales_tax DOUBLE PRECISION,
                    selling_fees DOUBLE PRECISION,
                    refund_selling_fees DOUBLE PRECISION,
                    fba_fees DOUBLE PRECISION,
                    other DOUBLE PRECISION,
                    marketplace_facilitator_tax DOUBLE PRECISION,
                    shipping_credits_tax DOUBLE PRECISION,
                    giftwrap_credits_tax DOUBLE PRECISION,
                    postage_credits DOUBLE PRECISION,
                    gift_wrap_credits DOUBLE PRECISION,
                    net_sales DOUBLE PRECISION,
                    net_taxes DOUBLE PRECISION,
                    net_credits DOUBLE PRECISION,
                    profit DOUBLE PRECISION,
                    profit_percentage DOUBLE PRECISION,
                    amazon_fee DOUBLE PRECISION,
                    sales_mix DOUBLE PRECISION,
                    profit_mix DOUBLE PRECISION,
                    quantity INTEGER,
                    cost_of_unit_sold DOUBLE PRECISION,
                    other_transaction_fees DOUBLE PRECISION,
                    platform_fee DOUBLE PRECISION,
                    rembursement_fee DOUBLE PRECISION,
                    advertising_total DOUBLE PRECISION,
                    reimbursement_vs_sales DOUBLE PRECISION,
                    cm2_profit DOUBLE PRECISION,
                    cm2_margins DOUBLE PRECISION,
                    acos DOUBLE PRECISION,
                    asp DOUBLE PRECISION,
                    rembursment_vs_cm2_margins DOUBLE PRECISION,
                    shipment_charges DOUBLE PRECISION,
                    unit_wise_profitability DOUBLE PRECISION,
                    user_id INTEGER
                )
            """
            conn.execute(text(create_table_query))

            sku_grouped.columns = [col.lower() for col in sku_grouped.columns]
            sku_grouped.to_sql(
                quarter_table,
                conn,
                if_exists="replace",
                index=False,
                schema="public",
                method="multi",
                chunksize=1000
            )
            conn.commit()
            print(f"✅ global monthly SKU-wise data saved in {quarter_table}!")

            # ------------------- Upload History Section -------------------
            from app.models.user_models import UploadHistory
            from sqlalchemy.orm import sessionmaker

            Session = sessionmaker(bind=engine)
            session = Session()

            def convert_value(val):
                if isinstance(val, (np.int64, np.int32)):
                    return int(val)
                elif isinstance(val, (np.float64, np.float32)):
                    return float(val)
                return val

            try:
                total_row_data = sku_grouped[sku_grouped["product_name"].str.lower() == "total"].iloc[0]
                total_sales = convert_value(total_row_data.get("net_sales", 0))
                total_profit = convert_value(total_row_data.get("profit", 0))
                fba_fees = convert_value(total_row_data.get("fba_fees", 0))
                platform_fee = convert_value(total_row_data.get("platform_fee", 0))
                rembursement_fee = convert_value(total_row_data.get("rembursement_fee", 0))
                cm2_profit = convert_value(total_row_data.get("cm2_profit", 0))
                cm2_margins = convert_value(total_row_data.get("cm2_margins", 0))
                acos = convert_value(total_row_data.get("acos", 0))
                rembursment_vs_cm2_margins = convert_value(total_row_data.get("rembursment_vs_cm2_margins", 0))
                advertising_total = convert_value(total_row_data.get("advertising_total", 0))
                reimbursement_vs_sales = convert_value(total_row_data.get("reimbursement_vs_sales", 0))
                unit_sold = convert_value(total_row_data.get("quantity", 0))
                total_cous = convert_value(total_row_data.get("cost_of_unit_sold", 0))
                total_amazon_fee = convert_value(total_row_data.get("amazon_fee", 0))
                total_credits = convert_value(total_row_data.get("net_credits", 0))
                total_tax = convert_value(total_row_data.get("net_taxes", 0))

                total_expense = total_sales - cm2_profit
                otherwplatform = abs(platform_fee)
                taxncredit = total_tax + abs(total_credits)

                # Delete existing entry (same user_id, logical_country, year, month)
                existing_entry = session.query(UploadHistory).filter_by(
                    user_id=user_id,
                    country=logical_country,
                    year=year,
                    month=month
                ).first()

                if existing_entry:
                    session.delete(existing_entry)
                    session.commit()
                    print(f"Existing upload history entry deleted for {logical_country}.")

                upload_history_entry = UploadHistory(
                    user_id=int(user_id),
                    year=str(year),
                    month=str(month),
                    country=logical_country,   # 👈 yahan ab "global", "global_inr", "global_cad", "global_gbp"
                    file_name=None,
                    sales_chart_img=None,
                    expense_chart_img=None,
                    qtd_pie_chart=None,
                    ytd_pie_chart=None,
                    profit_chart_img=None,
                    total_sales=total_sales,
                    total_profit=total_profit,
                    otherwplatform=otherwplatform,
                    taxncredit=taxncredit,
                    total_expense=total_expense,
                    total_fba_fees=fba_fees,
                    platform_fee=platform_fee,
                    rembursement_fee=rembursement_fee,
                    cm2_profit=cm2_profit,
                    cm2_margins=cm2_margins,
                    acos=acos,
                    rembursment_vs_cm2_margins=rembursment_vs_cm2_margins,
                    advertising_total=advertising_total,
                    reimbursement_vs_sales=reimbursement_vs_sales,
                    unit_sold=unit_sold,
                    total_cous=total_cous,
                    total_amazon_fee=total_amazon_fee,
                    pnl_email_sent=False,
                )

                session.add(upload_history_entry)
                session.commit()
                print(f"✅ Upload history entry saved successfully for {logical_country}.")

            except Exception as e:
                print(f"Failed to save upload history for {logical_country}: {e}")
                session.rollback()
            finally:
                session.close()

    except Exception as e:
        print(f"Error during processing: {e}")
        conn.rollback()
    finally:
        conn.close()




# def process_global_quarterly_skuwise_data(user_id, country, month, year, q, db_url):
#     engine = create_engine(db_url)
#     conn = engine.connect()
#     country = "global" 

#     try:
#         # Define quarter months
#         quarter_months = {
#             "quarter1": ["january", "february", "march"],
#             "quarter2": ["april", "may", "june"],
#             "quarter3": ["july", "august", "september"],
#             "quarter4": ["october", "november", "december"]
#         }

#         month = month.lower()
#         for q, months in quarter_months.items():
#             if month in months:
#                 quarter_table = f"{q}_{user_id}_{country}_{year}_table"
#                 break
#         else:
#             print("Invalid month provided.")
#             return

#         source_table = f"skuwisemonthly_{user_id}"

#         # Get only available months from DB
#         month_params = {f"m{i}": m for i, m in enumerate(months)}
#         placeholders = ', '.join(f":m{i}" for i in range(len(months)))
#         available_months_query = text(f"""
#             SELECT DISTINCT LOWER(month) AS month
#             FROM {source_table}
#             WHERE LOWER(month) IN ({placeholders}) AND year = :year
#         """)
#         result = conn.execute(available_months_query, {**month_params, "year": year})
#         available_months_df = pd.DataFrame(result.fetchall(), columns=["month"])
#         selected_months = available_months_df["month"].tolist()

#         if not selected_months:
#             print("No available months found.")
#             return

#         # Read full data for selected months
#         placeholders = ', '.join(['%s'] * len(selected_months))
#         query = f"""
#             SELECT "user_id","price_in_gbp", "product_sales", "promotional_rebates", "promotional_rebates_tax",
#             "product_sales_tax", "selling_fees", "refund_selling_fees", "fba_fees", "other",
#             "marketplace_facilitator_tax", "shipping_credits_tax", "giftwrap_credits_tax",
#             "postage_credits", "gift_wrap_credits", "net_sales", "net_taxes", "net_credits",
#             "profit", "profit_percentage", "amazon_fee", "sales_mix", "profit_mix", "quantity",
#             "cost_of_unit_sold", "other_transaction_fees", "platform_fee", "rembursement_fee",
#             "advertising_total", "reimbursement_vs_sales", "cm2_profit", "cm2_margins", "acos",
#             "asp", "rembursment_vs_cm2_margins", "product_name","shipment_charges","unit_wise_profitability"
#             FROM {source_table}
#             WHERE LOWER(month) IN ({placeholders}) AND year = %s
#         """
#         df = pd.read_sql(query, conn, params=tuple(selected_months + [year]))


#         if df.empty:
#             print("No data for selected months.")
#             return
        
        

#         sku_grouped = df.groupby('product_name').agg({
#             "price_in_gbp": "mean",
#             "product_sales": "sum",
#             "promotional_rebates": "sum",
#             "promotional_rebates_tax": "sum",
#             "product_sales_tax": "sum",
#             "selling_fees": "sum",
#             "refund_selling_fees": "sum",  # Add this column to df before grouping if needed
#             "fba_fees": "sum",
#             "other": "sum",
#             "marketplace_facilitator_tax": "sum",
#             "shipping_credits_tax": "sum",
#             "giftwrap_credits_tax": "sum",
#             "postage_credits": "sum",
#             "gift_wrap_credits": "sum",
#             "net_sales": "sum",  # Calculate these columns before grouping
#             "net_taxes": "sum",
#             "net_credits": "sum",
#             "profit": "sum",
#             # "profit_percentage": "sum",
#             "amazon_fee": "sum",
#             # "sales_mix": "sum",
#             # "profit_mix": "sum",
#             "quantity": "sum",
#             "cost_of_unit_sold": "sum",
#             "other_transaction_fees": "sum",
#             "platform_fee": "sum",
#             "rembursement_fee": "sum",
#             "advertising_total": "sum",
#             # "reimbursement_vs_sales": "sum",
#             "cm2_profit": "sum",
            
#             # "asp": "sum",
#             # "rembursment_vs_cm2_margins": "sum",
#             "shipment_charges": "sum",
#             "unit_wise_profitability": "sum",  # Add this column to df before grouping if needed
#             "user_id": "first"  # or "sum" if you want to repeat user_id for each group
#         }).reset_index()
#         sku_grouped["product_name"] = sku_grouped["product_name"].astype(str).str.strip()
#         sku_grouped["cm2_margins"] = sku_grouped.apply(
#             lambda row: (row["cm2_profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
#             axis=1
#         )
#         print(sku_grouped[["product_name", "cm2_margins"]])
#         sku_grouped["acos"] = sku_grouped.apply(
#             lambda row: (row["advertising_total"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
#             axis=1
#         )
#         print(sku_grouped[["product_name", "acos"]])
#         sku_grouped["rembursment_vs_cm2_margins"] = sku_grouped.apply(
#             lambda row: (row["rembursement_fee"] / row["cm2_profit"]) * 100 if row["cm2_profit"] != 0 else 0,
#             axis=1
#         )
#         print(sku_grouped[["product_name", "rembursment_vs_cm2_margins"]])
#         sku_grouped["reimbursement_vs_sales"] = sku_grouped.apply(
#             lambda row: (row["rembursement_fee"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
#             axis=1
#         )
#         print(sku_grouped[["product_name", "reimbursement_vs_sales"]])
#         sku_grouped["profit_percentage"] = sku_grouped.apply(
#             lambda row: (row["profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
#             axis=1
#         )
#         print(sku_grouped[["product_name", "profit_percentage"]])

#         sku_grouped["asp"] = sku_grouped.apply(
#             lambda row: (row["net_sales"] / row["quantity"])  if row["quantity"] != 0 else 0,
#             axis=1
#         )
#         print(sku_grouped[["product_name", "asp"]])
#         sku_grouped["unit_wise_profitability"] = sku_grouped.apply(
#             lambda row: (row["profit"] / row["quantity"])  if row["quantity"] != 0 else 0,
#             axis=1
#         )
#         print(sku_grouped[["product_name", "unit_wise_profitability"]])


#         total_sales = abs(sku_grouped["net_sales"].sum())  # lowercase column name
#         total_profit = abs(sku_grouped["profit"].sum())
#         print(total_profit)
#         print(total_sales)

#         sku_grouped["profit_mix"] = sku_grouped.apply(
#             lambda row: (row["profit"] / total_profit) * 100 if total_profit != 0 else 0,
#             axis=1
#         )

#         sku_grouped["sales_mix"] = sku_grouped.apply(
#             lambda row: (row["net_sales"] / total_sales) * 100 if total_sales != 0 else 0,
#             axis=1
#         )

        
        
#         print(sku_grouped[["product_name", "profit_mix"]])
        
        
#         print(sku_grouped[["product_name", "sales_mix"]])

        


#         total_row = sku_grouped[sku_grouped["product_name"].str.lower() == "total"]
#         other_rows = sku_grouped[sku_grouped["product_name"].str.lower() != "total"]

#         # Sort other rows by profit in ascending order
#         other_rows = other_rows.sort_values(by="profit", ascending=False)

#         # Concatenate the sorted rows with the total row at the end
#         sku_grouped = pd.concat([other_rows, total_row], ignore_index=True)

#         with engine.begin() as conn:
#             conn.execute(text(f"DROP TABLE IF EXISTS {quarter_table}"))



#             conn.execute(text(f"""
#                 CREATE TABLE IF NOT EXISTS {quarter_table} (
#                     id SERIAL PRIMARY KEY,
#                     product_name TEXT,
#                     price_in_gbp DOUBLE PRECISION,
#                     product_sales DOUBLE PRECISION,
#                     promotional_rebates DOUBLE PRECISION,
#                     promotional_rebates_tax DOUBLE PRECISION,
#                     product_sales_tax DOUBLE PRECISION,
#                     selling_fees DOUBLE PRECISION,
#                     refund_selling_fees DOUBLE PRECISION,
#                     fba_fees DOUBLE PRECISION,
#                     other DOUBLE PRECISION,
#                     marketplace_facilitator_tax DOUBLE PRECISION,
#                     shipping_credits_tax DOUBLE PRECISION,
#                     giftwrap_credits_tax DOUBLE PRECISION,
#                     postage_credits DOUBLE PRECISION,
#                     gift_wrap_credits DOUBLE PRECISION,
#                     net_sales DOUBLE PRECISION,
#                     net_taxes DOUBLE PRECISION,
#                     net_credits DOUBLE PRECISION,
#                     profit DOUBLE PRECISION,
#                     profit_percentage DOUBLE PRECISION,
#                     amazon_fee DOUBLE PRECISION,
#                     quantity INTEGER,
#                     cost_of_unit_sold DOUBLE PRECISION,
#                     other_transaction_fees DOUBLE PRECISION,
#                     platform_fee DOUBLE PRECISION,
#                     rembursement_fee DOUBLE PRECISION,
#                     advertising_total DOUBLE PRECISION,
#                     reimbursement_vs_sales DOUBLE PRECISION,
#                     cm2_profit DOUBLE PRECISION,
#                     cm2_margins DOUBLE PRECISION,
#                     acos DOUBLE PRECISION,
#                     asp DOUBLE PRECISION,
#                     rembursment_vs_cm2_margins DOUBLE PRECISION,
#                     sales_mix DOUBLE PRECISION,
#                     profit_mix DOUBLE PRECISION,
#                     shipment_charges DOUBLE PRECISION, 
#                     unit_wise_profitability DOUBLE PRECISION,
#                     user_id INTEGER
#                 )
#             """))


#             # Insert data into the quarterly table (merge existing)
#             sku_grouped.columns = sku_grouped.columns.str.lower()  # 👈 Ensures lowercase headers
#             sku_grouped.to_sql(quarter_table, conn, if_exists="replace", index=False)
#             conn.commit()
#             print(f"✅ Quarterly SKU-wise data saved to `{quarter_table}`")

#     except Exception as e:
#         print(f"❌ Error: {e}")
#     finally:
#         conn.close()


def process_global_quarterly_skuwise_data(user_id, country, month, year, q, db_url):
    engine = create_engine(db_url)
    conn = engine.connect()
    country = "global"  # base global (USD) ke liye

    try:
        # Define quarter months (same logic)
        quarter_months = {
            "quarter1": ["january", "february", "march"],
            "quarter2": ["april", "may", "june"],
            "quarter3": ["july", "august", "september"],
            "quarter4": ["october", "november", "december"]
        }

        month = month.lower()
        quarter_key = None
        months_for_quarter = None

        # ⬇️ yahi logic tha, sirf quarter_key / months_for_quarter store kar liya
        for q_name, months in quarter_months.items():
            if month in months:
                quarter_key = q_name            # e.g. "quarter2"
                months_for_quarter = months     # e.g. ["april","may","june"]
                break
        else:
            print("Invalid month provided.")
            return

        # 4 source tables + unka "country" name jo quarterly table me use hoga
        config_list = [
            (f"skuwisemonthly_{user_id}",      "global"),       # existing (USD)
            (f"skuwisemonthlyind_{user_id}",  "global_inr"),   # INR
            (f"skuwisemonthlycan_{user_id}",  "global_cad"),   # CAD
            (f"skuwisemonthlygbp_{user_id}",  "global_gbp"),   # GBP base
        ]

        # ---------- LOOP: same logic har currency table ke liye ----------
        for source_table, logical_country in config_list:
            print(f"\n==== Processing quarterly for source={source_table}, country={logical_country} ====")

            # Tumhara hi pattern:
            # quarter2_{user_id}_{country}_{year}_table
            quarter_table = f"{quarter_key}_{user_id}_{logical_country}_{year}_table"

            # Get only available months from THIS source table
            month_params = {f"m{i}": m for i, m in enumerate(months_for_quarter)}
            placeholders = ', '.join(f":m{i}" for i in range(len(months_for_quarter)))
            available_months_query = text(f"""
                SELECT DISTINCT LOWER(month) AS month
                FROM {source_table}
                WHERE LOWER(month) IN ({placeholders}) AND year = :year
            """)
            result = conn.execute(available_months_query, {**month_params, "year": year})
            available_months_df = pd.DataFrame(result.fetchall(), columns=["month"])
            selected_months = available_months_df["month"].tolist()

            if not selected_months:
                print(f"No available months found in {source_table} for quarter {quarter_key}.")
                continue

            # Read full data for selected months from THIS source
            placeholders = ', '.join(['%s'] * len(selected_months))
            query = f"""
                SELECT "user_id","price_in_gbp", "product_sales", "promotional_rebates", "promotional_rebates_tax",
                "product_sales_tax", "selling_fees", "refund_selling_fees", "fba_fees", "other",
                "marketplace_facilitator_tax", "shipping_credits_tax", "giftwrap_credits_tax",
                "postage_credits", "gift_wrap_credits", "net_sales", "net_taxes", "net_credits",
                "profit", "profit_percentage", "amazon_fee", "sales_mix", "profit_mix", "quantity",
                "cost_of_unit_sold", "other_transaction_fees", "platform_fee", "rembursement_fee",
                "advertising_total", "reimbursement_vs_sales", "cm2_profit", "cm2_margins", "acos",
                "asp", "rembursment_vs_cm2_margins", "product_name","shipment_charges","unit_wise_profitability"
                FROM {source_table}
                WHERE LOWER(month) IN ({placeholders}) AND year = %s
            """
            df = pd.read_sql(query, conn, params=tuple(selected_months + [year]))

            if df.empty:
                print(f"No data for selected months in {source_table}.")
                continue

            # ---------- AGGREGATION (same as tumhara) ----------
            sku_grouped = df.groupby('product_name').agg({
                "price_in_gbp": "mean",
                "product_sales": "sum",
                "promotional_rebates": "sum",
                "promotional_rebates_tax": "sum",
                "product_sales_tax": "sum",
                "selling_fees": "sum",
                "refund_selling_fees": "sum",
                "fba_fees": "sum",
                "other": "sum",
                "marketplace_facilitator_tax": "sum",
                "shipping_credits_tax": "sum",
                "giftwrap_credits_tax": "sum",
                "postage_credits": "sum",
                "gift_wrap_credits": "sum",
                "net_sales": "sum",
                "net_taxes": "sum",
                "net_credits": "sum",
                "profit": "sum",
                "amazon_fee": "sum",
                "quantity": "sum",
                "cost_of_unit_sold": "sum",
                "other_transaction_fees": "sum",
                "platform_fee": "sum",
                "rembursement_fee": "sum",
                "advertising_total": "sum",
                "cm2_profit": "sum",
                "shipment_charges": "sum",
                "unit_wise_profitability": "sum",
                "user_id": "first"
            }).reset_index()

            sku_grouped["product_name"] = sku_grouped["product_name"].astype(str).str.strip()

            sku_grouped["cm2_margins"] = sku_grouped.apply(
                lambda row: (row["cm2_profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            sku_grouped["acos"] = sku_grouped.apply(
                lambda row: (row["advertising_total"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            sku_grouped["rembursment_vs_cm2_margins"] = sku_grouped.apply(
                lambda row: (row["rembursement_fee"] / row["cm2_profit"]) * 100 if row["cm2_profit"] != 0 else 0,
                axis=1
            )
            sku_grouped["reimbursement_vs_sales"] = sku_grouped.apply(
                lambda row: (row["rembursement_fee"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            sku_grouped["profit_percentage"] = sku_grouped.apply(
                lambda row: (row["profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )

            sku_grouped["asp"] = sku_grouped.apply(
                lambda row: (row["net_sales"] / row["quantity"])  if row["quantity"] != 0 else 0,
                axis=1
            )
            sku_grouped["unit_wise_profitability"] = sku_grouped.apply(
                lambda row: (row["profit"] / row["quantity"])  if row["quantity"] != 0 else 0,
                axis=1
            )

            temp = sku_grouped[sku_grouped["product_name"].str.lower() != "total"]

            total_sales = abs(temp["net_sales"].sum())
            total_profit = abs(temp["profit"].sum())

            print(total_profit)
            print(total_sales)

            sku_grouped["profit_mix"] = sku_grouped.apply(
                lambda row: (row["profit"] / total_profit) * 100 if total_profit != 0 else 0,
                axis=1
            )

            sku_grouped["sales_mix"] = sku_grouped.apply(
                lambda row: (row["net_sales"] / total_sales) * 100 if total_sales != 0 else 0,
                axis=1
            )

            total_row = sku_grouped[sku_grouped["product_name"].str.lower() == "total"]
            other_rows = sku_grouped[sku_grouped["product_name"].str.lower() != "total"]
            other_rows = other_rows.sort_values(by="profit", ascending=False)
            sku_grouped = pd.concat([other_rows, total_row], ignore_index=True)

            # ---------- Create + Insert into quarterly table for this currency ----------
            with engine.begin() as conn_inner:
                conn_inner.execute(text(f"DROP TABLE IF EXISTS {quarter_table}"))

                conn_inner.execute(text(f"""
                    CREATE TABLE IF NOT EXISTS {quarter_table} (
                        id SERIAL PRIMARY KEY,
                        product_name TEXT,
                        price_in_gbp DOUBLE PRECISION,
                        product_sales DOUBLE PRECISION,
                        promotional_rebates DOUBLE PRECISION,
                        promotional_rebates_tax DOUBLE PRECISION,
                        product_sales_tax DOUBLE PRECISION,
                        selling_fees DOUBLE PRECISION,
                        refund_selling_fees DOUBLE PRECISION,
                        fba_fees DOUBLE PRECISION,
                        other DOUBLE PRECISION,
                        marketplace_facilitator_tax DOUBLE PRECISION,
                        shipping_credits_tax DOUBLE PRECISION,
                        giftwrap_credits_tax DOUBLE PRECISION,
                        postage_credits DOUBLE PRECISION,
                        gift_wrap_credits DOUBLE PRECISION,
                        net_sales DOUBLE PRECISION,
                        net_taxes DOUBLE PRECISION,
                        net_credits DOUBLE PRECISION,
                        profit DOUBLE PRECISION,
                        profit_percentage DOUBLE PRECISION,
                        amazon_fee DOUBLE PRECISION,
                        quantity INTEGER,
                        cost_of_unit_sold DOUBLE PRECISION,
                        other_transaction_fees DOUBLE PRECISION,
                        platform_fee DOUBLE PRECISION,
                        rembursement_fee DOUBLE PRECISION,
                        advertising_total DOUBLE PRECISION,
                        reimbursement_vs_sales DOUBLE PRECISION,
                        cm2_profit DOUBLE PRECISION,
                        cm2_margins DOUBLE PRECISION,
                        acos DOUBLE PRECISION,
                        asp DOUBLE PRECISION,
                        rembursment_vs_cm2_margins DOUBLE PRECISION,
                        sales_mix DOUBLE PRECISION,
                        profit_mix DOUBLE PRECISION,
                        shipment_charges DOUBLE PRECISION, 
                        unit_wise_profitability DOUBLE PRECISION,
                        user_id INTEGER
                    )
                """))

                sku_grouped.columns = sku_grouped.columns.str.lower()
                sku_grouped.to_sql(quarter_table, conn_inner, if_exists="replace", index=False)
                # conn_inner.commit()  # engine.begin() khud handle karega
                print(f"✅ Quarterly SKU-wise data saved to `{quarter_table}`")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()



def process_global_yearly_skuwise_data(user_id, country, year):

    from sqlalchemy import create_engine, text
    import pandas as pd
    import numpy as np
    # Connect to PostgreSQL database
    engine = create_engine(db_url)
    conn = engine.connect()
    print("enter in global monthly")   
    config_list = [
        (f"skuwisemonthly_{user_id}",      "global"),       # USD (pehle se)
        (f"skuwisemonthlyind_{user_id}",  "global_inr"),   # INR
        (f"skuwisemonthlycan_{user_id}",  "global_cad"),   # CAD
        (f"skuwisemonthlygbp_{user_id}",  "global_gbp"),   # GBP base
    ]
 

    # PostgreSQL table naming - using lowercase for consistency
    # quarter_table = f"skuwiseyearly_{user_id}_{country}_{year}_table"
    # source_table = f"skuwisemonthly_{user_id}"
    
    try:
        for source_table, logical_country in config_list:
            print(f"\n==== Processing global monthly for source_table={source_table}, country={logical_country} ====")

            quarter_table = f"skuwiseyearly_{user_id}_{logical_country}_{year}_table"

        # Fetch yearly data - using parameterized query for PostgreSQL
            yearly_query = f"""
                SELECT "user_id","price_in_gbp", "product_sales", "promotional_rebates", "promotional_rebates_tax",
                "product_sales_tax", "selling_fees", "refund_selling_fees", "fba_fees", "other",
                "marketplace_facilitator_tax", "shipping_credits_tax", "giftwrap_credits_tax",
                "postage_credits", "gift_wrap_credits", "net_sales", "net_taxes", "net_credits",
                "profit", "profit_percentage", "amazon_fee", "sales_mix", "profit_mix", "quantity",
                "cost_of_unit_sold", "other_transaction_fees", "platform_fee", "rembursement_fee",
                "advertising_total", "reimbursement_vs_sales", "cm2_profit", "cm2_margins", "acos",
                "asp", "rembursment_vs_cm2_margins", "product_name","shipment_charges","unit_wise_profitability"
                FROM {source_table}
                WHERE "year" = '{year}'
            """
        
        # Execute query directly without parameters argument
            try:
                df = pd.read_sql(yearly_query, conn)
            except Exception as e:
                print(f"❌ Failed to read from {source_table}: {e}")
                continue

            if df.empty:
                print(f"⚠️ No data found for {month}/{year} in {source_table}")
                continue

            print(df.columns)
        
    
        # Group by SKU for aggregation
            sku_grouped = df.groupby('product_name').agg({
                "price_in_gbp": "mean",
                "product_sales": "sum",
                "promotional_rebates": "sum",
                "promotional_rebates_tax": "sum",
                "product_sales_tax": "sum",
                "selling_fees": "sum",
                "refund_selling_fees": "sum",  # Add this column to df before grouping if needed
                "fba_fees": "sum",
                "other": "sum",
                "marketplace_facilitator_tax": "sum",
                "shipping_credits_tax": "sum",
                "giftwrap_credits_tax": "sum",
                "postage_credits": "sum",
                "gift_wrap_credits": "sum",
                "net_sales": "sum",  # Calculate these columns before grouping
                "net_taxes": "sum",
                "net_credits": "sum",
                "profit": "sum",
                # "profit_percentage": "sum",
                "amazon_fee": "sum",
                # "sales_mix": "sum",
                # "profit_mix": "sum",
                "quantity": "sum",
                "cost_of_unit_sold": "sum",
                "other_transaction_fees": "sum",
                "platform_fee": "sum",
                "rembursement_fee": "sum",
                "advertising_total": "sum",
                # "reimbursement_vs_sales": "sum",
                "cm2_profit": "sum",
                # "cm2_margins": "sum",
                # "acos": "sum",
                # "asp": "sum",
                # "rembursment_vs_cm2_margins": "sum",
                "shipment_charges": "sum",
                "unit_wise_profitability": "sum", 
                "user_id": "first"  # or "sum" if you want to repeat user_id for each group
            }).reset_index()
            sku_grouped["product_name"] = sku_grouped["product_name"].astype(str).str.strip()
            sku_grouped["cm2_margins"] = sku_grouped.apply(
                lambda row: (row["cm2_profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "cm2_margins"]])
            sku_grouped["acos"] = sku_grouped.apply(
                lambda row: (row["advertising_total"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "acos"]])
            sku_grouped["rembursment_vs_cm2_margins"] = sku_grouped.apply(
                lambda row: (row["rembursement_fee"] / row["cm2_profit"]) * 100 if row["cm2_profit"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "rembursment_vs_cm2_margins"]])
            sku_grouped["reimbursement_vs_sales"] = sku_grouped.apply(
                lambda row: (row["rembursement_fee"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "reimbursement_vs_sales"]])

            sku_grouped["profit_percentage"] = sku_grouped.apply(
                lambda row: (row["profit"] / row["net_sales"]) * 100 if row["net_sales"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "profit_percentage"]])

            sku_grouped["asp"] = sku_grouped.apply(
                lambda row: (row["net_sales"] / row["quantity"])  if row["quantity"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "asp"]])
            sku_grouped["unit_wise_profitability"] = sku_grouped.apply(
                lambda row: (row["profit"] / row["quantity"])  if row["quantity"] != 0 else 0,
                axis=1
            )
            print(sku_grouped[["product_name", "unit_wise_profitability"]])

            temp = sku_grouped[sku_grouped["product_name"].str.lower() != "total"]

            total_sales = abs(temp["net_sales"].sum())
            total_profit = abs(temp["profit"].sum())

            print(total_profit)
            print(total_sales)

            sku_grouped["profit_mix"] = sku_grouped.apply(
                lambda row: (row["profit"] / total_profit) * 100 if total_profit != 0 else 0,
                axis=1
            )

            sku_grouped["sales_mix"] = sku_grouped.apply(
                lambda row: (row["net_sales"] / total_sales) * 100 if total_sales != 0 else 0,
                axis=1
            )

            
            
            print(sku_grouped[["product_name", "profit_mix"]])
            
            
            print(sku_grouped[["product_name", "sales_mix"]])



            total_row = sku_grouped[sku_grouped["product_name"].str.lower() == "total"]
            other_rows = sku_grouped[sku_grouped["product_name"].str.lower() != "total"]

    # Sort other rows by profit in ascending order
            other_rows = other_rows.sort_values(by="profit", ascending=False)

    # Concatenate the sorted rows with the total row at the end
            sku_grouped = pd.concat([other_rows, total_row], ignore_index=True)

            # Drop existing table if it exists
            conn.execute(text(f"DROP TABLE IF EXISTS {quarter_table}"))

            # Create table with proper PostgreSQL syntax
            create_table_query = f"""
                CREATE TABLE IF NOT EXISTS {quarter_table} (
                    id SERIAL PRIMARY KEY,
                    product_name TEXT,
                    price_in_gbp DOUBLE PRECISION,
                    product_sales DOUBLE PRECISION,
                    promotional_rebates DOUBLE PRECISION,
                    promotional_rebates_tax DOUBLE PRECISION,
                    product_sales_tax DOUBLE PRECISION,
                    selling_fees DOUBLE PRECISION,
                    refund_selling_fees DOUBLE PRECISION,
                    fba_fees DOUBLE PRECISION,
                    other DOUBLE PRECISION,
                    marketplace_facilitator_tax DOUBLE PRECISION,
                    shipping_credits_tax DOUBLE PRECISION,
                    giftwrap_credits_tax DOUBLE PRECISION,
                    postage_credits DOUBLE PRECISION,
                    gift_wrap_credits DOUBLE PRECISION,
                    net_sales DOUBLE PRECISION,
                    net_taxes DOUBLE PRECISION,
                    net_credits DOUBLE PRECISION,
                    profit DOUBLE PRECISION,
                    profit_percentage DOUBLE PRECISION,
                    amazon_fee DOUBLE PRECISION,
                    sales_mix DOUBLE PRECISION,
                    profit_mix DOUBLE PRECISION,
                    quantity INTEGER,
                    cost_of_unit_sold DOUBLE PRECISION,
                    other_transaction_fees DOUBLE PRECISION,
                    platform_fee DOUBLE PRECISION,
                    rembursement_fee DOUBLE PRECISION,
                    advertising_total DOUBLE PRECISION,
                    reimbursement_vs_sales DOUBLE PRECISION,
                    cm2_profit DOUBLE PRECISION,
                    cm2_margins DOUBLE PRECISION,
                    acos DOUBLE PRECISION,
                    asp DOUBLE PRECISION,
                    rembursment_vs_cm2_margins DOUBLE PRECISION,
                    shipment_charges DOUBLE PRECISION,
                    unit_wise_profitability DOUBLE PRECISION,
                    user_id INTEGER
                )
            """
            conn.execute(text(create_table_query))
            
            # Ensure column names match the database (PostgreSQL is case-sensitive)
            sku_grouped.columns = [col.lower() for col in sku_grouped.columns]
            
            # Use to_sql with correct parameters for PostgreSQL
            sku_grouped.to_sql(quarter_table, conn, if_exists="replace", index=False, 
                            schema="public", method="multi", chunksize=1000)
            
            conn.commit()
            print(f"Yearly SKU-wise data saved in {quarter_table}!")

       

    except Exception as e:
        print(f"Error processing yearly SKU-wise data: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()



