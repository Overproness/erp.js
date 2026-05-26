import useLanguage from '@/locale/useLanguage';
import { settingsAction } from '@/redux/settings/actions';
import { currencyOptions } from '@/utils/currencyList';
import { DollarOutlined, GlobalOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Select, Spin, Steps, Typography } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

const { Step } = Steps;
const { Title, Paragraph } = Typography;

const InitialCompanySetup = ({ visible, onComplete, userData }) => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set initial values based on user data when the component loads
  useEffect(() => {
    if (userData && userData.email) {
      form.setFieldsValue({
        app_email: userData.email,
        app_company_email: userData.email,
        company_name: '',
      });
    }
  }, [userData, form]);

  const steps = [
    {
      title: translate('Company Info'),
      icon: <ShopOutlined />,
      content: (
        <>
          <Title level={4}>{translate('Company Information')}</Title>
          <Paragraph>{translate('Please enter your company details below:')}</Paragraph>
          <Form.Item
            name="company_name"
            label={translate('Company Name')}
            rules={[{ required: true, message: translate('Please enter your company name') }]}
          >
            <Input placeholder={translate('Your Company Name')} />
          </Form.Item>
          <Form.Item name="company_address" label={translate('Company Address')}>
            <Input.TextArea rows={3} placeholder={translate('Your Company Address')} />
          </Form.Item>
          <Form.Item name="app_company_email" label={translate('Company Email')}>
            <Input type="email" placeholder={translate('company@example.com')} />
          </Form.Item>
          <Form.Item name="company_phone" label={translate('Company Phone')}>
            <Input placeholder={translate('+1 123 456 7890')} />
          </Form.Item>
          <Form.Item name="app_country" label={translate('Country')}>
            <Input placeholder={translate('Your Country')} />
          </Form.Item>
        </>
      ),
    },
    {
      title: translate('Currency'),
      icon: <DollarOutlined />,
      content: (
        <>
          <Title level={4}>{translate('Currency Settings')}</Title>
          <Paragraph>{translate('Select your default currency and format settings:')}</Paragraph>
          <Form.Item
            name="default_currency_code"
            label={translate('Default Currency')}
            rules={[{ required: true, message: translate('Please select a default currency') }]}
          >
            <Select
              showSearch
              placeholder={translate('Select a currency')}
              filterOption={(input, option) =>
                option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              options={currencyOptions()}
            />
          </Form.Item>
          <Form.Item
            name="currency_position"
            label={translate('Currency Position')}
            initialValue="before"
          >
            <Select>
              <Select.Option value="before">{translate('Before amount ($100)')}</Select.Option>
              <Select.Option value="after">{translate('After amount (100$)')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="decimal_sep" label={translate('Decimal Separator')} initialValue=".">
            <Select>
              <Select.Option value=".">.</Select.Option>
              <Select.Option value=",">,</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="thousand_sep" label={translate('Thousand Separator')} initialValue=",">
            <Select>
              <Select.Option value=",">,</Select.Option>
              <Select.Option value=".">.</Select.Option>
              <Select.Option value=" ">{translate('Space')}</Select.Option>
            </Select>
          </Form.Item>
        </>
      ),
    },
    {
      title: translate('Preferences'),
      icon: <SettingOutlined />,
      content: (
        <>
          <Title level={4}>{translate('Additional Preferences')}</Title>
          <Paragraph>{translate('Set additional preferences for your system:')}</Paragraph>
          <Form.Item name="date_format" label={translate('Date Format')} initialValue="DD/MM/YYYY">
            <Select>
              <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
              <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
              <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="app_timezone" label={translate('Time Zone')} initialValue="UTC">
            <Select
              showSearch
              placeholder={translate('Select a timezone')}
              options={[
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'America/New_York' },
                { value: 'Europe/London', label: 'Europe/London' },
                { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
              ]}
            />
          </Form.Item>
          <Form.Item name="app_language" label={translate('Language')} initialValue="en">
            <Select>
              <Select.Option value="en">English</Select.Option>
              <Select.Option value="fr">Français</Select.Option>
              <Select.Option value="es">Español</Select.Option>
              <Select.Option value="de">Deutsch</Select.Option>
            </Select>
          </Form.Item>
        </>
      ),
    },
    {
      title: translate('Confirm'),
      icon: <GlobalOutlined />,
      content: (
        <>
          <Title level={4}>{translate('Review Your Settings')}</Title>
          <Paragraph>
            {translate('Please review your company settings before confirming:')}
          </Paragraph>
          <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
            {Object.keys(formData).length > 0 && (
              <div>
                <p>
                  <strong>{translate('Company Name')}:</strong> {formData.company_name}
                </p>
                {formData.company_address && (
                  <p>
                    <strong>{translate('Address')}:</strong> {formData.company_address}
                  </p>
                )}
                <p>
                  <strong>{translate('Email')}:</strong> {formData.app_company_email}
                </p>
                {formData.company_phone && (
                  <p>
                    <strong>{translate('Phone')}:</strong> {formData.company_phone}
                  </p>
                )}
                <p>
                  <strong>{translate('Currency')}:</strong> {formData.default_currency_code}
                </p>
                <p>
                  <strong>{translate('Date Format')}:</strong> {formData.date_format}
                </p>
              </div>
            )}
          </div>
        </>
      ),
    },
  ];

  const handleNext = async () => {
    try {
      // Validate fields for the current step
      const values = await form.validateFields();

      // Merge with previous data
      const updatedData = { ...formData, ...values };
      setFormData(updatedData);

      if (current === steps.length - 1) {
        // Final step - submit all settings
        await saveAllSettings(updatedData);
      } else {
        // Move to the next step
        setCurrent(current + 1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePrev = () => {
    setCurrent(current - 1);
  };

  const saveAllSettings = async (data) => {
    try {
      setIsSubmitting(true);

      // Prepare settings in the correct format for the backend
      const settingsToUpdate = [];

      // Company settings
      if (data.company_name) {
        settingsToUpdate.push({
          settingCategory: 'company_settings',
          settingKey: 'company_name',
          settingValue: data.company_name,
          valueType: 'string',
        });
      }

      if (data.company_address) {
        settingsToUpdate.push({
          settingCategory: 'company_settings',
          settingKey: 'company_address',
          settingValue: data.company_address,
          valueType: 'string',
        });
      }

      if (data.company_phone) {
        settingsToUpdate.push({
          settingCategory: 'company_settings',
          settingKey: 'company_phone',
          settingValue: data.company_phone,
          valueType: 'string',
        });
      }

      // App settings
      if (data.app_company_email) {
        settingsToUpdate.push({
          settingCategory: 'app_settings',
          settingKey: 'app_company_email',
          settingValue: data.app_company_email,
          valueType: 'string',
        });
      }

      if (data.app_country) {
        settingsToUpdate.push({
          settingCategory: 'app_settings',
          settingKey: 'app_country',
          settingValue: data.app_country,
          valueType: 'string',
        });
      }

      if (data.app_timezone) {
        settingsToUpdate.push({
          settingCategory: 'app_settings',
          settingKey: 'app_timezone',
          settingValue: data.app_timezone,
          valueType: 'string',
        });
      }

      if (data.app_language) {
        settingsToUpdate.push({
          settingCategory: 'app_settings',
          settingKey: 'app_language',
          settingValue: data.app_language,
          valueType: 'string',
        });
      }

      // Money format settings
      if (data.default_currency_code) {
        settingsToUpdate.push({
          settingCategory: 'money_format_settings',
          settingKey: 'currency_code',
          settingValue: data.default_currency_code,
          valueType: 'string',
        });

        // Also set currency symbol based on the selected currency
        // Lookup the symbol from currencyOptions
        const currencyData = currencyOptions().find((c) => c.value === data.default_currency_code);
        if (currencyData) {
          settingsToUpdate.push({
            settingCategory: 'money_format_settings',
            settingKey: 'currency_symbol',
            settingValue:
              currencyData.value === 'USD'
                ? '$'
                : currencyData.value === 'EUR'
                  ? '€'
                  : currencyData.value === 'GBP'
                    ? '£'
                    : '$',
            valueType: 'string',
          });
        }
      }

      if (data.currency_position) {
        settingsToUpdate.push({
          settingCategory: 'money_format_settings',
          settingKey: 'currency_position',
          settingValue: data.currency_position,
          valueType: 'string',
        });
      }

      if (data.decimal_sep) {
        settingsToUpdate.push({
          settingCategory: 'money_format_settings',
          settingKey: 'decimal_sep',
          settingValue: data.decimal_sep,
          valueType: 'string',
        });
      }

      if (data.thousand_sep) {
        settingsToUpdate.push({
          settingCategory: 'money_format_settings',
          settingKey: 'thousand_sep',
          settingValue: data.thousand_sep,
          valueType: 'string',
        });
      }

      // Date format
      if (data.date_format) {
        settingsToUpdate.push({
          settingCategory: 'app_settings',
          settingKey: 'date_format',
          settingValue: data.date_format,
          valueType: 'string',
        });
      }

      // Call API to save settings
      const { request } = await import('@/request');
      const result = await request.post({
        entity: 'setting/batch',
        jsonData: { settings: settingsToUpdate },
      });

      if (result.success) {
        message.success(translate('Company setup completed successfully!'));

        // Reload settings from server immediately
        dispatch(settingsAction.list({ entity: 'setting' }));

        // Also reload after a short delay to ensure backend processing is complete
        setTimeout(() => {
          console.log('Reloading settings again after delay...');
          dispatch(settingsAction.list({ entity: 'setting' }));
        }, 2000);

        // Mark setup as complete
        localStorage.setItem('companySetupComplete', 'true');

        // Notify parent component
        onComplete();
      } else {
        message.error(translate('Failed to save company settings.'));
      }

      setIsSubmitting(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error(translate('An error occurred while saving settings.'));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={translate('Initial Company Setup')}
      open={visible}
      closable={false}
      maskClosable={false}
      footer={null}
      width={700}
      style={{ top: 20 }}
    >
      <Steps current={current} style={{ marginBottom: '2rem' }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Form layout="vertical" form={form}>
        <div style={{ minHeight: '300px' }}>{steps[current].content}</div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          {current > 0 && (
            <Button onClick={handlePrev} disabled={isSubmitting}>
              {translate('Previous')}
            </Button>
          )}
          <div style={{ flex: 1 }}></div>
          <Button type="primary" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? (
              <Spin size="small" />
            ) : current === steps.length - 1 ? (
              translate('Complete Setup')
            ) : (
              translate('Next')
            )}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default InitialCompanySetup;
