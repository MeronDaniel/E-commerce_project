'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface CartContextType {
  itemCount: number;
  totalItems: number;
  isLoading: boolean;
  addToCart: (productId: number, quantity: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (productId: number, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (productId: number) => Promise<{ success: boolean; error?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading] = useState(false);

  const fetchCartCount = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/cart/count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItemCount(data.count || 0);
        setTotalItems(data.total_items || 0);
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  }, []);

  // Fetch cart count when user is authenticated
  useEffect(() => {
    let mounted = true;
    
    const loadCart = async () => {
      if (!authLoading && isAuthenticated) {
        await fetchCartCount();
      } else if (!isAuthenticated) {
        if (mounted) {
          setItemCount(0);
          setTotalItems(0);
        }
      }
    };
    
    loadCart();
    return () => { mounted = false; };
  }, [isAuthenticated, authLoading, fetchCartCount]);

  const addToCart = async (productId: number, quantity: number): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId, quantity })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh cart count
        await fetchCartCount();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to add to cart' };
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const updateQuantity = async (productId: number, quantity: number): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_URL}/cart/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId, quantity })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCartCount();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to update cart' };
      }
    } catch (error) {
      console.error('Update cart error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const removeFromCart = async (productId: number): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_URL}/cart/remove`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCartCount();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to remove from cart' };
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const refreshCart = async () => {
    await fetchCartCount();
  };

  return (
    <CartContext.Provider
      value={{
        itemCount,
        totalItems,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
