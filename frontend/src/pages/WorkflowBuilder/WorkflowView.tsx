import useLanguage from '@/locale/useLanguage';
import { Button, Card, Layout, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import WorkflowCanvas from '../../components/Workflow/WorkflowCanvas';

const { Content } = Layout;
const { Title } = Typography;

const WorkflowView = () => {
  const translate = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
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
        readOnly: true,
      };
      setWorkflow(mockWorkflow);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleEditWorkflow = () => {
    navigate(`/workflow/edit/${id}`);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            {translate('View Workflow')}: {workflow.name}
          </Title>
          <Button type="primary" onClick={handleEditWorkflow}>
            {translate('Edit')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          height: 'calc(100vh - 120px)',
          background: '#fff',
          border: '1px solid #e8e8e8',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <ReactFlowProvider>
          <WorkflowCanvas workflow={workflow} setWorkflow={setWorkflow} readOnly={true} />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default WorkflowView;
