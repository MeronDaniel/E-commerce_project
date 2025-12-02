'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { ShoppingCart, User, Search, ChevronDown, LogOut, Heart, Package, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export default function Navbar() {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { totalItems } = useCart();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isCategoriesOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    if (isCategoriesOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isCategoriesOpen, isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const categories = [
    { name: 'Laptops', slug: 'laptops' },
    { name: 'Phones', slug: 'phones' },
    { name: 'Tablets', slug: 'tablets' },
    { name: 'Audio', slug: 'audio' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'Wearables', slug: 'wearables' },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {isCategoriesOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setIsCategoriesOpen(false)}
        />
      )}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
              MDSRTech
            </h1>
          </Link>

          {/* Categories Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <span className="font-medium">Categories</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isCategoriesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isCategoriesOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    onClick={() => setIsCategoriesOpen(false)}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer">
                <Search className="w-5 h-5 text-gray-400 hover:text-blue-600 transition-colors" />
              </button>
            </form>
          </div>

          {/* Cart and Profile */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/cart')}
              className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* User Menu / Auth Button */}
            {isLoading ? (
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <User className="w-6 h-6" />
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push('/wishlist');
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4" />
                      My Wishlist
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push('/orders');
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      My Orders
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => router.push('/auth')}
                className="flex items-center gap-2 p-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-medium">Sign Up / Log In</span>
              </button>
            )}

            {/* Admin Link - Only visible to admins */}
            {isAuthenticated && user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Admin</span>
              </Link>
            )}
          </div>
        </div>
        </div>
      </nav>
    </>
  );
}
