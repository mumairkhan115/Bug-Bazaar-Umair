import { useEffect, useState } from 'react';
import { Card, Col, List, Row, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import PageStatus from '../../components/ui/PageStatus/PageStatus';
import type { Order, RequestStatus } from '../../domain/types';
import { friendlyMessage } from '../../services/api/errors';
import { isAbortError } from '../../services/api/client';
import { getOrder } from '../../services/api/orders';
import './OrderPage.scss';

export default function OrderPage() {
  const { id = '' } = useParams();
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${id}:${attempt}`;
  const [snapshot, setSnapshot] = useState<{
    key: string;
    status: RequestStatus;
    order: Order | null;
  }>({
    key: '',
    status: { state: 'idle' },
    order: null,
  });
  const status = snapshot.key === requestKey ? snapshot.status : { state: 'loading' as const };
  const order = snapshot.key === requestKey ? snapshot.order : null;

  useEffect(() => {
    const controller = new AbortController();
    const activeKey = requestKey;
    getOrder(id, controller.signal)
      .then((next) => {
        setSnapshot({ key: activeKey, status: { state: 'success' }, order: next });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }
        setSnapshot({
          key: activeKey,
          status: { state: 'error', message: friendlyMessage(error) },
          order: null,
        });
      });
    return () => controller.abort();
  }, [id, requestKey]);

  return (
    <PageStatus status={status} onRetry={() => setAttempt((current) => current + 1)}>
      {order ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={18} lg={14} xl={12} xxl={10}>
            <Card className="order-page">
              <Typography.Title level={3}>Order {order.id}</Typography.Title>
              <Typography.Paragraph>Status: {order.status}</Typography.Paragraph>
              <Typography.Paragraph>
                Payment, inventory, and email are queued after this point. A retry of the same
                checkout does not create another order.
              </Typography.Paragraph>
              <List
                dataSource={order.lines}
                renderItem={(line) => (
                  <List.Item>
                    <Typography.Text>
                      {line.quantity} × {line.name}
                    </Typography.Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      ) : null}
    </PageStatus>
  );
}
