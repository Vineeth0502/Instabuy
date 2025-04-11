
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@shared/schema';

interface FavoritesStore {
  favorites: number[];
  addFavorite: (productId: number) => void;
  removeFavorite: (productId: number) => void;
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
}

const getFavoritesKey = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return `favorites-${user?._id || 'guest'}`;
};

export const useFavorites = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      
      addFavorite: (productId: number) => {
        set((state) => ({
          favorites: [...state.favorites, productId],
        }));
      },
      
      removeFavorite: (productId: number) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== productId),
        }));
      },
      
      toggleFavorite: (productId: number) => {
        const isFavorite = get().favorites.includes(productId);
        if (isFavorite) {
          get().removeFavorite(productId);
        } else {
          get().addFavorite(productId);
        }
      },
      
      isFavorite: (productId: number) => {
        return get().favorites.includes(productId);
      },
    }),
    {
      name: getFavoritesKey(),
      version: 1,
    }
  )
);
