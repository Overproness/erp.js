import { selectAuth } from '@/redux/auth/selectors';
import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import NotFound from '@/pages/NotFound/NotFound';

// Import team invitation page
import Loading from '@/components/Loading';

// Auth / account pages: lazy-loaded so they do not bloat the bundle
// for visitors who only hit the public marketing pages.
const ForgetPassword = lazy(() => import('@/pages/ForgetPassword/ForgetPassword'));
const Login = lazy(() => import('@/pages/Login/Login'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword/ResetPassword'));
const Signup = lazy(() => import('@/pages/Signup/Signup'));
const AcceptInvitation = lazy(() => import('@/pages/Team/AcceptInvitation'));

// Public redirect handler and document share viewer: also lazy-loaded
const RedirectHandler = lazy(() => import('@/pages/URL/RedirectHandler'));
const PublicDocumentShare = lazy(() => import('@/pages/PublicDocumentShare'));

// Import public survey component
const PublicSurvey = lazy(() => import('@/pages/PublicSurvey'));

// Import customer chat page
const CustomerChatPage = lazy(() => import('@/pages/CustomerChatPage'));

// Website pages: lazy-loaded so Three.js and other heavy page deps
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
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <Login />
          </Suspense>
        }
        path="/login"
      />

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
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <Signup />
          </Suspense>
        }
        path="/signup"
      />
      <Route element={<Navigate to="/login" replace />} path="/logout" />
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <ForgetPassword />
          </Suspense>
        }
        path="/forgetpassword"
      />
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <ResetPassword />
          </Suspense>
        }
        path="/resetpassword/:userId/:resetToken"
      />

      {/* Special public route for team invitations - accessible when logged out */}
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <AcceptInvitation />
          </Suspense>
        }
        path="/team/invitation/:token"
      />

      {/* Add public redirect routes here */}
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <RedirectHandler />
          </Suspense>
        }
        path="/s/:shortCode"
      />

      {/* Public document share viewer route */}
      <Route
        element={
          <Suspense fallback={<Loading isLoading={true} />}>
            <PublicDocumentShare />
          </Suspense>
        }
        path="/share/document/:shortCode"
      />

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
