import Navbar from '../../components/Navbar';
import ProductPageClient from './ProductPageClient';
import { getProductById, getAllProducts } from '@/lib/api/products';
import Link from 'next/link';
import { Package, Home } from 'lucide-react';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(parseInt(id));
  
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-12 min-h-[calc(100vh-6rem)] flex items-start justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-[15vh]">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Product not found
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                The product you&apos;re looking for doesn&apos;t exist or may have been removed.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/25"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Fetch all products for suggestions
  const allProducts = await getAllProducts();
  
  // Get suggested products: same category first, then same brand, excluding current product
  const currentProductId = product.id;
  const categoryId = product.category?.id;
  const brandId = product.brand?.id;
  
  // Products in same category (excluding current)
  const sameCategoryProducts = allProducts.filter(
    p => p.id !== currentProductId && p.category?.id === categoryId
  );
  
  // Products from same brand but different category (excluding current and already included)
  const sameCategoryIds = new Set(sameCategoryProducts.map(p => p.id));
  const sameBrandProducts = allProducts.filter(
    p => p.id !== currentProductId && 
         !sameCategoryIds.has(p.id) && 
         p.brand?.id === brandId
  );
  
  // Combine: category products first, then brand products, limit to 4
  const suggestedProducts = [...sameCategoryProducts, ...sameBrandProducts]
    .slice(0, 4)
    .map(p => ({
      id: p.id,
      name: p.title,
      price: p.is_on_sale && p.sale_price_cents ? p.sale_price_cents / 100 : p.price_cents / 100,
      originalPrice: p.is_on_sale ? p.price_cents / 100 : undefined,
      isOnSale: p.is_on_sale,
      salePercent: p.sale_percent || undefined,
      stock: p.stock,
      image: p.image?.url || p.images?.[0]?.url || '/placeholder-product.jpg',
    }));
  
  // Transform API product to component format with sale info
  const productForClient = {
    id: product.id,
    name: product.title,
    price: product.is_on_sale && product.sale_price_cents 
      ? product.sale_price_cents / 100 
      : product.price_cents / 100,
    originalPrice: product.is_on_sale ? product.price_cents / 100 : undefined,
    isOnSale: product.is_on_sale,
    salePercent: product.sale_percent || undefined,
    stock: product.stock,
    image: product.image?.url || product.images?.[0]?.url || '/placeholder-product.jpg',
    description: product.description || 'No description available',
    brand: product.brand?.name,
    category: product.category?.name,
    categorySlug: product.category?.slug,
  };
  
  return <ProductPageClient product={productForClient} suggestedProducts={suggestedProducts} />;
}

