from .models import User
from flask import Blueprint, request, jsonify
from flask_jwt_extended.exceptions import NoAuthorizationError
from jwt import ExpiredSignatureError
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from .models import Customer, Products

products_bp = Blueprint("products", __name__, url_prefix="/products")

"""
GET /products: List all products
GET /products/:id: Fetch product details
"""

@products_bp.route('/products', methods=["GET"])
def get_products():
    if request.method == "GET":
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 400
        
        if token.startswith('Bearer '):
            token = token[7:]

        try:
            verify_jwt_in_request()
            username = get_jwt_identity()
        except ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except NoAuthorizationError:
            return jsonify({'error': 'Invalid token'}), 401

        user = Customer.query.filter_by(username=username).first()
        products = Products.query.filter_by(user_id=user.id).all()

        products_list = [] # Initialize an empty list to hold the book data
        for p in products:
            products_list.append({
                'name': p.name,
                'description': p.description,
                'price': p.price,
                'available': p.available,
                'stock': p.stock
            })

        return jsonify({'products': products_list}), 200
    





    