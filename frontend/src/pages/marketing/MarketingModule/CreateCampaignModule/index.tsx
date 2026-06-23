import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  Tabs, 
  Radio, 
  Checkbox,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Upload,
  message,
  Space,
  InputNumber,
  Switch,
  Empty
} from '@/components/ui';
import {
  MailOutlined,
  UserOutlined,
  FileTextOutlined,
  SendOutlined,
  PictureOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';
import { RichTextEditor } from '@/components/common/RichTextEditor';

// Redux actions and selectors
import { fetchSegments } from '@/redux/marketing/marketingSlice';
import { selectSegments } from '@/redux/marketing/selectors';

// Campaign Form Components
import CampaignBasicInfo from './Steps/CampaignBasicInfo';
import CampaignAudience from './Steps/CampaignAudience';
import CampaignContent from './Steps/CampaignContent';
import CampaignChannels from './Steps/CampaignChannels';
import CampaignReview from './Steps/CampaignReview';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CreateCampaignModule = ({ currentStep, formData, onUpdateFormData }) => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  
  // Redux state
  const segments = useSelector(selectSegments);

  useEffect(() => {
    dispatch(fetchSegments());
  }, [dispatch]);

  useEffect(() => {
    if (formData) {
      form.setFieldsValue(formData);
    }
  }, [form, formData]);

  // Form field change handler
  const handleFormChange = (changedValues, allValues) => {
    onUpdateFormData(allValues);
  };

  // Step components with corresponding form sections
  const steps = [
    {
      key: 'basic',
      component: (
        <CampaignBasicInfo 
          form={form} 
          formData={formData} 
          onChange={handleFormChange} 
        />
      )
    },
    {
      key: 'audience',
      component: (
        <CampaignAudience 
          form={form} 
          formData={formData} 
          segments={segments} 
          onChange={handleFormChange} 
        />
      )
    },
    {
      key: 'content',
      component: (
        <CampaignContent 
          form={form} 
          formData={formData} 
          onChange={handleFormChange} 
        />
      )
    },
    {
      key: 'channels',
      component: (
        <CampaignChannels 
          form={form} 
          formData={formData} 
          onChange={handleFormChange} 
        />
      )
    },
    {
      key: 'review',
      component: (
        <CampaignReview 
          formData={formData} 
          segments={segments}
        />
      )
    }
  ];

  return (
    <div>
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
            body: ''
          }
        }}
      >
        {steps[currentStep].component}
      </Form>
    </div>
  );
};

export default CreateCampaignModule;
