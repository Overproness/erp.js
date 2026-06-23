import { Form, Input } from '@/components/ui';
import useLanguage from '@/locale/useLanguage';

export default function LoginForm() {
  const translate = useLanguage();
  return (
    <div className="space-y-1">
      <Form.Item
        name="email"
        rules={[
          { required: true, message: translate('Please enter your email') },
          { type: 'email', message: translate('Please enter a valid email') },
        ]}
      >
        <Input
          placeholder="Email address"
          type="email"
          size="large"
          style={{
            background: '#e1e3e4',
            border: '1.5px solid transparent',
            borderRadius: '0.5rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
          }}
          onFocus={(e) => {
            e.target.style.border = '1.5px solid #0058c3';
            e.target.style.boxShadow =
              'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)';
          }}
          onBlur={(e) => {
            e.target.style.border = '1.5px solid transparent';
            e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
          }}
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: translate('Please enter your password') }]}
      >
        <Input.Password
          placeholder="Password"
          size="large"
          style={{
            background: '#e1e3e4',
            border: '1.5px solid transparent',
            borderRadius: '0.5rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
          }}
          onFocus={(e) => {
            const el = e.target.closest('.input-affix-wrapper') as HTMLElement;
            if (el) {
              el.style.border = '1.5px solid #0058c3';
              el.style.boxShadow =
                'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)';
            }
          }}
          onBlur={(e) => {
            const el = e.target.closest('.input-affix-wrapper') as HTMLElement;
            if (el) {
              el.style.border = '1.5px solid transparent';
              el.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
            }
          }}
        />
      </Form.Item>

      <div className="flex items-center justify-between py-3">
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <label
            className="flex items-center gap-2 cursor-pointer text-sm"
            style={{ color: '#414754' }}
          >
            <input type="checkbox" className="rounded" />
            {translate('Remember me')}
          </label>
        </Form.Item>
        <a
          href="/forgetpassword"
          className="text-sm font-medium no-underline hover:underline"
          style={{ color: '#0058c3' }}
        >
          {translate('Forgot password?')}
        </a>
      </div>
    </div>
  );
}
