import { useEffect, useMemo, useRef, useState } from 'react';
import { Col, Flex, Grid, Pagination, Row } from 'antd';
import { useAppDispatch } from '../../hooks/redux';
import { useLiveStock } from '../../components/ui/AppLayout/liveStockContext';
import PageStatus from '../../components/ui/PageStatus/PageStatus';
import type { Product, ProductQuery } from '../../domain/types';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useProductSearch } from '../../hooks/useProductSearch';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { addItem } from '../cart/cartSlice';
import FiltersBar from './FiltersBar';
import ProductCard from './ProductCard';
import './CatalogPage.scss';

/**
 * Catalog container: URL filters, debounced search, paged cards, and live stock.
 *
 * React concept: the page of cards is a derived view. Search text is local
 * until the debounce writes it to the URL. Page size follows the lg
 * breakpoint and is not written to the URL.
 */
export default function CatalogPage() {
  const dispatch = useAppDispatch();
  const screens = Grid.useBreakpoint();
  const pageSizeReady = screens.lg !== undefined;
  const pageSize: 12 | 24 = screens.lg ? 24 : 12;
  const measuredSize = useRef<12 | 24 | null>(null);
  const { filters, updateFilters } = useUrlFilters();
  const [draftSearch, setDraftSearch] = useState(filters.search);
  const [seenSearch, setSeenSearch] = useState(filters.search);
  if (filters.search !== seenSearch) {
    setSeenSearch(filters.search);
    setDraftSearch(filters.search);
  }
  const debouncedSearch = useDebouncedValue(draftSearch, 300);
  const { stocks } = useLiveStock();

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateFilters({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, filters.search, updateFilters]);

  /**
   * Moves back to page 1 when the viewport crosses lg.
   *
   * Why: 12 and 24 items are different slices. The size stays off the URL
   * because it belongs to the screen, not to a copied filter link.
   */
  useEffect(() => {
    if (!pageSizeReady) {
      return;
    }
    const previous = measuredSize.current;
    measuredSize.current = pageSize;
    if (previous !== null && previous !== pageSize && filters.page !== 1) {
      updateFilters({ page: 1 });
    }
  }, [filters.page, pageSize, pageSizeReady, updateFilters]);

  const query = useMemo<ProductQuery>(() => {
    let search = filters.search;
    if (filters.fault === '500') {
      search = '__error_500';
    } else if (filters.fault === 'empty') {
      search = '__no_match__';
    }
    return {
      search,
      category: filters.category,
      inStock: filters.inStock,
      sort: filters.sort,
      page: filters.page,
      pageSize,
    };
  }, [
    filters.category,
    filters.fault,
    filters.inStock,
    filters.page,
    filters.search,
    filters.sort,
    pageSize,
  ]);

  const { status, page, retry } = useProductSearch(query, pageSizeReady);

  const items = (page?.items ?? []).map((product) => {
    const stock = stocks[product.id];
    return stock === undefined ? product : { ...product, stock };
  });

  const handleAdd = (product: Product) => {
    dispatch(
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
      }),
    );
  };

  const handleClear = () => {
    setDraftSearch('');
    updateFilters({
      search: '',
      category: '',
      inStock: false,
      sort: 'name',
      page: 1,
      fault: '',
    });
  };

  return (
    <section className="catalog-page">
      <FiltersBar
        draftSearch={draftSearch}
        filters={filters}
        total={page?.total ?? 0}
        onSearch={setDraftSearch}
        onChange={updateFilters}
        onClear={handleClear}
      />
      <PageStatus
        status={status}
        empty={status.state === 'success' && items.length === 0}
        emptyDescription="No gear matches those filters."
        onRetry={retry}
      >
        <Row gutter={[16, 16]}>
          {items.map((product) => (
            <Col key={product.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
              <ProductCard product={product} onAdd={handleAdd} />
            </Col>
          ))}
        </Row>
        <Flex className="catalog-page__pagination" justify="flex-end">
          <Pagination
            current={filters.page}
            pageSize={pageSize}
            total={page?.total ?? 0}
            showSizeChanger={false}
            onChange={(nextPage) => updateFilters({ page: nextPage })}
          />
        </Flex>
      </PageStatus>
    </section>
  );
}
