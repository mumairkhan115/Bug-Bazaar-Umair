import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface CartState {
  items: CartItem[];
}

const storageKey = 'bug-bazaar.cart';

export function readStoredCart(): CartState {
  if (typeof localStorage === 'undefined') {
    return { items: [] };
  }
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return { items: [] };
  }
  try {
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.items)) {
      return { items: [] };
    }
    return { items: parsed.items.filter((item) => typeof item.productId === 'string') };
  } catch {
    return { items: [] };
  }
}

export function writeStoredCart(state: CartState): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(state));
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: readStoredCart(),
  reducers: {
    /**
     * Adds a product or increases its quantity without passing the stock cap.
     *
     * Why: repeated Add must keep one row. The reducer is the only writer,
     * so the header badge and the cart page cannot drift apart.
     */
    addItem(state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) {
      if (action.payload.stock < 1) {
        return;
      }
      const quantity = action.payload.quantity ?? 1;
      const existing = state.items.find((item) => item.productId === action.payload.productId);
      if (existing) {
        existing.stock = action.payload.stock;
        existing.price = action.payload.price;
        existing.name = action.payload.name;
        existing.quantity = Math.min(existing.stock, existing.quantity + quantity);
        return;
      }
      state.items.push({
        productId: action.payload.productId,
        name: action.payload.name,
        price: action.payload.price,
        stock: action.payload.stock,
        quantity: Math.min(action.payload.stock, quantity),
      });
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
    },
    changeQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((entry) => entry.productId === action.payload.productId);
      if (!item || item.stock < 1) {
        return;
      }
      item.quantity = Math.min(item.stock, Math.max(1, action.payload.quantity));
    },
    syncStock(state, action: PayloadAction<{ productId: string; stock: number }>) {
      const item = state.items.find((entry) => entry.productId === action.payload.productId);
      if (!item) {
        return;
      }
      item.stock = action.payload.stock;
      if (item.quantity > item.stock) {
        item.quantity = Math.max(item.stock, 0);
      }
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, changeQuantity, syncStock, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;

/** Memoized because the header reads the count on every cart action. */
export const selectCartCount = createSelector(selectCartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0),
);

export const selectCartSubtotal = createSelector(selectCartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0),
);
