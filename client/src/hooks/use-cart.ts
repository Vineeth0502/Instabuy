import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@shared/schema';

export type CartItem = Product & { quantity: number };

interface CartState {
  items: CartItem[];
  addItem: (item: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  totalItems: number;
  totalPrice: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,

      addItem: (item) => {
        const existing = get().items.find((i) => i._id === item._id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [...get().items, { ...item, quantity: 1 }],
          });
        }
        updateTotals();
      },

      removeItem: (id) => {
        const currentItems = get().items;
        const itemToRemove = currentItems.find(item => item._id === id);

        if (!itemToRemove) {
          console.error('Item not found:', id);
          return;
        }

        const newItems = currentItems.filter(item => item._id !== id);
        const newTotalItems = get().totalItems - itemToRemove.quantity;
        const newTotalPrice = get().totalPrice - (parseFloat(itemToRemove.price) * itemToRemove.quantity);

        set({
          items: newItems,
          totalItems: newTotalItems,
          totalPrice: newTotalPrice,
        });

        // Force a state update
        setTimeout(() => {
          const state = get();
          set({ ...state });
        }, 0);
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 });
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i._id === id ? { ...i, quantity } : i
          ),
        });
        updateTotals();
      },

      totalItems: 0,
      totalPrice: 0,
    }),
    {
      name: 'shopping-cart',
      partialize: (state) => ({ items: state.items }),
      storage: {
        getItem: (name) => {
          const userData = localStorage.getItem('user');
          const userId = userData ? JSON.parse(userData)?._id : 'guest';
          const cartData = localStorage.getItem(`${name}-${userId}`);
          return cartData ? Promise.resolve(JSON.parse(cartData)) : null;
        },
        setItem: (name, value) => {
          const userData = localStorage.getItem('user');
          const userId = userData ? JSON.parse(userData)?._id : 'guest';
          localStorage.setItem(`${name}-${userId}`, JSON.stringify(value));
          return Promise.resolve();
        },
        removeItem: (name) => {
          const userData = localStorage.getItem('user');
          const userId = userData ? JSON.parse(userData)?._id : 'guest';
          localStorage.removeItem(`${name}-${userId}`);
          return Promise.resolve();
        },
      },
    }
  )
);

// Helper to update totals after cart change
function updateTotals() {
  const { items } = useCart.getState();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  useCart.setState({ totalItems, totalPrice });
}
