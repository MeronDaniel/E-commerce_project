'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Minus, ShoppingCart, Heart, Tag, Package, Truck, Shield, ChevronRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
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
  categorySlug?: string;
}

interface SuggestedProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  isOnSale?: boolean;
  salePercent?: number;
  stock: number;
  image: string;
}

interface ProductPageClientProps {
  product: Product;
  suggestedProducts?: SuggestedProduct[];
}

export default function ProductPageClient({ product, suggestedProducts = [] }: ProductPageClientProps) {
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
      showToast(`Added ${quantity} × ${product.name} to cart`, 'success');
    } else {
      showToast(result.error || 'Failed to add to cart', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            {product.category && product.categorySlug && (
              <>
                <Link href={`/category/${product.categorySlug}`} className="hover:text-blue-600 transition-colors">
                  {product.category}
                </Link>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Back Button - Mobile */}
          <button
            onClick={() => router.back()}
            className="md:hidden flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group cursor-pointer mb-4"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>

          {/* Product Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Product Image Section */}
              <div className="relative bg-white p-6 lg:p-12">
                {/* Sale Badge */}
                {product.isOnSale && product.salePercent && (
                  <div className="absolute top-6 left-6 z-10 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                    <Tag className="w-4 h-4" />
                    {product.salePercent}% OFF
                  </div>
                )}

                <div className="aspect-square relative">
                  {product.image && product.image !== '/placeholder-product.jpg' ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Package className="w-24 h-24 text-gray-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details Section */}
              <div className="p-6 lg:p-12 lg:border-l border-gray-100 flex flex-col">
                {/* Brand */}
                {product.brand && (
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    {product.brand}
                  </p>
                )}

                {/* Product Name */}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-6">
                  {product.isOnSale && product.originalPrice ? (
                    <>
                      <span className="text-3xl lg:text-4xl font-bold text-red-600">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xl text-gray-400 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                        Save ${(product.originalPrice - product.price).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl lg:text-4xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2 mb-6">
                  <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Description</h2>
                    <p className="text-gray-600 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Quantity</h2>
                  <div className="flex items-center gap-3 max-w-[200px]">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-xl transition-colors cursor-pointer"
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
                      className="flex-1 text-center py-3 border-2 border-gray-200 rounded-xl font-semibold text-lg focus:outline-none focus:border-blue-500 transition-colors"
                    />

                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="p-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-xl transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || product.stock === 0}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
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

                  <button
                    onClick={handleWishlistClick}
                    disabled={isWishlistLoading}
                    className={`sm:w-auto px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                      isWishlisted 
                        ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''} ${isWishlistLoading ? 'animate-pulse' : ''}`} />
                    <span className="sm:hidden lg:inline">{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                  </button>
                </div>

                {/* Features */}
                <div className="border-t border-gray-100 pt-6 mt-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                      <span>Free Shipping</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <span>1 Year Warranty</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <span>Easy Returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* You May Also Like Section */}
          {suggestedProducts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedProducts.map((suggestedProduct) => (
                  <ProductCard key={suggestedProduct.id} product={suggestedProduct} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
