import React from 'react';
import { Form, Input, Divider, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, BankOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Text } = Typography;

export default function RegisterForm() {
  const translate = useLanguage();
  
  return (
    <>
      <Form.Item
        name="name"
        rules={[
          {
            required: true,
            message: translate('Please input your name!'),
          },
        ]}
      >
        <Input 
          prefix={<UserOutlined />}
          placeholder={translate('Name')}
          size="large"
        />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            message: translate('Please input your email!'),
          },
          {
            type: 'email',
            message: translate('Please enter a valid email!'),
          },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder={translate('Email')}
          size="large"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: translate('Please input your password!'),
          },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder={translate('Password')}
          size="large"
        />
      </Form.Item>
      
      <Divider>
        <Text type="secondary">{translate('Company Information')}</Text>
      </Divider>
      
      <Form.Item
        name="company_name"
        rules={[
          {
            required: true,
            message: translate('Please input your company name!'),
          },
        ]}
      >
        <Input 
          prefix={<BankOutlined />}
          placeholder={translate('Company Name')}
          size="large"
        />
      </Form.Item>
      
      <Text type="secondary" style={{ display: 'block', marginTop: -10, marginBottom: 16 }}>
        {translate('You will complete your company setup after registration')}
      </Text>
    </>
  );
}