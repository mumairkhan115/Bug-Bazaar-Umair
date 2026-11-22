import type { User } from '../../domain/types';
import { apiRequest } from './client';

export function loginRequest(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  return apiRequest('/api/login', {
    method: 'POST',
    body: { email, password },
    cache: false,
  });
}

export function currentUserRequest(signal?: AbortSignal): Promise<User> {
  return apiRequest<User>('/api/me', { signal, cache: false });
}
