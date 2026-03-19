import './style/app.css';

import { ApolloProvider } from '@apollo/client/react';
import { App, ConfigProvider } from 'antd';
import { Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ErrorBoundary } from './components/ErrorBoundary';
import { antdTheme } from './config/theme';
import toastConfig from './config/toastConfig';
import { CopilotProvider } from './context/CopilotContext';
import { NotificationProvider } from './context/NotificationContext';
import apolloClient from './graphql/client';
import store from './redux/store';

// Import directly instead of using lazy loading initially
import ErpOs from './apps/ErpOs';

const RootApp = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ApolloProvider client={apolloClient}>
          <ConfigProvider theme={antdTheme}>
            <HelmetProvider>
              <App>
                <NotificationProvider>
                  <CopilotProvider>
                    <Router>
                      <Suspense fallback={<div className="loading-container">Loading...</div>}>
                        <ErpOs />
                      </Suspense>
                    </Router>
                  </CopilotProvider>
                </NotificationProvider>
                <ToastContainer {...toastConfig} />
              </App>
            </HelmetProvider>
          </ConfigProvider>
        </ApolloProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default RootApp;
