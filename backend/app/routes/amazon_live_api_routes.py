from __future__ import annotations
import logging
import os
from sqlalchemy.types import Date
from sqlalchemy.exc import NoSuchTableError
import jwt
from dotenv import find_dotenv, load_dotenv

# -------------------------------------------------------------------------------------------
# Config / env
# -------------------------------------------------------------------------------------------

dotenv_path = find_dotenv(filename=".env", usecwd=True)
load_dotenv(dotenv_path, override=True)

logger = logging.getLogger("amazon_sp_api")
logging.basicConfig(level=logging.INFO)

db_url = os.getenv("DATABASE_URL")
db_url1 = os.getenv("DATABASE_ADMIN_URL")

if not db_url:
    raise RuntimeError("DATABASE_URL is not set")

if not db_url1:
    logger.warning("[WARN] DATABASE_ADMIN_URL not set; using DATABASE_URL for admin_engine as fallback")
    db_url1 = db_url




