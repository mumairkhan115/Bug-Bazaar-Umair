import { useState } from 'react';
import { ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Drawer, Flex, Input, Select, Space, Switch, Typography } from 'antd';
import { categories } from '../../domain/types';
import type { FaultMode, UrlFilters } from '../../hooks/useUrlFilters';
import './FiltersBar.scss';

interface FiltersBarProps {
  draftSearch: string;
  filters: UrlFilters;
  total: number;
  onSearch: (value: string) => void;
  onChange: (patch: Partial<UrlFilters>) => void;
  onClear: () => void;
}

const categoryOptions = [
  { value: '', label: 'All categories' },
  ...categories.map((category) => ({ value: category, label: category })),
];

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Rating' },
];

const faultOptions: { value: FaultMode; label: string }[] = [
  { value: '', label: 'None' },
  { value: '500', label: 'Server error (500)' },
  { value: 'empty', label: 'Empty results' },
];

function activeFilterCount(filters: UrlFilters): number {
  let count = 0;
  if (filters.category) {
    count += 1;
  }
  if (filters.inStock) {
    count += 1;
  }
  if (filters.sort !== 'name') {
    count += 1;
  }
  if (filters.fault) {
    count += 1;
  }
  return count;
}

function faultStatusMessage(fault: FaultMode): string {
  if (fault === '500') {
    return 'Active: catalog returns a 500 so PageStatus shows the error state.';
  }
  if (fault === 'empty') {
    return 'Active: catalog returns no matches so PageStatus shows empty.';
  }
  return 'No fault selected. The catalog loads normally.';
}

export default function FiltersBar({
  draftSearch,
  filters,
  total,
  onSearch,
  onChange,
  onClear,
}: FiltersBarProps) {
  const [open, setOpen] = useState(false);
  const filterCount = activeFilterCount(filters);

  const handleClear = () => {
    onClear();
    setOpen(false);
  };

  return (
    <div className="filters-bar">
      <Flex className="filters-bar__toolbar" gap="middle" wrap="wrap" align="center">
        <Input.Search
          id="filters-search"
          className="filters-bar__search"
          allowClear
          placeholder="Search developer gear"
          value={draftSearch}
          aria-label="Search"
          onChange={(event) => onSearch(event.target.value)}
        />
        <Badge count={filterCount} size="small" offset={[-4, 4]}>
          <Button icon={<FilterOutlined />} onClick={() => setOpen(true)}>
            Filters
          </Button>
        </Badge>
      </Flex>
      <Typography.Paragraph className="filters-bar__count" type="secondary">
        {total} products match
      </Typography.Paragraph>
      <Drawer
        title="Filters"
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        destroyOnHidden
      >
        <Space className="filters-bar__drawer" direction="vertical" size="large">
          <div className="filters-bar__field">
            <label className="filters-bar__label" htmlFor="filters-category">
              Category
            </label>
            <Select
              id="filters-category"
              className="filters-bar__control"
              value={filters.category}
              options={categoryOptions}
              onChange={(category) => onChange({ category, page: 1 })}
            />
          </div>
          <div className="filters-bar__field">
            <label className="filters-bar__label" htmlFor="filters-sort">
              Sort
            </label>
            <Select
              id="filters-sort"
              className="filters-bar__control"
              value={filters.sort}
              options={sortOptions}
              onChange={(sort) => onChange({ sort, page: 1 })}
            />
          </div>
          <div className="filters-bar__field">
            <span className="filters-bar__label">Stock</span>
            <Flex align="center" gap="small">
              <Switch
                id="in-stock-only"
                checked={filters.inStock}
                onChange={(inStock) => onChange({ inStock, page: 1 })}
              />
              <label htmlFor="in-stock-only">In stock only</label>
            </Flex>
          </div>
          <div className="filters-bar__field">
            <Typography.Title level={5} className="filters-bar__heading">
              Error Simulation
            </Typography.Title>
            <label className="filters-bar__label" htmlFor="filters-fault">
              Demo status
            </label>
            <Select
              id="filters-fault"
              className="filters-bar__control"
              value={filters.fault}
              options={faultOptions}
              onChange={(fault: FaultMode) => onChange({ fault, page: 1 })}
            />
            <Alert
              className="filters-bar__fault-alert"
              type={
                filters.fault === '500' ? 'error' : filters.fault === 'empty' ? 'warning' : 'info'
              }
              showIcon
              message={faultStatusMessage(filters.fault)}
            />
          </div>
          <Button icon={<ClearOutlined />} onClick={handleClear} block>
            Clear filters
          </Button>
        </Space>
      </Drawer>
    </div>
  );
}
