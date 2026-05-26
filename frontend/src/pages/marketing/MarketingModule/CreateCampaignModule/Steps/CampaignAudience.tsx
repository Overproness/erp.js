import React, { useState } from 'react';
import { 
  Form, 
  Select, 
  Card,
  Row,
  Col,
  Typography,
  Radio,
  Input,
  Divider,
  Tag,
  Button,
  Space,
  Table,
  Checkbox,
  Progress,
  Empty
} from '@/components/ui';
import { 
  TeamOutlined, 
  UserAddOutlined, 
  FilterOutlined, 
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CampaignAudience = ({ form, formData, segments, onChange }) => {
  const translate = useLanguage();
  const [audienceType, setAudienceType] = useState(formData?.audienceType || 'segment');
  const [searchText, setSearchText] = useState('');

  const handleAudienceTypeChange = (e) => {
    setAudienceType(e.target.value);
    
    // Clear previous selections when changing audience type
    if (e.target.value === 'segment') {
      form.setFieldsValue({ customAudience: undefined });
    } else {
      form.setFieldsValue({ segmentIds: [] });
    }
  };

  const filteredSegments = segments?.filter(segment => 
    segment.name.toLowerCase().includes(searchText.toLowerCase()) ||
    segment.description?.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  const columns = [
    {
      title: translate('Segment'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {record.description.length > 60 ? record.description.substring(0, 60) + '...' : record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: translate('Audience Size'),
      dataIndex: 'count',
      key: 'count',
      width: 150,
      render: (count) => count?.toLocaleString() || '0',
    },
    {
      title: translate('Match'),
      dataIndex: 'match',
      key: 'match',
      width: 120,
      render: (match) => (
        <Progress 
          percent={match || 0} 
          size="small" 
          status="active" 
          strokeColor="#8b5cf6"
          format={(percent) => `${percent}%`}
        />
      )
    }
  ];

  // Row selection config for the segments table
  const rowSelection = {
    selectedRowKeys: formData?.segmentIds || [],
    onChange: (selectedRowKeys) => {
      form.setFieldsValue({ segmentIds: selectedRowKeys });
      onChange({ segmentIds: selectedRowKeys }, form.getFieldsValue());
    }
  };

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4}>{translate('Target Audience')}</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        {translate('Select who will receive this campaign')}
      </Text>

      <Form.Item name="audienceType" initialValue={audienceType}>
        <Radio.Group onChange={handleAudienceTypeChange} value={audienceType}>
          <Radio value="segment">{translate('Use Audience Segments')}</Radio>
          <Radio value="custom">{translate('Custom Audience')}</Radio>
        </Radio.Group>
      </Form.Item>

      {audienceType === 'segment' ? (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <Input
              placeholder={translate('Search segments')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {/* Open segment creator */}}
            >
              {translate('Create Segment')}
            </Button>
          </div>

          <Form.Item
            name="segmentIds"
            rules={[
              {
                required: audienceType === 'segment',
                message: translate('Please select at least one audience segment'),
              },
            ]}
          >
            {segments?.length > 0 ? (
              <Table
                rowKey="id"
                rowSelection={rowSelection}
                columns={columns}
                dataSource={filteredSegments}
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    {translate('No audience segments available')}
                  </span>
                }
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => {/* Open segment creator */}}
                >
                  {translate('Create Segment')}
                </Button>
              </Empty>
            )}
          </Form.Item>

          {formData?.segmentIds?.length > 0 && (
            <Card size="small" style={{ backgroundColor: '#f9fafb', marginTop: '16px' }}>
              <Space align="center">
                <TeamOutlined />
                <Text>
                  {translate('Selected audience size: ')}
                  <Text strong>{formData.segmentIds.length > 0 
                    ? segments
                      .filter(s => formData.segmentIds.includes(s.id))
                      .reduce((sum, segment) => sum + (segment.count || 0), 0)
                      .toLocaleString()
                    : '0'
                  }</Text> 
                  {translate(' contacts')}
                </Text>
              </Space>
            </Card>
          )}
        </>
      ) : (
        <div>
          <Form.Item
            name={['customAudience', 'criteria']}
            label={translate('Audience Criteria')}
            rules={[
              {
                required: audienceType === 'custom',
                message: translate('Please define audience criteria'),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={translate('Select criteria')}
              style={{ width: '100%' }}
              options={[
                { label: translate('Recent website visitors'), value: 'recent_visitors' },
                { label: translate('Cart abandoners'), value: 'cart_abandoners' },
                { label: translate('Recent purchasers'), value: 'recent_purchasers' },
                { label: translate('High-value customers'), value: 'high_value' },
                { label: translate('Newsletter subscribers'), value: 'newsletter' },
              ]}
            />
          </Form.Item>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name={['customAudience', 'locations']}
                label={translate('Locations')}
              >
                <Select
                  mode="tags"
                  placeholder={translate('Enter locations')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name={['customAudience', 'languages']}
                label={translate('Languages')}
              >
                <Select
                  mode="multiple"
                  placeholder={translate('Select languages')}
                  style={{ width: '100%' }}
                  options={[
                    { label: 'English', value: 'en' },
                    { label: 'Spanish', value: 'es' },
                    { label: 'French', value: 'fr' },
                    { label: 'German', value: 'de' },
                    { label: 'Japanese', value: 'ja' },
                    { label: 'Chinese', value: 'zh' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name={['customAudience', 'ageRange']}
            label={translate('Age Range')}
          >
            <Select
              mode="multiple"
              placeholder={translate('Select age ranges')}
              style={{ width: '100%' }}
              options={[
                { label: '18-24', value: '18-24' },
                { label: '25-34', value: '25-34' },
                { label: '35-44', value: '35-44' },
                { label: '45-54', value: '45-54' },
                { label: '55-64', value: '55-64' },
                { label: '65+', value: '65+' },
              ]}
            />
          </Form.Item>
          
          <Form.Item
            name={['customAudience', 'interests']}
            label={translate('Interests')}
          >
            <Select
              mode="tags"
              placeholder={translate('Add interests')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name={['customAudience', 'saveAsSegment']}
            valuePropName="checked"
          >
            <Checkbox>
              {translate('Save this audience as a segment for future campaigns')}
            </Checkbox>
          </Form.Item>
        </div>
      )}
    </Card>
  );
};

export default CampaignAudience;
