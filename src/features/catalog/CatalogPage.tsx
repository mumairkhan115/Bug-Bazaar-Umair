import { useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Flex, Grid, Pagination, Row, Typography } from 'antd';
import { useAppDispatch } from '../../hooks/redux';
import PageStatus from '../../components/ui/PageStatus/PageStatus';
import type { Product, ProductQuery } from '../../domain/types';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useProductSearch } from '../../hooks/useProductSearch';
import { useStockFeed } from '../../hooks/useStockFeed';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import type { StockUpdate } from '../../services/stock/stockClient';
import { addItem, syncStock } from '../cart/cartSlice';
import FiltersBar from './FiltersBar';
import ProductCard from './ProductCard';
import './CatalogPage.scss';

/**
 * Catalog container: URL filters, debounced search, paged cards, and live stock.
 *
 * React concept: the page of cards is a derived view. Search text is local
 * until the debounce writes it to the URL.
 */
export default function CatalogPage() {
  const dispatch = useAppDispatch();
  const screens = Grid.useBreakpoint();
  const { filters, updateFilters } = useUrlFilters();
  const [draftSearch, setDraftSearch] = useState(filters.search);
  const [seenSearch, setSeenSearch] = useState(filters.search);
  if (filters.search !== seenSearch) {
    setSeenSearch(filters.search);
    setDraftSearch(filters.search);
  }
  const debouncedSearch = useDebouncedValue(draftSearch, 300);
  const [stockOverlay, setStockOverlay] = useState<Record<string, number>>({});

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateFilters({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, filters.search, updateFilters]);

  useEffect(() => {
    if (screens.lg === undefined) {
      return;
    }
    const nextSize = screens.lg ? 24 : 12;
    if (filters.pageSize !== nextSize) {
      updateFilters({ pageSize: nextSize, page: 1 });
    }
  }, [screens.lg, filters.pageSize, updateFilters]);

  const query = useMemo<ProductQuery>(
    () => ({
      search: filters.search,
      category: filters.category,
      inStock: filters.inStock,
      sort: filters.sort,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [
      filters.category,
      filters.inStock,
      filters.page,
      filters.pageSize,
      filters.search,
      filters.sort,
    ],
  );

  const { status, page, retry } = useProductSearch(query);
  const onStock = useCallback(
    (update: StockUpdate) => {
      setStockOverlay((current) => ({ ...current, [update.productId]: update.stock }));
      dispatch(syncStock(update));
    },
    [dispatch],
  );
  const stockStatus = useStockFeed(onStock);

  const items = (page?.items ?? []).map((product) => {
    const stock = stockOverlay[product.id];
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
    updateFilters({ search: '', category: '', inStock: false, sort: 'name', page: 1 });
  };

  return (
    <section className="catalog-page">
      <Typography.Paragraph type="secondary" className="catalog-page__feed">
        Stock feed: {stockStatus}
      </Typography.Paragraph>
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
            pageSize={filters.pageSize}
            total={page?.total ?? 0}
            showSizeChanger={false}
            onChange={(nextPage) => updateFilters({ page: nextPage })}
          />
        </Flex>
      </PageStatus>
    </section>
  );
}
