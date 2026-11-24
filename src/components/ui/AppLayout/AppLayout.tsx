import { useCallback, useMemo, useState } from 'react';
import { LoginOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Button, Col, Flex, Grid, Layout, Row, Typography } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useStockFeed } from '../../../hooks/useStockFeed';
import { selectCartCount, syncStock } from '../../../features/cart/cartSlice';
import type { StockStatus, StockUpdate } from '../../../services/stock/stockClient';
import { LiveStockContext } from './liveStockContext';
import './AppLayout.scss';

const { Content, Footer, Header } = Layout;

const browseLinks = [
  { to: '/', label: 'Shop' },
  { to: '/?category=keyboards', label: 'Keyboards' },
  { to: '/?category=ducks', label: 'Ducks' },
  { to: '/?category=coffee', label: 'Coffee' },
  { to: '/?category=stickers', label: 'Stickers' },
];

const accountLinks = [
  { to: '/cart', label: 'Cart' },
  { to: '/login', label: 'Sign in' },
  { to: '/account', label: 'Account' },
  { to: '/?inStock=1', label: 'In stock' },
];

const feedLabel: Record<StockStatus, string> = {
  connecting: 'Connecting',
  live: 'Live',
  reconnecting: 'Reconnecting',
  closed: 'Offline',
};

/**
 * The store shell: header, page, footer, cart count, and skip link.
 *
 * React concept: Outlet renders the child route. The badge reads a selector,
 * so it updates when the cart slice changes and not when a filter changes.
 * The skip link targets #main so keyboard users can bypass the header.
 */
export default function AppLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const count = useAppSelector(selectCartCount);
  const user = useAppSelector((state) => state.session.user);
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const year = new Date().getFullYear();
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const onStock = useCallback(
    (update: StockUpdate) => {
      setStocks((current) => ({ ...current, [update.productId]: update.stock }));
      dispatch(syncStock(update));
    },
    [dispatch],
  );
  const stockStatus = useStockFeed(onStock);
  const liveStock = useMemo(() => ({ status: stockStatus, stocks }), [stockStatus, stocks]);
  const feedPulse = stockStatus === 'closed' ? '' : ' app-layout__feed-dot--pulse';

  return (
    <LiveStockContext.Provider value={liveStock}>
      <Layout className="app-layout">
        <a className="app-layout__skip" href="#main">
          Skip to content
        </a>
        <Header className="app-layout__header">
          <Flex className="app-layout__bar" align="center" justify="space-between" gap="middle">
            <Flex className="app-layout__identity" align="center" gap="middle">
              <Link className="app-layout__brand" to="/">
                <img
                  className="app-layout__logo"
                  src={`${import.meta.env.BASE_URL}logo.svg`}
                  alt="Bug Bazaar"
                />
              </Link>
              <Flex
                className="app-layout__feed"
                align="center"
                gap="small"
                role="status"
                aria-label={`Stock feed ${feedLabel[stockStatus]}`}
              >
                <span
                  className={`app-layout__feed-dot app-layout__feed-dot--${stockStatus}${feedPulse}`}
                  aria-hidden="true"
                />
                <Typography.Text className="app-layout__feed-label">Stock feed</Typography.Text>
                <Typography.Text className="app-layout__feed-state" strong>
                  {feedLabel[stockStatus]}
                </Typography.Text>
              </Flex>
            </Flex>
            <Flex className="app-layout__tools" align="center" gap="middle">
              <Badge count={count} showZero={false}>
                <Button
                  type="default"
                  icon={<ShoppingCartOutlined />}
                  aria-label="Cart"
                  onClick={() => navigate('/cart')}
                >
                  {isDesktop ? 'Cart' : null}
                </Button>
              </Badge>
              <Button
                type="primary"
                icon={user ? <UserOutlined /> : <LoginOutlined />}
                aria-label={user ? user.name : 'Sign in'}
                onClick={() => navigate(user ? '/account' : '/login')}
              >
                {isDesktop ? (user ? user.name : 'Sign in') : null}
              </Button>
            </Flex>
          </Flex>
        </Header>
        <Content id="main" className="app-layout__content">
          <Outlet />
        </Content>
        <Footer className="app-layout__footer">
          <Flex className="app-layout__footer-inner" vertical gap="large">
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={24} md={10} lg={10} xl={10} xxl={10}>
                <Flex vertical gap="small">
                  <Link className="app-layout__footer-brand" to="/">
                    <img
                      className="app-layout__footer-logo"
                      src={`${import.meta.env.BASE_URL}logo.svg`}
                      alt=""
                    />
                    <Typography.Title level={4} className="app-layout__site-name">
                      The Bug Bazaar
                    </Typography.Title>
                  </Link>
                  <Typography.Paragraph className="app-layout__tagline">
                    Developer gear, honestly priced.
                  </Typography.Paragraph>
                </Flex>
              </Col>
              <Col xs={12} sm={12} md={7} lg={7} xl={7} xxl={7}>
                <Typography.Title level={5} className="app-layout__column-title">
                  Browse
                </Typography.Title>
                <Flex vertical gap="small">
                  {browseLinks.map((item) => (
                    <Link key={item.to} className="app-layout__footer-link" to={item.to}>
                      {item.label}
                    </Link>
                  ))}
                </Flex>
              </Col>
              <Col xs={12} sm={12} md={7} lg={7} xl={7} xxl={7}>
                <Typography.Title level={5} className="app-layout__column-title">
                  Account
                </Typography.Title>
                <Flex vertical gap="small">
                  {accountLinks.map((item) => (
                    <Link key={item.to} className="app-layout__footer-link" to={item.to}>
                      {item.label}
                    </Link>
                  ))}
                </Flex>
              </Col>
            </Row>
            <Flex className="app-layout__legal" vertical gap="small">
              <Typography.Text className="app-layout__copyright">
                © {year} The Bug Bazaar. All rights reserved.
              </Typography.Text>
              <Typography.Text className="app-layout__credit">
                by Muhammad Umair Khan
              </Typography.Text>
              <Typography.Text className="app-layout__credit">
                Lead UI Engineer, Folio3 Pvt Limited
              </Typography.Text>
            </Flex>
          </Flex>
        </Footer>
      </Layout>
    </LiveStockContext.Provider>
  );
}
