import ChatBubble from '@/components/ChatBubble';
import PageLoader from '@/components/PageLoader';
import { AppContextProvider } from '@/context/appContext';
import { ErpContextProvider } from '@/context/erp';
import Localization from '@/locale/Localization';
import { selectAuth } from '@/redux/auth/selectors';
import { settingsAction } from '@/redux/settings/actions';
import AuthRouter from '@/router/AuthRouter';
import ProtectedRoutes from '@/router/ProtectedRoutes';
import { App as AntdApp, notification } from 'antd';
import { Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

export default function ErpOs() {
  const { isLoggedIn } = useSelector(selectAuth);

  // Online state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update network status
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (!isOnline) {
        console.log('🚀 ~ useEffect ~ navigator.onLine:', navigator.onLine);
        notification.config({
          duration: 20,
          maxCount: 1,
        });
        // Code to execute when there is internet connection
        notification.error({
          message: 'No internet connection',
          description: 'Cannot connect to the Internet, Check your internet network',
        });
      }
    };

    // Listen to the online status
    window.addEventListener('online', handleStatusChange);

    // Listen to the offline status
    window.addEventListener('offline', handleStatusChange);

    // Specify how to clean up after this effect for performance improvment
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [isOnline]); // Use AntdApp to provide message, notification and modal global methods
  // This resolves the context warning for message
  // Add a settings reload when user comes online
  const dispatch = useDispatch(); // Use the useDispatch hook from react-redux
  const location = useLocation(); // <-- Add this line
  // Make sure we log that the dispatch is available
  useEffect(() => {
    if (isLoggedIn && isOnline) {
      // Dispatch settings reload when coming back online

      try {
        // Use the imported settingsAction from the top of the file
        dispatch(settingsAction.list({ entity: 'setting' }));
      } catch (error) {
        console.error('Error reloading settings:', error);
      }
    }
  }, [isOnline, isLoggedIn, dispatch]);

  // --- BEGIN: PUBLIC REDIRECT ROUTE HANDLING ---
  // If the current route is a public redirect route, public survey, or customer chat, render only the router outlet (children), no layout
  const isPublicRedirect =
    location.pathname.startsWith('/s/') &&
    (location.pathname.match(/^\/s\/[^/]+$/) || location.pathname.match(/^\/s\/[^/]+\/preview$/));

  const isPublicSurvey = location.pathname.startsWith('/public/survey/');
  const isCustomerChat = location.pathname.startsWith('/chat/');

  if (isPublicRedirect || isPublicSurvey || isCustomerChat) {
    // Only render the router outlet (children), no layout, no header/sidebar
    return (
      <Localization>
        <AuthRouter />
      </Localization>
    );
  }
  // --- END: PUBLIC REDIRECT ROUTE HANDLING ---

  return (
    <AntdApp>
      {!isLoggedIn ? (
        <Localization>
          <AuthRouter />
        </Localization>
      ) : (
        <Localization>
          <AppContextProvider>
            <ErpContextProvider>
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoutes />
              </Suspense>
              {/* AI Copilot - Available on all pages */}
              <ChatBubble position="bottom-right" />
            </ErpContextProvider>
          </AppContextProvider>
        </Localization>
      )}
    </AntdApp>
  );
}
