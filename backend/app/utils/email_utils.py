from flask_mail import Message
from app import mail
import os
from sqlalchemy import create_engine


db_url = os.getenv("DATABASE_URL")

engine_hist = create_engine(db_url)


def test_send_email():
    from flask_mail import Message
    from app import mail  # Assuming you've imported mail correctly
    
    msg = Message(
        'Test Email', 
        sender=("Phormula Care Team", "care@phormula.io"),
        recipients=["test@example.com"]
    )
    msg.body = "This is a test email."
    
    try:
        mail.send(msg)
        print("Test email sent successfully.")
    except Exception as e:
        print(f"Failed to send test email: {e}")



def send_welcome_and_verification_emails(email, verification_link):
    try:               
        welcome_msg = Message(
            'Welcome to Phormula', 
            sender=("Phormula Care Team", "care@phormula.io"),
            recipients=[email]
        )
        # welcome_msg.sender = ("Phormula Care Team", "care@phormula.io")
        # http://localhost:3000/Logo_Phormula.png
        welcome_msg.html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Phormula</title>
</head>
<body style="font-family: 'Lato', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; border: 2px solid#5EA68E; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
        <img src="https://i.postimg.cc/43T3k86Z/logo.png" alt="Phormula Logo" style="width: 200px; height: auto; display: block; margin: 0 auto 20px;" />
        <p style="font-size: 14px; line-height: 1.6; color: #555;">Hey {email},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #555;">Welcome to Phormula!</p>
        <p style="font-size: 14px; line-height: 1.6; color: #555;">We are excited to have you on board. You are now part of our global community of D2C Brands.</p>
        <p style="font-size: 14px; line-height: 1.6; color: #555;">To explore the Phormula Tool, please verify your email address by clicking the button below:</p>
        <a href="{verification_link}" style="display: inline-block; background-color: #37455F; color: #f8edcf; padding: 8px 20px; text-align: center; text-decoration: none; font-size: 14px; border-radius: 8px; box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2); transition: background-color 0.3s ease; cursor: pointer;">Activate My Account</a>
        <p style="font-size: 14px; color: #777;">If you did not request this email, you can safely ignore it.</p>
        <p style="font-size: 14px; color: #555;">If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:care@phormula.io" style="color: #007bff;">care@phormula.io</a></p>
        <p style="font-size: 14px; color: #555;">Best regards, <br>The Phormula Team</p>
    </div>
</body>
</html>

        """
        
        # Ensure content is non-empty before sending
        if not welcome_msg.html:
            print("Error: HTML content is empty")
            return  # Exit if content is empty

        # Send the welcome email
        mail.send(welcome_msg)

    except Exception as e:
        print(f"Failed to send email to {email}: {e}")
        raise e



def send_reset_email(to_email, reset_url):
    msg = Message(
        'Password Reset Request',
        sender='care@phormula.io',
        recipients=[to_email]
    )

    # HTML email body
    html_body = f"""
    <html>
    <body style="font-family: 'Lato', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; border: 2px solid#5EA68E; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
        <img src="https://i.postimg.cc/43T3k86Z/logo.png" alt="Phormula Logo" style="width: 200px; height: auto; display: block; margin: 0 auto 20px;" />
        <p style="font-size: 14px; line-height: 1.6; color: #555;"> Dear {to_email},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #555;">We have received a request to reset your password. To proceed, please click the button below:</p>        
        <a href="{reset_url}" style="display: inline-block; background-color: #37455F; color: #f8edcf; padding: 8px 20px; text-align: center; text-decoration: none; font-size: 14px; border-radius: 8px; box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2); transition: background-color 0.3s ease; cursor: pointer;">Reset Your Password</a>        
        <p style="font-size: 14px; color: #777;">If you did not request this change, please disregard this email.</p>
        <p style="font-size: 14px; color: #555;">If you need assistance, feel free to contact our support team at <a href="mailto:care@phormula.io" style="color: #007bff;">care@phormula.io</a>.</p>
        <p style="font-size: 14px; color: #555;">Best regards, <br>The Phormula Team</p>
        </div>
    </body>
    </html>
    """

    msg.html = html_body
    mail.send(msg)

# def send_live_bi_email(
#     to_email,
#     overall_summary,
#     overall_actions,
#     country,
#     prev_label,
#     curr_label,
#     deep_link_token=None,
# ):
#     if not to_email:
#         print("[WARN] No email provided for live BI email.")
#         return

#     subject = f"[Phormula] Live MTD Business Insights - {country.upper()} ({curr_label})"

#     summary_html = "".join(f"<li>{s}</li>" for s in overall_summary)

#     actions_html = ""
#     for a in overall_actions:
#         actions_html += f"<li style='margin-bottom: 16px; white-space: pre-line;'>{a}</li>"

#     # Optional deep link button
#     deep_link_html = ""
#     if deep_link_token:
#         # Adjust frontend URL as per your app
#         dashboard_url = f"https://app.phormula.io/live-bi?token={deep_link_token}&country={country}"
#         deep_link_html = f"""
#         <p style="text-align: center; margin-top: 24px;">
#           <a href="{dashboard_url}"
#              style="display: inline-block; background-color: #37455F; color: #f8edcf; padding: 10px 24px;
#                     text-decoration: none; border-radius: 8px; font-size: 14px; box-shadow: 0 0 10px rgba(0,0,0,0.15);">
#             Open Live BI Dashboard
#           </a>
#         </p>
#         """

#     html_body = f"""
#     <html>
#     <body style="font-family: 'Lato', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
#       <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 8px; border: 2px solid #5EA68E;">
#         <img src="https://i.postimg.cc/43T3k86Z/logo.png" alt="Phormula Logo"
#              style="width: 200px; height: auto; display: block; margin: 0 auto 20px;" />

#         <h2 style="text-align: center; color: #37455F; margin-bottom: 8px;">
#           Live MTD vs Previous Period – Business Insights
#         </h2>
#         <p style="text-align: center; font-size: 13px; color: #777; margin-top: 0;">
#           Country: <strong>{country.upper()}</strong><br/>
#           Previous: {prev_label} &nbsp; | &nbsp; Current: {curr_label}
#         </p>

#         <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

#         <h3 style="color: #37455F; margin-bottom: 8px;">Overall summary</h3>
#         <ul style="padding-left: 20px; font-size: 14px; color: #555;">
#           {summary_html}
#         </ul>

#         <h3 style="color: #37455F; margin-bottom: 8px; margin-top: 24px;">SKU-wise actions</h3>
#         <ol style="padding-left: 20px; font-size: 14px; color: #555;">
#           {actions_html}
#         </ol>

#         {deep_link_html}

#         <p style="font-size: 12px; color: #999; margin-top: 24px;">
#           This email was auto-generated from the Live MTD BI route.
#         </p>
#         <p style="font-size: 12px; color: #999;">
#           For any questions, write to <a href="mailto:care@phormula.io" style="color: #007bff;">care@phormula.io</a>.
#         </p>
#       </div>
#     </body>
#     </html>
#     """

#     msg = Message(
#         subject,
#         sender=("Phormula Care Team", "care@phormula.io"),
#         recipients=[to_email],
#     )
#     msg.html = html_body

#     try:
#         mail.send(msg)
#         print(f"[INFO] Live BI email sent to {to_email}")
#     except Exception as e:
#         print(f"[ERROR] Failed to send Live BI email to {to_email}: {e}")


# from sqlalchemy import text
# from sqlalchemy.exc import ProgrammingError

# def has_recent_bi_email(user_id: int, country: str, hours: int = 24) -> bool:
#     query = text("""
#         SELECT 1
#         FROM bi_email_log
#         WHERE user_id = :uid
#           AND country = :country
#           AND sent_at >= (NOW() - (:hours * INTERVAL '1 hour'))
#         LIMIT 1
#     """)
#     try:
#         with engine_hist.connect() as conn:
#             row = conn.execute(query, {
#                 "uid": user_id,
#                 "country": country.lower(),
#                 "hours": hours,
#             }).fetchone()
#         return row is not None
#     except ProgrammingError as e:
#         # e.g. "relation \"bi_email_log\" does not exist"
#         print(f"[WARN] has_recent_bi_email failed (likely missing table): {e}")
#         # fallback: behave as if no recent email, but DON’T 500
#         return False
#     except Exception as e:
#         print(f"[WARN] has_recent_bi_email error: {e}")
#         return False


# def mark_bi_email_sent(user_id: int, country: str) -> None:
#     query = text("""
#         INSERT INTO bi_email_log (user_id, country, sent_at)
#         VALUES (:uid, :country, NOW())
#     """)
#     try:
#         with engine_hist.begin() as conn:
#             conn.execute(query, {
#                 "uid": user_id,
#                 "country": country.lower(),
#             })
#     except ProgrammingError as e:
#         print(f"[WARN] mark_bi_email_sent failed (likely missing table): {e}")
#     except Exception as e:
#         print(f"[WARN] mark_bi_email_sent error: {e}")

# from sqlalchemy import text

# def get_user_email_by_id(user_id: int) -> str | None:
#     """
#     Fetch email from public.user table.
#     Uses double quotes because 'user' is a reserved keyword.
#     """
#     try:
#         query = text("""
#             SELECT email
#             FROM "user"
#             WHERE id = :uid
#             LIMIT 1
#         """)
#         with engine_hist.connect() as conn:
#             row = conn.execute(query, {"uid": user_id}).fetchone()

#         if not row:
#             print(f"[WARN] No user found with id={user_id}")
#             return None

#         # row may be tuple or Row
#         return row[0] if isinstance(row, tuple) else row.email

#     except Exception as e:
#         print(f"[ERROR] Failed to fetch user email for id={user_id}: {e}")
#         return None


