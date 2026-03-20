import { usePermissions } from '@/hooks/usePermissions';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, permissions, requireAll = false, fallbackPath = '/' }) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isOwner, loading } = usePermissions();
  const location = useLocation();

  // Show loading while permissions are being fetched
  if (loading) {
    return <div>Loading permissions...</div>;
  }

  // Owner has access to everything
  if (isOwner) {
    return children;
  }

  // If no permissions required, allow access
  if (!permissions || (Array.isArray(permissions) && permissions.length === 0)) {
    return children;
  }

  // Check permissions IMMEDIATELY
  let hasAccess = false;
  if (Array.isArray(permissions)) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    hasAccess = hasPermission(permissions);
  }

  // Redirect immediately if no access
  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Only render children if user has access
  return children;
};

export default ProtectedRoute;