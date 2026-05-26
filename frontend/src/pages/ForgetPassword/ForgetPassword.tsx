import { useNavigate } from 'react-router-dom';
import { Form, Result, Button, message } from '@/components/ui';
import { useForgotPassword } from '@/hooks/useAuthGql';
import ForgetPasswordForm from '@/forms/ForgetPasswordForm';
import useLanguage from '@/locale/useLanguage';
import Loading from '@/components/Loading';
import AuthModule from '@/pages/AuthModule';

const ForgetPassword = () => {
  const translate = useLanguage();
  const navigate = useNavigate();

  const [forgotPasswordMutation, { loading: isLoading, data }] = useForgotPassword();
  const isSuccess = data?.forgetPassword?.success;

  const onFinish = (values) => {
    forgotPasswordMutation({
      variables: { input: values },
      onCompleted: (result) => {
        if (result?.forgetPassword?.success) {
          message.success(translate('Password reset instructions have been sent to your email'));
        }
      },
      onError: () => {
        message.error(translate('Failed to send password reset request'));
      },
    });
  };

  const FormContainer = () => (
    <Loading isLoading={isLoading}>
      <Form
        name="forget-password"
        className="login-form"
        onFinish={onFinish}
      >
        <ForgetPasswordForm />
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="login-form-button"
            size="large"
            loading={isLoading}
          >
            {translate('Request new Password')}
          </Button>
          {translate('Or')}{' '}
          <a href="/login">{translate('already have account Login')}</a>
        </Form.Item>
      </Form>
    </Loading>
  );

  if (isSuccess) {
    return (
      <Result
        status="success"
        title={translate('Check your email address to reset your password')}
        subTitle={translate('Password Reset in progress')}
        style={{ maxWidth: '450px', margin: 'auto' }}
        extra={[
          <Button
            type="primary"
            key="login"
            onClick={() => navigate('/login')}
          >
            {translate('Login')}
          </Button>,
        ]}
      />
    );
  }

  return <AuthModule authContent={<FormContainer />} AUTH_TITLE="Forget Password" />;
};

export default ForgetPassword;
