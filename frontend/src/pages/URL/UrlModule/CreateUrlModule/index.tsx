import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Steps,
  message,
  Row,
  Col,
  Typography,
  Divider,
} from '@/components/ui';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  CheckOutlined,
  LinkOutlined,
} from '@/components/icons';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { useUrlManagement } from '@/hooks/useUrl';
import CreateUrlForm from './CreateUrlForm';
import AdvancedSettings from './AdvancedSettings';
import UtmBuilder from './UtmBuilder';
import UrlPreview from './UrlPreview';

const { Step } = Steps;
const { Title, Text } = Typography;

const CreateUrlModule = ({ mode = 'wizard', onSubmit }) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { createUrl, isLoading } = useUrlManagement();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    originalUrl: '',
    title: '',
    description: '',
    tags: [],
    isPasswordProtected: false,
    password: '',
    hasClickLimit: false,
    clickLimit: 1000,
    hasExpiration: false,
    expirationDate: null,
    enableUtm: false,
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmTerm: '',
    utmContent: '',
    isActive: true,
    enableAnalytics: true,
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: translate('Basic Info'),
      description: translate('Enter URL and basic information'),
      key: 'basic',
    },
    {
      title: translate('Advanced Settings'),
      description: translate('Configure security and access controls'),
      key: 'advanced',
    },
    {
      title: translate('UTM Parameters'),
      description: translate('Add tracking parameters'),
      key: 'utm',
    },
    {
      title: translate('Preview & Create'),
      description: translate('Review and create your URL'),
      key: 'preview',
    },
  ];

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      if (currentStep === steps.length - 2) {
        generatePreview();
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        if (!formData.originalUrl) {
          message.error(translate('Please enter the original URL'));
          return false;
        }
        // Additional URL validation
        try {
          new URL(formData.originalUrl);
        } catch {
          message.error(translate('Please enter a valid URL'));
          return false;
        }
        return true;

      case 1:
        if (formData.isPasswordProtected && !formData.password) {
          message.error(translate('Password is required when password protection is enabled'));
          return false;
        }
        if (formData.hasClickLimit) {
          const clickLimitNum = Number(formData.clickLimit);
          if (isNaN(clickLimitNum) || clickLimitNum < 1) {
            message.error(translate('Click limit must be at least 1'));
            return false;
          }
        }
        if (
          formData.hasExpiration &&
          (!formData.expirationDate || formData.expirationDate.valueOf() < Date.now())
        ) {
          message.error(translate('Expiration date must be in the future'));
          return false;
        }
        return true;

      case 2:
        if (formData.enableUtm) {
          if (!formData.utmSource || !formData.utmMedium || !formData.utmCampaign) {
            message.error(
              translate(
                'UTM Source, Medium, and Campaign are required when UTM tracking is enabled'
              )
            );
            return false;
          }
        }
        return true;

      default:
        return true;
    }
  };

  const generatePreview = async () => {
    // Build short URL using website base URL and placeholder for shortCode
    const baseUrl = window.location.origin || 'http://localhost:3000';
    // Use placeholder since shortCode is generated in backend
    const shortUrl = `${baseUrl}/s/[shortCode will be generated]`;

    const preview = {
      shortUrl,
      finalUrl: formData.enableUtm ? buildUtmUrl() : formData.originalUrl,
      metadata: {
        title: formData.title,
        description: formData.description,
        security: {
          passwordProtected: formData.isPasswordProtected,
          clickLimit: formData.hasClickLimit ? formData.clickLimit : null,
          expiration: formData.hasExpiration ? formData.expirationDate : null,
        },
        utm: formData.enableUtm
          ? {
              source: formData.utmSource,
              medium: formData.utmMedium,
              campaign: formData.utmCampaign,
              term: formData.utmTerm,
              content: formData.utmContent,
            }
          : null,
      },
    };
    setPreviewData(preview);
  };

  const buildUtmUrl = () => {
    try {
      const url = new URL(formData.originalUrl);
      const params = new URLSearchParams(url.search);

      if (formData.utmSource) params.set('utm_source', formData.utmSource);
      if (formData.utmMedium) params.set('utm_medium', formData.utmMedium);
      if (formData.utmCampaign) params.set('utm_campaign', formData.utmCampaign);
      if (formData.utmTerm) params.set('utm_term', formData.utmTerm);
      if (formData.utmContent) params.set('utm_content', formData.utmContent);

      url.search = params.toString();
      return url.toString();
    } catch {
      return formData.originalUrl;
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit) {
      console.error('CreateUrlModule: onSubmit prop is required');
      return;
    }

    try {
      setLoading(true);
      // Transform formData to backend format
      const finalData = {
        originalUrl: formData.originalUrl,
        title: formData.title,
        description: formData.description,
        passwordProtected: formData.isPasswordProtected,
        ...(formData.isPasswordProtected && formData.password && { password: formData.password }),
        maxClicks: formData.hasClickLimit ? Number(formData.clickLimit) : null,
        expiresAt:
          formData.hasExpiration && formData.expirationDate
            ? formData.expirationDate.toISOString?.() || formData.expirationDate
            : null,
        utmSource: formData.enableUtm ? formData.utmSource : null,
        utmMedium: formData.enableUtm ? formData.utmMedium : null,
        utmCampaign: formData.enableUtm ? formData.utmCampaign : null,
        utmTerm: formData.enableUtm ? formData.utmTerm : null,
        utmContent: formData.enableUtm ? formData.utmContent : null,
        isActive: formData.isActive,
        enableAnalytics: formData.enableAnalytics,
        tags: formData.tags || [],
      };
      console.log('Submitting to backend:', finalData);
      await onSubmit(finalData);
    } catch (error) {
      message.error(translate('Failed to create URL'));
      console.error('Error creating URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormDataChange = (newData) => {
    setFormData({ ...formData, ...newData });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <CreateUrlForm data={formData} onChange={handleFormDataChange} disabled={isLoading} />
        );

      case 1:
        return (
          <AdvancedSettings data={formData} onChange={handleFormDataChange} disabled={isLoading} />
        );

      case 2:
        return <UtmBuilder data={formData} onChange={handleFormDataChange} disabled={isLoading} />;

      case 3:
        return (
          <UrlPreview data={previewData} formData={formData} onEdit={() => setCurrentStep(0)} />
        );

      default:
        return null;
    }
  };

  if (mode === 'simple') {
    return (
      <div>
        <Card>
          <CreateUrlForm
            data={formData}
            onChange={handleFormDataChange}
            disabled={isLoading}
            mode="all"
          />

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => navigate('/url')}>{translate('Cancel')}</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={isLoading}
                onClick={handleSubmit}
              >
                {translate('Create URL')}
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Steps */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps current={currentStep} labelPlacement="vertical">
          {steps.map((step, index) => (
            <Step
              key={step.key}
              title={step.title}
              description={step.description}
              icon={index < currentStep ? <CheckOutlined /> : undefined}
            />
          ))}
        </Steps>
      </Card>

      {/* Content */}
      <Card>
        {renderStepContent()}

        <Divider />

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {currentStep > 0 && (
              <Button size="large" onClick={handlePrev} disabled={loading}>
                {translate('Previous')}
              </Button>
            )}
          </div>

          <div>
            {currentStep < steps.length - 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={handleNext}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                {translate('Next')}
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={loading}
                icon={<SaveOutlined />}
                style={{
                  // background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                {translate('Create URL')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateUrlModule;
