import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber,
  Switch,
  Row,
  Col,
  Button,
  Space
} from '@/components/ui';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import urlConfig from '../config/urlConfig';

const { Option } = Select;
const { RangePicker } = DatePicker;

const UrlFilters = ({ onFilterChange }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({});

  const handleFilterChange = (changedValues, allValues) => {
    setFilters(allValues);
    onFilterChange(allValues);
  };

  const handleClearFilters = () => {
    form.resetFields();
    setFilters({});
    onFilterChange({});
  };

  return (
    <Card title={<><FilterOutlined /> {translate('Advanced Filters')}</>} size="small">
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFilterChange}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="domain"
              label={translate('Domain')}
            >
              <Input placeholder={translate('Filter by domain')} />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="tags"
              label={translate('Tags')}
            >
              <Select
                mode="multiple"
                placeholder={translate('Select tags')}
                allowClear
              >
                <Option value="utm">{translate('UTM Tagged')}</Option>
                <Option value="password">{translate('Password Protected')}</Option>
                <Option value="custom">{translate('Custom Short Code')}</Option>
                <Option value="scheduled">{translate('Scheduled')}</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="clickRange"
              label={translate('Click Count Range')}
            >
              <InputNumber.Group compact>
                <Form.Item name={['clickRange', 'min']} noStyle>
                  <InputNumber placeholder="Min" style={{ width: '50%' }} />
                </Form.Item>
                <Form.Item name={['clickRange', 'max']} noStyle>
                  <InputNumber placeholder="Max" style={{ width: '50%' }} />
                </Form.Item>
              </InputNumber.Group>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="expirationDate"
              label={translate('Expiration Date')}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col xs={24} sm={8} md={6}>
            <Form.Item
              name="hasPassword"
              label={translate('Password Protected')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <Form.Item
              name="hasClickLimit"
              label={translate('Has Click Limit')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <Form.Item
              name="hasExpiration"
              label={translate('Has Expiration')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <Form.Item
              name="hasUtmParams"
              label={translate('Has UTM Parameters')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        
        <Row justify="end">
          <Space>
            <Button onClick={handleClearFilters} icon={<ClearOutlined />}>
              {translate('Clear Filters')}
            </Button>
            <Button type="primary">
              {translate('Apply Filters')}
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};

export default UrlFilters;
