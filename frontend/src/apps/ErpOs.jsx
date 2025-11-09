import { lazy, Suspense, useEffect, useState } from 'react';
import { App as AntdApp } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { AppContextProvider } from '@/context/appContext';
import { ErpContextProvider } from '@/context/erp';
import PageLoader from '@/components/PageLoader';
import AuthRouter from '@/router/AuthRouter';
import ProtectedRoutes from '@/router/ProtectedRoutes';
import Localization from '@/locale/Localization';
import { notification } from 'antd';
import { settingsAction } from '@/redux/settings/actions';
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
  }, [isOnline]);  // Use AntdApp to provide message, notification and modal global methods
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
  // If the current route is a public redirect route, render only the router outlet (children), no layout
  const isPublicRedirect =
    location.pathname.startsWith('/s/') &&
    (location.pathname.match(/^\/s\/[^/]+$/) || location.pathname.match(/^\/s\/[^/]+\/preview$/));

  if (isPublicRedirect) {
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
            </ErpContextProvider>
          </AppContextProvider>
        </Localization>
      )}
    </AntdApp>
  );
}
