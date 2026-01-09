import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  templateId: string;
  template: any; // InstanceTemplate type
  quantity: number;
  addedAt: Date;
}

interface TemplateCartState {
  items: CartItem[];
  addToCart: (template: any, quantity?: number) => void;
  removeFromCart: (templateId: string) => void;
  updateQuantity: (templateId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => { monthly: number; yearly: number };
}

export const useTemplateCart = create<TemplateCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (template, quantity = 1) => {
        const items = get().items;
        const existingIndex = items.findIndex((item) => item.templateId === template.id);

        if (existingIndex >= 0) {
          // Update quantity if already in cart
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          // Add new item
          set({
            items: [
              ...items,
              {
                templateId: template.id,
                template,
                quantity,
                addedAt: new Date(),
              },
            ],
          });
        }
      },

      removeFromCart: (templateId) => {
        set({ items: get().items.filter((item) => item.templateId !== templateId) });
      },

      updateQuantity: (templateId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(templateId);
          return;
        }

        const items = get().items;
        const index = items.findIndex((item) => item.templateId === templateId);
        if (index >= 0) {
          const newItems = [...items];
          newItems[index].quantity = quantity;
          set({ items: newItems });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getCartCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getCartTotal: () => {
        const items = get().items;
        const monthly = items.reduce((sum, item) => {
          const price = item.template.pricing_cache?.monthly_total_usd || 0;
          return sum + price * item.quantity;
        }, 0);

        const yearly = items.reduce((sum, item) => {
          const price = item.template.pricing_cache?.yearly_total_usd || 0;
          return sum + price * item.quantity;
        }, 0);

        return { monthly, yearly };
      },
    }),
    {
      name: "template-cart-storage",
    }
  )
);
