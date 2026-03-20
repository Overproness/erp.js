import React from 'react';
import { Form, Input, Switch } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

export default function PaymentModeForm({ isUpdateForm = false }) {
  const translate = useLanguage();

  return (
    <>
      <Form.Item
        label={translate('Payment Mode')}
        name="name"
        rules={[
          {
            required: true,
            message: translate('Please input payment mode name!'),
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={translate('Description')}
        name="description"
      >
        <Input.TextArea />
      </Form.Item>

      <Form.Item
        label={translate('Enabled')}
        name="enabled"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch 
          checkedChildren={<CheckOutlined />} 
          unCheckedChildren={<CloseOutlined />}
        />
      </Form.Item>

      <Form.Item
        label={translate('Default')}
        name="isDefault"
        valuePropName="checked"
        initialValue={false}
      >
        <Switch 
          checkedChildren={<CheckOutlined />} 
          unCheckedChildren={<CloseOutlined />}
        />
      </Form.Item>
    </>
  );
}
