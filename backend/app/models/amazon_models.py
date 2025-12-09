from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from app import db

class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    amazon_order_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    purchase_date = db.Column(db.DateTime, index=True)
    order_status = db.Column(db.String(50), index=True)
    total_amount = db.Column(db.Numeric(10, 2))
    currency = db.Column(db.String(10))
    buyer_email = db.Column(db.String(255))
    marketplace_id = db.Column(db.String(255), index=True)
    sales_channel = db.Column(db.String(50))
    shipping_address = db.Column(JSONB)
    synced_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    seller_sku = db.Column(db.String(255), unique=True, nullable=False, index=True)
    asin = db.Column(db.String(255), index=True)
    product_type = db.Column(db.String(100))
    marketplace_id = db.Column(db.String(255), index=True)
    status = db.Column(db.String(50), default='Active')
    title = db.Column(db.Text)
    brand = db.Column(db.String(255))
    category = db.Column(db.String(255))
    product_data = db.Column(JSONB)  # Store additional product metadata
    synced_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    

# Inventory table
class Inventory(db.Model):
    __tablename__ = 'inventory'

    id = db.Column(db.Integer, primary_key=True)
    asin = db.Column(db.String(255))
    seller_sku = db.Column(db.String(255))
    total_quantity = db.Column(db.Integer, default=0)
    inbound_quantity = db.Column(db.Integer, default=0)
    available_quantity = db.Column(db.Integer, default=0)
    reserved_quantity = db.Column(db.Integer, default=0)
    fulfillable_quantity = db.Column(db.Integer, default=0)
    marketplace_id = db.Column(db.String(255))
    synced_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('asin', 'seller_sku', name='uq_asin_seller_sku'),
    )


# OrderItems table
class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    amazon_order_id = db.Column(db.String(255), db.ForeignKey('orders.amazon_order_id'))
    order_item_id = db.Column(db.String(255), unique=True, nullable=False)
    asin = db.Column(db.String(255))
    seller_sku = db.Column(db.String(255))
    title = db.Column(db.Text)
    quantity_ordered = db.Column(db.Integer)
    quantity_shipped = db.Column(db.Integer)
    item_price = db.Column(db.Numeric(10, 2))
    currency = db.Column(db.String(10))
    synced_at = db.Column(db.DateTime, default=datetime.utcnow)

   


# Notifications table
class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(100))
    message = db.Column(JSONB)
    signature = db.Column(db.Text)
    received_at = db.Column(db.DateTime, default=datetime.utcnow)
