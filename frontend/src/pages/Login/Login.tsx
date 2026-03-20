import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import useLanguage from '@/locale/useLanguage';

import { useLogin } from '@/hooks/useAuthGql';
import { Button, Form } from 'antd';

import Loading from '@/components/Loading';
import LoginForm from '@/forms/LoginForm';
import { useNotifications } from '@/hooks/useNotifications';
import AuthModule from '@/pages/AuthModule';
import storePersist from '@/redux/storePersist';

const LoginPage = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
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
      storePersist.set('auth', {
        current: { ...adminData.admin, token: adminData.token },
        isLoggedIn: true,
      });
      initializeSocket(adminData.token);
      navigate('/');
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
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              loading={isLoading}
              size="large"
              block
            >
              {translate('Log in')}
            </Button>
          </Form.Item>
        </Form>
      </Loading>
    );
  };

  return <AuthModule authContent={<FormContainer />} AUTH_TITLE="Sign in" />;
};

export default LoginPage;
