'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  isOnSale?: boolean;
  salePercent?: number;
  stock: number;
  image: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleQuickAdd = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your cart', 'info');
      return;
    }
    setIsQuickAddOpen(true);
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
      showToast(`Added ${quantity} × ${product.name} to cart`, 'success');
      setIsQuickAddOpen(false);
      setQuantity(1);
    } else {
      showToast(result.error || 'Failed to add to cart', 'error');
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

  return (
    <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Sale Badge */}
      {product.isOnSale && product.salePercent && (
        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
          <Tag className="w-3.5 h-3.5" />
          {product.salePercent}% OFF
        </div>
      )}

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistClick}
        disabled={isWishlistLoading}
        className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-transform disabled:opacity-50 cursor-pointer"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`w-5 h-5 transition-colors ${
            isWishlisted
              ? 'fill-red-500 text-red-500'
              : 'text-gray-600 hover:text-red-500'
          } ${isWishlistLoading ? 'animate-pulse' : ''}`}
        />
      </button>

      {/* Clickable Product Image and Name Area */}
      <Link href={`/product/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative h-64 bg-gray-100 overflow-hidden">
          {product.image && product.image !== '/placeholder-product.jpg' ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">Product Image</span>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </div>
      </Link>

      {/* Price and Stock - Not Clickable */}
      <div className="px-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col min-h-[3.5rem]">
            {product.isOnSale && product.originalPrice ? (
              <>
                <p className="text-2xl font-bold text-red-600">
                  ${product.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold text-blue-600">
                ${product.price.toFixed(2)}
              </p>
            )}
          </div>
          <p
            className={`text-sm font-medium mt-2 ${
              product.stock < 10 ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {product.stock} in stock
          </p>
        </div>
      </div>

      {/* Quick Add Button / Counter */}
      <div className="px-6 pb-6">
        {!isQuickAddOpen ? (
          <button
            onClick={handleQuickAdd}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2  cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Quick Add
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5" />
              </button>

              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityInput(e.target.value)}
                min="1"
                max={product.stock}
                className="flex-1 text-center py-2 border-2 border-gray-200 rounded-lg font-semibold text-lg focus:outline-none focus:border-blue-500 transition-colors"
              />

              <button
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors cursor-pointer"
                aria-label="Increase quantity"
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
