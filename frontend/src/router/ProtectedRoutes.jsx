import { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { message } from 'antd';

import { selectAuth } from '@/redux/auth/selectors';
import { usePermissions } from '@/hooks/usePermissions';
import Onboarding from '@/pages/Onboarding/Onboarding';
import PageLoader from '@/components/Loading';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import ErpApp from '@/apps/ErpApp';
import routes from './routes';

// Component to handle 404 routes
const NotFoundHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only show error for actual unknown routes
    console.warn('Unknown route accessed:', location.pathname);
    message.error('Page not found. Redirecting to home page.', 3);
  }, [location.pathname]);
  
  return <Navigate to="/" replace />;
};

export default function ProtectedRoutes() {
  const { current: authUser, isLoggedIn } = useSelector(selectAuth);
  const { loading: permissionsLoading, hasPermission, hasAllPermissions, hasAnyPermission, isOwner } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Short timeout to ensure auth state is loaded
    const timer = setTimeout(() => {
      setAuthLoading(false);
      
      if (!isLoggedIn) return;
      
      // Get the latest auth state directly from localStorage
      const persistedAuth = JSON.parse(localStorage.getItem('auth') || '{}');
      const persistedAuthUser = persistedAuth?.current || {};
      const effectiveAuthUser = authUser || persistedAuthUser;

      // Only check onboarding for CompanyOwner (role === 'owner')
      const isOwner = effectiveAuthUser.role === 'owner';
      const onboardingCompleteValue = effectiveAuthUser.onboardingComplete;
      const needsOnboarding = isOwner && (
        onboardingCompleteValue === false ||
        onboardingCompleteValue === "false" ||
        onboardingCompleteValue === undefined ||
        onboardingCompleteValue === null
      );

      if (needsOnboarding && window.location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isLoggedIn, authUser, navigate]);

  // Function to check if user has access to a route
  const hasRouteAccess = (routePermissions, requireAll = false) => {
    if (!routePermissions || (Array.isArray(routePermissions) && routePermissions.length === 0)) {
      return true;
    }
    
    if (isOwner) return true;
    
    if (Array.isArray(routePermissions)) {
      return requireAll ? hasAllPermissions(routePermissions) : hasAnyPermission(routePermissions);
    }
    
    return hasPermission(routePermissions);
  };

  // Create protected routes based on permissions
  const createProtectedRoutes = () => {
    return routes.default.map((route, index) => {
      const { permissions, requireAll, ...routeProps } = route;
      
      // Always wrap with ProtectedRoute if permissions are set
      if (permissions) {
        return (
          <Route
            key={index}
            path={route.path}
            element={
              <ProtectedRoute
                permissions={permissions}
                requireAll={requireAll}
                fallbackPath="/"
              >
                {route.element}
              </ProtectedRoute>
            }
          />
        );
      }
      
      // No permissions required, render normally
      return <Route key={index} {...routeProps} />;
    });
  };

  // Add a catch-all route for unmatched paths
  const createCatchAllRoute = () => {
    return (
      <Route
        path="*"
        element={<NotFoundHandler />}
      />
    );
  };
  
  // Show loading only while auth or permissions are loading
  if (authLoading || permissionsLoading) {
    return <PageLoader />;
  }
  
  // If not logged in, redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/*" element={
        <ErpApp>
          <Routes>
            {createProtectedRoutes()}
            {createCatchAllRoute()}
          </Routes>
        </ErpApp>
      } />
    </Routes>
  );
}