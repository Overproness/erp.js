import { useEffect } from 'react';

import { settingsAction } from '@/redux/settings/actions';
import { selectSettings } from '@/redux/settings/selectors';
import { useDispatch, useSelector } from 'react-redux';

import Loading from '@/components/Loading';
import useLanguage from '@/locale/useLanguage';
import { Button, Form } from '@/components/ui';

export default function UpdateSettingForm({ config, children, withUpload, uploadSettingKey }) {
  let { entity, settingsCategory } = config;
  const dispatch = useDispatch();
  const { result, isLoading } = useSelector(selectSettings);
  const translate = useLanguage();
  const [form] = Form.useForm();

  // Validate that entity is provided
  if (!entity) {
    console.error('UpdateSettingForm: entity is required in config');
    return (
      <div style={{ padding: '20px', border: '1px solid red', margin: '10px' }}>
        <h3>Configuration Error</h3>
        <p>Entity parameter is missing from configuration. Please check the component props.</p>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </div>
    );
  }

  const onSubmit = (fieldsValue) => {
    if (withUpload) {
      if (fieldsValue.file) {
        fieldsValue.file = fieldsValue.file[0].originFileObj;
      }
      dispatch(
        settingsAction.upload({ entity, settingKey: uploadSettingKey, jsonData: fieldsValue })
      );
    } else {
      const settings = [];

      for (const [key, value] of Object.entries(fieldsValue)) {
        settings.push({
          settingKey: key,
          settingValue: value,
          settingCategory: settingsCategory, // Include the category to ensure proper saving
        });
      }

      dispatch(settingsAction.updateMany({ entity, jsonData: { settings } }));
    }
  }; // Refresh settings when component mounts - always get fresh data from backend
  useEffect(() => {
    // Always fetch the latest settings from backend
    dispatch(settingsAction.list({ entity, forceRefresh: true }));
  }, [dispatch, entity]);
  useEffect(() => {
    // Wait until component is mounted and result data is loaded
    const loadSettings = () => {
      try {
        // Check for possible locations where the data might be stored
        let current = {};

        // First try direct category mapping
        if (result && result[settingsCategory]) {
          current = result[settingsCategory];
        }
        // Special case for money_format_settings
        else if (settingsCategory === 'money_format_settings') {
          if (result.money_format_settings) {
            current = result.money_format_settings;
          } else if (
            result.finance_settings &&
            result.finance_settings.currencySettings &&
            result.finance_settings.currencySettings.defaultCurrency
          ) {
            // Map currency data from finance_settings
            const currency = result.finance_settings.currencySettings.defaultCurrency;
            current = {
              currency_code: currency.code || 'EUR',
              default_currency_code: currency.code || 'EUR',
              currency_symbol:
                currency.symbol ||
                (currency.code === 'EUR' ? '€' : currency.code === 'GBP' ? '£' : '$'),
              currency_position:
                result.currency_position || (currency.code === 'EUR' ? 'after' : 'before'),
              decimal_sep: currency.decimal_separator || (currency.code === 'EUR' ? ',' : '.'),
              thousand_sep: currency.thousand_separator || (currency.code === 'EUR' ? '.' : ','),
              cent_precision: currency.cent_precision || 2,
            };
          } else if (result.currency_code && result.currency_symbol) {
            // Use global currency settings
            current = {
              currency_code: result.currency_code,
              default_currency_code: result.currency_code,
              currency_symbol: result.currency_symbol,
              currency_position: result.currency_position || 'before',
              decimal_sep: result.decimal_sep || '.',
              thousand_sep: result.thousand_sep || ',',
              cent_precision: result.cent_precision || 2,
            };
          }
        }
        // Special case for company_settings
        else if (settingsCategory === 'company_settings') {
          if (result.company_settings) {
            current = result.company_settings;
          } else {
            // Try to collect company data from multiple sources
            current = {
              company_name: result.company_name || '',
              company_address: result.company_address || '',
              company_email: result.company_email || result.app_company_email || '',
              company_phone: result.company_phone || '',
              company_website: result.company_website || '',
              company_tax_number: result.company_tax_number || '',
              company_vat_number: result.company_vat_number || '',
              company_reg_number: result.company_reg_number || '',
              company_state: result.company_state || '',
              company_country: result.company_country || result.app_country || '',
            };

            // Add finance settings company data if available
            if (result.finance_settings && result.finance_settings.companyName) {
              current.company_name = result.finance_settings.companyName;
            }
          }
        }
        // Special case for finance_settings
        else if (settingsCategory === 'finance_settings') {
          if (result.finance_settings) {
            // Extract finance settings from the model
            current = {
              last_invoice_number: result.finance_settings.invoice?.counter || 0,
              last_quote_number: result.finance_settings.quote?.counter || 0,
              last_payment_number: result.finance_settings.payment?.counter || 0,
            };
          } else {
            // Try to get them from old settings format
            current = {
              last_invoice_number: result.last_invoice_number || 0,
              last_quote_number: result.last_quote_number || 0,
              last_payment_number: result.last_payment_number || 0,
            };
          }
        }
        // Special case for general settings (AI API keys, etc.)
        else if (settingsCategory === 'general') {
          if (result.general) {
            current = result.general;
          } else if (result.ai_settings) {
            // Fallback to ai_settings if available
            current = result.ai_settings;
          }
        }

        if (current && Object.keys(current).length > 0) {
          // Reset the form first to clear any previous values
          form.resetFields();

          // Then set the field values from settings
          form.setFieldsValue(current);
        } else {
          // If no settings are found, reset the form to prevent stale data
          form.resetFields();
        }
      } catch (err) {
        console.error('Error setting form values:', err);
      }
    };

    loadSettings();
  }, [result, settingsCategory, form]);
  return (
    <div>
      <Loading isLoading={isLoading}>
        <Form
          form={form}
          onFinish={onSubmit}
          // onValuesChange={handleValuesChange}
          labelCol={{ span: 10 }}
          labelAlign="left"
          wrapperCol={{ span: 16 }}
          initialValues={result[settingsCategory] || {}}
        >
          {children}
          <Form.Item
            style={{
              display: 'inline-block',
              paddingRight: '5px',
            }}
          >
            <Button type="primary" htmlType="submit">
              {translate('Save')}
            </Button>
          </Form.Item>
          <Form.Item
            style={{
              display: 'inline-block',
              paddingLeft: '5px',
            }}
          >
            {/* <Button onClick={() => console.log('Cancel clicked')}>{translate('Cancel')}</Button> */}
          </Form.Item>
        </Form>
      </Loading>
    </div>
  );
}
