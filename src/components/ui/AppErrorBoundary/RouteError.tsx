import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { useLocation, useRouteError } from 'react-router-dom';
import { logError } from '../../../services/logger';
import './AppErrorBoundary.scss';

/**
 * Renders the route fallback React Router shows instead of the class boundary.
 *
 * React concept: a route render error stops at the nearest route errorElement.
 * Why: the shopper should see the same logged fallback, not the router default.
 * A full load clears the crash, because the router keeps the error until navigation.
 */
export default function RouteError() {
  const error = useRouteError();
  const location = useLocation();

  useEffect(() => {
    logError(error, 'render');
  }, [error]);

  return (
    <div className="app-error-boundary">
      <Result
        status="error"
        title="This page hit an unexpected error"
        subTitle="The error was logged. You can try the page again."
        extra={
          <Button type="primary" onClick={() => window.location.assign(location.pathname)}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
