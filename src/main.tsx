import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { Provider } from 'react-redux';
import 'antd/dist/reset.css';
import './assets/sass/global.scss';
import AppErrorBoundary from './components/ui/AppErrorBoundary/AppErrorBoundary';
import { prepareStaticApi } from './services/api/mode';
import { store } from './stores/store';
import { router } from './router';
import theme from './config/theme';

function renderApp(): void {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element missing');
  }

  createRoot(root).render(
    <StrictMode>
      <Provider store={store}>
        <ConfigProvider theme={theme}>
          <AntdApp>
            <AppErrorBoundary>
              <RouterProvider router={router} />
            </AppErrorBoundary>
          </AntdApp>
        </ConfigProvider>
      </Provider>
    </StrictMode>,
  );
}

void prepareStaticApi().then(renderApp);
