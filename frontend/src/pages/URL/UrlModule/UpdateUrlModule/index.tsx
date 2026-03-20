import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  message,
  Spin,
  Typography,
  Divider,
  Steps,
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  EditOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { useUrlManagement } from '@/hooks/useUrl';
import UpdateUrlForm from './UpdateUrlForm';
import UpdateUtmBuilder from './UpdateUtmBuilder';
import UpdateAdvancedSettings from './UpdateAdvancedSettings';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Step } = Steps;

const UpdateUrlModule = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const { getUrl, updateUrl } = useUrlManagement();
  
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});

  useEffect(() => {
    loadUrlData();
  }, [id]);

  const loadUrlData = async () => {
    try {
      setLoading(true);
      
      const response = await getUrl(id);
      
      // Extract the actual URL data from the response
      const urlData = response.result || response;
      
      setUrl(urlData);
      
      // Initialize form data with current URL data
      const processedData = {
        originalUrl: urlData.originalUrl || '',
        title: urlData.title || '',
        description: urlData.description || '',
        isPasswordProtected: urlData.passwordProtected || false,
        password: '',
        hasClickLimit: urlData.maxClicks ? true : false,
        clickLimit: urlData.maxClicks || 1000,
        hasExpiration: urlData.expiresAt ? true : false,
        expirationDate: urlData.expiresAt ? dayjs(urlData.expiresAt) : null,
        enableUtm: (urlData.utmSource || urlData.utmMedium || urlData.utmCampaign) ? true : false,
        utmSource: urlData.utmSource || '',
        utmMedium: urlData.utmMedium || '',
        utmCampaign: urlData.utmCampaign || '',
        utmTerm: urlData.utmTerm || '',
        utmContent: urlData.utmContent || '',
        isActive: urlData.isActive !== false,
        enableAnalytics: urlData.enableAnalytics !== false,
        // Add additional fields for display
        shortUrl: urlData.shortUrl || urlData.shortenedUrl,
        clickCount: urlData.totalClicks || urlData.clickCount || 0,
        createdAt: urlData.createdAt || urlData.created,
        status: urlData.status || (urlData.isActive ? 'active' : 'inactive')
      };
      
      setFormData(processedData);
      setInitialData(processedData);
      
    } catch (error) {
      message.error(translate('Failed to load URL data'));
      navigate('/url');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      // Transform form data back to API format
      const updateData = {
        originalUrl: formData.originalUrl,
        title: formData.title,
        description: formData.description,
        passwordProtected: formData.isPasswordProtected,
        ...(formData.isPasswordProtected && formData.password && { password: formData.password }),
        maxClicks: formData.hasClickLimit ? formData.clickLimit : null,
        expiresAt: formData.hasExpiration ? formData.expirationDate?.toISOString() : null,
        utmSource: formData.enableUtm ? formData.utmSource : null,
        utmMedium: formData.enableUtm ? formData.utmMedium : null,
        utmCampaign: formData.enableUtm ? formData.utmCampaign : null,
        utmTerm: formData.enableUtm ? formData.utmTerm : null,
        utmContent: formData.enableUtm ? formData.utmContent : null,
        isActive: formData.isActive,
        enableAnalytics: formData.enableAnalytics
      };

      await updateUrl(id, updateData);
      message.success(translate('URL updated successfully'));
      navigate(`/url/${id}`);
    } catch (error) {
      message.error(translate('Failed to update URL'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/url/${id}`);
  };

  const handleFormDataChange = (newData) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
  };

  // Add this new method to handle complete form updates
  const handleCompleteFormDataChange = (completedData) => {
    setFormData(completedData);
  };

  const hasUnsavedChanges = () => {
    // Return false if initial data is not loaded yet
    if (!initialData || Object.keys(initialData).length === 0) {
      return false;
    }
    
    const fieldsToCheck = [
      'originalUrl', 'title', 'description', 'isPasswordProtected',
      'hasClickLimit', 'clickLimit', 'hasExpiration', 'expirationDate',
      'enableUtm', 'utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent',
      'isActive', 'enableAnalytics'
    ];
    
    return fieldsToCheck.some(field => {
      const currentValue = formData[field];
      const initialValue = initialData[field];
      
      // Handle special cases
      if (field === 'expirationDate') {
        // Both null/undefined
        if (!currentValue && !initialValue) return false;
        // One is null/undefined, other is not
        if (!currentValue || !initialValue) return true;
        // Compare dayjs values
        return dayjs(currentValue).valueOf() !== dayjs(initialValue).valueOf();
      }
      
      // Handle password field - only check if password protection is enabled and password is provided
      if (field === 'password') {
        // Don't flag password changes unless password protection is enabled and password is not empty
        if (!formData.isPasswordProtected) return false;
        return currentValue && currentValue !== '';
      }
      
      // For other fields, normalize undefined/null to appropriate default values
      const normalizedCurrent = currentValue ?? (typeof initialValue === 'boolean' ? false : '');
      const normalizedInitial = initialValue ?? (typeof currentValue === 'boolean' ? false : '');
      
      return normalizedCurrent !== normalizedInitial;
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!url) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={4}>{translate('URL not found')}</Title>
        <Button type="primary" onClick={() => navigate('/url')}>
          {translate('Back to URLs')}
        </Button>
      </div>
    );
  }

  const steps = [
    {
      title: translate('Basic Information'),
      icon: <EditOutlined />,
      content: (
        <UpdateUrlForm
          data={formData}
          onChange={handleCompleteFormDataChange}
          disabled={saving}
          initialValues={initialData}
        />
      )
    },
    {
      title: translate('UTM Parameters'),
      icon: <BarChartOutlined />,
      content: (
        <UpdateUtmBuilder
          data={formData}
          onChange={handleFormDataChange}
          disabled={saving}
          initialValues={initialData}
        />
      )
    },
    {
      title: translate('Advanced Settings'),
      icon: <SettingOutlined />,
      content: (
        <UpdateAdvancedSettings
          data={formData}
          onChange={handleFormDataChange}
          disabled={saving}
          initialValues={initialData}
        />
      )
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/url/${id}`)}
          >
            {translate('Back to URL')}
          </Button>
        </Space>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges() && (
        <Alert
          message={translate('You have unsaved changes')}
          description={translate('Make sure to save your changes before leaving this page')}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button size="small" onClick={handleSubmit} loading={saving}>
              {translate('Save Now')}
            </Button>
          }
        />
      )}

      {/* Steps Navigation */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps 
          current={currentStep} 
          onChange={setCurrentStep}
          style={{ marginBottom: '0' }}
        >
          {steps.map((step, index) => (
            <Step 
              key={index}
              title={step.title} 
              icon={step.icon}
            />
          ))}
        </Steps>
      </Card>

      {/* Current Step Content */}
      <Card>
        {steps[currentStep].content}
        
        <Divider />
        
        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>
                {translate('Previous')}
              </Button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleCancel} disabled={saving}>
              {translate('Cancel')}
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                type="primary" 
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                {translate('Next')}
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSubmit}
                disabled={!hasUnsavedChanges()}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
                }}
              >
                {translate('Update URL')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UpdateUrlModule;