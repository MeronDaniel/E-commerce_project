const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Product {
  id: number;
  title: string;
  slug: string;
  brand: {
    id: number;
    name: string;
    slug: string;
  } | null;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  description: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  // Sale info
  is_on_sale: boolean;
  sale_percent: number | null;
  sale_price_cents: number | null;
  // Images
  image: {
    url: string;
    alt_text: string | null;
  } | null;
  images: Array<{
    url: string;
    alt: string | null;
    order: number;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active products with their brand and category info
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: number): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Fetch a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/slug/${slug}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Fetch products by category
 */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${categorySlug}/products`);
    
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

/**
 * Helper to format price from cents to dollar string
 */
export function formatPrice(priceCents: number, currency: string = 'CAD'): string {
  const dollars = priceCents / 100;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
  }).format(dollars);
}
