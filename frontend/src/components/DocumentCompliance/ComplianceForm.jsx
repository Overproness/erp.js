import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import {
  InfoCircleOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ShieldOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function ComplianceForm({ documentId, data, onSaved }) {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [gdprEnabled, setGdprEnabled] = useState(false);
  const [hipaaEnabled, setHipaaEnabled] = useState(false);

  const { isLoading } = useSelector((state) => state.erp.updateCompliance);

  useEffect(() => {
    if (data) {
      // Format data for form
      const formData = {
        complianceStatus: data.complianceStatus || 'review_required',
        containsSensitiveData: data.containsSensitiveData || false,
        dataClassification: data.dataClassification || 'unclassified',
        'dataRetention.policy': data.dataRetention?.policy || 'standard',
        'dataRetention.expirationDate': data.dataRetention?.expirationDate
          ? dayjs(data.dataRetention.expirationDate)
          : null,
        'dataRetention.autoDeleteEnabled': data.dataRetention?.autoDeleteEnabled || false,
      };

      // GDPR specific fields
      if (data.regulations?.gdpr) {
        setGdprEnabled(data.regulations.gdpr.applicable || false);
        formData['regulations.gdpr.status'] = data.regulations.gdpr.status || 'review_required';
        formData['regulations.gdpr.details'] = data.regulations.gdpr.details || '';
        formData['regulations.gdpr.reviewDate'] = data.regulations.gdpr.reviewDate
          ? dayjs(data.regulations.gdpr.reviewDate)
          : null;
      }

      // HIPAA specific fields
      if (data.regulations?.hipaa) {
        setHipaaEnabled(data.regulations.hipaa.applicable || false);
        formData['regulations.hipaa.status'] = data.regulations.hipaa.status || 'review_required';
        formData['regulations.hipaa.details'] = data.regulations.hipaa.details || '';
        formData['regulations.hipaa.reviewDate'] = data.regulations.hipaa.reviewDate
          ? dayjs(data.regulations.hipaa.reviewDate)
          : null;
      }

      form.setFieldsValue(formData);
    }
  }, [data, form]);

  const onFinish = async (values) => {
    // Format form values for API
    const payload = {
      complianceStatus: values.complianceStatus,
      containsSensitiveData: values.containsSensitiveData,
      dataClassification: values.dataClassification,
      dataRetention: {
        policy: values['dataRetention.policy'],
        expirationDate: values['dataRetention.expirationDate']?.toISOString(),
        autoDeleteEnabled: values['dataRetention.autoDeleteEnabled'],
      },
      regulations: {
        gdpr: {
          applicable: gdprEnabled,
          status: values['regulations.gdpr.status'],
          details: values['regulations.gdpr.details'],
          reviewDate: values['regulations.gdpr.reviewDate']?.toISOString(),
        },
        hipaa: {
          applicable: hipaaEnabled,
          status: values['regulations.hipaa.status'],
          details: values['regulations.hipaa.details'],
          reviewDate: values['regulations.hipaa.reviewDate']?.toISOString(),
        },
      },
    };

    try {
      await dispatch(erp.updateDocumentCompliance({ id: documentId, jsonData: payload }));
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error('Error updating compliance:', error);
    }
  };

  return (
    <Card className="compliance-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          complianceStatus: 'review_required',
          containsSensitiveData: false,
          dataClassification: 'unclassified',
          'dataRetention.policy': 'standard',
          'dataRetention.autoDeleteEnabled': false,
          'regulations.gdpr.status': 'review_required',
          'regulations.hipaa.status': 'review_required',
        }}
      >
        <Title level={4}>
          <ShieldOutlined /> {translate('Compliance Settings')}
        </Title>

        <Alert
          message={translate('Compliance Information')}
          description={translate(
            'Configure document compliance settings to meet regulatory requirements and organizational policies. This helps in maintaining proper document governance.'
          )}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="complianceStatus"
          label={translate('Overall Compliance Status')}
          tooltip={translate('The overall compliance status of this document')}
        >
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="compliant">{translate('Compliant')}</Radio.Button>
            <Radio.Button value="non_compliant">{translate('Non Compliant')}</Radio.Button>
            <Radio.Button value="review_required">{translate('Review Required')}</Radio.Button>
            <Radio.Button value="exempt">{translate('Exempt')}</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="containsSensitiveData"
          label={translate('Contains Sensitive Data')}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="dataClassification"
          label={translate('Data Classification')}
          tooltip={translate(
            'Indicates the level of sensitivity and protection required for this document'
          )}
        >
          <Select>
            <Option value="public">{translate('Public')}</Option>
            <Option value="internal">{translate('Internal')}</Option>
            <Option value="confidential">{translate('Confidential')}</Option>
            <Option value="restricted">{translate('Restricted')}</Option>
            <Option value="unclassified">{translate('Unclassified')}</Option>
          </Select>
        </Form.Item>

        <Divider orientation="left">{translate('Data Retention')}</Divider>

        <Form.Item name="dataRetention.policy" label={translate('Retention Policy')}>
          <Select>
            <Option value="standard">{translate('Standard (7 years)')}</Option>
            <Option value="extended">{translate('Extended (10+ years)')}</Option>
            <Option value="short">{translate('Short-term (1-3 years)')}</Option>
            <Option value="permanent">{translate('Permanent')}</Option>
            <Option value="custom">{translate('Custom')}</Option>
          </Select>
        </Form.Item>

        <Form.Item name="dataRetention.expirationDate" label={translate('Expiration Date')}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="dataRetention.autoDeleteEnabled"
          label={translate('Auto-Delete on Expiration')}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider orientation="left">{translate('Regulatory Compliance')}</Divider>

        {/* GDPR Section */}
        <Card
          title={
            <Space>
              <SafetyCertificateOutlined />
              <span>{translate('GDPR')}</span>
              <Tooltip title={translate('General Data Protection Regulation')}>
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          }
          className="compliance-regulation-card"
          extra={
            <Form.Item name="gdprSwitch" valuePropName="checked" noStyle>
              <Switch
                checked={gdprEnabled}
                onChange={setGdprEnabled}
                checkedChildren={translate('Applicable')}
                unCheckedChildren={translate('N/A')}
              />
            </Form.Item>
          }
        >
          {gdprEnabled && (
            <>
              <Form.Item name="regulations.gdpr.status" label={translate('GDPR Status')}>
                <Select>
                  <Option value="compliant">{translate('Compliant')}</Option>
                  <Option value="non_compliant">{translate('Non-Compliant')}</Option>
                  <Option value="review_required">{translate('Review Required')}</Option>
                  <Option value="exempt">{translate('Exempt')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="regulations.gdpr.details"
                label={translate('GDPR Compliance Details')}
              >
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item name="regulations.gdpr.reviewDate" label={translate('Next Review Date')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
        </Card>

        {/* HIPAA Section */}
        <Card
          title={
            <Space>
              <LockOutlined />
              <span>{translate('HIPAA')}</span>
              <Tooltip title={translate('Health Insurance Portability and Accountability Act')}>
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          }
          className="compliance-regulation-card"
          style={{ marginTop: 16 }}
          extra={
            <Form.Item name="hipaaSwitch" valuePropName="checked" noStyle>
              <Switch
                checked={hipaaEnabled}
                onChange={setHipaaEnabled}
                checkedChildren={translate('Applicable')}
                unCheckedChildren={translate('N/A')}
              />
            </Form.Item>
          }
        >
          {hipaaEnabled && (
            <>
              <Form.Item name="regulations.hipaa.status" label={translate('HIPAA Status')}>
                <Select>
                  <Option value="compliant">{translate('Compliant')}</Option>
                  <Option value="non_compliant">{translate('Non-Compliant')}</Option>
                  <Option value="review_required">{translate('Review Required')}</Option>
                  <Option value="exempt">{translate('Exempt')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="regulations.hipaa.details"
                label={translate('HIPAA Compliance Details')}
              >
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item name="regulations.hipaa.reviewDate" label={translate('Next Review Date')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
        </Card>

        <Divider />

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            {translate('Save Compliance Settings')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
