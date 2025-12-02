from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Product, Category, Brand, ProductImage
from extensions import db
from sqlalchemy import or_

products_bp = Blueprint("products", __name__, url_prefix="/api")

"""
GET /api/products: List all active products
GET /api/products/:id: Fetch product details by ID
GET /api/products/slug/:slug: Fetch product details by slug
GET /api/categories/:slug/products: Fetch products by category
GET /api/search: Search products by query
GET /api/categories: Get all categories
GET /api/brands: Get all brands
"""

def product_to_dict(product):
    """Convert a product to dictionary with sale info"""
    # Get first/primary image
    primary_image = next((img for img in product.images if img.is_primary), None)
    if not primary_image and product.images:
        primary_image = product.images[0]
    
    # Calculate sale info
    is_on_sale = product.is_on_sale
    sale_percent = product.effective_sale_percent if is_on_sale else None
    sale_price_cents = product.sale_price_cents if is_on_sale else None
    
    return {
        'id': product.id,
        'title': product.title,
        'slug': product.slug,
        'description': product.description,
        'price_cents': product.price_cents,
        'currency': product.currency,
        'stock': product.stock,
        # Sale info
        'is_on_sale': is_on_sale,
        'sale_percent': sale_percent,
        'sale_price_cents': sale_price_cents,
        'brand': {
            'id': product.brand.id,
            'name': product.brand.name,
            'slug': product.brand.slug
        } if product.brand else None,
        'category': {
            'id': product.category.id,
            'name': product.category.name,
            'slug': product.category.slug
        } if product.category else None,
        'image': {
            'url': primary_image.url,
            'alt_text': primary_image.alt_text
        } if primary_image else None,
        'images': [
            {
                'url': img.url,
                'alt': img.alt_text,
                'order': img.position
            } for img in sorted(product.images, key=lambda x: x.position)
        ],
        'created_at': product.created_at.isoformat(),
        'updated_at': product.updated_at.isoformat()
    }

@products_bp.route('/products', methods=["GET"])
def get_products():
    """Get all active products with their brand, category, and images"""
    try:
        products = Product.query.filter_by(is_active=True).order_by(Product.id).all()
        products_list = [product_to_dict(p) for p in products]
        return jsonify({'products': products_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/products/<int:product_id>', methods=["GET"])
def get_product_by_id(product_id):
    """Get a single product by ID"""
    try:
        product = Product.query.filter_by(id=product_id, is_active=True).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify(product_to_dict(product)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/products/slug/<string:slug>', methods=["GET"])
def get_product_by_slug(slug):
    """Get a single product by slug"""
    try:
        product = Product.query.filter_by(slug=slug, is_active=True).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify(product_to_dict(product)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/categories/<string:category_slug>/products', methods=["GET"])
def get_products_by_category(category_slug):
    """Get all products in a specific category"""
    try:
        category = Category.query.filter_by(slug=category_slug).first()
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        products = Product.query.filter_by(category_id=category.id, is_active=True).all()
        products_list = [product_to_dict(p) for p in products]
        
        # Get unique brands that have products in this category
        brand_ids = set(p.brand_id for p in products if p.brand_id)
        brands = Brand.query.filter(Brand.id.in_(brand_ids)).all() if brand_ids else []
        brands_list = [{'id': b.id, 'name': b.name, 'slug': b.slug} for b in brands]
        
        return jsonify({
            'products': products_list, 
            'category': {
                'id': category.id,
                'name': category.name, 
                'slug': category.slug,
                'sale_percent': category.sale_percent
            },
            'brands': brands_list
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/search', methods=["GET"])
def search_products():
    """Search products by query string - searches title, description, brand, and category"""
    try:
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({'products': [], 'query': ''}), 200
        
        # Search in title, description, brand name, and category name
        search_term = f'%{query}%'
        
        products = Product.query.join(Brand, Product.brand_id == Brand.id, isouter=True)\
            .join(Category, Product.category_id == Category.id, isouter=True)\
            .filter(
                Product.is_active == True,
                or_(
                    Product.title.ilike(search_term),
                    Product.description.ilike(search_term),
                    Brand.name.ilike(search_term),
                    Category.name.ilike(search_term)
                )
            ).all()
        
        products_list = [product_to_dict(p) for p in products]
        
        # Get unique brands and categories from results for filters
        brand_ids = set(p.brand_id for p in products if p.brand_id)
        category_ids = set(p.category_id for p in products if p.category_id)
        
        brands = Brand.query.filter(Brand.id.in_(brand_ids)).all() if brand_ids else []
        categories = Category.query.filter(Category.id.in_(category_ids)).all() if category_ids else []
        
        brands_list = [{'id': b.id, 'name': b.name, 'slug': b.slug} for b in brands]
        categories_list = [{'id': c.id, 'name': c.name, 'slug': c.slug} for c in categories]
        
        return jsonify({
            'products': products_list,
            'query': query,
            'brands': brands_list,
            'categories': categories_list,
            'total': len(products_list)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/categories', methods=["GET"])
def get_all_categories():
    """Get all categories"""
    try:
        categories = Category.query.order_by(Category.name).all()
        categories_list = [{
            'id': c.id,
            'name': c.name,
            'slug': c.slug,
            'sale_percent': c.sale_percent
        } for c in categories]
        
        return jsonify({'categories': categories_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/brands', methods=["GET"])
def get_all_brands():
    """Get all brands"""
    try:
        brands = Brand.query.order_by(Brand.name).all()
        brands_list = [{
            'id': b.id,
            'name': b.name,
            'slug': b.slug
        } for b in brands]
        
        return jsonify({'brands': brands_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
