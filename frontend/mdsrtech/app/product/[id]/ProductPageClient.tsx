'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, ShoppingCart, Heart, Tag } from 'lucide-react';
import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  isOnSale?: boolean;
  salePercent?: number;
  stock: number;
  image: string;
  description?: string;
  brand?: string;
  category?: string;
}

export default function ProductPageClient({ product }: { product: Product }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your wishlist', 'info');
      return;
    }

    setIsWishlistLoading(true);
    const result = await toggleWishlist(product.id);
    setIsWishlistLoading(false);

    if (result.success) {
      if (result.action === 'added') {
        showToast(`${product.name} added to wishlist`, 'success');
      } else {
        showToast(`${product.name} removed from wishlist`, 'success');
      }
    } else {
      showToast(result.error || 'Failed to update wishlist', 'error');
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityInput = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= product.stock) {
      setQuantity(num);
    } else if (value === '') {
      setQuantity(1);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your cart', 'info');
      return;
    }

    setIsAddingToCart(true);
    const result = await addToCart(product.id, quantity);
    setIsAddingToCart(false);

    if (result.success) {
      showToast(`Added ${quantity} ${product.name} to cart`, 'success');
    } else {
      showToast(result.error || 'Failed to add to cart', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Product Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Product Image */}
          <div className="w-full max-w-md">
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
              <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Product Image</span>
              </div>
            </div>
          </div>

          {/* Brand & Category */}
          {(product.brand || product.category) && (
            <div className="flex gap-3 text-sm text-gray-500">
              {product.brand && <span className="font-medium">{product.brand}</span>}
              {product.brand && product.category && <span>•</span>}
              {product.category && <span>{product.category}</span>}
            </div>
          )}

          {/* Product Name */}
          <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>

          {/* Description */}
          {product.description && (
            <p className="text-lg text-gray-600 max-w-2xl">
              {product.description}
            </p>
          )}

          {/* Sale Badge */}
          {product.isOnSale && product.salePercent && (
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold">
              <Tag className="w-5 h-5" />
              {product.salePercent}% OFF - Limited Time Sale!
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-center gap-4">
            {product.isOnSale && product.originalPrice ? (
              <>
                <p className="text-5xl font-bold text-red-600">
                  ${product.price.toFixed(2)}
                </p>
                <div className="flex flex-col items-start">
                  <p className="text-2xl text-gray-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </p>
                  <p className="text-green-600 font-semibold">
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-5xl font-bold text-blue-600">
                ${product.price.toFixed(2)}
              </p>
            )}
          </div>

          {/* Stock */}
          <p
            className={`text-lg font-medium ${
              product.stock < 10 ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            {product.stock} in stock
          </p>

          {/* Quantity Selector */}
          <div className="w-full max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="p-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-6 h-6" />
              </button>

              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityInput(e.target.value)}
                min="1"
                max={product.stock}
                className="flex-1 text-center py-3 border-2 border-gray-200 rounded-lg font-semibold text-xl focus:outline-none focus:border-blue-500 transition-colors"
              />

              <button
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
                className="p-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    Add to Cart
                  </>
                )}
              </button>

              {/* Add to Wishlist Button */}
              <button
                onClick={handleWishlistClick}
                disabled={isWishlistLoading}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isWishlisted 
                    ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500' : ''} ${isWishlistLoading ? 'animate-pulse' : ''}`} />
                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
