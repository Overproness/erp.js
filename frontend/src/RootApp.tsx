import './style/app.css';

import { ApolloProvider } from '@apollo/client/react';
import { App } from '@/components/ui';
import { Suspense, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ErrorBoundary } from './components/ErrorBoundary';
import toastConfig from './config/toastConfig';
import { CopilotProvider } from './context/CopilotContext';
import { NotificationProvider } from './context/NotificationContext';
import apolloClient from './graphql/client';
import store from './redux/store';

// Import directly instead of using lazy loading initially
import ErpOs from './apps/ErpOs';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const RootApp: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ApolloProvider client={apolloClient}>
          <HelmetProvider>
            <App>
              <NotificationProvider>
                <CopilotProvider>
                  <Router>
                    <ScrollToTop />
                    <Suspense fallback={<div className="loading-container">Loading...</div>}>
                      <ErpOs />
                    </Suspense>
                  </Router>
                </CopilotProvider>
              </NotificationProvider>
              <ToastContainer {...toastConfig} />
            </App>
          </HelmetProvider>
        </ApolloProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default RootApp;
