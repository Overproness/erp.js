import { request } from '@/request';
import { BarChartOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Steps,
  Tag,
} from 'antd';
import { useState } from 'react';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

export default function CustomReportBuilder({ visible, onClose }) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedVisualizations, setSelectedVisualizations] = useState([]);

  const modules = [
    { label: 'CRM', value: 'crm' },
    { label: 'Sales', value: 'sales' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Reputation', value: 'reputation' },
    { label: 'Tasks', value: 'tasks' },
    { label: 'Documents', value: 'documents' },
  ];

  const visualizationTypes = [
    { label: 'Line Chart', value: 'line' },
    { label: 'Bar Chart', value: 'bar' },
    { label: 'Pie Chart', value: 'pie' },
    { label: 'Area Chart', value: 'area' },
    { label: 'Table', value: 'table' },
    { label: 'Statistics Cards', value: 'cards' },
  ];

  const handleNext = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const reportConfig = {
        name: values.reportName,
        description: values.description,
        modules: selectedModules,
        visualizations: selectedVisualizations,
        filters: {
          dateRange: values.dateRange || 'last30days',
          groupBy: values.groupBy,
        },
      };

      const response = await request.post('/global-analytics/reports/create', reportConfig);

      if (response.success) {
        message.success('Custom report created successfully!');
        handleClose();
      } else {
        message.error('Failed to create report');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      message.error('An error occurred while creating the report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setCurrentStep(0);
    setSelectedModules([]);
    setSelectedVisualizations([]);
    onClose();
  };

  const steps = [
    {
      title: 'Basic Info',
      icon: <FileTextOutlined />,
    },
    {
      title: 'Select Modules',
      icon: <BarChartOutlined />,
    },
    {
      title: 'Visualizations',
      icon: <CheckCircleOutlined />,
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Form.Item
              name="reportName"
              label="Report Name"
              rules={[{ required: true, message: 'Please enter a report name' }]}
            >
              <Input placeholder="e.g., Monthly Sales Overview" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Describe what this report will show..." />
            </Form.Item>
            <Form.Item name="dateRange" label="Default Date Range" initialValue="last30days">
              <Select>
                <Option value="last7days">Last 7 Days</Option>
                <Option value="last30days">Last 30 Days</Option>
                <Option value="last90days">Last 90 Days</Option>
                <Option value="thisMonth">This Month</Option>
                <Option value="lastMonth">Last Month</Option>
                <Option value="thisYear">This Year</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 1:
        return (
          <>
            <div style={{ marginBottom: '16px', fontWeight: 500 }}>
              Select the modules you want to include in this report:
            </div>
            <Checkbox.Group
              style={{ width: '100%' }}
              onChange={setSelectedModules}
              value={selectedModules}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {modules.map((module) => (
                  <Card key={module.value} size="small" hoverable>
                    <Checkbox value={module.value}>
                      <strong>{module.label}</strong>
                    </Checkbox>
                  </Card>
                ))}
              </Space>
            </Checkbox.Group>
            <Form.Item name="groupBy" label="Group Data By" style={{ marginTop: '24px' }}>
              <Select placeholder="Select grouping">
                <Option value="day">Day</Option>
                <Option value="week">Week</Option>
                <Option value="month">Month</Option>
                <Option value="quarter">Quarter</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 2:
        return (
          <>
            <p style={{ marginBottom: '16px' }}>Choose how you want to visualize the data:</p>
            <Checkbox.Group
              style={{ width: '100%' }}
              onChange={setSelectedVisualizations}
              value={selectedVisualizations}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {visualizationTypes.map((viz) => (
                  <Card key={viz.value} size="small" hoverable>
                    <Checkbox value={viz.value}>
                      <strong>{viz.label}</strong>
                    </Checkbox>
                  </Card>
                ))}
              </Space>
            </Checkbox.Group>

            <Card title="Summary" style={{ marginTop: '24px', background: '#f0f2f5' }} size="small">
              <p>
                <strong>Selected Modules:</strong>
              </p>
              <div style={{ marginBottom: '12px' }}>
                {selectedModules.map((mod) => (
                  <Tag key={mod} color="blue">
                    {mod.toUpperCase()}
                  </Tag>
                ))}
              </div>
              <p>
                <strong>Visualizations:</strong>
              </p>
              <div>
                {selectedVisualizations.map((viz) => (
                  <Tag key={viz} color="green">
                    {viz}
                  </Tag>
                ))}
              </div>
            </Card>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title="Custom Report Builder"
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={null}
    >
      <Steps current={currentStep} style={{ marginBottom: '24px' }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Form form={form} layout="vertical">
        {renderStepContent()}
      </Form>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Space>
          {currentStep > 0 && <Button onClick={handlePrev}>Previous</Button>}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={selectedModules.length === 0 || selectedVisualizations.length === 0}
            >
              Create Report
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
}
