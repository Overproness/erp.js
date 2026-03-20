import PageLoader from '@/components/PageLoader';
import { useNotifications } from '@/hooks/useNotifications';
import { useLogout } from '@/hooks/useAuthGql';
import { crud } from '@/redux/crud/actions';
import { erp } from '@/redux/erp/actions';
import { useEffect, useLayoutEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useApolloClient } from '@apollo/client/react';

const Logout = () => {
  const dispatch = useDispatch();
  const { disconnectSocket } = useNotifications();
  const [logoutMutation] = useLogout();
  const apolloClient = useApolloClient();

  useLayoutEffect(() => {
    dispatch(crud.resetState());
    dispatch(erp.resetState());
  }, []);

  useEffect(() => {
    dispatch(crud.resetState());
    dispatch(erp.resetState());

    disconnectSocket();
    logoutMutation().catch(() => {});
    apolloClient.clearStore();

    const keysToRemove = ['auth', 'persist:root', 'isLogout', 'auth_token', 'reduxPersist:auth'];
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.log('Error removing', key, e);
      }
    });

    try {
      sessionStorage.clear();
    } catch (e) {
      console.log('Error clearing sessionStorage', e);
    }

    localStorage.setItem('logging_out', 'true');

    setTimeout(() => {
      localStorage.removeItem('logging_out');
      window.location.href = '/login';
    }, 300);
  }, []);

  return <PageLoader />;
};
export default Logout;
