import { selectAuth } from '@/redux/auth/selectors';
import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import ForgetPassword from '@/pages/ForgetPassword/ForgetPassword';
import Login from '@/pages/Login/Login';
import NotFound from '@/pages/NotFound/NotFound';
import ResetPassword from '@/pages/ResetPassword/ResetPassword';
import Signup from '@/pages/Signup/Signup';

// Import team invitation page
import Loading from '@/components/Loading';
import AcceptInvitation from '@/pages/Team/AcceptInvitation';

// Import the public redirect handler and preview page
import RedirectHandler from '@/pages/URL/RedirectHandler';

// Import public document share viewer
import PublicDocumentShare from '@/pages/PublicDocumentShare';

// Import public survey component
const PublicSurvey = lazy(() => import('@/pages/PublicSurvey'));

// Import customer chat page
const CustomerChatPage = lazy(() => import('@/pages/CustomerChatPage'));

// Website pages — lazy-loaded so Three.js and other heavy page deps
// only load when the user actually navigates to that route.
const HomePage = lazy(() => import('@/pages/Website/HomePage'));
const FeaturesPage = lazy(() => import('@/pages/Website/FeaturesPage'));
const PricingPage = lazy(() => import('@/pages/Website/PricingPage'));
const AboutPage = lazy(() => import('@/pages/Website/AboutPage'));
const ContactPage = lazy(() => import('@/pages/Website/ContactPage'));
const PrivacyPage = lazy(() => import('@/pages/Website/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/Website/TermsPage'));

export default function AuthRouter() {
  const { pathname } = useLocation();
  const { isLoggedIn, isLoading } = useSelector(selectAuth);

  // Add review-portal and document shares to public paths
  const publicPaths = [
    '/',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/s',
    '/share',
    '/review-portal',
    '/team/invitation',
    '/public/survey',
    '/chat',
  ];

  // Check if the current path starts with any of the public paths
  // Normalize pathname by removing double slashes
  const normalizedPathname = pathname.replace(/\/+/g, '/');

  const isPublicPath = publicPaths.some(
    (path) => normalizedPathname === path || normalizedPathname.startsWith(`${path}/`)
  );

  // Debug logging for chat routes
  if (normalizedPathname.includes('/chat')) {
    console.log('Chat route detected:', { normalizedPathname, isPublicPath, isLoggedIn });
  }

  if (isLoading) {
    return <Loading isLoading={true} />;
  }

  // For login/signup pages, redirect to app if already logged in
  if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
    return <Navigate to="/client" replace />;
  }

  // For protected pages, redirect to login if not logged in
  if (!isLoggedIn && !isPublicPath) {
    // Store the attempted URL for redirection after login
    sessionStorage.setItem('redirectAfterLogin', pathname);
    console.log('Redirecting to login. Path:', normalizedPathname, 'isPublicPath:', isPublicPath);
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <HomePage />
          </Suspense>
        }
        path="/"
      />
      <Route element={<Login />} path="/login" />

      {/* Website pages */}
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <FeaturesPage />
          </Suspense>
        }
        path="/features"
      />
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <PricingPage />
          </Suspense>
        }
        path="/pricing"
      />
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <AboutPage />
          </Suspense>
        }
        path="/about"
      />
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <ContactPage />
          </Suspense>
        }
        path="/contact"
      />
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <PrivacyPage />
          </Suspense>
        }
        path="/privacy"
      />
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <TermsPage />
          </Suspense>
        }
        path="/terms"
      />
      <Route element={<Signup />} path="/signup" />
      <Route element={<Navigate to="/login" replace />} path="/logout" />
      <Route element={<ForgetPassword />} path="/forgetpassword" />
      <Route element={<ResetPassword />} path="/resetpassword/:userId/:resetToken" />

      {/* Special public route for team invitations - accessible when logged out */}
      <Route element={<AcceptInvitation />} path="/team/invitation/:token" />

      {/* Add public redirect routes here */}
      <Route element={<RedirectHandler />} path="/s/:shortCode" />

      {/* Public document share viewer route */}
      <Route element={<PublicDocumentShare />} path="/share/document/:shortCode" />

      {/* Public survey route - accessible without authentication */}
      <Route
        path="/public/survey/:shortCode"
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <PublicSurvey />
          </Suspense>
        }
      />

      {/* Public customer chat route - accessible without authentication */}
      <Route
        path="/chat/:roomId"
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <CustomerChatPage />
          </Suspense>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
