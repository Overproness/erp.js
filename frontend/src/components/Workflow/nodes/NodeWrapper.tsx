import { CopyOutlined, DeleteOutlined, MoreOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, message, Tooltip } from '@/components/ui';
import { useReactFlow } from 'reactflow';

const NodeWrapper = ({ children, nodeType, id, data }) => {
  const instance = useReactFlow();

  // Node colors based on type
  const nodeColors = {
    trigger: '#1890ff',
    action: '#722ed1',
    condition: '#fa8c16',
    delay: '#13c2c2',
  };

  // Delete the node and connected edges
  const onDelete = () => {
    instance.setNodes((nodes) => nodes.filter((node) => node.id !== id));
    instance.setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
    message.success('Node deleted');
  };

  // Duplicate the node
  const onDuplicate = () => {
    const nodeToClone = instance.getNode(id);

    if (nodeToClone) {
      const newNode = {
        ...nodeToClone,
        id: `${nodeType}_${Date.now()}`,
        position: {
          x: nodeToClone.position.x + 50,
          y: nodeToClone.position.y + 50,
        },
        selected: false,
      };

      instance.setNodes((nodes) => [...nodes, newNode]);
      message.success('Node duplicated');
    }
  };

  // Context menu items
  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<SettingOutlined />} onClick={() => {}}>
        Configure
      </Menu.Item>
      <Menu.Item key="2" icon={<CopyOutlined />} onClick={onDuplicate}>
        Duplicate
      </Menu.Item>
      <Menu.Item key="3" icon={<DeleteOutlined />} onClick={onDelete} danger>
        Delete
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="node-wrapper" style={{ position: 'relative' }}>
      <Dropdown overlay={menu} trigger={['contextMenu']}>
        <div style={{ minWidth: '200px', maxWidth: '250px' }}>{children}</div>
      </Dropdown>

      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          zIndex: 10,
        }}
      >
        <Tooltip title="More options">
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            style={{
              backgroundColor: nodeColors[nodeType] || '#ccc',
              color: '#fff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 0,
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default NodeWrapper;
