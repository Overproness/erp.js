import React, { useEffect, useMemo, useState } from 'react';
import { Form, Card, Space, Button, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import useLanguage from '@/locale/useLanguage';
import { fetchSegments, fetchCampaigns } from '@/redux/marketing/marketingSlice';
import { selectSegments, selectCampaigns } from '@/redux/marketing/selectors';

// Reuse the same step components as CreateCampaignModule
import CampaignBasicInfo from '../CreateCampaignModule/Steps/CampaignBasicInfo';
import CampaignAudience from '../CreateCampaignModule/Steps/CampaignAudience';
import CampaignContent from '../CreateCampaignModule/Steps/CampaignContent';
import CampaignChannels from '../CreateCampaignModule/Steps/CampaignChannels';
import CampaignReview from '../CreateCampaignModule/Steps/CampaignReview';

const UpdateCampaignModule = () => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const { campaignId } = useParams();
  const [form] = Form.useForm();

  // Redux data
  const segments = useSelector(selectSegments);
  const campaigns = useSelector(selectCampaigns);

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(null);

  // Consistent dummy campaigns (fallback)
  const dummyCampaigns = useMemo(() => ([
    {
      id: 'cmp_1',
      name: 'Spring Sale 2025',
      description: 'Promotional email series for spring collection.',
      status: 'active',
      type: 'email',
      audience: { name: 'All Subscribers' },
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      sentCount: 12000,
      openCount: 4800,
      createdAt: '2025-02-10',
      channels: ['email', 'sms', 'push'],
    },
    {
      id: 'cmp_2',
      name: 'Social Boost - April',
      description: 'Paid social media push to increase awareness.',
      status: 'paused',
      type: 'social',
      audienceCount: 8400,
      startDate: '2025-04-05',
      endDate: '2025-04-20',
      sentCount: 0,
      openCount: 0,
      createdAt: '2025-04-01',
      channels: ['email', 'sms'],
    },
    {
      id: 'cmp_3',
      name: 'Re-engagement SMS',
      description: 'Win-back campaign for inactive users.',
      status: 'completed',
      type: 'sms',
      audience: { name: 'Inactive Users' },
      startDate: '2025-01-10',
      endDate: '2025-01-20',
      sentCount: 5000,
      openCount: 0,
      createdAt: '2024-12-30',
      channels: ['sms'],
    },
  ]), []);

  // Ensure data available on direct route entry
  useEffect(() => {
    setLoading(true);
    Promise.all([dispatch(fetchSegments()), dispatch(fetchCampaigns())]).finally(() => {
      setLoading(false);
    });
  }, [dispatch]);

  // Resolve current campaign and prefill form
  useEffect(() => {
    const entity = (campaigns || []).find(c => String(c.id) === String(campaignId))
      || dummyCampaigns.find(c => String(c.id) === String(campaignId));

    if (!entity) {
      setFormData(null);
      return;
    }

    const supportedTypes = ['email', 'sms', 'push', 'multi', 'social'];
    const coerceType = (t) => (supportedTypes.includes(t) ? t : 'multi');
    const type = coerceType(entity.type || 'email');

    const channels = Array.isArray(entity.channels) && entity.channels.length
      ? entity.channels
      : (type === 'multi' ? ['email', 'sms', 'push'] : [type]);

    const prefill = {
      name: entity.name || '',
      description: entity.description || '',
      type,
      status: entity.status || 'draft',
      dateRange: [
        entity.startDate ? dayjs(entity.startDate) : null,
        entity.endDate ? dayjs(entity.endDate) : null,
      ],
      startDate: entity.startDate || null,
      endDate: entity.endDate || null,
      channels,
      segmentIds: [], // none known; user can adjust
      audienceType: 'segment', // default so UI matches Create module
      content: {
        email: {
          subject: '',
          preheader: '',
          body: '',
        },
        sms: {
          message: '',
          includeUnsubscribeLink: true,
        },
        push: {
          title: '',
          body: '',
          actionUrl: '',
          image: null,
        },
      },
      channelSettings: {
        // defaults; user can change
      },
      priority: 'medium',
      budget: undefined,
      timeZoneSettings: 'recipient',
      abTesting: false,
      deliverySpeedLimit: 0,
      retryFailedDeliveries: true,
    };

    setFormData(prefill);
    form.setFieldsValue(prefill);
  }, [campaignId, campaigns, dummyCampaigns, form]);

  const handleFormChange = (_changed, allValues) => {
    setFormData(allValues);
  };

  const steps = [
    {
      key: 'basic',
      component: <CampaignBasicInfo form={form} formData={formData} onChange={handleFormChange} />,
    },
    {
      key: 'audience',
      component: <CampaignAudience form={form} formData={formData} segments={segments} onChange={handleFormChange} />,
    },
    {
      key: 'content',
      component: <CampaignContent form={form} formData={formData} onChange={handleFormChange} />,
    },
    {
      key: 'channels',
      component: <CampaignChannels form={form} formData={formData} onChange={handleFormChange} />,
    },
    {
      key: 'review',
      component: <CampaignReview formData={formData} segments={segments} />,
    },
  ];

  if (loading || !formData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        initialValues={{
          name: '',
          status: 'draft',
          type: 'email',
          startDate: null,
          endDate: null,
          segmentIds: [],
          channels: ['email'],
          content: {
            subject: '',
            body: '',
          },
        }}
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button disabled={currentStep === 0} onClick={() => setCurrentStep(s => Math.max(0, s - 1))}>
              {translate('Previous')}
            </Button>
            <Button type="primary" onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))}>
              {currentStep < steps.length - 1 ? translate('Next') : translate('Review')}
            </Button>
          </Space>
          <Space>
            <Button onClick={() => form.resetFields()}>{translate('Reset')}</Button>
            <Button type="primary">{translate('Save Changes')}</Button>
          </Space>
        </div>

        {steps[currentStep].component}
      </Form>
    </Card>
  );
};

export default UpdateCampaignModule;
