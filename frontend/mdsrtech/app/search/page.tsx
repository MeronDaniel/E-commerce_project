'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, Home, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Product {
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

interface Brand {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}



function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const fetchSearchResults = useCallback(async () => {
    if (!query) {
      setProducts([]);
      setFilteredProducts([]);
      setBrands([]);
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setFilteredProducts(data.products);
        setBrands(data.brands);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    // Filter by brands
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => p.brand && selectedBrands.includes(p.brand.id));
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => p.category && selectedCategories.includes(p.category.id));
    }

    // Filter by price range
    const minPriceCents = minPrice ? parseFloat(minPrice) * 100 : null;
    const maxPriceCents = maxPrice ? parseFloat(maxPrice) * 100 : null;
    
    if (minPriceCents !== null || maxPriceCents !== null) {
      filtered = filtered.filter(p => {
        const price = p.is_on_sale && p.sale_price_cents ? p.sale_price_cents : p.price_cents;
        if (minPriceCents !== null && price < minPriceCents) return false;
        if (maxPriceCents !== null && price > maxPriceCents) return false;
        return true;
      });
    }

    setFilteredProducts(filtered);
  }, [products, selectedBrands, selectedCategories, minPrice, maxPrice]);

  const toggleBrand = (brandId: number) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = selectedBrands.length > 0 || selectedCategories.length > 0 || minPrice !== '' || maxPrice !== '';

  // Transform products for ProductCard
  const transformProduct = (p: Product) => ({
    id: p.id,
    name: p.title,
    price: p.is_on_sale && p.sale_price_cents ? p.sale_price_cents / 100 : p.price_cents / 100,
    originalPrice: p.is_on_sale ? p.price_cents / 100 : undefined,
    isOnSale: p.is_on_sale,
    salePercent: p.sale_percent || undefined,
    stock: p.stock,
    image: p.image?.url || '/placeholder-product.jpg',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-50 pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // No results found
  if (!isLoading && products.length === 0 && query) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-50 pt-24 pb-12 flex items-start justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-[15vh]">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                No products found
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                We couldn&apos;t find any products matching &quot;{query}&quot;. Try a different search term or browse our categories.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Search results for &quot;{query}&quot;
            </h1>
            <p className="text-gray-600">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        min="0"
                        className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        min="0"
                        className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Brands */}
                {brands.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Brand</h3>
                    <div className="space-y-2">
                      {brands.map(brand => (
                        <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand.id)}
                            onChange={() => toggleBrand(brand.id)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">{brand.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Category</h3>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 cursor-pointer"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {selectedBrands.length + selectedCategories.length + (minPrice || maxPrice ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Filters Modal */}
            {showFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    <button onClick={() => setShowFilters(false)} className="p-2 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 mb-6 cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  )}

                  {/* Price Range */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          min="0"
                          className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          min="0"
                          className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brands */}
                  {brands.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Brand</h3>
                      <div className="space-y-2">
                        {brands.map(brand => (
                          <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand.id)}
                              onChange={() => toggleBrand(brand.id)}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{brand.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Category</h3>
                      <div className="space-y-2">
                        {categories.map(category => (
                          <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => toggleCategory(category.id)}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Show {filteredProducts.length} results
                  </button>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matching products</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters to find what you&apos;re looking for.</p>
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={transformProduct(product)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
