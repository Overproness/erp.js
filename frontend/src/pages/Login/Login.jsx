import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import useLanguage from '@/locale/useLanguage';

import { login } from '@/redux/auth/actions';
import { selectAuth, selectCurrentAdmin } from '@/redux/auth/selectors';
import { Button, Form } from 'antd';

import Loading from '@/components/Loading';
import LoginForm from '@/forms/LoginForm';
import { useNotifications } from '@/hooks/useNotifications';
import AuthModule from '@/pages/AuthModule';

const LoginPage = () => {
  const translate = useLanguage();
  const { isLoading, isSuccess } = useSelector(selectAuth);
  const currentAdmin = useSelector(selectCurrentAdmin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { initializeSocket } = useNotifications();

  const onFinish = (values) => {
    dispatch(login({ loginData: values }));
  };

  useEffect(() => {
    if (isSuccess && currentAdmin?.token) {
      // Initialize socket connection with the auth token
      initializeSocket(currentAdmin.token);
      navigate('/');
    }
  }, [isSuccess, currentAdmin]);

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
