import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../domain/types';

const tokenKey = 'bug-bazaar.token';
const userKey = 'bug-bazaar.user';

export interface SessionState {
  token: string | null;
  user: User | null;
}

function readSession(): SessionState {
  if (typeof sessionStorage === 'undefined') {
    return { token: null, user: null };
  }
  const token = sessionStorage.getItem(tokenKey);
  const rawUser = sessionStorage.getItem(userKey);
  if (!token || !rawUser) {
    return { token: null, user: null };
  }
  try {
    const user = JSON.parse(rawUser) as User;
    if (!user.email || !user.name) {
      return { token: null, user: null };
    }
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function writeStoredSession(state: SessionState): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  if (!state.token || !state.user) {
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem(userKey);
    return;
  }
  sessionStorage.setItem(tokenKey, state.token);
  sessionStorage.setItem(userKey, JSON.stringify(state.user));
}

const sessionSlice = createSlice({
  name: 'session',
  initialState: readSession(),
  reducers: {
    /**
     * Replaces the in-memory session.
     *
     * Why: login and a 401 are the only events that may change it.
     * Persistence lives in middleware so the reducer stays pure.
     */
    setSession(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    clearSession(state) {
      state.token = null;
      state.user = null;
    },
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
