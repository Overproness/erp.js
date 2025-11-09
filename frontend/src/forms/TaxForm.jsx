import React from 'react';
import { Form, Input, InputNumber, Switch } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

export default function TaxForm({ isUpdateForm = false }) {
  const translate = useLanguage();
  
  return (
    <>
      <Form.Item
        label={translate('Name')}
        name="name"  // Changed from taxName to name to match model
        rules={[
          {
            required: true,
            message: translate('Please input tax name!'),
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={translate('Tax Rate')} // Added Tax Rate field
        name="taxRate"
        rules={[
          {
            required: true,
            type: 'number',
            message: translate('Please input tax rate!'),
          },
        ]}
      >
        <InputNumber min={0} max={100} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label={translate('Tax Value')}
        name="taxValue"
        rules={[
          {
            required: true,
            type: 'number',
            message: translate('Please input tax value!'),
          },
        ]}
      >
        <InputNumber min={0} max={100} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label={translate('Enabled')}
        name="enabled"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
      </Form.Item>

      <Form.Item
        label={translate('Default')}
        name="isDefault"
        valuePropName="checked"
        initialValue={false}
      >
        <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
      </Form.Item>
    </>
  );
}
