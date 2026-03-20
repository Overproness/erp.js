import useLanguage from '@/locale/useLanguage';
import { Button, Card, Layout, message, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import WorkflowCanvas from '../../components/Workflow/WorkflowCanvas';
import WorkflowSidebar from '../../components/Workflow/WorkflowSidebar';

const { Content, Sider } = Layout;
const { Title } = Typography;

const WorkflowEdit = () => {
  const translate = useLanguage();
  const { id } = useParams();
  const [workflow, setWorkflow] = useState({
    nodes: [],
    edges: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch workflow data based on ID
  useEffect(() => {
    // Mock fetch - replace with actual API call
    setLoading(true);
    setTimeout(() => {
      // Replace with actual API data
      const mockWorkflow = {
        id,
        name: `Workflow ${id}`,
        nodes: [],
        edges: [],
      };
      setWorkflow(mockWorkflow);
      setLoading(false);
    }, 1000);
  }, [id]);

  // Function to handle template selection
  const handleTemplateSelect = (template) => {
    if (template && template.nodes && template.edges) {
      setTimeout(() => {
        setWorkflow({
          ...workflow,
          nodes: [...template.nodes],
          edges: [...template.edges],
        });
        message.success(`${template.name} template loaded successfully!`);
      }, 100);
    } else {
      message.error('Invalid template format');
    }
  };

  // Function to update the workflow
  const handleUpdateWorkflow = () => {
    message.info(`Updating workflow ${id}`);
    // Here you would implement the API call to update the workflow
  };

  if (loading) {
    return <div>Loading workflow...</div>;
  }

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
            {translate('Edit Workflow')}: {workflow.name}
          </Title>
          <Button type="primary" onClick={handleUpdateWorkflow}>
            {translate('Update Workflow')}
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

export default WorkflowEdit;
