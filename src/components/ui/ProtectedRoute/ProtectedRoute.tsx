import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/redux';

/**
 * Sends anonymous shoppers to login and remembers the page they wanted.
 *
 * React concept: route layout. The protected page is an Outlet, not a child prop.
 */
export default function ProtectedRoute() {
  const token = useAppSelector((state) => state.session.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
