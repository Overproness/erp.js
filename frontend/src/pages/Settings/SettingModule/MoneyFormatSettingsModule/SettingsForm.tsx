import useLanguage from '@/locale/useLanguage';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { Form, Input, InputNumber, Select, Switch } from '@/components/ui';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { currencyOptions } from '@/utils/currencyList';

export default function SettingsForm() {
  const translate = useLanguage();
  const moneyFormatSettings = useSelector(selectMoneyFormat);
  const [form] = Form.useForm();

  // Log the current settings for debugging
  useEffect(() => {
    console.log('Money format settings from Redux:', moneyFormatSettings);

    // Set form values when settings change
    if (moneyFormatSettings && Object.keys(moneyFormatSettings).length > 0) {
      form.setFieldsValue(moneyFormatSettings);
    }
  }, [moneyFormatSettings, form]);

  return (
    <div>
      {' '}
      <Form.Item
        label={translate('Currency')}
        name="currency_code"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? '').toLowerCase().startsWith((optionB?.label ?? '').toLowerCase())
          }
          options={currencyOptions()}
        ></Select>
      </Form.Item>
      <Form.Item
        label={translate('Currency Symbol')}
        name="currency_symbol"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={translate('Currency Position')}
        name="currency_position"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select>
          <Select.Option value="before">{translate('before')}</Select.Option>
          <Select.Option value="after">{translate('after')}</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label={translate('Decimal Separator')}
        name="decimal_sep"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>
      <Form.Item
        label={translate('Thousand Separator')}
        name="thousand_sep"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>
      <Form.Item
        label={translate('Cent precision')}
        name="cent_precision"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item
        label={translate('Zero Format')}
        name="zero_format"
        rules={[
          {
            required: true,
          },
        ]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </div>
  );
}
