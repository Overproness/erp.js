import React from 'react';
import { Form, Input } from 'antd';
import useLanguage from '@/locale/useLanguage';

const inputStyle = {
  // background: '#e1e3e4',
  border: '1.5px solid transparent',
  borderRadius: '0.5rem',
  // boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.border = '1.5px solid #0058c3';
  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)';
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.border = '1.5px solid transparent';
  // e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
};

const handlePasswordFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  const el = e.target.closest('.ant-input-affix-wrapper') as HTMLElement;
  if (el) {
    el.style.border = '1.5px solid #0058c3';
    el.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)';
  }
};

const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  const el = e.target.closest('.ant-input-affix-wrapper') as HTMLElement;
  if (el) {
    el.style.border = '1.5px solid transparent';
    // el.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
  }
};

export default function RegisterForm() {
  const translate = useLanguage();

  return (
    <div className="space-y-1">
      <Form.Item
        name="name"
        rules={[{ required: true, message: translate('Please input your name!') }]}
      >
        <Input
          placeholder={translate('Full name')}
          size="large"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[
          { required: true, message: translate('Please input your email!') },
          { type: 'email', message: translate('Please enter a valid email!') },
        ]}
      >
        <Input
          placeholder={translate('Work email')}
          size="large"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: translate('Please input your password!') }]}
      >
        <Input.Password
          placeholder={translate('Password')}
          size="large"
          style={inputStyle}
          onFocus={handlePasswordFocus}
          onBlur={handlePasswordBlur}
        />
      </Form.Item>

      <div className="py-2">
        <div className="h-px" style={{}}></div>
        <p
          className="text-xs font-medium uppercase tracking-wider mt-3 mb-1"
          style={{ color: '#414754' }}
        >
          Company Information
        </p>
      </div>

      <Form.Item
        name="company_name"
        rules={[{ required: true, message: translate('Please input your company name!') }]}
      >
        <Input
          placeholder={translate('Company name')}
          size="large"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Form.Item>
      <p className="text-xs py-2" style={{ color: '#71767f', marginTop: -8, marginBottom: 12 }}>
        {translate('You will complete your company setup after registration')}
      </p>
    </div>
  );
}
