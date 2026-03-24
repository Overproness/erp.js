import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import useLanguage from '@/locale/useLanguage';

import { useLogin } from '@/hooks/useAuthGql';
import { Form } from 'antd';

import Loading from '@/components/Loading';
import LoginForm from '@/forms/LoginForm';
import { useNotifications } from '@/hooks/useNotifications';
import AuthModule from '@/pages/AuthModule';
import storePersist from '@/redux/storePersist';
import * as actionTypes from '@/redux/auth/types';

const LoginPage = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { initializeSocket } = useNotifications();

  const [loginMutation, { loading: isLoading, data }] = useLogin();

  const loginResult = data?.login;
  const isSuccess = loginResult?.success;
  const adminData = loginResult?.result;

  const onFinish = (values) => {
    loginMutation({ variables: { input: values } });
  };

  useEffect(() => {
    if (isSuccess && adminData?.token) {
      const current = { ...adminData.admin, token: adminData.token };
      const authState = {
        current,
        isLoggedIn: true,
        isLoading: false,
        isSuccess: true,
      };
      storePersist.set('auth', authState);
      dispatch({ type: actionTypes.REQUEST_SUCCESS, payload: current });
      initializeSocket(adminData.token);
      navigate('/client');
    }
  }, [isSuccess, adminData]);

  const FormContainer = () => {
    return (
      <Loading isLoading={isLoading}>
        <Form
          layout="vertical"
          name="normal_login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <LoginForm />
          <Form.Item>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold text-white text-base border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0058c3 0%, #0070f3 100%)' }}
            >
              {isLoading ? 'Signing in...' : translate('Log in')}
            </button>
          </Form.Item>
        </Form>
      </Loading>
    );
  };

  return <AuthModule authContent={<FormContainer />} AUTH_TITLE="Sign in" />;
};

export default LoginPage;
