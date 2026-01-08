from flask import Blueprint, request, jsonify
from app.utils.monthwise_ai_summary_utils import get_or_create_summary
from flask import Blueprint, request, jsonify
import jwt
import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from config import Config
from calendar import month_abbr, monthrange
from datetime import date, datetime, timedelta
from openai import OpenAI
import json
import pandas as pd
from app.models.user_models import HistoricAISummary
from app.utils.formulas_utils import uk_all
from app import db


summary_bp = Blueprint("summary_bp", __name__)



load_dotenv()
SECRET_KEY = Config.SECRET_KEY




@summary_bp.route("/summary", methods=["GET"])
def summary():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authorization token is missing or invalid"}), 401

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")

        if not user_id:
            return jsonify({"error": "Invalid token payload: user_id missing"}), 401

        # ----------- SAFE PARAM EXTRACTION -----------
        country = (request.args.get("country", "uk") or "uk").strip().lower()
        marketplace_id = request.args.get("marketplace_id", type=int)

        period = request.args.get("period")        # monthly / quarterly / yearly
        timeline = request.args.get("timeline")    # "12", "Q4", "ALL"
        year = request.args.get("year", type=int)

        if not period or not timeline or not year:
            return jsonify({
                "error": "Missing required query params: period, timeline, year"
            }), 400

        # ----------- CORE LOGIC -----------
        result = get_or_create_summary(
            user_id=user_id,
            country=country,
            marketplace_id=marketplace_id,
            period=period,
            timeline=timeline,
            year=year,
        )

        return jsonify(result), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    except Exception as e:
        print("Unexpected error in /summary:", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500
