import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number, instructions?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  
  // Pricing helpers/selectors
  getSubtotal: () => number;
  getGST: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (menuItem, quantity = 1, instructions = '') => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === menuItem.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === menuItem.id
                  ? { ...i, quantity: i.quantity + quantity, customInstructions: instructions || i.customInstructions }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { id: menuItem.id, menuItem, quantity, customInstructions: instructions }],
          };
        });
      },
      
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        }));
      },
      
      setInstructions: (itemId, instructions) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, customInstructions: instructions } : i
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
      },
      
      getGST: () => {
        // Industry standard 5% tax for cloud kitchens
        return Math.round(get().getSubtotal() * 0.05);
      },
      
      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        // Free delivery above ₹499
        return subtotal >= 499 ? 0 : 40;
      },
      
      getTotal: () => {
        return get().getSubtotal() + get().getGST() + get().getDeliveryFee();
      },
    }),
    {
      name: 'bitecraft-cart', // local storage key
    }
  )
);
