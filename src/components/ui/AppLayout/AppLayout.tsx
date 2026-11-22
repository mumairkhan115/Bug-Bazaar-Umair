import { useState } from 'react';
import { LoginOutlined, ShopOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Button, Flex, Grid, Layout, Menu } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
 * The store shell: navigation, cart count, skip link, and the active route.
 *
 * React concept: Outlet renders the child route. The badge reads a selector,
 * so it updates when the cart slice changes and not when a filter changes.
 * The skip link targets #main so keyboard users can bypass the sider.
 */
export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const count = useAppSelector(selectCartCount);
  const user = useAppSelector((state) => state.session.user);
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="app-layout">
      <a className="app-layout__skip" href="#main">
        Skip to content
      </a>
      <Sider
        className="app-layout__sider"
        breakpoint="md"
        collapsedWidth={isDesktop ? 80 : 0}
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
      >
        <div className="app-layout__sider-inner">
          <Link className="app-layout__brand" to="/">
            <img
              className={
                collapsed && isDesktop
                  ? 'app-layout__logo app-layout__logo--collapsed'
                  : 'app-layout__logo'
              }
              src="/logo.svg"
              alt="Bug Bazaar"
            />
          </Link>
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
          <Flex className="app-layout__tools" align="center" gap="middle" justify="flex-end">
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
        </Header>
        <Content id="main" className="app-layout__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
