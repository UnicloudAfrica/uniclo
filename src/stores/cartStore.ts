import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  category: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  monthly_cost: number;
  one_time_cost: number;
  quantity: number;
  currency: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
}

const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, id: `${item.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }],
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "cost-explorer-cart" }
  )
);

export default useCartStore;

// Derived selectors
export const useCartSubtotal = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.monthly_cost * i.quantity, 0));

export const useCartOneTime = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.one_time_cost * i.quantity, 0));
