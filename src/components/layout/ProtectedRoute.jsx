import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, page }) {
  const { user, hasAccess } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (page && !hasAccess(page)) return <Navigate to="/unauthorized" replace />;

  return children;
}
