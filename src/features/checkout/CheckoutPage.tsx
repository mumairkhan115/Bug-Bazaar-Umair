import { useRef, useState } from 'react';
import { Alert, Button, Card, Col, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageStatus from '../../components/ui/PageStatus/PageStatus';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { formatPrice } from '../../domain/money';
import { ApiRequestError, friendlyMessage } from '../../services/api/errors';
import { createOrder } from '../../services/api/orders';
import { clearCart, selectCartItems, selectCartSubtotal } from '../cart/cartSlice';
import './CheckoutPage.scss';

/**
 * Places one order and reuses the same idempotency key if the shopper retries.
 *
 * Why: a double click or a retry after a timeout must not create a second order.
 */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const order = await createOrder(
        items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        idempotencyKey.current,
      );
      dispatch(clearCart());
      navigate(`/orders/${order.id}`);
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError ? friendlyMessage(error) : friendlyMessage(error),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageStatus
      status={{ state: 'success' }}
      empty={items.length === 0}
      emptyDescription="Your cart is empty. Add gear before checkout."
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={16} lg={12} xl={10} xxl={8}>
          <Card className="checkout-page">
            <Typography.Title level={3}>Checkout</Typography.Title>
            <Typography.Paragraph>
              {items.length} line{items.length === 1 ? '' : 's'} · {formatPrice(subtotal)}
            </Typography.Paragraph>
            {message ? (
              <Alert className="checkout-page__alert" type="error" showIcon message={message} />
            ) : null}
            <Button type="primary" disabled={submitting} onClick={() => void handleCheckout()}>
              {submitting ? 'Placing order' : 'Place order'}
            </Button>
          </Card>
        </Col>
      </Row>
    </PageStatus>
  );
}
