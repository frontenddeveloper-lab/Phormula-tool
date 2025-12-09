from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from app.models.user_models import User
from app import db, mail
from flask_mail import Message
import secrets
import string

add_member_bp = Blueprint('add_member', __name__)


def send_member_invite_email(email, password, token_name, country):
    """
    Send an invitation email to the newly added member with login credentials
    """
    try:
        msg = Message(
            'Welcome to Phormula - Your Account Has Been Created', 
            sender=("Phormula Care Team", "care@phormula.io"),
            recipients=[email]
        )
        
        # Login URL - adjust this to your frontend login page
        login_url = "http://localhost:3000/login"  # Change to your actual frontend URL
        
        msg.html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Phormula</title>
</head>
<body style="font-family: 'Lato', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; border: 2px solid #5EA68E; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
        <img src="https://i.postimg.cc/43T3k86Z/logo.png" alt="Phormula Logo" style="width: 200px; height: auto; display: block; margin: 0 auto 20px;" />
        
        <h2 style="color: #37455F; text-align: center; margin-bottom: 20px;">Welcome to Phormula!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">Hello,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Your account has been successfully created by an administrator. You are now part of our global community of D2C Brands.
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5EA68E;">
            <h3 style="color: #37455F; margin-top: 0;">Your Login Credentials:</h3>
            <p style="font-size: 16px; color: #555; margin: 10px 0;">
                <strong>Email:</strong> {email}
            </p>
            <p style="font-size: 16px; color: #555; margin: 10px 0;">
                <strong>Password:</strong> {password}
            </p>
            <p style="font-size: 16px; color: #555; margin: 10px 0;">
                <strong>Country:</strong> {country}
            </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
            <strong>Important Security Note:</strong> Please change your password after your first login for security purposes.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555; text-align: center; margin: 30px 0;">
            <a href="{login_url}" style="display: inline-block; background-color: #37455F; color: #f8edcf; padding: 13px 30px; text-align: center; text-decoration: none; font-size: 20px; border-radius: 8px; box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2); transition: background-color 0.3s ease; cursor: pointer;">
                Login to Your Account
            </a>
        </p>
        
        <p style="font-size: 14px; color: #777; text-align: center;">
            If you did not expect this email, please contact our support team immediately.
        </p>
        
        <p style="font-size: 16px; color: #555;">
            If you have any questions or need assistance, feel free to reach out to our support team at 
            <a href="mailto:care@phormula.io" style="color: #007bff;">care@phormula.io</a>
        </p>
        
        <p style="font-size: 16px; color: #555;">
            Best regards, <br>
            The Phormula Team
        </p>
    </div>
</body>
</html>
        """
        
        # Send the invitation email
        mail.send(msg)
        print(f"Invitation email sent successfully to {email}")
        
    except Exception as e:
        print(f"Failed to send invitation email to {email}: {e}")
        raise e


@add_member_bp.route('/add_member', methods=['POST'])
def add_member():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        country = data.get('country')

        if not email or not password or not country:
            return jsonify({'error': 'All fields (email, password, country) are required.'}), 400

        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Please provide a valid email address.'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'User with this email already exists.'}), 400

        # Generate token and token_name
        token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        token_name = f"{country.lower()}_{token}"
        hashed_password = generate_password_hash(password)

        # Create user WITH token_name since it's required in the database
        new_user = User(
            email=email, 
            password=hashed_password, 
            country=country,
            phone_number="",  # Add empty phone_number since it's required in the model
            token_name=token_name
        )
        db.session.add(new_user)
        db.session.commit()

        # Send invitation email to the new member
        try:
            send_member_invite_email(email, password, token_name, country)
            email_sent = True
            email_message = "Invitation email sent successfully."
        except Exception as e:
            email_sent = False
            email_message = f"Member created but failed to send invitation email: {str(e)}"
            print(f"Email sending error: {e}")

        return jsonify({
            'message': 'Member added successfully.',
            'token_name': token_name,
            'email': email,
            'country': country,
            'email_sent': email_sent,
            'email_message': email_message
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500