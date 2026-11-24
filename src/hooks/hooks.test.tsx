import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { useState } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product, ProductPage } from '../domain/types';
import { useDebouncedValue } from './useDebouncedValue';
import { useProductSearch } from './useProductSearch';
import { useUrlFilters } from './useUrlFilters';
import { listProducts } from '../services/api/products';

vi.mock('../services/api/products', () => ({
  listProducts: vi.fn(),
}));

const duck: Product = {
  id: '4',
  name: 'Moss Duck 4',
  price: 100,
  category: 'ducks',
  stock: 3,
  rating: 5,
  imageUrl: '/gear/ducks.svg',
};

function DebounceProbe() {
  const [value, setValue] = useState('d');
  const debounced = useDebouncedValue(value, 300);
  return (
    <div>
      <button type="button" onClick={() => setValue('duck')}>
        type
      </button>
      <span>{debounced}</span>
    </div>
  );
}

function UrlProbe() {
  useUrlFilters();
  const location = useLocation();
  return <div>{location.search}</div>;
}

function SearchProbe({ search }: { search: string }) {
  const result = useProductSearch({
    search,
    category: '',
    inStock: false,
    sort: 'name',
    page: 1,
    pageSize: 12,
  });
  return <div>{result.page?.items[0]?.name ?? result.status.state}</div>;
}

describe('custom hooks', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('updates a debounced value after the delay', () => {
    vi.useFakeTimers();
    render(<DebounceProbe />);
    act(() => {
      screen.getByRole('button', { name: 'type' }).click();
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText('duck')).toBeInTheDocument();
  });

  it('drops pageSize from the catalog URL', async () => {
    render(
      <MemoryRouter initialEntries={['/?pageSize=24&search=duck']}>
        <Routes>
          <Route path="/" element={<UrlProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('?search=duck')).toBeInTheDocument();
  });

  it('keeps the latest search when an older request resolves last', async () => {
    let resolveOld: (value: ProductPage) => void = () => undefined;
    vi.mocked(listProducts).mockImplementation((query) => {
      if (query.search === 'd') {
        return new Promise((resolve) => {
          resolveOld = resolve;
        });
      }
      return Promise.resolve({ items: [duck], total: 1 });
    });

    const { rerender } = render(<SearchProbe search="d" />);
    rerender(<SearchProbe search="duck" />);
    expect(await screen.findByText('Moss Duck 4')).toBeInTheDocument();
    resolveOld({
      items: [{ ...duck, id: '1', name: 'Old Result' }],
      total: 1,
    });
    expect(screen.queryByText('Old Result')).not.toBeInTheDocument();
  });
});
