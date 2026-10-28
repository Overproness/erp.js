import { useMarketing } from '@/context/useMarketing';
import useLanguage from '@/locale/useLanguage';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@/components/icons';
import { Button, Card, Space, Steps, Typography, message } from '@/components/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateCampaignModule from './MarketingModule/CreateCampaignModule';

const { Title, Text } = Typography;
const { Step } = Steps;

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const translate = useLanguage();
  const { setFormData, formData } = useMarketing();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Define steps for campaign creation
  const steps = [
    {
      title: translate('Campaign Info'),
      description: translate('Basic details'),
    },
    {
      title: translate('Audience'),
      description: translate('Select target audience'),
    },
    {
      title: translate('Content'),
      description: translate('Create campaign content'),
    },
    {
      title: translate('Channels'),
      description: translate('Choose delivery channels'),
    },
    {
      title: translate('Review'),
      description: translate('Review and launch'),
    },
  ];

  const handleBack = () => {
    navigate('/marketing');
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleFinish = async () => {
    setLoading(true);

    try {
      const payload = {
        name:
          formData?.name ||
          formData?.basicInfo?.name ||
          `Ad Campaign ${new Date().toLocaleDateString()}`,
        description: formData?.description || formData?.basicInfo?.description || '',
        objective: formData?.objective || 'OUTCOME_TRAFFIC',
        platforms: formData?.channels || formData?.platforms || ['facebook', 'google'],
        budget: {
          amount: Number(formData?.budget?.amount || formData?.budget || 50),
          type: 'DAILY',
          currency: 'USD',
        },
        targeting: formData?.audience || formData?.targeting || {},
        creatives: [
          {
            headline: formData?.content?.subject || formData?.name || 'Special Offer',
            body:
              formData?.content?.body ||
              formData?.description ||
              'Discover our latest solutions and offers.',
            destinationUrl: formData?.content?.destinationUrl || window.location.origin,
            callToAction: 'LEARN_MORE',
          },
        ],
      };

      const { request } = await import('@/request');
      const response = await request.create({
        entity: 'marketing/ad-campaigns',
        jsonData: payload,
      });

      if (response?.success) {
        message.success(translate('Ad campaign deployed successfully!'));
        navigate('/marketing');
      } else {
        throw new Error(response?.message || 'Failed to deploy campaign');
      }
    } catch (err: any) {
      console.error('Campaign creation error:', err);
      message.error(err?.message || translate('Failed to launch campaign'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const payload = {
        name:
          formData?.name ||
          formData?.basicInfo?.name ||
          `Draft Campaign ${new Date().toLocaleDateString()}`,
        description: formData?.description || formData?.basicInfo?.description || '',
        objective: formData?.objective || 'OUTCOME_TRAFFIC',
        platforms: formData?.channels || formData?.platforms || ['facebook'],
        budget: {
          amount: Number(formData?.budget?.amount || formData?.budget || 25),
          type: 'DAILY',
          currency: 'USD',
        },
        status: 'DRAFT',
      };
      const { request } = await import('@/request');
      await request.create({
        entity: 'marketing/ad-campaigns',
        jsonData: payload,
      });
      message.success(translate('Campaign saved as draft'));
      navigate('/marketing');
    } catch (err: any) {
      message.error(err?.message || translate('Failed to save draft'));
    }
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <Space style={{ marginBottom: '16px' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {translate('Back to Marketing')}
          </Button>
        </Space>

        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
            {translate('Create Campaign')}
          </Title>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            {translate('Build your marketing campaign in a few simple steps')}
          </Text>
        </div>
      </div>

      {/* Steps Progress */}
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)',
        }}
      >
        <Steps current={currentStep} size="small">
          {steps.map((item) => (
            <Step key={item.title} title={item.title} description={item.description} />
          ))}
        </Steps>
      </Card>

      {/* Campaign Builder Content */}
      <Card
        style={{
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)',
          minHeight: '500px',
        }}
      >
        <CreateCampaignModule
          currentStep={currentStep}
          formData={formData}
          onUpdateFormData={setFormData}
        />

        {/* Navigation Buttons */}
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Button onClick={handlePrevious} disabled={currentStep === 0}>
            {translate('Previous')}
          </Button>

          <Space>
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                {translate('Next')}
              </Button>
            ) : (
              <>
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveDraft}
                >
                  {translate('Save as Draft')}
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={loading}
                  onClick={handleFinish}
                >
                  {translate('Launch Campaign')}
                </Button>
              </>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}
