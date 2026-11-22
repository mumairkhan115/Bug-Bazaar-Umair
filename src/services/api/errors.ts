import type { ApiErrorBody } from '../../domain/types';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(status: number, code: string, details?: Record<string, string>) {
    super(code);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toApiRequestError(status: number, payload: unknown): ApiRequestError {
  const body = payload as Partial<ApiErrorBody> | null;
  const code = body?.error?.code ?? 'unavailable';
  const details = body?.error?.details;
  return new ApiRequestError(status, code, details);
}

/**
 * Turns a status code into copy the screen is allowed to show.
 *
 * Why: the JSON `error.message` is for logs and contracts, not for the shopper.
 * A 409 is the exception that names a product from `details`, which we control.
 */
export function friendlyMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return 'The store is unavailable. Try again.';
  }

  switch (error.status) {
    case 400:
      return 'Check the highlighted fields and try again.';
    case 401:
      return 'Your session has ended. Sign in again.';
    case 404:
      return 'We could not find that page.';
    case 409:
      return error.details?.productName
        ? `${error.details.productName} is out of stock.`
        : 'One item is out of stock.';
    default:
      return 'The store is unavailable. Try again.';
  }
}
