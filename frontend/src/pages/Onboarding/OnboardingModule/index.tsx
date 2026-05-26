import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { request } from '@/request';
import * as actionTypes from '@/redux/auth/types';
import saveAllSettings from './saveAllSettings';
import { 
  Steps, 
  Form, 
  Input, 
  Select, 
  Button, 
  Typography, 
  Card, 
  Row, 
  Col, 
  Divider,
  InputNumber, 
  Space,
  message
} from '@/components/ui';
import storePersist from '@/redux/storePersist';
import { 
  ShopOutlined, 
  DollarOutlined, 
  GlobalOutlined, 
  SettingOutlined 
} from '@ant-design/icons';
import { settingsAction } from '@/redux/settings/actions';
import { selectAuth } from '@/redux/auth/selectors';
import { selectCurrentSettings } from '@/redux/settings/selectors';
import { currencyOptions, currencyFlag } from '@/utils/currencyList';
import { countryList } from '@/utils/countryList';
import useLanguage from '@/locale/useLanguage';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Currency symbols mapping for common currencies
const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  RUB: '₽',
  KRW: '₩',
  BRL: 'R$',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  NZD: 'NZ$',
  ZAR: 'R',
  SGD: 'S$',
  HKD: 'HK$',
};

const OnboardingModule = () => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // State for the component
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exampleFormat, setExampleFormat] = useState('$1,234.56');
  
  // Get user data from auth state
  const { current: userData } = useSelector(selectAuth);
  const currentSettings = useSelector(selectCurrentSettings);

  // Initialize form with user data and defaults
  useEffect(() => {
    if (userData && userData.email) {
      form.setFieldsValue({
        app_email: userData.email,
        app_company_email: userData.email,
        company_name: userData.companyName || '',
        default_currency_code: 'USD',
        default_currency_symbol: '$',
        currency_position: 'before',
        decimal_separator: '.',
        thousand_separator: ',',
        decimal_places: 2,
        date_format: 'DD/MM/YYYY',
        app_timezone: 'UTC',
        app_language: 'en',
      });
    }
  }, [userData, form]);

  // Update the example currency format when form values change
  const updateExampleFormat = useCallback((values) => {
    if (!values) return;

    const amount = 1234.56;
    const {
      default_currency_symbol = '$',
      currency_position = 'before',
      decimal_separator = '.',
      thousand_separator = ',',
      decimal_places = 2
    } = values;

    // Format the number based on the settings
    const formattedNumber = amount.toFixed(decimal_places)
      .replace('.', decimal_separator)
      .replace(/\B(?=(\d{3})+(?!\d))/g, thousand_separator);

    // Position the currency symbol according to the setting
    const formatted = currency_position === 'before' 
      ? `${default_currency_symbol}${formattedNumber}` 
      : `${formattedNumber}${default_currency_symbol}`;
    
    setExampleFormat(formatted);
  }, []);

  // Update example format when currency-related fields change
  useEffect(() => {
    const values = form.getFieldsValue();
    updateExampleFormat(values);
  }, [form, updateExampleFormat]);

  // Define the steps for the onboarding process
  const steps = [
    {
      title: translate('Company Info'),
      icon: <ShopOutlined />,
      content: (
        <Card>
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
            <Input placeholder={translate('+1 (123) 456-7890')} />
          </Form.Item>
          
          <Form.Item name="app_country" label={translate('Country')} initialValue="US">
            <Select
              showSearch
              placeholder={translate('Select a country')}
              optionFilterProp="label"
              options={countryList.map(country => ({
                value: country.value,
                label: `${country.label} (${country.value})`
              }))}
            />
          </Form.Item>
        </Card>
      ),
    },
    {
      title: translate('Currency Setup'),
      icon: <DollarOutlined />,
      content: (
        <Card>
          <Title level={4}>{translate('Currency Settings')}</Title>
          <Paragraph>{translate('Configure your default currency and format:')}</Paragraph>
          
          <Form.Item
            name="default_currency_code"
            label={translate('Default Currency')}
            rules={[{ required: true, message: translate('Please select a currency') }]}
          >
            <Select
              showSearch
              placeholder={translate('Select a currency')}
              optionFilterProp="label"
              options={currencyFlag.map(c => ({
                value: c.currency_code,
                label: `${c.flag} ${c.currency_code}`
              }))}
              onChange={(value) => {
                // Get the symbol for this currency
                const symbol = currencySymbols[value] || '$';
                const selectedCurrency = currencyFlag.find(c => c.currency_code === value);
                const formValues = {
                  default_currency_symbol: symbol,
                  currency_flag: selectedCurrency?.flag || '💵'
                };
                form.setFieldsValue(formValues);
                
                // Update the example format
                setTimeout(() => {
                  updateExampleFormat({
                    ...form.getFieldsValue(),
                    ...formValues
                  });
                }, 100);
              }}
            />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="default_currency_symbol"
                label={translate('Currency Symbol')}
                tooltip={translate('The symbol used for displaying currency values')}
              >
                <Input placeholder="$" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency_flag"
                label={translate('Currency Flag')}
                tooltip={translate('Flag emoji associated with this currency')}
              >
                <Input placeholder="🇺🇸" disabled />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="currency_position"
            label={translate('Currency Position')}
            initialValue="before"
          >
            <Select>
              <Select.Option value="before">{translate('Before Amount')} ($123.45)</Select.Option>
              <Select.Option value="after">{translate('After Amount')} (123.45$)</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="thousand_separator"
            label={translate('Thousand Separator')}
            initialValue=","
          >
            <Select>
              <Select.Option value=",">,</Select.Option>
              <Select.Option value=".">.</Select.Option>
              <Select.Option value=" ">{translate('Space')}</Select.Option>
              <Select.Option value="">{translate('None')}</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="decimal_separator"
            label={translate('Decimal Separator')}
            initialValue="."
          >
            <Select>
              <Select.Option value=".">.</Select.Option>
              <Select.Option value=",">,</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="decimal_places"
            label={translate('Decimal Places')}
            initialValue={2}
          >
            <InputNumber min={0} max={4} />
          </Form.Item>
          
          <Divider />
          
          <Title level={5}>{translate('Example')}</Title>
          <Card 
            style={{ 
              textAlign: 'center', 
              marginBottom: '20px',
              backgroundColor: '#f9f9f9'
            }}
          >
            <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {exampleFormat}
            </Text>
          </Card>
          
          <Button 
            type="default" 
            onClick={() => form.validateFields().then(updateExampleFormat)}
            style={{ marginBottom: '10px' }}
          >
            {translate('Update Preview')}
          </Button>
        </Card>
      ),
    },
    {
      title: translate('Preferences'),
      icon: <SettingOutlined />,
      content: (
        <Card>
          <Title level={4}>{translate('Additional Preferences')}</Title>
          <Paragraph>{translate('Set additional preferences for your system:')}</Paragraph>
          
          <Form.Item name="date_format" label={translate('Date Format')} initialValue="DD/MM/YYYY">
            <Select>
              <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
              <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
              <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
              <Select.Option value="DD.MM.YYYY">DD.MM.YYYY</Select.Option>
              <Select.Option value="YYYY/MM/DD">YYYY/MM/DD</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="app_timezone" label={translate('Time Zone')} initialValue="UTC">
            <Select
              showSearch
              placeholder={translate('Select a timezone')}
              options={[
                { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
                { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
                { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
                { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
                { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
                { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
                { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
                { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
                { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
                { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
                { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT)' }
              ]}
            />
          </Form.Item>
          
          <Form.Item name="app_language" label={translate('Language')} initialValue="en">
            <Select>
              <Select.Option value="en">English</Select.Option>
              <Select.Option value="fr">Français</Select.Option>
              <Select.Option value="es">Español</Select.Option>
              <Select.Option value="de">Deutsch</Select.Option>
              <Select.Option value="it">Italiano</Select.Option>
              <Select.Option value="pt">Português</Select.Option>
              <Select.Option value="ru">Русский</Select.Option>
              <Select.Option value="zh">中文</Select.Option>
              <Select.Option value="ja">日本語</Select.Option>
              <Select.Option value="ko">한국어</Select.Option>
              <Select.Option value="ar">العربية</Select.Option>
              <Select.Option value="hi">हिन्दी</Select.Option>
            </Select>
          </Form.Item>
        </Card>
      ),
    },
    {
      title: translate('Confirm'),
      icon: <GlobalOutlined />,
      content: (
        <Card>
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
                  <strong>{translate('Country')}:</strong> {
                    countryList.find(c => c.value === formData.app_country)?.label || formData.app_country
                  }
                </p>
                <p>
                  <strong>{translate('Currency')}:</strong> {
                    formData.default_currency_code
                  } ({formData.default_currency_symbol})
                </p>
                <p>
                  <strong>{translate('Date Format')}:</strong> {formData.date_format}
                </p>
                <p>
                  <strong>{translate('Time Zone')}:</strong> {formData.app_timezone}
                </p>
                <p>
                  <strong>{translate('Language')}:</strong> {formData.app_language}
                </p>
              </div>
            )}
          </div>
        </Card>
      ),
    },
  ];

  // Handle the next button click
  const handleNext = async () => {
    try {
      // Validate fields for the current step
      const values = await form.validateFields();
      
      // Merge with previous data
      const updatedData = { ...formData, ...values };
      setFormData(updatedData);
      
      if (current === steps.length - 1) {
        // Final step - submit all settings
        await handleSaveSettings(updatedData);
      } else {
        // Move to the next step
        setCurrent(current + 1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Handle the previous button click
  const handlePrev = () => {
    setCurrent(current - 1);
  };
  
  // Wrapper function to call the imported saveAllSettings with the right parameters
  const handleSaveSettings = async (data) => {
    // Call the imported function with the data and required context
    return saveAllSettings(data, {
      setIsSubmitting,
      dispatch,
      navigate,
      translate,
      userData
    });
  };

  // Prevent onboarding for non-owner users
  if (userData && userData.role !== 'owner') {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
        <Typography.Title level={3}>Onboarding is only required for company owners.</Typography.Title>
        <Typography.Paragraph>
          You do not need to complete onboarding. Please contact your administrator if you believe this is an error.
        </Typography.Paragraph>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
        {translate('Welcome to Your New ERP System')}
      </Title>
      
      <Steps current={current} style={{ marginBottom: '2rem' }}>
        {steps.map(step => (
          <Step key={step.title} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Form layout="vertical" form={form} onValuesChange={(changedValues, allValues) => updateExampleFormat(allValues)}>
        <div style={{ minHeight: '300px' }}>{steps[current].content}</div>
        
        <Divider />
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          {current > 0 && (
            <Button onClick={handlePrev} disabled={isSubmitting}>
              {translate('Previous')}
            </Button>
          )}
          
          <div style={{ flex: 1 }}></div>
          
          <Button 
            type="primary" 
            onClick={handleNext}
            loading={isSubmitting}
          >
            {current === steps.length - 1 ? (
              translate('Complete Setup')
            ) : (
              translate('Next')
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default OnboardingModule;
