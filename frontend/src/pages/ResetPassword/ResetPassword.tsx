import { useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { useResetPassword } from '@/hooks/useAuthGql';

import { Form, Button } from '@/components/ui';

import ResetPasswordForm from '@/forms/ResetPasswordForm';

import useLanguage from '@/locale/useLanguage';

import Loading from '@/components/Loading';
import AuthModule from '@/pages/AuthModule';
import storePersist from '@/redux/storePersist';

const ResetPassword = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { userId, resetToken } = useParams();

  const [resetPasswordMutation, { loading: isLoading, data }] = useResetPassword();
  const resetResult = data?.resetPassword;
  const isSuccess = resetResult?.success;

  const onFinish = (values) => {
    resetPasswordMutation({
      variables: {
        input: {
          password: values.password,
          userId,
          resetToken,
        },
      },
    });
  };

  useEffect(() => {
    if (isSuccess && resetResult?.result) {
      storePersist.set('auth', {
        current: { ...resetResult.result.admin, token: resetResult.result.token },
        isLoggedIn: true,
      });
      navigate('/');
    }
  }, [isSuccess]);

  const FormContainer = () => {
    return (
      <Loading isLoading={isLoading}>
        <Form
          name="signup"
          className="login-form"
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
        >
          <ResetPasswordForm />
          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button" size="large">
              {translate('update password')}
            </Button>
            {translate('Or')} <a href="/login"> {translate('already have account Login')} </a>
          </Form.Item>
        </Form>
      </Loading>
    );
  };
  return <AuthModule authContent={<FormContainer />} AUTH_TITLE="Reset Password" />;
};

export default ResetPassword;
