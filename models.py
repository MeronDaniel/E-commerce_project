from .extensions import db


class Customer(db.Model): 
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True) # Define the id as a primary key
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    #created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    carts = db.relationship("Cart", back_populates='customer') #one to one relationship between Customers and Carts
    orders = db.relationship('Order', back_populates='customer') #one to one relationship between Customers and Orders

class Products(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True) # Define the id as a primary key
    category_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(200), nullable=False) 
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    

class Cart(db.Model):
    __tablename__ = 'carts'
    id = db.Column(db.Integer, primary_key=True) # Define the id as a primary key
    user_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    customer = db.relationship("Customer", back_populates="carts") # Define the relationship with Customer
    cartitems = db.relationship("CartItems", back_populates="cart") #One to many relationship between Cart and CartItems

class CartItems(db.Model):
    __tablename__ = 'cartitems'
    id = db.Column(db.Integer, primary_key=True) # Define the id as a primary key
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    cart = db.relationship("Cart", back_populates="cartitems")



class Orders(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True) # Define the id as a primary key
    status = db.Column(db.Boolean, default=True)
    total_amount = db.Column(db.Double, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    customer = db.relationship("Customer", back_populates="orders") # Define the relationship with Customer


class OrderItems(db.Model):
    __tablename__ = 'orderitems'
    id = db.Column(db.Integer, primary_key=True) # Define the id as a primary key
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    order = db.relationship("Orders", back_populates="orderitems")


class Payments(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True) # Define the id as a primary key
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    stripe_session_id = db.Column(db.String(200), nullable=False)
    status = db.Column(db.Boolean, default=True)




