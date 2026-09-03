import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { addFavorite, getFavorites, removeFavorite } from '../api/client';
import { useAuth } from './AuthContext';
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
    if (isFavorite(listingId)) {
      await removeFavorite(listingId, token);
      setFavorites((current) => current.filter((listing) => listing.id !== listingId));
    } else {
      await addFavorite(listingId, token);
      const updated = await getFavorites(token);
      setFavorites(updated);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
