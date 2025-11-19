from flask import Flask, jsonify
from .extensions import db, jwt
from .auth import auth_bp
from .products import products_bp
from .cart import carts_bp
"""from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import create_access_token, JWTManager, get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError
from jwt import ExpiredSignatureError
from werkzeug.security import generate_password_hash, check_password_hash"""




def create_app():
    app = Flask(__name__)
    app.config.setdefault('SQLALCHEMY_DATABASE_URI', 'postgresql://postgres:mdrsy29@localhost:5434/activity05')
    app.config.setdefault('SQLALCHEMY_TRACK_MODIFICATIONS', False)
    app.config.setdefault('JWT_SECRET_KEY', "a-string-secret-at-least-256-bits-long")

    db.init_app(app)
    jwt.init_app(app)

    if 'auth' not in app.blueprints:
        app.register_blueprint(auth_bp, name=f"auth_{id(app)}")

    if 'products' not in app.blueprints:
        app.register_blueprint(products_bp, name=f"products_{id(app)}")

    if 'carts' not in app.blueprints:
        app.register_blueprint(carts_bp, name=f"carts_{id(app)}")

    """@app.route("/")
    def home():
        return jsonify(message="Hello, Flask!")"""

    
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(carts_bp)

    return app

if __name__ == "__main__":
    # Running directly: python app.py
    app = create_app()
    app.run(debug=True)