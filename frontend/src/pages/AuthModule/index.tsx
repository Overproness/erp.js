import WebsiteLayout from '@/pages/Website/components/WebsiteLayout';
import { Link } from 'react-router-dom';

const AuthModule = ({ authContent, AUTH_TITLE, isForRegistre = false }) => {
  return (
    <WebsiteLayout title={AUTH_TITLE}>
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#0058c3]/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#a6c1fe]/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Glass card */}
          <div
            className="rounded-2xl p-8 md:p-10"
            style={{
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.4)',
              borderLeft: '1px solid rgba(255,255,255,0.4)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              borderRight: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 20px 40px rgba(25, 28, 29, 0.06)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-6">
              <img src="/logo-bg-remove.webp" alt="ERP.js" width={36} height={36} className="h-9 w-9 object-contain" />
              <span
                className="text-xl font-bold tracking-tighter font-inter"
                style={{ color: '#191c1d' }}
              >
                ERP.js
              </span>
            </div>

            {/* Title */}
            <h1
              className="text-3xl font-bold tracking-tight mb-1 font-inter"
              style={{ color: '#191c1d' }}
            >
              {AUTH_TITLE}
            </h1>
            <p className="text-sm mb-8 font-inter" style={{ color: '#414754' }}>
              {AUTH_TITLE === 'Sign in'
                ? 'Welcome back. Enter your credentials to continue.'
                : 'Create your account to get started with ERP.js.'}
            </p>

            {/* Form content */}
            <div className="auth-form-content">{authContent}</div>
          </div>

          {/* Bottom link */}
          <p className="text-center mt-6 text-sm font-inter" style={{ color: '#414754' }}>
            {AUTH_TITLE === 'Sign in' ? (
              <>
                Don&apos;t have an account?{' '}
                <Link
                  to="/signup"
                  className="text-[#0058c3] font-semibold no-underline hover:underline"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#0058c3] font-semibold no-underline hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default AuthModule;
