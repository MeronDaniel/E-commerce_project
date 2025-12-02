'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { ShoppingCart, LogIn, Trash2, Plus, Minus, Tag, ArrowRight, Package, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface CartProduct {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  is_on_sale: boolean;
  sale_percent: number | null;
  sale_price_cents: number | null;
  brand: { id: number; name: string; slug: string } | null;
  category: { id: number; name: string; slug: string } | null;
  image: { url: string; alt_text: string } | null;
}

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price_cents: number;
  original_price_cents: number;
  line_total_cents: number;
  original_line_total_cents: number;
  added_at: string;
  product: CartProduct;
}

interface CartData {
  cart_id: number;
  items: CartItem[];
  item_count: number;
  total_items: number;
  subtotal_cents: number;
  original_subtotal_cents: number;
  sale_savings_cents: number;
  tax_cents: number;
  tax_rate: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
}

export default function CartPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount_percent: number;
  } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [inputValues, setInputValues] = useState<Record<number, string>>({});

  const fetchCart = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchCart]);

  const handleUpdateQuantity = async (productId: number, newQuantity: number, productName: string, optimistic = false) => {
    if (newQuantity < 1) return;
    
    // Find the item to check stock limit
    const item = cart?.items.find(i => i.product_id === productId);
    if (!item || newQuantity > item.product.stock) return;
    
    // Optimistic update - immediately update the UI
    if (optimistic && cart) {
      setCart(prevCart => {
        if (!prevCart) return prevCart;
        const updatedItems = prevCart.items.map(item => {
          if (item.product_id === productId) {
            const newLineTotal = item.unit_price_cents * newQuantity;
            const newOriginalLineTotal = item.original_price_cents * newQuantity;
            return { 
              ...item, 
              quantity: newQuantity, 
              line_total_cents: newLineTotal,
              original_line_total_cents: newOriginalLineTotal
            };
          }
          return item;
        });
        const newSubtotal = updatedItems.reduce((sum, item) => sum + item.line_total_cents, 0);
        const newOriginalSubtotal = updatedItems.reduce((sum, item) => sum + item.original_line_total_cents, 0);
        const newTotalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        return {
          ...prevCart,
          items: updatedItems,
          subtotal_cents: newSubtotal,
          original_subtotal_cents: newOriginalSubtotal,
          sale_savings_cents: newOriginalSubtotal - newSubtotal,
          total_items: newTotalItems,
          shipping_cents: newSubtotal >= 10000 ? 0 : 999,
        };
      });
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: newQuantity }),
      });

      if (response.ok) {
        // Optimistic update already applied, no need to re-fetch
        // Just update the navbar count silently
        refreshCart();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to update quantity', 'error');
        // Revert on error by re-fetching
        await fetchCart();
      }
    } catch {
      showToast('Failed to update quantity', 'error');
      // Revert on error by re-fetching
      await fetchCart();
    }
  };

  const handleInputBlur = (productId: number, productName: string, currentQuantity: number, stock: number) => {
    const inputValue = inputValues[productId];
    if (inputValue === undefined) return;
    
    const val = parseInt(inputValue);
    
    // If user enters 0 or less, delete the item
    if (!isNaN(val) && val <= 0) {
      handleRemoveItem(productId, productName);
    } else if (!isNaN(val) && val >= 1 && val <= stock && val !== currentQuantity) {
      handleUpdateQuantity(productId, val, productName, true);
    }
    
    // Clear the input value state
    setInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[productId];
      return newValues;
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleRemoveItem = async (productId: number, productName: string) => {
    // Optimistic removal - immediately remove from UI
    setCart(prevCart => {
      if (!prevCart) return prevCart;
      const updatedItems = prevCart.items.filter(item => item.product_id !== productId);
      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.line_total_cents, 0);
      const newOriginalSubtotal = updatedItems.reduce((sum, item) => sum + item.original_line_total_cents, 0);
      const newTotalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      return {
        ...prevCart,
        items: updatedItems,
        item_count: updatedItems.length,
        subtotal_cents: newSubtotal,
        original_subtotal_cents: newOriginalSubtotal,
        sale_savings_cents: newOriginalSubtotal - newSubtotal,
        total_items: newTotalItems,
        shipping_cents: newSubtotal >= 10000 ? 0 : 999,
      };
    });
    
    showToast(`${productName} removed from cart`, 'success');
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/cart/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });

      if (response.ok) {
        // Optimistic update already applied, just update navbar count
        refreshCart();
      } else {
        // If failed, re-fetch to restore correct state
        const data = await response.json();
        showToast(data.error || 'Failed to remove item', 'error');
        await fetchCart();
      }
    } catch {
      showToast('Failed to remove item', 'error');
      await fetchCart();
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      showToast('Please enter a promo code', 'info');
      return;
    }

    setIsApplyingPromo(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/cart/apply-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ promo_code: promoCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppliedPromo({
          code: data.promo_code,
          discount_percent: data.discount_percent,
        });
        showToast(`${data.discount_percent}% discount applied!`, 'success');
      } else {
        showToast(data.error || 'Invalid promo code', 'error');
      }
    } catch {
      showToast('Failed to apply promo code', 'error');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    showToast('Promo code removed', 'success');
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Sign in to view your cart
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Please log in to your account to view your shopping cart, add items, and proceed to checkout.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer"
                >
                  Create Account
                </Link>
              </div>
              <p className="mt-6 text-gray-600">
                Just browsing?{' '}
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Continue shopping
                </Link>
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your cart is empty
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Looks like you haven&apos;t added anything to your cart yet. Start shopping to find great tech products!
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer"
              >
                <Package className="w-5 h-5" />
                Start Shopping
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Cart with items
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Shopping Cart</h1>
              <p className="text-gray-600">
                {cart.total_items} {cart.total_items === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items - Left Column (wider) */}
            <div className="flex-1 lg:flex-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="relative w-22 h-22 bg-white rounded-lg shrink-0 flex items-center justify-center">
                          {item.product.image ? (
                            <Image
                              src={item.product.image.url}
                              alt={item.product.image.alt_text || item.product.title}
                              fill
                              className="object-contain p-1 rounded-lg"
                              sizes="88px"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                          )}
                          {/* Sale badge on image */}
                          {item.product.is_on_sale && item.product.sale_percent && (
                            <div className="absolute -top-2 -left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                              -{item.product.sale_percent}%
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-4">
                              <Link
                                href={`/product/${item.product_id}`}
                                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                              >
                                {item.product.title}
                              </Link>
                              <p className="text-sm text-gray-400 mt-1">
                                {item.product.stock} in stock
                              </p>
                            </div>
                            {/* Price - Top Right */}
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900 whitespace-nowrap">
                                ${(item.line_total_cents / 100).toFixed(2)}
                              </p>
                              {item.product.is_on_sale && item.original_line_total_cents > item.line_total_cents && (
                                <p className="text-sm text-gray-400 line-through whitespace-nowrap">
                                  ${(item.original_line_total_cents / 100).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls - Bottom Right */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              {item.product.is_on_sale ? (
                                <>
                                  <p className="text-sm text-red-600 font-medium">
                                    ${(item.unit_price_cents / 100).toFixed(2)} each
                                  </p>
                                  <p className="text-xs text-gray-400 line-through">
                                    ${(item.original_price_cents / 100).toFixed(2)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  ${(item.unit_price_cents / 100).toFixed(2)} each
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Minus/Trash Button */}
                              {item.quantity === 1 ? (
                                <button
                                  onClick={() => handleRemoveItem(item.product_id, item.product.title)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1, item.product.title, true)}
                                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-5 h-5" />
                                </button>
                              )}

                              {/* Quantity Input */}
                              <input
                                type="number"
                                value={inputValues[item.product_id] !== undefined ? inputValues[item.product_id] : item.quantity}
                                onChange={(e) => {
                                  setInputValues(prev => ({ ...prev, [item.product_id]: e.target.value }));
                                }}
                                onBlur={() => handleInputBlur(item.product_id, item.product.title, item.quantity, item.product.stock)}
                                onKeyDown={handleInputKeyDown}
                                min="0"
                                max={item.product.stock}
                                className="w-16 text-center py-2 border border-gray-200 rounded-lg font-medium focus:outline-none focus:border-blue-500"
                              />

                              {/* Plus Button */}
                              <button
                                onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1, item.product.title, true)}
                                disabled={item.quantity >= item.product.stock}
                                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary - Right Column (narrower) */}
            <div className="lg:flex-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                {/* Promo Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code
                  </label>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">{appliedPromo.code}</span>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApplyingPromo ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                {(() => {
                  const subtotal = cart.subtotal_cents / 100;
                  const saleSavings = cart.sale_savings_cents / 100;
                  let promoDiscount = 0;
                  const shipping = cart.shipping_cents / 100;
                  
                  if (appliedPromo) {
                    promoDiscount = subtotal * (appliedPromo.discount_percent / 100);
                  }
                  
                  const afterDiscount = subtotal - promoDiscount;
                  const tax = afterDiscount * cart.tax_rate;
                  const total = afterDiscount + shipping + tax;
                  const totalSavings = saleSavings + promoDiscount;
                  
                  return (
                    <div className="space-y-3 mb-6">

                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal ({cart.total_items} items)</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>

                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            Promo ({appliedPromo?.discount_percent}% off)
                          </span>
                          <span>-${promoDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>
                          {shipping === 0 ? (
                            <span className="text-green-600">FREE</span>
                          ) : (
                            `$${shipping.toFixed(2)}`
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-600">
                        <span>Tax (13% HST)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>

                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                        {/* Total Savings Badge */}
                        {totalSavings > 0 && (
                          <div className="mt-2 flex justify-end">
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                              <Sparkles className="w-4 h-4" />
                              You&apos;re saving ${totalSavings.toFixed(2)}!
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Free Shipping Notice */}
                      {shipping > 0 && subtotal < 100 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            Add <span className="font-semibold">${(100 - subtotal).toFixed(2)}</span> more for free shipping!
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Checkout Button */}
                <button
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Continue to Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Continue Shopping */}
                <Link
                  href="/"
                  className="block text-center mt-4 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
