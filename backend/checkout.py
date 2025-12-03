from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Cart, CartItem, Order, OrderItem, Payment, Product
from extensions import db, mail
from flask_mail import Message
import stripe
import os

checkout_bp = Blueprint("checkout", __name__, url_prefix="/api/checkout")

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


@checkout_bp.route('/create-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Create a Stripe checkout session from the user's cart"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get user's cart
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not cart or not cart.items:
        return jsonify({'error': 'Cart is empty'}), 400
    
    # Build line items for Stripe
    line_items = []
    for item in cart.items:
        product = item.product
        if not product or not product.is_active:
            continue
        
        # Get the price (use sale price if on sale)
        if product.is_on_sale and product.sale_price_cents:
            unit_price = product.sale_price_cents
        else:
            unit_price = product.price_cents
        
        # Get product image
        image_url = None
        if product.images:
            primary_image = next((img for img in product.images if img.is_primary), None)
            if primary_image:
                image_url = primary_image.url
            elif product.images:
                image_url = product.images[0].url
        
        line_item = {
            'price_data': {
                'currency': 'cad',
                'unit_amount': unit_price,
                'product_data': {
                    'name': product.title,
                    'description': f'{product.brand.name if product.brand else ""}'.strip() or None,
                },
            },
            'quantity': item.quantity,
        }
        
        # Add image if available
        if image_url:
            line_item['price_data']['product_data']['images'] = [image_url]
        
        line_items.append(line_item)
    
    if not line_items:
        return jsonify({'error': 'No valid items in cart'}), 400
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=f'{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/cart',
            customer_email=user.email,
            metadata={
                'user_id': str(user_id),
            },
            shipping_address_collection={
                'allowed_countries': ['CA', 'US'],
            },
            shipping_options=[
                {
                    'shipping_rate_data': {
                        'type': 'fixed_amount',
                        'fixed_amount': {'amount': 0, 'currency': 'cad'},
                        'display_name': 'Free Shipping',
                        'delivery_estimate': {
                            'minimum': {'unit': 'business_day', 'value': 5},
                            'maximum': {'unit': 'business_day', 'value': 7},
                        },
                    },
                },
                {
                    'shipping_rate_data': {
                        'type': 'fixed_amount',
                        'fixed_amount': {'amount': 1499, 'currency': 'cad'},
                        'display_name': 'Express Shipping',
                        'delivery_estimate': {
                            'minimum': {'unit': 'business_day', 'value': 1},
                            'maximum': {'unit': 'business_day', 'value': 3},
                        },
                    },
                },
            ],
            automatic_tax={'enabled': False},
        )
        
        return jsonify({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({'error': str(e)}), 500


@checkout_bp.route('/session/<session_id>', methods=['GET'])
@jwt_required()
def get_session_details(session_id):
    """Get details of a completed checkout session"""
    user_id = get_jwt_identity()
    
    try:
        # Retrieve the session from Stripe
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=['line_items', 'payment_intent']
        )
        
        # Verify this session belongs to the current user
        if session.metadata.get('user_id') != str(user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        if session.payment_status != 'paid':
            return jsonify({'error': 'Payment not completed'}), 400
        
        # Get payment intent ID (it's an object when expanded, string otherwise)
        payment_intent_id = session.payment_intent.id if hasattr(session.payment_intent, 'id') else session.payment_intent
        
        # Check if order already exists for this session
        existing_payment = Payment.query.filter_by(provider_payment_id=payment_intent_id).first()
        
        if existing_payment:
            # Order already created, return it
            order = Order.query.filter_by(payment_id=existing_payment.id).first()
            if order:
                return jsonify({
                    'success': True,
                    'order_id': order.id,
                    'already_processed': True
                }), 200
        
        # Create order from session
        order = create_order_from_session(session, user_id)
        
        if order:
            return jsonify({
                'success': True,
                'order_id': order.id,
                'already_processed': False
            }), 200
        else:
            return jsonify({'error': 'Failed to create order'}), 500
            
    except stripe.error.StripeError as e:
        return jsonify({'error': str(e)}), 500


def create_order_from_session(session, user_id):
    """Create an order from a completed Stripe checkout session"""
    try:
        user = User.query.get(user_id)
        cart = Cart.query.filter_by(user_id=user_id).first()
        
        if not cart or not cart.items:
            return None
        
        # Calculate totals
        subtotal_cents = 0
        order_items_data = []
        
        for item in cart.items:
            product = item.product
            if not product:
                continue
            
            # Get the price used
            if product.is_on_sale and product.sale_price_cents:
                unit_price = product.sale_price_cents
            else:
                unit_price = product.price_cents
            
            line_total = unit_price * item.quantity
            subtotal_cents += line_total
            
            order_items_data.append({
                'product_id': product.id,
                'title_snapshot': product.title,
                'unit_price_cents': unit_price,
                'quantity': item.quantity,
                'line_total_cents': line_total
            })
        
        # Get shipping cost from session
        shipping_cents = session.shipping_cost.amount_total if session.shipping_cost else 0
        
        # Calculate tax (13% HST for Ontario)
        tax_cents = int((subtotal_cents + shipping_cents) * 0.13)
        
        total_cents = subtotal_cents + shipping_cents + tax_cents
        
        # Get payment intent ID (it's an object when expanded, string otherwise)
        payment_intent_id = session.payment_intent.id if hasattr(session.payment_intent, 'id') else session.payment_intent
        
        # Create payment record
        payment = Payment(
            provider='stripe',
            provider_payment_id=payment_intent_id,
            status='succeeded',
            amount_cents=total_cents,
            currency='CAD',
            raw_response={'session_id': session.id}
        )
        db.session.add(payment)
        db.session.flush()
        
        # Create order
        order = Order(
            user_id=user_id,
            subtotal_cents=subtotal_cents,
            tax_cents=tax_cents,
            shipping_cents=shipping_cents,
            total_cents=total_cents,
            currency='CAD',
            payment_id=payment.id
        )
        db.session.add(order)
        db.session.flush()
        
        # Create order items
        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=order.id,
                **item_data
            )
            db.session.add(order_item)
        
        # Clear the cart
        CartItem.query.filter_by(cart_id=cart.id).delete()
        
        db.session.commit()
        
        # Send order confirmation email
        send_order_confirmation_email(user, order)
        
        return order
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating order: {str(e)}")
        return None


def send_order_confirmation_email(user, order):
    """Send order confirmation email"""
    try:
        # Build order items HTML
        items_html = ""
        for item in order.items:
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{item.title_snapshot}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">{item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.line_total_cents / 100:.2f}</td>
            </tr>
            """
        
        msg = Message(
            subject=f'Order Confirmation - MDSRTech #{order.id}',
            recipients=[user.email],
            html=f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb; text-align: center;">MDSRTech</h1>
                <h2 style="color: #1f2937;">Thank you for your order!</h2>
                
                <p style="color: #4b5563; font-size: 16px;">
                    Hi {user.full_name},
                </p>
                <p style="color: #4b5563; font-size: 16px;">
                    We've received your order and it's being processed. Here's your order summary:
                </p>
                
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Order Number</p>
                    <p style="margin: 5px 0 0; color: #1f2937; font-size: 20px; font-weight: bold;">#{order.id}</p>
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
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6b7280;">Subtotal:</span>
                        <span style="color: #1f2937;">${order.subtotal_cents / 100:.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6b7280;">Shipping:</span>
                        <span style="color: #1f2937;">${order.shipping_cents / 100:.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6b7280;">Tax (HST 13%):</span>
                        <span style="color: #1f2937;">${order.tax_cents / 100:.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                        <span style="color: #1f2937;">Total:</span>
                        <span style="color: #2563eb;">${order.total_cents / 100:.2f} CAD</span>
                    </div>
                </div>
                
                <p style="color: #4b5563; font-size: 14px; margin-top: 30px;">
                    You'll receive another email when your order ships.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    © 2025 MDSRTech. All rights reserved.
                </p>
            </div>
            '''
        )
        mail.send(msg)
    except Exception as e:
        print(f"Failed to send order confirmation email: {str(e)}")


@checkout_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    # If no webhook secret configured, skip signature verification (for development)
    if webhook_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError:
            return jsonify({'error': 'Invalid payload'}), 400
        except stripe.error.SignatureVerificationError:
            return jsonify({'error': 'Invalid signature'}), 400
    else:
        # Development mode - parse without verification
        import json
        event = json.loads(payload)
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Payment was successful, create order
        user_id = session.get('metadata', {}).get('user_id')
        if user_id:
            # Retrieve full session with expanded data
            full_session = stripe.checkout.Session.retrieve(
                session['id'],
                expand=['line_items']
            )
            create_order_from_session(full_session, user_id)
    
    return jsonify({'received': True}), 200
