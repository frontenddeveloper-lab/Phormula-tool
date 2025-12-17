# from app import create_app


# app = create_app()


# if __name__ == '__main__':
#     app.run(debug=True, use_reloader=False)


from app import create_app, db
from app.utils.token_utils import create_database_if_not_exists
from sqlalchemy import text, inspect

app = create_app()

if __name__ == "__main__":

    # CREATE DATABASES (ONCE)
    create_database_if_not_exists(app.config['SQLALCHEMY_DATABASE_URI'])
    create_database_if_not_exists(app.config['SQLALCHEMY_DATABASE_ADMIN_URL'])
    create_database_if_not_exists(app.config['SQLALCHEMY_DATABASE_SHOPIFY_URL'])
    create_database_if_not_exists(app.config['SQLALCHEMY_DATABASE_CHATBOT_URL'])
    create_database_if_not_exists(app.config['SQLALCHEMY_DATABASE_AMAZON_URL'])

    # CREATE TABLES (ONCE)
    with app.app_context():
        db.create_all()

        inspector = inspect(db.engine)
        if 'upload_history' in inspector.get_table_names():
            try:
                with db.engine.connect() as conn:
                    conn.execute(
                        text("ALTER TABLE upload_history ALTER COLUMN month TYPE VARCHAR(20);")
                    )
                    conn.commit()
            except Exception as e:
                print(f"[WARNING] Could not alter upload_history: {e}")

    app.run(debug=True, use_reloader=False)
