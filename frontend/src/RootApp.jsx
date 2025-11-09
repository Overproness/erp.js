import './style/app.css';

import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { App, ConfigProvider } from 'antd';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary';
import store from './redux/store';

// Import directly instead of using lazy loading initially
import ErpOs from './apps/ErpOs';

const RootApp = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ConfigProvider>
          <HelmetProvider>
            <App>
              <Router>
                <Suspense fallback={<div className="loading-container">Loading...</div>}>
                  <ErpOs />
                </Suspense>
              </Router>
            </App>
          </HelmetProvider>
        </ConfigProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default RootApp;
