import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@shared/schema';

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      
      addItem: (product: Product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.id === product.id);
        
        if (existingItem) {
          // Increment quantity if item already exists
          return get().updateQuantity(product.id, existingItem.quantity + 1);
        }
        
        // Add new item with quantity 1
        const newItem: CartItem = { ...product, quantity: 1 };
        const newItems = [...currentItems, newItem];
        
        set({
          items: newItems,
          totalItems: get().totalItems + 1,
          totalPrice: get().totalPrice + parseFloat(product.price),
        });
      },
      
      removeItem: (productId: number) => {
        const currentItems = get().items;
        const itemToRemove = currentItems.find(item => item.id === productId);
        
        if (!itemToRemove) return;
        
        const newItems = currentItems.filter(item => item.id !== productId);
        
        set({
          items: newItems,
          totalItems: get().totalItems - itemToRemove.quantity,
          totalPrice: get().totalPrice - (parseFloat(itemToRemove.price) * itemToRemove.quantity),
        });
      },
      
      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          return get().removeItem(productId);
        }
        
        const currentItems = get().items;
        const itemToUpdate = currentItems.find(item => item.id === productId);
        
        if (!itemToUpdate) return;
        
        // Calculate total items and price difference
        const quantityDiff = quantity - itemToUpdate.quantity;
        const priceDiff = parseFloat(itemToUpdate.price) * quantityDiff;
        
        const newItems = currentItems.map(item => 
          item.id === productId ? { ...item, quantity } : item
        );
        
        set({
          items: newItems,
          totalItems: get().totalItems + quantityDiff,
          totalPrice: get().totalPrice + priceDiff,
        });
      },
      
      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        });
      },
    }),
    {
      name: 'instabuy-cart',
    }
  )
);