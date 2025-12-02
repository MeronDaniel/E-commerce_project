'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/contexts/CartContext';
import { Heart, Trash2, ShoppingCart, Plus, Minus, Tag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';

interface WishlistProduct {
  id: number;
  title: string;
  slug: string;
  description: string;
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

interface WishlistItem {
  id: number;
  product_id: number;
  added_at: string;
  product: WishlistProduct;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function WishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    const loadWishlist = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/wishlist`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
        showToast('Failed to load wishlist', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadWishlist();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, showToast]);

  const handleRemove = async (productId: number, productName: string) => {
    setRemovingId(productId);
    const result = await toggleWishlist(productId);
    
    if (result.success) {
      setItems(prev => prev.filter(item => item.product_id !== productId));
      showToast(`${productName} removed from wishlist`, 'success');
    } else {
      showToast(result.error || 'Failed to remove item', 'error');
    }
    setRemovingId(null);
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency
    }).format(cents / 100);
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
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-red-500" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Sign in to view your wishlist
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Please log in to your account to view and manage your wishlist items.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
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

  // Empty wishlist
  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-gray-400" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your wishlist is empty
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Save items you love by clicking the heart icon on any product.
              </p>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Wishlist with items
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
            </div>
          </div>

          {/* Wishlist Grid - Same format as featured products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <WishlistProductCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removingId === item.product_id}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

// Product card component for wishlist items
function WishlistProductCard({ 
  item, 
  onRemove, 
  isRemoving,
  formatPrice 
}: { 
  item: WishlistItem; 
  onRemove: (productId: number, productName: string) => void;
  isRemoving: boolean;
  formatPrice: (cents: number, currency: string) => string;
}) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const product = item.product;
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    const result = await addToCart(product.id, quantity);
    setIsAddingToCart(false);

    if (result.success) {
      showToast(`Added ${quantity} × ${product.title} to cart`, 'success');
      setIsQuickAddOpen(false);
      setQuantity(1);
    } else {
      showToast(result.error || 'Failed to add to cart', 'error');
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Sale Badge */}
      {product.is_on_sale && product.sale_percent && (
        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
          <Tag className="w-3.5 h-3.5" />
          {product.sale_percent}% OFF
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={() => onRemove(product.id, product.title)}
        disabled={isRemoving}
        className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:scale-110 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
        aria-label="Remove from wishlist"
      >
        {isRemoving ? (
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-5 h-5 text-red-500" />
        )}
      </button>

      {/* Clickable Product Image and Name Area */}
      <Link href={`/product/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative h-64 bg-gray-100 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {product.image ? (
              <Image 
                src={product.image.url} 
                alt={product.image.alt_text || product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">Product Image</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
        </div>
      </Link>

      {/* Price and Stock */}
      <div className="px-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col min-h-[3.5rem]">
            {product.is_on_sale && product.sale_price_cents ? (
              <>
                <p className="text-2xl font-bold text-red-600">
                  {formatPrice(product.sale_price_cents, product.currency)}
                </p>
                <p className="text-sm text-gray-400 line-through">
                  {formatPrice(product.price_cents, product.currency)}
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold text-blue-600">
                {formatPrice(product.price_cents, product.currency)}
              </p>
            )}
          </div>
          <p className={`text-sm font-medium mt-2 ${product.stock < 10 ? 'text-red-500' : 'text-gray-500'}`}>
            {product.stock} in stock
          </p>
        </div>
      </div>

      {/* Quick Add Button / Counter */}
      <div className="px-6 pb-6">
        {!isQuickAddOpen ? (
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Quick Add
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                disabled={quantity <= 1}
                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>

              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const num = parseInt(e.target.value);
                  if (!isNaN(num) && num >= 1 && num <= product.stock) {
                    setQuantity(num);
                  }
                }}
                min="1"
                max={product.stock}
                className="flex-1 text-center py-2 border-2 border-gray-200 rounded-lg font-semibold text-lg focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={() => quantity < product.stock && setQuantity(quantity + 1)}
                disabled={quantity >= product.stock}
                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isAddingToCart ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
