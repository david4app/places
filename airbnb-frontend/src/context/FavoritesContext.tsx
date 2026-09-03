import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { addFavorite, getFavorites, removeFavorite } from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import type { Listing } from '../types';

type FavoritesContextValue = {
  favorites: Listing[];
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: async () => undefined,
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<Listing[]>([]);

  useEffect(() => {
    if (!token) {
      setFavorites([]);
      return;
    }
    getFavorites(token)
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, [token]);

  const isFavorite = (listingId: string) => favorites.some((listing) => listing.id === listingId);

  const toggleFavorite = async (listingId: string) => {
    if (!token) return;
    try {
      if (isFavorite(listingId)) {
        await removeFavorite(listingId, token);
        setFavorites((current) => current.filter((listing) => listing.id !== listingId));
        showToast('Removed from favorites.');
      } else {
        await addFavorite(listingId, token);
        const updated = await getFavorites(token);
        setFavorites(updated);
        showToast('Added to favorites.');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update favorites.', 'error');
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
