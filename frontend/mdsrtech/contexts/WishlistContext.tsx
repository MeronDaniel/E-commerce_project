'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: number[];
  isLoading: boolean;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<{ success: boolean; action?: 'added' | 'removed'; error?: string }>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [isLoading] = useState(false);

  const fetchWishlistIds = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/wishlist/ids`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWishlistIds(data.product_ids || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  }, []);

  // Fetch wishlist IDs when user is authenticated
  useEffect(() => {
    let mounted = true;
    
    const loadWishlist = async () => {
      if (!authLoading && isAuthenticated) {
        await fetchWishlistIds();
      } else if (!isAuthenticated) {
        if (mounted) {
          setWishlistIds([]);
        }
      }
    };
    
    loadWishlist();
    return () => { mounted = false; };
  }, [isAuthenticated, authLoading, fetchWishlistIds]);

  const isInWishlist = useCallback((productId: number): boolean => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  const toggleWishlist = async (productId: number): Promise<{ success: boolean; action?: 'added' | 'removed'; error?: string }> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_URL}/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId })
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        if (data.action === 'added') {
          setWishlistIds(prev => [...prev, productId]);
        } else {
          setWishlistIds(prev => prev.filter(id => id !== productId));
        }
        return { success: true, action: data.action };
      } else {
        return { success: false, error: data.error || 'Failed to update wishlist' };
      }
    } catch (error) {
      console.error('Toggle wishlist error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const refreshWishlist = async () => {
    await fetchWishlistIds();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isLoading,
        isInWishlist,
        toggleWishlist,
        refreshWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
