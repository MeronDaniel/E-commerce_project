'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Package, ArrowRight, Loader2, Mail, Truck, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface OrderItem {
  id: number;
  product_id: number;
  title: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  image_url: string | null;
  product_slug: string | null;
}

interface OrderDetails {
  id: number;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  placed_at: string;
  items: OrderItem[];
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshCart } = useCart();
  const sessionId = searchParams.get('session_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (!sessionId) {
      setError('Invalid checkout session');
      setIsLoading(false);
      return;
    }

    const processOrder = async () => {
      try {
        // First, process the checkout session
        const sessionResponse = await fetch(`${API_URL}/checkout/session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok) {
          setError(sessionData.error || 'Failed to process order');
          return;
        }

        setOrderId(sessionData.order_id);

        // Then fetch full order details
        const orderResponse = await fetch(`${API_URL}/orders/${sessionData.order_id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const orderData = await orderResponse.json();

        if (orderResponse.ok) {
          setOrderDetails(orderData);
          // Refresh cart to clear the count in navbar
          await refreshCart();
        }
      } catch {
        setError('An error occurred while retrieving your order');
      } finally {
        setIsLoading(false);
      }
    };

    processOrder();
  }, [sessionId, accessToken, isAuthenticated, authLoading, router, refreshCart]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-24">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/cart"
              className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Return to Cart
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your purchase. We&apos;ve sent a confirmation email with your order details.
            </p>
            
            {orderId && (
              <div className="inline-block bg-gray-50 rounded-xl px-6 py-3">
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-blue-600">#{orderId}</p>
              </div>
            )}
          </div>

          {/* Order Receipt */}
          {orderDetails && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Order Receipt</h2>
                </div>
                {orderDetails.placed_at && (
                  <p className="text-blue-100 mt-1 text-sm">
                    Placed on {formatDate(orderDetails.placed_at)}
                  </p>
                )}
              </div>

              {/* Order Items */}
              <div className="p-8">
                <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
                <div className="space-y-4">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shrink-0">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(item.line_total_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${(item.unit_price_cents / 100).toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="border-t border-gray-200 mt-6 pt-6 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${(orderDetails.subtotal_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>
                      {orderDetails.shipping_cents === 0 
                        ? 'FREE' 
                        : `$${(orderDetails.shipping_cents / 100).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (HST 13%)</span>
                    <span>${(orderDetails.tax_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-blue-600">
                      ${(orderDetails.total_cents / 100).toFixed(2)} {orderDetails.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center gap-4">
            <Mail className="w-6 h-6 text-blue-600 shrink-0" />
            <p className="text-blue-800 text-sm">
              A confirmation email has been sent to your email address with your complete order receipt.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/orders"
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              View All Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex-1 text-center py-4 px-6 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
