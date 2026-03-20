import { CopyOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useEffect, useRef } from 'react';

const WorkflowContextMenu = ({ x, y, selectedNode, onDeleteNode, onDuplicateNode, onClose }) => {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const items = [
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: <CopyOutlined />,
      onClick: onDuplicateNode,
      disabled: !selectedNode,
    },
    {
      key: 'configure',
      label: 'Configure',
      icon: <SettingOutlined />,
      disabled: !selectedNode,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: onDeleteNode,
      disabled: !selectedNode,
      danger: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        width: '180px',
      }}
    >
      <Menu items={items} />
    </div>
  );
};

export default WorkflowContextMenu;
