import { Button, Card, Col, InputNumber, Row, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageStatus from '../../components/ui/PageStatus/PageStatus';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { formatPrice } from '../../domain/money';
import {
  changeQuantity,
  removeItem,
  selectCartItems,
  selectCartSubtotal,
  type CartItem,
} from './cartSlice';
import './CartPage.scss';

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);

  const columns: TableColumnsType<CartItem> = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_quantity, item) => (
        <InputNumber
          min={1}
          max={item.stock}
          value={item.quantity}
          aria-label={`Quantity for ${item.name}`}
          onChange={(value) => {
            if (typeof value === 'number') {
              dispatch(changeQuantity({ productId: item.productId, quantity: value }));
            }
          }}
        />
      ),
    },
    {
      title: 'Remove',
      key: 'remove',
      render: (_value, item) => (
        <Button onClick={() => dispatch(removeItem(item.productId))}>Remove</Button>
      ),
    },
  ];

  return (
    <PageStatus
      status={{ state: 'success' }}
      empty={items.length === 0}
      emptyDescription="Your cart is empty."
    >
      <Row gutter={[16, 16]} className="cart-page">
        <Col xs={24} sm={24} md={24} lg={16} xl={16} xxl={16}>
          <Table<CartItem>
            rowKey="productId"
            columns={columns}
            dataSource={items}
            pagination={false}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8}>
          <Card className="cart-page__summary">
            <Typography.Title level={4}>Subtotal</Typography.Title>
            <Typography.Paragraph>{formatPrice(subtotal)}</Typography.Paragraph>
            <Button type="primary" onClick={() => navigate('/checkout')}>
              Checkout
            </Button>
          </Card>
        </Col>
      </Row>
    </PageStatus>
  );
}
