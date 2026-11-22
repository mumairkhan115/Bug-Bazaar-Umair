import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../../stores/store';
import { addItem } from '../cart/cartSlice';
import LoginPage from './LoginPage';
import { loginRequest } from '../../services/api/auth';
import CheckoutPage from '../checkout/CheckoutPage';
import { createOrder } from '../../services/api/orders';

vi.mock('../../services/api/auth', () => ({
  loginRequest: vi.fn(),
}));

vi.mock('../../services/api/orders', () => ({
  createOrder: vi.fn(),
}));

function renderWithStore(ui: ReactElement, path = '/') {
  const store = createAppStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </Provider>,
  );
  return store;
}

describe('login and checkout screens', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('asks for an email before calling the API', async () => {
    const user = userEvent.setup();
    renderWithStore(<LoginPage />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it('signs in with the demo account', async () => {
    const user = userEvent.setup();
    vi.mocked(loginRequest).mockResolvedValue({
      token: 'token-umair',
      user: { id: 'user-1', name: 'Umair Khan', email: 'umair@bugbazaar.dev' },
    });
    const store = renderWithStore(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'umair@bugbazaar.dev');
    await user.type(screen.getByLabelText('Password'), 'quack');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(loginRequest).toHaveBeenCalledWith('umair@bugbazaar.dev', 'quack');
    expect(store.getState().session.token).toBe('token-umair');
  });

  it('places an order from the cart', async () => {
    const user = userEvent.setup();
    vi.mocked(createOrder).mockResolvedValue({ id: 'ord-1', status: 'queued' });
    const store = renderWithStore(<CheckoutPage />);
    store.dispatch(addItem({ productId: '2', name: 'Quiet Duck 2', price: 524, stock: 4 }));
    await user.click(await screen.findByRole('button', { name: 'Place order' }));
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(store.getState().cart.items).toEqual([]);
  });

  it('shows the out-of-stock name and keeps the cart for a retry', async () => {
    const user = userEvent.setup();
    const { ApiRequestError } = await import('../../services/api/errors');
    vi.mocked(createOrder).mockRejectedValue(
      new ApiRequestError(409, 'out_of_stock', { productName: 'Quiet Duck 2' }),
    );
    const store = renderWithStore(<CheckoutPage />);
    store.dispatch(addItem({ productId: '2', name: 'Quiet Duck 2', price: 524, stock: 4 }));
    await user.click(await screen.findByRole('button', { name: 'Place order' }));
    expect(await screen.findByText('Quiet Duck 2 is out of stock.')).toBeInTheDocument();
    expect(store.getState().cart.items).toHaveLength(1);
  });
});
