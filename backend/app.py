from flask import Flask, jsonify
from extensions import db, jwt, cors, limiter
from auth import auth_bp
from products import products_bp
from cart import carts_bp
from orders import order_bp
from wishlist import wishlist_bp
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Get database URL from environment variable or use default
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:[YOUR-SUPABASE-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'a-string-secret-at-least-256-bits-long')

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    
    # Configure CORS - allow auth routes as well
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(carts_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(wishlist_bp)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token has expired',
            'code': 'token_expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'error': 'Invalid token',
            'code': 'invalid_token'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'error': 'Authorization token is missing',
            'code': 'missing_token'
        }), 401

    return app

# Create app instance for gunicorn
app = create_app()

if __name__ == "__main__":
    # Running directly: python app.py
    app.run(debug=True, port=5000)