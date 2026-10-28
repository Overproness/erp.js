import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Typography, Button, Tabs, Tag, Divider, Statistic, Space, Form, Input, Select, Switch, message, Modal, Radio, Tooltip, Upload } from '@/components/ui';
import { 
  ApiOutlined, 
  LinkOutlined, 
  SaveOutlined, 
  PlusOutlined,
  GoogleOutlined,
  FacebookOutlined,
  GlobalOutlined,
  CopyOutlined,
  QrcodeOutlined,
  SettingOutlined,
  StarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MailOutlined,
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CloudDownloadOutlined,
  CloseOutlined
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';
import PlatformIntegrationStatus from '@/components/ReputationComponents/PlatformIntegrationStatus';
import { QRCodeCanvas } from 'qrcode.react'; // Fixed import statement

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;  
const { TextArea } = Input;

const ReviewPortalModule = () => {
  const translate = useLanguage();
  const [activeTab, setActiveTab] = useState('settings');
  const [form] = Form.useForm();
  const [customLinkForm] = Form.useForm();
  const [emailConfigForm] = Form.useForm();
  
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);

  const fetchPlatforms = async () => {
    setLoadingPlatforms(true);
    try {
      const { request } = await import('@/request');
      const res = await request.get({ entity: 'marketing/reputation/platforms' });
      if (res?.result) {
        setPlatforms(res.result);
      }
    } catch (err) {
      console.warn('Failed to load reputation platforms:', err);
    } finally {
      setLoadingPlatforms(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  // State for modals
  const [customLinkModalVisible, setCustomLinkModalVisible] = useState(false);
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);
  const [emailConfigModalVisible, setEmailConfigModalVisible] = useState(false);
  
  // State for QR Code customization
  const [qrCodeForeground, setQrCodeForeground] = useState('#000000');
  const [qrCodeBackground, setQrCodeBackground] = useState('#FFFFFF');
  const [qrCodeSize, setQrCodeSize] = useState(200);
  const [qrCodeLogo, setQrCodeLogo] = useState(null);
  const [qrCodeIncludeLogo, setQrCodeIncludeLogo] = useState(false);
  
  // Reference for QR code download
  const qrCodeRef = useRef();
  
  // Email configuration state
  const [emailTemplate, setEmailTemplate] = useState('default');
  const [emailSubject, setEmailSubject] = useState('Please leave us a review');
  
  const handleTabChange = (key) => {
    setActiveTab(key);
  };
  
  const handleFormSubmit = (values) => {
    console.log('Form values:', values);
    // Would dispatch action or API call here
  };
  
  // Widget configuration options
  const widgetElements = [
    {
      type: 'text',
      label: translate('Header Text'),
      value: translate('Love our service? Leave a review!'),
      key: 'header'
    },
    {
      type: 'color',
      label: translate('Background Color'),
      value: '#ffffff',
      key: 'bgColor'
    },
    {
      type: 'color',
      label: translate('Text Color'),
      value: '#333333',
      key: 'textColor'
    },
    {
      type: 'select',
      label: translate('Layout'),
      options: ['horizontal', 'vertical'],
      value: 'horizontal',
      key: 'layout'
    },
    {
      type: 'divider'
    },
    {
      type: 'button',
      label: translate('Google Review'),
      url: 'https://g.page/r/review',
      icon: 'google',
      key: 'googleBtn'
    },
    {
      type: 'button',
      label: translate('Facebook Review'),
      url: 'https://facebook.com/review',
      icon: 'facebook',
      key: 'facebookBtn'
    }
  ];
  
  const handlePlatformConnect = (platformId: string) => {
    window.location.href = '/marketing/integrations';
  };

  const handlePlatformSync = async (platformId: string) => {
    try {
      setPlatforms((prev) =>
        prev.map((p) => (p.id === platformId ? { ...p, syncing: true } : p))
      );
      const { request } = await import('@/request');
      const res = await request.create({
        entity: 'marketing/reputation/sync',
        jsonData: { platforms: [platformId] },
      });
      message.success(res?.message || translate('Platform synchronized successfully'));
      await fetchPlatforms();
    } catch (err: any) {
      message.error(err?.message || translate('Failed to sync platform'));
    } finally {
      setPlatforms((prev) =>
        prev.map((p) => (p.id === platformId ? { ...p, syncing: false } : p))
      );
    }
  };

  const handlePlatformDisconnect = (platformId: string) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, connected: false } : p))
    );
    message.success(`${platformId} disconnected successfully`);
  };

  const handleViewAnalytics = () => {
    window.location.href = '/reputation/analytics';
  };

  // Get a unique portal link (would be replaced with actual generation)
  const getPortalLink = () => {
    return 'https://example.com/review/abcd1234';
  };

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPortalLink());
    message.success(translate('Link copied to clipboard'));
  };
  
  // Handle open customize link modal
  const handleCustomizeLink = () => {
    // Pre-populate form with current values
    customLinkForm.setFieldsValue({
      linkPath: 'review/abcd1234',
      linkExpiry: 'never',
      expiryDate: '',
      maxUses: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: ''
    });
    setCustomLinkModalVisible(true);
  };
  
  // Handle customize link submission
  const handleCustomLinkSubmit = (values) => {
    console.log('Customize link form values:', values);
    
    // In a real app, this would call an API to update the link
    const newLink = `https://example.com/${values.linkPath}`;
    
    // Show success message
    message.success(translate('Link customized successfully'));
    
    // Close the modal
    setCustomLinkModalVisible(false);
  };
  
  // Handle open QR code modal
  const handleGenerateQRCode = () => {
    setQrCodeModalVisible(true);
  };
  
  // Handle QR code download
  const handleQRCodeDownload = (format) => {
    if (!qrCodeRef.current) return;
    
    try {
      // Create a canvas from the QR code
      const canvas = qrCodeRef.current.querySelector('canvas');
      
      if (canvas) {
        // For PNG format
        if (format === 'png') {
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = 'review-qrcode.png';
          link.href = url;
          document.body.appendChild(link); // Needed for Firefox
          link.click();
          document.body.removeChild(link);
        }
        // For SVG format
        else if (format === 'svg') {
          const svgElement = qrCodeRef.current.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            const link = document.createElement('a');
            link.download = 'review-qrcode.svg';
            link.href = svgUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(svgUrl);
          }
        }
        
        message.success(`${translate('QR code downloaded as')} ${format.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Error downloading QR code:', err);
      message.error(translate('Failed to download QR code'));
    }
  };

  // Handle open email configuration modal
  const handleEmailConfig = () => {
    // Pre-populate form with current values
    emailConfigForm.setFieldsValue({
      emailTemplate: emailTemplate,
      emailSubject: emailSubject,
      emailSender: 'reviews@example.com',
      emailDelay: 2,
      includeLogo: true,
      customHtml: emailTemplate === 'custom' ? '<html><body>Your custom template</body></html>' : ''
    });
    setEmailConfigModalVisible(true);
  };
  
  // Handle email configuration submission
  const handleEmailConfigSubmit = (values) => {
    console.log('Email config form values:', values);
    
    // Update state with new values
    setEmailTemplate(values.emailTemplate);
    setEmailSubject(values.emailSubject);
    
    // Show success message
    message.success(translate('Email configuration saved'));
    
    // Close the modal
    setEmailConfigModalVisible(false);
  };
  
  const renderIntegrationTab = () => (
    <Card>
      {/* REMOVE: <PlatformIntegrationStatus platforms={platformStatuses} /> */}
      {/* REMOVE: Divider and Connect New Platform buttons */}
    </Card>
  );
  
  const renderWidgetTab = () => (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        initialValues={{
          widgetEnabled: true,
          widgetPosition: 'bottom-right',
          autoOpen: false,
          autoOpenDelay: 5,
          showOnMobile: true
        }}
      >
        <Form.Item
          name="widgetEnabled"
          valuePropName="checked"
          label={translate('Enable Review Widget')}
        >
          <Switch />
        </Form.Item>
        
        <Form.Item
          name="widgetPosition"
          label={translate('Widget Position')}
        >
          <Select>
            <Option value="bottom-right">{translate('Bottom Right')}</Option>
            <Option value="bottom-left">{translate('Bottom Left')}</Option>
            <Option value="top-right">{translate('Top Right')}</Option>
            <Option value="top-left">{translate('Top Left')}</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="autoOpen"
          valuePropName="checked"
          label={translate('Auto-open Widget')}
        >
          <Switch />
        </Form.Item>
        
        <Form.Item
          name="autoOpenDelay"
          label={translate('Auto-open Delay (seconds)')}
        >
          <Select>
            <Option value={5}>5 {translate('seconds')}</Option>
            <Option value={10}>10 {translate('seconds')}</Option>
            <Option value={30}>30 {translate('seconds')}</Option>
            <Option value={60}>60 {translate('seconds')}</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="showOnMobile"
          valuePropName="checked"
          label={translate('Show on Mobile Devices')}
        >
          <Switch />
        </Form.Item>
        
        <Divider>{translate('Widget Customization')}</Divider>
        
        {widgetElements.map((element, index) => (
          <div key={element.key || index}>
            {element.type === 'text' && (
              <Form.Item
                name={['widgetElements', element.key]}
                label={element.label}
                initialValue={element.value}
              >
                <Input />
              </Form.Item>
            )}
            
            {element.type === 'color' && (
              <Form.Item
                name={['widgetElements', element.key]}
                label={element.label}
                initialValue={element.value}
              >
                <Input type="color" style={{ width: '60px' }} />
              </Form.Item>
            )}
            
            {element.type === 'select' && (
              <Form.Item
                name={['widgetElements', element.key]}
                label={element.label}
                initialValue={element.value}
              >
                <Select>
                  {element.options.map(option => (
                    <Option key={option} value={option}>{option}</Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            
            {element.type === 'button' && (
              <Form.Item
                label={`${translate('Button')}: ${element.label}`}
              >
                <Space>
                  <Button
                    icon={element.icon === 'google' ? <GoogleOutlined /> : 
                          element.icon === 'facebook' ? <FacebookOutlined /> : 
                          <LinkOutlined />}
                  >
                    {element.label || 'Button'}
                  </Button>
                  
                  <Form.Item
                    name={['widgetElements', element.key, 'url']}
                    initialValue={element.url}
                    noStyle
                  >
                    <Input 
                      addonBefore={translate('URL')}
                      style={{ width: '300px' }} 
                    />
                  </Form.Item>
                </Space>
              </Form.Item>
            )}
            
            {element.type === 'divider' && (
              <Divider />
            )}
          </div>
        ))}
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />}
          >
            {translate('Save Widget Settings')}
          </Button>
        </Form.Item>
      </Form>
      
      <Divider />
      
      <h3>{translate('Widget Embed Code')}</h3>
      <Input.TextArea
        readOnly
        rows={4}
        value={`<script src="https://example.com/reviewwidget.js" id="review-widget" data-business-id="12345"></script>`}
      />
      <Button 
        style={{ marginTop: 8 }}
        icon={<CopyOutlined />}
        onClick={() => {
          navigator.clipboard.writeText(`<script src="https://example.com/reviewwidget.js" id="review-widget" data-business-id="12345"></script>`);
          message.success(translate('Copied to clipboard!'));
        }}
      >
        {translate('Copy Code')}
      </Button>
    </Card>
  );
  
  return (
    <div>
      <PlatformIntegrationStatus 
        platforms={platforms} 
        onConnect={handlePlatformConnect}
        onSync={handlePlatformSync}
        onDisconnect={handlePlatformDisconnect}
      />
      <Row gutter={[24, 24]}>
        {/* Review Portal */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <GlobalOutlined />
                {translate('Review Collection Portal')}
              </Space>
            }
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
              <TabPane 
                tab={
                  <span><SettingOutlined /> {translate('Settings')}</span>
                } 
                key="settings"
              >
                <Row gutter={[16, 24]}>
                  <Col xs={24} md={12}>
                    <Title level={5}>{translate('Portal Link')}</Title>
                    <div style={{ 
                      border: '1px solid #d9d9d9', 
                      borderRadius: '4px', 
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <Text ellipsis style={{ maxWidth: '80%' }}>{getPortalLink()}</Text>
                      <Button 
                        icon={<CopyOutlined />} 
                        type="text" 
                        onClick={handleCopyLink} 
                      />
                    </div>
                    
                    <Space>
                      <Button 
                        icon={<LinkOutlined />} 
                        type="primary" 
                        onClick={handleCustomizeLink}
                      >
                        {translate('Customize Link')}
                      </Button>
                      <Button 
                        icon={<QrcodeOutlined />}
                        onClick={handleGenerateQRCode}
                      >
                        {translate('Generate QR Code')}
                      </Button>
                    </Space>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Title level={5}>{translate('Portal Appearance')}</Title>
                    <div>
                      <Text>{translate('Logo')}:</Text>
                      <Button 
                        size="small" 
                        style={{ marginLeft: '8px' }}
                      >
                        {translate('Upload')}
                      </Button>
                    </div>
                    
                    <div style={{ marginTop: '12px' }}>
                      <Text>{translate('Theme Color')}:</Text>
                      <div 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          backgroundColor: '#1890ff',
                          display: 'inline-block',
                          margin: '0 8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }} 
                      />
                    </div>
                  </Col>

                  <Col span={24}>
                    <Title level={5}>{translate('Email Configuration')}</Title>
                    <Paragraph>
                      {translate('Configure automated emails to request reviews from your customers.')}
                    </Paragraph>
                    <Button 
                      type="primary" 
                      onClick={handleEmailConfig}
                    >
                      {translate('Configure Emails')}
                    </Button>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane 
                tab={
                  <span><StarOutlined /> {translate('Preview')}</span>
                } 
                key="preview"
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  padding: '20px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  minHeight: '400px'
                }}>
                  {/* Portal Preview */}
                  <div style={{ 
                    width: '320px', 
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      padding: '16px', 
                      borderBottom: '1px solid #f0f0f0',
                      textAlign: 'center'
                    }}>
                      <img 
                        src="https://via.placeholder.com/150x50" 
                        alt="Company Logo" 
                        style={{ maxHeight: '50px' }}
                      />
                    </div>
                    <div style={{ padding: '24px', textAlign: 'center' }}>
                      <Title level={4}>{translate('How was your experience?')}</Title>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#fadb14',
                        margin: '24px 0'
                      }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <StarOutlined key={star} style={{ margin: '0 4px' }} />
                        ))}
                      </div>
                      <Paragraph type="secondary">
                        {translate('Your feedback helps us improve our service.')}
                      </Paragraph>
                      <Button type="primary" block>
                        {translate('Submit Review')}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
        
        {/* Stats */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <StarOutlined />
                {translate('Collection Statistics')}
              </Space>
            }
          >
            <Statistic 
              title={translate('Total Reviews Collected')}
              value={5}
              prefix={<StarOutlined />}
              style={{ marginBottom: '24px' }}
            />
            
            <Divider />
            
            <Title level={5}>{translate('Last 30 Days')}</Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={translate('New Reviews')}
                  value={5}
                  prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={translate('Conversion Rate')}
                  value={75.0}
                  suffix="%"
                  prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Title level={5}>{translate('Source Breakdown')}</Title>
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Statistic
                  title={translate('Email')}
                  value={100}
                  suffix="%"
                  valueStyle={{ fontSize: '18px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={translate('QR Code')}
                  value={0}
                  suffix="%"
                  valueStyle={{ fontSize: '18px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={translate('Direct')}
                  value={0}
                  suffix="%"
                  valueStyle={{ fontSize: '18px' }}
                />
              </Col>
            </Row>
            
            <Divider />

            <Button onClick={handleViewAnalytics} type="primary" block>
              {translate('View Detailed Analytics')}
            </Button>
          </Card>
        </Col>
      </Row>
      
      {/* Customize Link Modal */}
      <Modal
        title={translate('Customize Review Portal Link')}
        open={customLinkModalVisible}
        onCancel={() => setCustomLinkModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCustomLinkModalVisible(false)}>
            {translate('Cancel')}
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => customLinkForm.submit()}
          >
            {translate('Save Changes')}
          </Button>
        ]}
      >
        <Form
          form={customLinkForm}
          layout="vertical"
          onFinish={handleCustomLinkSubmit}
        >
          <Form.Item
            name="linkPath"
            label={translate('Custom Link Path')}
            extra={translate('Customize the path of your review portal link')}
          >
            <Input 
              addonBefore="https://example.com/" 
              placeholder="review/my-business"
            />
          </Form.Item>
          
          <Form.Item
            name="linkExpiry"
            label={translate('Link Expiration')}
          >
            <Radio.Group>
              <Radio value="never">{translate('Never Expires')}</Radio>
              <Radio value="date">{translate('Specific Date')}</Radio>
              <Radio value="uses">{translate('After # Uses')}</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.linkExpiry !== currentValues.linkExpiry}
          >
            {({ getFieldValue }) => 
              getFieldValue('linkExpiry') === 'date' ? (
                <Form.Item
                  name="expiryDate"
                  label={translate('Expiry Date')}
                >
                  <Input type="date" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.linkExpiry !== currentValues.linkExpiry}
          >
            {({ getFieldValue }) => 
              getFieldValue('linkExpiry') === 'uses' ? (
                <Form.Item
                  name="maxUses"
                  label={translate('Maximum Uses')}
                >
                  <Input type="number" min={1} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          
          <Divider />
          
          <Form.Item
            name="utmSource"
            label={translate('UTM Source')}
            extra={translate('Add tracking parameters to your link')}
          >
            <Input placeholder="utm_source" />
          </Form.Item>
          
          <Form.Item
            name="utmMedium"
            label={translate('UTM Medium')}
          >
            <Input placeholder="utm_medium" />
          </Form.Item>
          
          <Form.Item
            name="utmCampaign"
            label={translate('UTM Campaign')}
          >
            <Input placeholder="utm_campaign" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* QR Code Generator Modal */}
      <Modal
        title={translate('Generate QR Code')}
        open={qrCodeModalVisible}
        onCancel={() => setQrCodeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setQrCodeModalVisible(false)}>
            {translate('Close')}
          </Button>,
          <Button 
            key="downloadPNG" 
            type="primary"
            onClick={() => handleQRCodeDownload('png')}
            icon={<DownloadOutlined />}
          >
            {translate('Download PNG')}
          </Button>,
        ]}
        width={700}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              background: '#f7f7f7',
              borderRadius: '8px',
              minHeight: '250px'
            }}>
              <div ref={qrCodeRef}>
                <QRCodeCanvas 
                  value={getPortalLink()}
                  size={qrCodeSize}
                  fgColor={qrCodeForeground}
                  bgColor={qrCodeBackground}
                  level="H"
                  imageSettings={
                    qrCodeIncludeLogo && qrCodeLogo ? {
                      src: qrCodeLogo,
                      width: qrCodeSize * 0.2,
                      height: qrCodeSize * 0.2,
                      excavate: true,
                    } : undefined
                  }
                />
              </div>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <Title level={5}>{translate('QR Code Customization')}</Title>
            <Form layout="vertical">
              <Form.Item label={translate('QR Code Size')}>
                <Select 
                  value={qrCodeSize} 
                  onChange={setQrCodeSize}
                >
                  <Option value={128}>128 x 128 px</Option>
                  <Option value={200}>200 x 200 px</Option>
                  <Option value={300}>300 x 300 px</Option>
                  <Option value={400}>400 x 400 px</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label={translate('Foreground Color')}>
                <Input 
                  type="color" 
                  value={qrCodeForeground}
                  onChange={(e) => setQrCodeForeground(e.target.value)}
                  style={{ width: '60px' }}
                />
              </Form.Item>
              
              <Form.Item label={translate('Background Color')}>
                <Input 
                  type="color" 
                  value={qrCodeBackground}
                  onChange={(e) => setQrCodeBackground(e.target.value)}
                  style={{ width: '60px' }}
                />
              </Form.Item>
              
              <Form.Item>
                <Switch 
                  checked={qrCodeIncludeLogo} 
                  onChange={setQrCodeIncludeLogo}
                /> <Text style={{ marginLeft: '8px' }}>{translate('Include Logo')}</Text>
              </Form.Item>
              
              {qrCodeIncludeLogo && (
                <Form.Item>
                  <Upload
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setQrCodeLogo(e.target.result);
                      };
                      reader.readAsDataURL(file);
                      // Return false to prevent actual upload
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />}>
                      {qrCodeLogo ? translate('Change Logo') : translate('Upload Logo')}
                    </Button>
                  </Upload>
                  
                  {qrCodeLogo && (
                    <div style={{ marginTop: '8px' }}>
                      <img 
                        src={qrCodeLogo} 
                        alt="Logo" 
                        style={{ maxHeight: '32px', maxWidth: '100%' }} 
                      />
                      <Button 
                        type="text" 
                        danger 
                        icon={<CloseOutlined />} 
                        size="small" 
                        onClick={() => setQrCodeLogo(null)}
                      />
                    </div>
                  )}
                </Form.Item>
              )}
            </Form>
          </Col>
          
          <Col span={24}>
            <Divider />
            <Paragraph>
              <InfoCircleOutlined /> {translate('The QR code will direct customers to your review portal where they can leave reviews across multiple platforms.')}
            </Paragraph>
            <Paragraph>
              <Text strong>{translate('Tip:')}</Text> {translate('Print this QR code and place it in your business location to encourage reviews.')}
            </Paragraph>
          </Col>
        </Row>
      </Modal>
      
      {/* Email Configuration Modal */}
      <Modal
        title={translate('Configure Review Request Emails')}
        open={emailConfigModalVisible}
        onCancel={() => setEmailConfigModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setEmailConfigModalVisible(false)}>
            {translate('Cancel')}
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            onClick={() => emailConfigForm.submit()}
          >
            {translate('Save Configuration')}
          </Button>
        ]}
      >
        <Form
          form={emailConfigForm}
          layout="vertical"
          onFinish={handleEmailConfigSubmit}
        >
          <Form.Item
            name="emailTemplate"
            label={translate('Email Template')}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="default">
                  {translate('Default Template')} 
                  <Text type="secondary" style={{ marginLeft: '8px' }}>{translate('Standard review request email')}</Text>
                </Radio>
                <Radio value="minimalist">
                  {translate('Minimalist')} 
                  <Text type="secondary" style={{ marginLeft: '8px' }}>{translate('Simple, clean design with minimal text')}</Text>
                </Radio>
                <Radio value="branded">
                  {translate('Branded')} 
                  <Text type="secondary" style={{ marginLeft: '8px' }}>{translate('Fully customizable with your brand colors')}</Text>
                </Radio>
                <Radio value="custom">
                  {translate('Custom HTML')} 
                  <Text type="secondary" style={{ marginLeft: '8px' }}>{translate('Create your own HTML template')}</Text>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="emailSubject"
                label={translate('Email Subject')}
                rules={[{ required: true, message: translate('Please enter email subject') }]}
              >
                <Input placeholder={translate('Please leave us a review')} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="emailSender"
                label={translate('From Email Address')}
                rules={[{ type: 'email', message: translate('Please enter valid email') }]}
              >
                <Input placeholder="reviews@yourbusiness.com" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="emailDelay"
                label={translate('Days After Transaction')}
                tooltip={translate('Number of days to wait after a transaction before sending the review request')}
              >
                <Select>
                  <Option value={0}>{translate('Same Day')}</Option>
                  <Option value={1}>1 {translate('day')}</Option>
                  <Option value={2}>2 {translate('days')}</Option>
                  <Option value={3}>3 {translate('days')}</Option>
                  <Option value={5}>5 {translate('days')}</Option>
                  <Option value={7}>7 {translate('days')}</Option>
                  <Option value={14}>14 {translate('days')}</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="includeLogo"
                label={translate('Include Logo')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.emailTemplate !== currentValues.emailTemplate}
          >
            {({ getFieldValue }) => 
              getFieldValue('emailTemplate') === 'custom' ? (
                <Form.Item
                  name="customHtml"
                  label={translate('Custom HTML Template')}
                >
                  <TextArea rows={6} placeholder="<html><body>Your custom email template...</body></html>" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          
          <Divider />
          
          <Title level={5}>{translate('Email Preview')}</Title>
          <div style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: '4px', 
            padding: '16px',
            background: '#f9f9f9',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="https://via.placeholder.com/150x50" 
              alt="Logo" 
              style={{ marginBottom: '16px' }}
            />
            <Title level={5}>
              {emailSubject || translate('Please leave us a review')}
            </Title>
            <Paragraph>
              {translate('Thank you for your recent visit! We would love to hear your feedback.')}
            </Paragraph>
            <Button type="primary">
              {translate('Leave a Review')}
            </Button>
          </div>
          
          <Form.Item style={{ marginTop: '16px' }}>
            <Button type="default" icon={<MailOutlined />}>
              {translate('Send Test Email')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewPortalModule;