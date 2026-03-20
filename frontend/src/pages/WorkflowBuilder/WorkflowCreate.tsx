import useLanguage from '@/locale/useLanguage';
import { Button, Card, Layout, message, Typography } from 'antd';
import { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import WorkflowCanvas from '../../components/Workflow/WorkflowCanvas';
import WorkflowSidebar from '../../components/Workflow/WorkflowSidebar';

const { Content, Sider } = Layout;
const { Title } = Typography;

const WorkflowCreate = () => {
  const translate = useLanguage();
  const [workflow, setWorkflow] = useState({
    nodes: [],
    edges: [],
  });

  // Function to handle template selection
  const handleTemplateSelect = (template) => {
    if (template && template.nodes && template.edges) {
      setTimeout(() => {
        setWorkflow({
          nodes: [...template.nodes],
          edges: [...template.edges],
        });
        message.success(`${template.name} template loaded successfully!`);
      }, 100);
    } else {
      message.error('Invalid template format');
    }
  };

  // Function to save the workflow (to be implemented)
  const handleSaveWorkflow = () => {
    message.info('Save workflow functionality coming soon!');
    // Here you would implement the saving of the workflow to the backend
  };

  return (
    <div
      style={{
        padding: '16px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#fafbfc',
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {translate('Create Workflow')}
          </Title>
          <Button type="primary" onClick={handleSaveWorkflow}>
            {translate('Save Workflow')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '16px',
          overflow: 'hidden',
          height: 'calc(100vh - 120px)',
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: '280px',
            height: '100%',
            background: '#fafafa',
            border: '1px solid #e8e8e8',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #e8e8e8',
              flexShrink: 0,
            }}
          >
            <Title
              level={5}
              style={{
                color: '#2c2c2c',
                margin: 0,
                fontSize: '14px',
              }}
            >
              {translate('Workflow Templates')}
            </Title>
          </div>
          <div
            style={{
              flex: 1,
              height: 'calc(100% - 60px)',
              overflow: 'hidden',
            }}
          >
            <WorkflowSidebar onTemplateSelect={handleTemplateSelect} />
          </div>
        </div>

        {/* Canvas */}
        <div
          style={{
            flex: 1,
            height: '100%',
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <ReactFlowProvider>
            <WorkflowCanvas workflow={workflow} setWorkflow={setWorkflow} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCreate;
