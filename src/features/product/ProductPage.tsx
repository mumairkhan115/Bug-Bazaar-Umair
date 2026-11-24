import { useEffect, useState } from 'react';
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Flex, Rate, Row, Space, Tag, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import PageStatus from '../../components/ui/PageStatus/PageStatus';
import { publicAssetUrl } from '../../config/publicAsset';
import { formatPrice } from '../../domain/money';
import type { Product, RequestStatus } from '../../domain/types';
import { friendlyMessage } from '../../services/api/errors';
import { isAbortError } from '../../services/api/client';
import { getProduct } from '../../services/api/products';
import { addItem } from '../cart/cartSlice';
import './ProductPage.scss';

/**
 * Product detail with aborted in-flight fetches and a Back to Top control.
 *
 * React concept: the effect depends on the id. Cleanup aborts the request
 * and removes the scroll listener so a closed page does not keep working.
 */
export default function ProductPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${id}:${attempt}`;
  const [snapshot, setSnapshot] = useState<{
    key: string;
    status: RequestStatus;
    product: Product | null;
  }>({ key: '', status: { state: 'idle' }, product: null });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const status = snapshot.key === requestKey ? snapshot.status : { state: 'loading' as const };
  const product = snapshot.key === requestKey ? snapshot.product : null;

  useEffect(() => {
    const controller = new AbortController();
    const activeKey = requestKey;

    getProduct(id, controller.signal)
      .then((next) => {
        setSnapshot({ key: activeKey, status: { state: 'success' }, product: next });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }
        setSnapshot({
          key: activeKey,
          status: { state: 'error', message: friendlyMessage(error) },
          product: null,
        });
      });

    return () => controller.abort();
  }, [id, requestKey]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAdd = () => {
    if (!product || product.stock < 1) {
      return;
    }
    dispatch(
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
      }),
    );
  };

  return (
    <PageStatus
      status={status}
      empty={status.state === 'success' && product === null}
      onRetry={() => setAttempt((current) => current + 1)}
    >
      {product ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={10} xl={8} xxl={8}>
            <img className="product-page__image" src={publicAssetUrl(product.imageUrl)} alt="" />
          </Col>
          <Col xs={24} sm={24} md={12} lg={14} xl={16} xxl={16}>
            <Card className="product-page__card">
              <Space direction="vertical" size="middle">
                <Tag className="product-page__tag" color="magenta">
                  {product.category}
                </Tag>
                <Typography.Title level={2} className="product-page__title">
                  {product.name}
                </Typography.Title>
                <Typography.Paragraph className="product-page__price" strong>
                  {formatPrice(product.price)}
                </Typography.Paragraph>
                <Rate disabled allowHalf value={product.rating} />
                <Typography.Text type={product.stock < 1 ? 'danger' : 'secondary'}>
                  {product.stock < 1 ? 'Out of stock' : `${product.stock} in stock`}
                </Typography.Text>
                <Flex gap="small" wrap="wrap">
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    disabled={product.stock < 1}
                    onClick={handleAdd}
                  >
                    Add to cart
                  </Button>
                  <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
                    Back to shop
                  </Button>
                </Flex>
              </Space>
            </Card>
          </Col>
        </Row>
      ) : null}
      {showBackToTop ? (
        <Button
          className="product-page__top"
          icon={<VerticalAlignTopOutlined />}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Back to top
        </Button>
      ) : null}
    </PageStatus>
  );
}
