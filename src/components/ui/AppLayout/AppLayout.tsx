import { useState } from 'react';
import { LoginOutlined, ShopOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Button, Flex, Layout, Menu, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/redux';
import { selectCartCount } from '../../../features/cart/cartSlice';
import './AppLayout.scss';

const { Content, Header, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <ShopOutlined />, label: 'Shop' },
  { key: '/cart', icon: <ShoppingCartOutlined />, label: 'Cart' },
  { key: '/account', icon: <UserOutlined />, label: 'Account' },
];

function selectedKey(pathname: string): string {
  if (pathname.startsWith('/products') || pathname === '/') {
    return '/';
  }
  if (pathname.startsWith('/orders') || pathname.startsWith('/checkout')) {
    return '/cart';
  }
  if (pathname.startsWith('/account') || pathname.startsWith('/login')) {
    return '/account';
  }
  return pathname;
}

/**
 * The store shell: navigation, cart count, and the active route.
 *
 * React concept: Outlet renders the child route. The badge reads a selector,
 * so it updates when the cart slice changes and not when a filter changes.
 */
export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const count = useAppSelector(selectCartCount);
  const user = useAppSelector((state) => state.session.user);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="app-layout">
      <a className="app-layout__skip" href="#main">
        Skip to content
      </a>
      <Sider
        className="app-layout__sider"
        breakpoint="md"
        collapsedWidth={80}
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
      >
        <div className="app-layout__sider-inner">
          <Typography.Title level={4} className="app-layout__brand">
            {collapsed ? 'BB' : 'Bug Bazaar'}
          </Typography.Title>
          <Menu
            className="app-layout__menu"
            mode="inline"
            theme="light"
            selectedKeys={[selectedKey(location.pathname)]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </div>
      </Sider>
      <Layout>
        <Header className="app-layout__header">
          <Typography.Title level={4} className="app-layout__title">
            The Bug Bazaar
          </Typography.Title>
          <Flex className="app-layout__tools" align="center" gap="middle">
            <Badge count={count} showZero={false}>
              <Button
                type="default"
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate('/cart')}
              >
                Cart
              </Button>
            </Badge>
            <Button
              type="primary"
              icon={user ? <UserOutlined /> : <LoginOutlined />}
              onClick={() => navigate(user ? '/account' : '/login')}
            >
              {user ? user.name : 'Sign in'}
            </Button>
          </Flex>
        </Header>
        <Content id="main" className="app-layout__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
