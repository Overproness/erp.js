import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { selectAuth } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';

import ForgetPassword from '@/pages/ForgetPassword/ForgetPassword';
import Login from '@/pages/Login/Login';
import NotFound from '@/pages/NotFound/NotFound';
import ResetPassword from '@/pages/ResetPassword/ResetPassword';
import Signup from '@/pages/Signup/Signup';

// Import team invitation page
import AcceptInvitation from '@/pages/Team/AcceptInvitation';
import Loading from '@/components/Loading';

// Import the public redirect handler and preview page
import RedirectHandler from '@/pages/URL/RedirectHandler';

export default function AuthRouter() {
  const { pathname } = useLocation();
  const { isLoggedIn, isLoading } = useSelector(selectAuth);

  // Add review-portal to public paths
  const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/s', '/review-portal', '/team/invitation'];

  // Check if the current path starts with any of the public paths
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isLoading) {
    return <Loading isLoading={true} />;
  }

  // For login/signup pages, redirect to dashboard if already logged in
  if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
    return <Navigate to="/" replace />;
  }

  // For protected pages, redirect to login if not logged in
  if (!isLoggedIn && !isPublicPath) {
    // Store the attempted URL for redirection after login
    sessionStorage.setItem('redirectAfterLogin', pathname);
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<Login />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<Signup />} path="/signup" />
      <Route element={<Navigate to="/login" replace />} path="/logout" />
      <Route element={<ForgetPassword />} path="/forgetpassword" />
      <Route element={<ResetPassword />} path="/resetpassword/:userId/:resetToken" />
      
      {/* Special public route for team invitations - accessible when logged out */}
      <Route element={<AcceptInvitation />} path="/team/invitation/:token" />

      {/* Add public redirect routes here */}
      <Route element={<RedirectHandler />} path="/s/:shortCode" />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
