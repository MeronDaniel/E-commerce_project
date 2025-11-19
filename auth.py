from flask import Blueprint, jsonify, request
from models import User
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route('/register', methods=['POST'])
def register():
    username = request.json.get('username')
    password = request.json.get('password') # Extract 'password' from the request data and encode it

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error' : 'username already exists'}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message' : 'User registered successfully'}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400
    

    user = User.query.filter_by(username=username).first()


    if user or check_password_hash(user.password_hash, password):
        token =  create_access_token(identity=username)
        return jsonify({'message' : f'{token} is a success'}), 200
    else:
        return jsonify({'error': 'Invalid password'}), 401
