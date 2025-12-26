from flask_mail import Message
from app import mail
import os
from sqlalchemy import create_engine
import re
from sqlalchemy import text
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError
from app import db
from app.models.user_models import Email


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

def metric_box(label, value, is_negative=False):
    """Render one KPI box. Sign/color is controlled by is_negative."""
    color = "#d32f2f" if is_negative else "#2e7d32"
    sign = "-" if is_negative else "+"
    return f"""
    <td style="padding:10px; background:#f9fafb; border-radius:6px; text-align:center;">
      <div style="font-size:11px; color:#666;">{label}</div>
      <div style="font-size:16px; font-weight:bold; color:{color};">
        {sign}{abs(value):.2f}%
      </div>
    </td>
    """

def _metric_is_negative(description: str, keyword_pattern: str, extracted_value: float | None) -> bool:
    """Infer negativity from (a) explicit negative numeric value, else (b) nearby words like decrease/dip/down."""
    if extracted_value is not None:
        try:
            if float(extracted_value) < 0:
                return True
        except Exception:
            pass

    if not description:
        return False

    neg_words = r"(decrease|decreased|dip|dipped|down|fall|falling|fell|decline|declined|drop|dropped|reduced|reduction)"
    patt = re.compile(rf"({keyword_pattern}).{{0,50}}{neg_words}|{neg_words}.{{0,50}}({keyword_pattern})", re.IGNORECASE)
    return bool(patt.search(description))


def render_sku_card(sku):
    negatives = sku.get("negatives") or {}
    asp_neg = bool(negatives.get("ASP", False))
    units_neg = bool(negatives.get("Units", False))
    mix_neg = bool(negatives.get("Sales Mix", False))
    profit_neg = bool(negatives.get("Profit", False))

    return f"""
    <div style="
      border:1px solid #e5e7eb;
      border-radius:12px;
      padding:16px;
      margin-bottom:20px;
      background:#ffffff;
    ">
      <div style="font-size:15px; font-weight:600; margin-bottom:10px;">
        {sku['product']}
      </div>

      <table width="100%" cellspacing="8">
        <tr>
          {metric_box("ASP Change", sku["metrics"]["ASP"], asp_neg)}
          {metric_box("Units", sku["metrics"]["Units"], units_neg)}
          {metric_box("Sales Mix", sku["metrics"]["Sales Mix"], mix_neg)}
          {metric_box("Profit", sku["metrics"]["Profit"], profit_neg)}
        </tr>
      </table>

      <p style="font-size:13px; color:#555; line-height:1.6; margin-top:12px;">
        {sku["description"]}
      </p>

      <div style="
        margin-top:12px;
        padding:12px;
        background:#fdecc8;
        border-left:4px solid #f59e0b;
        font-size:13px;
        font-weight:500;
        border-radius:6px;
      ">
        <strong>Action:</strong> {sku["action"]}
      </div>
    </div>
    """




def _extract_pct(text: str, pattern: str):
    """Return float percentage extracted using regex pattern, else None."""
    m = re.search(pattern, text, flags=re.IGNORECASE)
    if not m:
        return None
    try:
        return float(m.group(1))
    except Exception:
        return None


def parse_action_bullet_to_card(bullet: str) -> dict | None:
    """
    Convert one AI action_bullet string into the dict expected by render_sku_card().
    Expected bullet format (from build_ai_summary prompt):
      Product name - <name>

      <2 sentence paragraph...>

      <one action sentence>
    """
    if not bullet or not str(bullet).strip():
        return None

    lines = [l.rstrip() for l in str(bullet).splitlines()]
    # remove leading/trailing empty lines
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()

    if not lines:
        return None

    # Product line
    product = lines[0]
    if product.lower().startswith("product name"):
        # Product name - Classic
        parts = product.split("-", 1)
        if len(parts) == 2 and parts[1].strip():
            product = parts[1].strip()

    # Action line = last non-empty line
    action = ""
    for l in reversed(lines):
        if l.strip():
            action = l.strip()
            break

    # Description = everything between first line and last action line (excluding blank lines)
    middle = []
    for l in lines[1:]:
        if l.strip() and l.strip() != action:
            middle.append(l.strip())
    description = " ".join(middle).strip()

    # Extract % metrics from the description text (best-effort)
    # Extract % metrics from the description text (best-effort)
    # Note: avoid sales_mix being caught by generic sales regex by matching sales mix first.
    mix_val = _extract_pct(description, r"sales\s*mix[^%]*?by\s*([+-]?\d+(?:\.\d+)?)%")
    asp_val = _extract_pct(description, r"\bASP\b[^%]*?by\s*([+-]?\d+(?:\.\d+)?)%")
    units_val = _extract_pct(description, r"\bunits?\b[^%]*?by\s*([+-]?\d+(?:\.\d+)?)%")
    profit_val = _extract_pct(description, r"\bprofit(?!\s*margin)\b[^%]*?by\s*([+-]?\d+(?:\.\d+)?)%")

    # If numbers come without sign but text says decrease/dip/down, infer negatives from description.
    negatives = {
        "ASP": _metric_is_negative(description, r"asp", asp_val),
        "Units": _metric_is_negative(description, r"units?", units_val),
        "Sales Mix": _metric_is_negative(description, r"sales\s*mix|mix", mix_val),
        "Profit": _metric_is_negative(description, r"profit", profit_val),
    }

    def _abs_or_zero(x):
        return abs(x) if x is not None else 0.0

    metrics = {
        "ASP": _abs_or_zero(asp_val),
        "Units": _abs_or_zero(units_val),
        "Sales Mix": _abs_or_zero(mix_val),
        "Profit": _abs_or_zero(profit_val),
    }


    return {
        "product": product,
        "metrics": metrics,
        "negatives": negatives,
        "description": description or "",
        "action": action or "",
    }



def parse_actions_to_cards(actions: list) -> list:
    """Convert list[str] action bullets to list[dict] cards, skipping failures."""
    cards = []
    for a in (actions or []):
        c = parse_action_bullet_to_card(a)
        if c:
            cards.append(c)
    return cards


# ================== MAIN EMAIL ==================


def send_live_bi_email(
    to_email,
    overall_summary,
    country,
    prev_label,
    curr_label,
    deep_link_token=None,
    overall_actions=None,   # ✅ bullets (strings)
    sku_actions=None,       # ✅ structured list of dicts for cards
):
    if not to_email:
        print("[WARN] No email provided.")
        return

    subject = f"[Phormula] Live MTD Business Insights - {country.upper()} ({curr_label})"

    summary_html = "".join(f"<li>{s}</li>" for s in (overall_summary or []))

    # ✅ If structured SKU actions exist, render cards.
    # If only overall_actions (list[str] with multi-line bullets) exist, parse them into cards
    # so the email shows the same SKU-wise card UI as the frontend.
    sku_section_html = ""
    if sku_actions:
        sku_section_html = "".join(render_sku_card(sku) for sku in sku_actions)
    elif overall_actions:
        parsed_cards = parse_actions_to_cards(overall_actions)
        if parsed_cards:
            sku_section_html = "".join(render_sku_card(sku) for sku in parsed_cards)
        else:
            # fallback: plain bullets (should be rare)
            sku_section_html = f"""
            <ul style="font-size:14px; color:#555;">
              {''.join(f"<li>{a}</li>" for a in overall_actions)}
            </ul>
            """
    else:
        sku_section_html = """
        <p style="font-size:13px; color:#777;">
          No SKU-wise actions available for this run.
        </p>
        """

    deep_link_html = ""
    if deep_link_token:
        dashboard_url = f"https://app.phormula.io/live-bi?token={deep_link_token}&country={country}"
        deep_link_html = f"""
        <p style="text-align:center; margin-top:24px;">
          <a href="{dashboard_url}"
             style="display:inline-block; background:#37455F; color:#f8edcf;
                    padding:10px 24px; text-decoration:none; border-radius:8px;
                    font-size:14px;">
            Open Live BI Dashboard
          </a>
        </p>
        """

    html_body = f"""
    <html>
    <body style="font-family:Lato,Arial,sans-serif; background:#f4f4f4; padding:20px;">
      <div style="max-width:700px; margin:auto; background:#fff;
                  padding:24px; border-radius:10px; border:2px solid #5EA68E;">

        <img src="https://i.postimg.cc/43T3k86Z/logo.png"
             style="width:180px; display:block; margin:0 auto 16px;" />

        <h2 style="text-align:center; color:#37455F;">
          Live MTD vs Previous Period – Business Insights
        </h2>

        <p style="text-align:center; font-size:13px; color:#777;">
          Country: <strong>{country.upper()}</strong><br/>
          Previous: {prev_label} | Current: {curr_label}
        </p>

        <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />

        <h3 style="color:#37455F;">Overall Summary</h3>
        <ul style="font-size:14px; color:#555;">
          {summary_html}
        </ul>

        <h3 style="color:#37455F; margin-top:28px;">
          🎯 Actions
        </h3>

        {sku_section_html}

        {deep_link_html}

        <p style="font-size:12px; color:#999; margin-top:24px;">
          This email was auto-generated from Live BI.
        </p>
        <p style="font-size:12px; color:#999;">
          Support: <a href="mailto:care@phormula.io">care@phormula.io</a>
        </p>
      </div>
    </body>
    </html>
    """

    msg = Message(
        subject,
        sender=("Phormula Care Team", "care@phormula.io"),
        recipients=[to_email],
    )
    msg.html = html_body

    try:
        mail.send(msg)
        print(f"[INFO] Live BI email sent to {to_email}")
    except Exception as e:
        print(f"[ERROR] Email send failed: {e}")





def has_recent_bi_email(user_id: int, country: str, hours: int = 24) -> bool:
    """
    Returns True if an email was sent within last `hours` for this user+country.
    Uses ORM model Email (table: email).
    """
    try:
        cutoff = datetime.utcnow() - timedelta(hours=hours)

        rec = (
            db.session.query(Email)
            .filter(
                Email.user_id == user_id,
                Email.country == country.lower(),
                Email.sent_at >= cutoff
            )
            .first()
        )
        return rec is not None

    except SQLAlchemyError as e:
        # Fail-safe: if DB has an issue, do NOT spam.
        print(f"[WARN] has_recent_bi_email DB error (fail-safe=True): {e}")
        return True


def mark_bi_email_sent(user_id: int, country: str) -> None:
    """
    Upsert (one row per user+country).
    Updates sent_at if exists else inserts.
    """
    try:
        country = country.lower()

        rec = (
            db.session.query(Email)
            .filter_by(user_id=user_id, country=country)
            .first()
        )

        if rec:
            rec.sent_at = datetime.utcnow()
        else:
            rec = Email(user_id=user_id, country=country)
            db.session.add(rec)

        db.session.commit()

    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"[WARN] mark_bi_email_sent DB error: {e}")




def get_user_email_by_id(user_id: int) -> str | None:
    """
    Fetch email from public.user table.
    Uses double quotes because 'user' is a reserved keyword.
    """
    try:
        query = text("""
            SELECT email
            FROM "user"
            WHERE id = :uid
            LIMIT 1
        """)
        with engine_hist.connect() as conn:
            row = conn.execute(query, {"uid": user_id}).fetchone()

        if not row:
            print(f"[WARN] No user found with id={user_id}")
            return None

        # row may be tuple or Row
        return row[0] if isinstance(row, tuple) else row.email

    except Exception as e:
        print(f"[ERROR] Failed to fetch user email for id={user_id}: {e}")
        return None

