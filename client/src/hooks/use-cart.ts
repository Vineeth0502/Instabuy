// client/src/hooks/use-cart.ts
import { create } from 'zustand';
import { Product } from '@shared/schema';

export type CartItem = Product & { quantity: number };

interface CartState {
  items: CartItem[];
  addItem: (item: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;

  // 🧠 Derived state
  totalItems: number;
  totalPrice: number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

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
    set({ items: get().items.filter((i) => i._id !== id) });
    updateTotals();
  },

  clearCart: () => {
    set({ items: [] });
    updateTotals();
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
}));

// Helper to update totals after cart change
function updateTotals() {
  const { items } = useCart.getState();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  useCart.setState({ totalItems, totalPrice });
}
