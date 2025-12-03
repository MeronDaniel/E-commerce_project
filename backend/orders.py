from models import User, Order, OrderItem, Product, ProductImage
from extensions import db, mail
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
import threading


"""
GET /api/orders: Get all orders for user
GET /api/orders/:id: Get order details
DELETE /api/orders/:id: Cancel order
"""


order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


def get_product_image(product):
    """Get primary image URL for a product"""
    if product and product.images:
        primary_image = next((img for img in product.images if img.is_primary), None)
        if primary_image:
            return primary_image.url
        elif product.images:
            return product.images[0].url
    return None


def send_order_cancellation_email_async(app, user_email, user_name, order_id, items, total_cents):
    """Send order cancellation email in background thread"""
    with app.app_context():
        try:
            # Build order items HTML
            items_html = ""
            for item in items:
                items_html += f"""
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{item['title']}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">{item['quantity']}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item['total'] / 100:.2f}</td>
                </tr>
                """
            
            msg = Message(
                subject=f'Order Cancelled - MDSRTech #{order_id}',
                recipients=[user_email],
                html=f'''
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2563eb; text-align: center;">MDSRTech</h1>
                    <h2 style="color: #dc2626;">Order Cancelled</h2>
                    
                    <p style="color: #4b5563; font-size: 16px;">
                        Hi {user_name},
                    </p>
                    <p style="color: #4b5563; font-size: 16px;">
                        Your order has been cancelled as requested. Here&apos;s a summary of the cancelled order:
                    </p>
                    
                    <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fecaca;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Cancelled Order Number</p>
                        <p style="margin: 5px 0 0; color: #dc2626; font-size: 20px; font-weight: bold;">#{order_id}</p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background-color: #f3f4f6;">
                                <th style="padding: 12px; text-align: left;">Item</th>
                                <th style="padding: 12px; text-align: center;">Qty</th>
                                <th style="padding: 12px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    
                    <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                            <span style="color: #1f2937;">Refund Amount:</span>
                            <span style="color: #dc2626;">${total_cents / 100:.2f} CAD</span>
                        </div>
                    </div>
                    
                    <p style="color: #4b5563; font-size: 14px; margin-top: 30px;">
                        If you paid for this order, your refund will be processed within 5-10 business days.
                    </p>
                    
                    <p style="color: #4b5563; font-size: 14px;">
                        If you have any questions, please don&apos;t hesitate to contact us.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                        © 2025 MDSRTech. All rights reserved.<br/>
                        This is a demonstration project for educational purposes only.
                    </p>
                </div>
                '''
            )
            mail.send(msg)
            print(f"Order cancellation email sent for order #{order_id}")
        except Exception as e:
            print(f"Failed to send order cancellation email: {str(e)}")


def send_order_cancellation_email(user, order):
    """Start background thread to send order cancellation email"""
    # Extract all data needed before starting thread (can't access ORM objects in thread)
    app = current_app._get_current_object()
    user_email = user.email
    user_name = user.full_name
    order_id = order.id
    items = [{'title': item.title_snapshot, 'quantity': item.quantity, 'total': item.line_total_cents} for item in order.items]
    total_cents = order.total_cents
    
    # Start email in background thread
    thread = threading.Thread(
        target=send_order_cancellation_email_async,
        args=(app, user_email, user_name, order_id, items, total_cents)
    )
    thread.start()


@order_bp.route('', methods=["GET"])
@jwt_required()
def get_all_orders():
    """Get all orders for the current user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.placed_at.desc()).all()
    
    orders_list = []
    for order in orders:
        # Get first item image for preview
        preview_image = None
        if order.items:
            first_item = order.items[0]
            if first_item.product:
                preview_image = get_product_image(first_item.product)
        
        orders_list.append({
            'id': order.id,
            'total_cents': order.total_cents,
            'subtotal_cents': order.subtotal_cents,
            'tax_cents': order.tax_cents,
            'shipping_cents': order.shipping_cents,
            'currency': order.currency,
            'placed_at': order.placed_at.isoformat() if order.placed_at else None,
            'item_count': len(order.items),
            'preview_image': preview_image,
            'first_item_name': order.items[0].title_snapshot if order.items else None
        })
    
    return jsonify({'orders': orders_list}), 200


@order_bp.route('/<int:order_id>', methods=["GET"])
@jwt_required()
def get_order_details(order_id):
    """Get detailed order information"""
    user_id = get_jwt_identity()
    
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Build items list with product details
    items = []
    for item in order.items:
        product_image = None
        product_slug = None
        
        if item.product:
            product_image = get_product_image(item.product)
            product_slug = item.product.slug
        
        items.append({
            'id': item.id,
            'product_id': item.product_id,
            'title': item.title_snapshot,
            'quantity': item.quantity,
            'unit_price_cents': item.unit_price_cents,
            'line_total_cents': item.line_total_cents,
            'image_url': product_image,
            'product_slug': product_slug
        })
    
    return jsonify({
        'id': order.id,
        'subtotal_cents': order.subtotal_cents,
        'tax_cents': order.tax_cents,
        'shipping_cents': order.shipping_cents,
        'total_cents': order.total_cents,
        'currency': order.currency,
        'placed_at': order.placed_at.isoformat() if order.placed_at else None,
        'items': items
    }), 200


@order_bp.route('/<int:order_id>', methods=["DELETE"])
@jwt_required()
def cancel_order(order_id):
    """Cancel an order"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Store order info for email before deleting
    order_info = {
        'id': order.id,
        'total_cents': order.total_cents,
        'items': [{
            'title_snapshot': item.title_snapshot,
            'quantity': item.quantity,
            'line_total_cents': item.line_total_cents
        } for item in order.items]
    }
    
    # Send cancellation email before deleting
    send_order_cancellation_email(user, order)
    
    # Delete order items first (they have foreign key to order)
    for item in order.items:
        db.session.delete(item)
    
    db.session.delete(order)
    db.session.commit()
    
    return jsonify({
        "message": "Order has been cancelled",
        "order_id": order_info['id']
    }), 200

