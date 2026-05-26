import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { Form } from '@/components/ui';
import { useRegister } from '@/hooks/useAuthGql';
import RegisterForm from '@/forms/RegisterForm';
import Loading from '@/components/Loading';
import AuthModule from '@/pages/AuthModule';
import storePersist from '@/redux/storePersist';

const SignupPage = () => {
  const translate = useLanguage();
  const navigate = useNavigate();

  const [registerMutation, { loading: isLoading, data }] = useRegister();

  const registerResult = data?.register;
  const isSuccess = registerResult?.success;

  const onFinish = (values) => {
    if (values.company_name) {
      localStorage.setItem('company_name', values.company_name);
    }
    registerMutation({ variables: { input: values } });
  };

  useEffect(() => {
    if (isSuccess && registerResult?.result) {
      storePersist.set('auth', {
        current: { ...registerResult.result.admin, token: registerResult.result.token },
        isLoggedIn: true,
      });
      navigate('/');
    }
  }, [isSuccess]);

  const FormContainer = () => {
    return (
      <Loading isLoading={isLoading}>
        <Form
          layout="vertical"
          name="signup_form"
          className="signup-form"
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
        >
          <RegisterForm />
          <Form.Item>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold text-white text-base border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0058c3 0%, #0070f3 100%)' }}
            >
              {isLoading ? 'Creating account...' : translate('Sign up')}
            </button>
          </Form.Item>
        </Form>
      </Loading>
    );
  };

  return <AuthModule authContent={<FormContainer />} AUTH_TITLE="Sign up" />;
};

export default SignupPage;
