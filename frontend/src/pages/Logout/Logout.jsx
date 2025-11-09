import { useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '@/redux/auth/actions';
import { crud } from '@/redux/crud/actions';
import { erp } from '@/redux/erp/actions';
import PageLoader from '@/components/PageLoader';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  function asyncLogout() {
    dispatch(logoutAction());
  }

  useLayoutEffect(() => {
    dispatch(crud.resetState());
    dispatch(erp.resetState());
  }, []);  useEffect(() => {
    // First reset other state
    dispatch(crud.resetState());
    dispatch(erp.resetState());
    
    // Clear all potentially problematic localStorage items first
    const keysToRemove = ['auth', 'persist:root', 'isLogout', 'auth_token', 'reduxPersist:auth'];
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.log('Error removing', key, e);
      }
    });
    
    // Clear sessionStorage too, just to be safe
    try {
      sessionStorage.clear();
    } catch (e) {
      console.log('Error clearing sessionStorage', e);
    }
    
    // Set a flag that we're logging out (to prevent redirect loops)
    localStorage.setItem('logging_out', 'true');
    
    // Then dispatch the logout action
    asyncLogout();
      // Set a small timeout to ensure everything is cleared before redirecting
    setTimeout(() => {
      // Clear the logout flag
      localStorage.removeItem('logging_out');
      // Force a hard refresh to the login page to ensure complete reset
      window.location.href = '/login';
    }, 300);
  }, []);

  return <PageLoader />;
};
export default Logout;
