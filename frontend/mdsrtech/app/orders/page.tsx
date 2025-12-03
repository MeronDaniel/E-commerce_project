'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronDown, ChevronUp, Loader2, ShoppingBag, X, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface OrderSummary {
  id: number;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  currency: string;
  placed_at: string;
  item_count: number;
  preview_image: string | null;
  first_item_name: string | null;
}

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

export default function OrdersPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<{ [key: number]: OrderDetails }>({});
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/orders`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setOrders(data.orders || []);
        } else {
          setError(data.error || 'Failed to fetch orders');
        }
      } catch {
        setError('An error occurred while fetching orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [accessToken, isAuthenticated, authLoading]);

  const fetchOrderDetails = async (orderId: number) => {
    if (orderDetails[orderId]) {
      return; // Already fetched
    }

    setLoadingDetails(orderId);
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setOrderDetails(prev => ({ ...prev, [orderId]: data }));
      }
    } catch {
      console.error('Failed to fetch order details');
    } finally {
      setLoadingDetails(null);
    }
  };

  const toggleOrder = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      await fetchOrderDetails(orderId);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    setCancellingOrder(orderId);
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
        setShowCancelModal(null);
        setExpandedOrderId(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to cancel order');
      }
    } catch {
      setError('An error occurred while cancelling the order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In to View Orders</h1>
            <p className="text-gray-600 mb-8">
              Please sign in to your account to view your order history and track your purchases.
            </p>
            <Link
              href="/auth"
              className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/auth?mode=signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show empty state if no orders
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Orders Yet</h1>
            <p className="text-gray-600 mb-8">
              You haven&apos;t placed any orders yet. Start shopping to see your orders here!
            </p>
            <Link
              href="/"
              className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Orders List */}
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Order Header - Clickable */}
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="w-full p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  {/* Preview Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    {order.preview_image ? (
                      <Image
                        src={order.preview_image}
                        alt="Order preview"
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">Order #{order.id}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Confirmed
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {order.first_item_name}
                      {order.item_count > 1 && ` + ${order.item_count - 1} more item${order.item_count > 2 ? 's' : ''}`}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatShortDate(order.placed_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {(order.total_cents / 100).toFixed(2)} {order.currency}
                      </span>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  {expandedOrderId === order.id ? (
                    <ChevronUp className="w-6 h-6 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Expanded Details */}
                {expandedOrderId === order.id && (
                  <div className="border-t border-gray-200">
                    {loadingDetails === order.id ? (
                      <div className="p-6 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      </div>
                    ) : orderDetails[order.id] ? (
                      <div className="p-6">
                        {/* Order Date Full */}
                        <p className="text-sm text-gray-500 mb-4">
                          Placed on {formatDate(orderDetails[order.id].placed_at)}
                        </p>

                        {/* Items */}
                        <div className="space-y-3 mb-6">
                          {orderDetails[order.id].items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                            >
                              <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0">
                                {item.image_url ? (
                                  <Image
                                    src={item.image_url}
                                    alt={item.title}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <Package className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                {item.product_slug ? (
                                  <Link 
                                    href={`/product/${item.product_id}`}
                                    className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                                  >
                                    {item.title}
                                  </Link>
                                ) : (
                                  <p className="font-medium text-gray-900 truncate">{item.title}</p>
                                )}
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                ${(item.line_total_cents / 100).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-gray-200 pt-4 space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>${(orderDetails[order.id].subtotal_cents / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Shipping</span>
                            <span>
                              {orderDetails[order.id].shipping_cents === 0
                                ? 'FREE'
                                : `$${(orderDetails[order.id].shipping_cents / 100).toFixed(2)}`}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Tax (HST 13%)</span>
                            <span>${(orderDetails[order.id].tax_cents / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-blue-600">
                              ${(orderDetails[order.id].total_cents / 100).toFixed(2)} {orderDetails[order.id].currency}
                            </span>
                          </div>
                        </div>

                        {/* Cancel Button */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowCancelModal(order.id)}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCancelModal(null)}
        >
          <div className="absolute inset-0 bg-black/70" />
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Cancel Order?</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to cancel Order #{showCancelModal}? This action cannot be undone. 
              You will receive an email confirmation of the cancellation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                disabled={cancellingOrder === showCancelModal}
              >
                Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(showCancelModal)}
                disabled={cancellingOrder === showCancelModal}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancellingOrder === showCancelModal ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
