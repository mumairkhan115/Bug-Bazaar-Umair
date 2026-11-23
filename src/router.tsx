import { createBrowserRouter } from 'react-router-dom';
import RouteError from './components/ui/AppErrorBoundary/RouteError';
import ProtectedRoute from './components/ui/ProtectedRoute/ProtectedRoute';

/**
 * Vite's base always ends with a slash. React Router rejects that trailing slash.
 * Why: the Pages build is served from /Bug-Bazaar-Umair/, not the domain root.
 */
function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base === '' ? undefined : base;
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      lazy: async () => {
        const { default: AppLayout } = await import('./components/ui/AppLayout/AppLayout');
        return { Component: AppLayout };
      },
      children: [
        {
          errorElement: <RouteError />,
          children: [
            {
              index: true,
              lazy: async () => {
                const { default: CatalogPage } = await import('./features/catalog/CatalogPage');
                return { Component: CatalogPage };
              },
            },
            {
              path: 'products/:id',
              lazy: async () => {
                const { default: ProductPage } = await import('./features/product/ProductPage');
                return { Component: ProductPage };
              },
            },
            {
              path: 'cart',
              lazy: async () => {
                const { default: CartPage } = await import('./features/cart/CartPage');
                return { Component: CartPage };
              },
            },
            {
              path: 'login',
              lazy: async () => {
                const { default: LoginPage } = await import('./features/auth/LoginPage');
                return { Component: LoginPage };
              },
            },
            {
              element: <ProtectedRoute />,
              children: [
                {
                  path: 'checkout',
                  lazy: async () => {
                    const { default: CheckoutPage } =
                      await import('./features/checkout/CheckoutPage');
                    return { Component: CheckoutPage };
                  },
                },
                {
                  path: 'account',
                  lazy: async () => {
                    const { default: AccountPage } = await import('./features/auth/AccountPage');
                    return { Component: AccountPage };
                  },
                },
                {
                  path: 'orders/:id',
                  lazy: async () => {
                    const { default: OrderPage } = await import('./features/orders/OrderPage');
                    return { Component: OrderPage };
                  },
                },
              ],
            },
            {
              path: '*',
              lazy: async () => {
                const { default: NotFoundPage } =
                  await import('./components/ui/NotFound/NotFoundPage');
                return { Component: NotFoundPage };
              },
            },
          ],
        },
      ],
    },
  ],
  { basename: routerBasename() },
);
