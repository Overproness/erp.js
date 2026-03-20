import React, { useState } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Modal,
  Form,
  Input,
  Select,
  Steps,
  Alert
} from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SettingOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Title, Text } = Typography;
const { Step } = Steps;

const ProcessingWorkflows = () => {
  const translate = useLanguage();
  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: 'Invoice Processing Pipeline',
      description: 'OCR → Data Extraction → Validation → ERP Integration',
      status: 'active',
      steps: ['OCR Processing', 'Data Extraction', 'Validation', 'ERP Integration'],
      triggerType: 'automatic',
      processedCount: 245,
    },
    {
      id: 2,
      name: 'Receipt Analysis Workflow',
      description: 'Scan receipts and extract expense data',
      status: 'active',
      steps: ['OCR Processing', 'Expense Categorization', 'Approval Routing'],
      triggerType: 'manual',
      processedCount: 156,
    },
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [form] = Form.useForm();

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    form.setFieldsValue(workflow);
    setModalVisible(true);
  };

  const handleSaveWorkflow = (values) => {
    if (editingWorkflow) {
      setWorkflows(prev => prev.map(w => 
        w.id === editingWorkflow.id ? { ...w, ...values } : w
      ));
    } else {
      const newWorkflow = {
        id: Date.now(),
        ...values,
        status: 'active',
        processedCount: 0,
      };
      setWorkflows(prev => [...prev, newWorkflow]);
    }
    setModalVisible(false);
  };

  const handleRunWorkflow = (workflowId) => {
    console.log('Running workflow:', workflowId);
    // Implement workflow execution
  };

  return (
    <div>
      <Alert
        message={translate('Processing Workflows')}
        description={translate('Create and manage automated data processing pipelines that combine OCR, data extraction, and business logic.')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title={<><SettingOutlined /> {translate('Workflows')}</>}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateWorkflow}
          >
            {translate('Create Workflow')}
          </Button>
        }
      >
        <List
          dataSource={workflows}
          renderItem={(workflow) => (
            <List.Item
              actions={[
                <Button 
                  key="run"
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleRunWorkflow(workflow.id)}
                >
                  {translate('Run')}
                </Button>,
                <Button 
                  key="edit"
                  icon={<EditOutlined />}
                  onClick={() => handleEditWorkflow(workflow)}
                >
                  {translate('Edit')}
                </Button>,
                <Button 
                  key="delete"
                  icon={<DeleteOutlined />}
                  danger
                >
                  {translate('Delete')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{workflow.name}</span>
                    <Tag color={workflow.status === 'active' ? 'green' : 'red'}>
                      {translate(workflow.status)}
                    </Tag>
                    <Tag color="blue">
                      {workflow.processedCount} {translate('processed')}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text>{workflow.description}</Text>
                    <br />
                    <Steps size="small" style={{ marginTop: 8 }}>
                      {workflow.steps.map((step, index) => (
                        <Step key={index} title={step} status="finish" />
                      ))}
                    </Steps>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingWorkflow ? translate('Edit Workflow') : translate('Create Workflow')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveWorkflow}
        >
          <Form.Item
            name="name"
            label={translate('Workflow Name')}
            rules={[{ required: true }]}
          >
            <Input placeholder={translate('Enter workflow name')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={translate('Description')}
          >
            <Input.TextArea 
              rows={3}
              placeholder={translate('Describe what this workflow does')} 
            />
          </Form.Item>

          <Form.Item
            name="triggerType"
            label={translate('Trigger Type')}
            rules={[{ required: true }]}
          >
            <Select placeholder={translate('Select trigger type')}>
              <Select.Option value="automatic">Automatic</Select.Option>
              <Select.Option value="manual">Manual</Select.Option>
              <Select.Option value="scheduled">Scheduled</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="steps"
            label={translate('Processing Steps')}
          >
            <Select
              mode="tags"
              placeholder={translate('Add processing steps')}
              style={{ width: '100%' }}
            >
              <Select.Option value="OCR Processing">OCR Processing</Select.Option>
              <Select.Option value="Data Extraction">Data Extraction</Select.Option>
              <Select.Option value="Validation">Validation</Select.Option>
              <Select.Option value="ERP Integration">ERP Integration</Select.Option>
              <Select.Option value="Approval Routing">Approval Routing</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProcessingWorkflows;
