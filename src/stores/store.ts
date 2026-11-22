import { configureStore, type Middleware } from '@reduxjs/toolkit';
import { clearSession, writeStoredSession, type SessionState } from '../features/auth/sessionSlice';
import sessionReducer from '../features/auth/sessionSlice';
import cartReducer, { writeStoredCart, type CartState } from '../features/cart/cartSlice';
import { configureApi } from '../services/api/client';

/**
 * Persists the cart after cart actions.
 *
 * Why: a reload should keep the cart, and Redux Persist is an extra library
 * this project does not need for one slice.
 */
const persistState: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action);
  const type = actionType(action);
  const state = storeApi.getState() as { cart: CartState; session: SessionState };
  if (type.startsWith('cart/')) {
    writeStoredCart(state.cart);
  }
  if (type.startsWith('session/')) {
    writeStoredSession(state.session);
  }
  return result;
};

function actionType(action: unknown): string {
  if (typeof action === 'object' && action !== null && 'type' in action) {
    return String(action.type);
  }
  return '';
}

export function createAppStore() {
  return configureStore({
    reducer: {
      cart: cartReducer,
      session: sessionReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(persistState),
  });
}

export const store = createAppStore();

configureApi({
  readToken: () => store.getState().session.token,
  onUnauthorized: () => {
    store.dispatch(clearSession());
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
