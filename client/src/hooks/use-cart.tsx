
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@shared/schema';
import { useToast } from './use-toast';

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const getCartKey = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return `cart-${user?._id || 'guest'}`;
};

const calculateTotals = (items: CartItem[]) => {
  return items.reduce(
    (acc, item) => ({
      totalItems: acc.totalItems + item.quantity,
      totalPrice: acc.totalPrice + parseFloat(item.price) * item.quantity,
    }),
    { totalItems: 0, totalPrice: 0 }
  );
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      
      addItem: (product: Product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item._id === product._id);
        
        if (existingItem) {
          const newQuantity = Math.min(existingItem.quantity + 1, product.stock);
          get().updateQuantity(product._id, newQuantity);
          return;
        }
        
        const newItem: CartItem = { ...product, quantity: 1 };
        const newItems = [...currentItems, newItem];
        const { totalItems, totalPrice } = calculateTotals(newItems);
        
        set({ items: newItems, totalItems, totalPrice });
      },
      
      removeItem: (id: string) => {
        const newItems = get().items.filter(item => item._id === id);
        const { totalItems, totalPrice } = calculateTotals(newItems);
        set({ items: newItems, totalItems, totalPrice });
      },
      
      updateQuantity: (id: number, quantity: number) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        
        const newItems = get().items.map(item => {
          if (item._id === id) {
            const newQuantity = Math.min(quantity, item.stock);
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        
        const { totalItems, totalPrice } = calculateTotals(newItems);
        set({ items: newItems, totalItems, totalPrice });
      },
      
      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 });
      },
    }),
    {
      name: getCartKey(),
      version: 1,
    }
  )
);
