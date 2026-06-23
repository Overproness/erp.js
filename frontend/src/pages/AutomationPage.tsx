import {
  ApiOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  PlayCircleOutlined,
  SettingOutlined,
} from '@/components/icons';
import { Card, Layout, Menu, Space, Tag, Typography } from '@/components/ui';
import { useState } from 'react';
import N8nWorkflowManager from '../components/N8nWorkflowManager';
import DashboardLayout from '../layout/DashboardLayout';

const { Content, Sider } = Layout;
const { Title, Paragraph } = Typography;

const AutomationPage = () => {
  const [selectedSection, setSelectedSection] = useState('workflows');

  const menuItems = [
    {
      key: 'workflows',
      icon: <SettingOutlined />,
      label: 'Workflow Builder',
    },
    {
      key: 'executions',
      icon: <PlayCircleOutlined />,
      label: 'Executions',
    },
    {
      key: 'connections',
      icon: <ApiOutlined />,
      label: 'Connections',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case 'workflows':
        return <N8nWorkflowManager />;
      case 'executions':
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <CloudServerOutlined style={{ fontSize: '3rem', color: '#1890ff' }} />
              <Title level={3}>Workflow Executions</Title>
              <Paragraph>
                View and monitor your workflow execution history. This section will show detailed
                logs and execution results from your automated workflows.
              </Paragraph>
              <Tag color="blue">Coming Soon</Tag>
            </div>
          </Card>
        );
      case 'connections':
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <ApiOutlined style={{ fontSize: '3rem', color: '#52c41a' }} />
              <Title level={3}>External Connections</Title>
              <Paragraph>
                Manage your connections to external services like databases, APIs, email services,
                and other third-party integrations.
              </Paragraph>
              <Tag color="green">Available in n8n</Tag>
            </div>
          </Card>
        );
      case 'analytics':
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <BarChartOutlined style={{ fontSize: '3rem', color: '#722ed1' }} />
              <Title level={3}>Automation Analytics</Title>
              <Paragraph>
                Analyze the performance of your workflows, execution times, success rates, and
                identify optimization opportunities.
              </Paragraph>
              <Tag color="purple">Coming Soon</Tag>
            </div>
          </Card>
        );
      default:
        return <N8nWorkflowManager />;
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '1rem' }}>
        <Card size="small" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                <SettingOutlined style={{ marginRight: '0.5rem' }} />
                Workflow Automation
              </Title>
              <Paragraph style={{ margin: 0, marginTop: '0.5rem' }}>
                Create, manage, and monitor automated workflows with n8n integration
              </Paragraph>
            </div>
            <Space>
              <Tag color="blue">Beta</Tag>
              <Tag color="green">Company Isolated</Tag>
            </Space>
          </div>
        </Card>

        <Layout style={{ minHeight: 'calc(100vh - 200px)' }}>
          <Sider
            width={250}
            style={{
              background: '#fff',
              borderRadius: '6px',
              marginRight: '1rem',
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedSection]}
              style={{ height: '100%', borderRight: 0 }}
              items={menuItems}
              onClick={({ key }) => setSelectedSection(key)}
            />
          </Sider>
          <Content>{renderContent()}</Content>
        </Layout>
      </div>
    </DashboardLayout>
  );
};

export default AutomationPage;
