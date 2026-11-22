import type { User } from './types.ts';

export const demoUser: User = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@bugbazaar.dev',
};

export const demoPassword = 'quack';
export const demoToken = 'token-ada';

export type LoginResult =
  | { ok: true; token: string; user: User }
  | { ok: false; status: 400; details: Record<string, string> }
  | { ok: false; status: 401 };

/**
 * Checks the demo account.
 *
 * Why: login needs a predictable 400 for bad fields and a 401 for a bad password
 * without a real identity provider.
 */
export function authenticate(email: string, password: string): LoginResult {
  const details: Record<string, string> = {};
  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    details.email = 'Email is required.';
  } else if (!trimmedEmail.includes('@')) {
    details.email = 'Enter a valid email.';
  }

  if (password.length === 0) {
    details.password = 'Password is required.';
  }

  if (Object.keys(details).length > 0) {
    return { ok: false, status: 400, details };
  }

  if (trimmedEmail.toLowerCase() !== demoUser.email || password !== demoPassword) {
    return { ok: false, status: 401 };
  }

  return { ok: true, token: demoToken, user: demoUser };
}

export function userForToken(token: string | undefined): User | undefined {
  if (token === demoToken) {
    return demoUser;
  }
  return undefined;
}
