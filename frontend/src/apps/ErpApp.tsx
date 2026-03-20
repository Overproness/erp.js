import { useEffect, useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Layout } from 'antd';

import Navigation from '@/apps/Navigation/NavigationContainer';

import HeaderContent from '@/apps/Header/HeaderContainer';
import PageLoader from '@/components/PageLoader';

import { settingsAction } from '@/redux/settings/actions';

import { selectSettings } from '@/redux/settings/selectors';

import AppRouter from '@/router/AppRouter';

import useResponsive from '@/hooks/useResponsive';
import useLanguage from '@/locale/useLanguage';

import { MarketingProvider } from '@/context/MarketingContext';
import TeamPanelProvider from '@/pages/Team/TeamModule/TeamPanelProvider';

export default function ErpCrmApp() {
  const { Content } = Layout;
  const { isMobile } = useResponsive();
  const translate = useLanguage();

  const dispatch = useDispatch();
  useLayoutEffect(() => {
    // Always load fresh settings from backend on app start
    dispatch(settingsAction.list({ entity: 'setting', forceRefresh: true }));
  }, [dispatch]);

  // Also reload settings when authentication changes
  const { current: authData } = useSelector((state) => state.auth);

  useEffect(() => {
    if (authData?._id) {
      dispatch(settingsAction.list({ entity: 'setting', forceRefresh: true }));
    }
  }, [authData?._id, dispatch]);

  // Add network reconnect handler to reload settings when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      // Force a refresh of settings when network reconnects
      dispatch(settingsAction.list({ entity: 'setting', forceRefresh: true }));
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [dispatch]);

  // const appSettings = useSelector(selectAppSettings);

  const { isSuccess: settingIsloaded, isLoading: settingsLoading } = useSelector(selectSettings);

  if (settingIsloaded)
    return (
      <TeamPanelProvider>
        <MarketingProvider>
          <div style={{ position: 'relative' }}>
            <Navigation />

            {isMobile ? (
              <Layout style={{ marginLeft: 0, minHeight: '100vh' }}>
                <Content
                  style={{
                    margin: '0',
                    overflow: 'initial',
                    width: '100%',
                    padding: '0',
                    background: '#f8f9fa',
                    minHeight: '100vh',
                  }}
                >
                  <AppRouter />
                </Content>
              </Layout>
            ) : (
              <Layout style={{ minHeight: '100vh', marginLeft: '220px' }}>
                <HeaderContent />
                <Content
                  style={{
                    margin: '0',
                    overflow: 'initial',
                    width: '100%',
                    padding: '24px',
                    background: '#f8f9fa',
                    minHeight: 'calc(100vh - 64px)',
                  }}
                >
                  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <AppRouter />
                  </div>
                </Content>
              </Layout>
            )}
          </div>
        </MarketingProvider>
      </TeamPanelProvider>
    );
  else return <PageLoader />;
}
