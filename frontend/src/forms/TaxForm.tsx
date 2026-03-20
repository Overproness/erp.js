import useLanguage from '@/locale/useLanguage';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Form, Input, InputNumber, Switch } from 'antd';

export default function TaxForm({ isUpdateForm = false }) {
  const translate = useLanguage();

  return (
    <>
      <Form.Item
        label={translate('Name')}
        name="name" // Changed from taxName to name to match model
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
        label={translate('Tax Rate (%)')}
        name="taxRate"
        rules={[
          {
            required: true,
            type: 'number',
            message: translate('Please input tax rate!'),
          },
        ]}
        tooltip={translate('Enter the percentage rate for this tax (e.g., 15 for 15%)')}
      >
        <InputNumber
          min={0}
          max={100}
          style={{ width: '100%' }}
          placeholder="e.g., 15"
          addonAfter="%"
        />
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
        tooltip={translate('Enter the absolute value or calculated amount for this tax')}
      >
        <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="e.g., 100" />
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
