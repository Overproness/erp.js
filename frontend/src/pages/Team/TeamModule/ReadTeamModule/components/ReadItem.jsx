import { DeleteOutlined, EditOutlined, UserAddOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { Button, Descriptions, Divider, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useErpContext } from '@/context/erp';
import { erp } from '@/redux/erp/actions';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { useDate } from '@/settings';

const { TabPane } = Tabs;
const { Title } = Typography;

export const ReadItem = ({ config }) => {
  const { TEAM_ENTITY } = config;
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatDate } = useDate();

  const dispatch = useDispatch();
  const { result: currentResult, isLoading } = useSelector(selectCurrentItem);
  const { erpContextAction } = useErpContext();
  const { panel } = erpContextAction;
  const [activeTabKey, setActiveTabKey] = useState('members');

  useEffect(() => {
    dispatch(erp.read({ entity: TEAM_ENTITY, id }));
  }, [id]);

  const item = currentResult;

  const handleEdit = () => {
    navigate(`/team/update/${id}`);
  };

  const handleDelete = () => {
    dispatch(erp.delete({ entity: TEAM_ENTITY, id }));
    message.success('User successfully deleted');
    navigate(`/team`);
  };
  const handleInviteMember = () => {
    if (panel && panel.open) {
      panel.open({ entity: TEAM_ENTITY, mode: 'invite', recordId: id });
    }
  };

  const memberColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : role === 'lead' ? 'orange' : 'default'} key={role}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isInvitationAccepted ? 'green' : 'orange'} key={record._id}>
          {record.isInvitationAccepted ? 'Active' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() =>
              panel && panel.open
                ? panel.open({ entity: TEAM_ENTITY, mode: 'editMember', id, memberId: record._id })
                : null
            }
            key={`edit-${record._id}`}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              dispatch(
                erp.custom({
                  entity: TEAM_ENTITY,
                  customAction: 'removeMember',
                  jsonData: { teamId: id, memberId: record._id },
                })
              );
              message.success('User successfully deleted');
            }}
            key={`delete-${record._id}`}
          />
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="loading-container">
        <Space size="middle">
          <span>Loading...</span>
        </Space>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="not-found">
        <Space size="middle">
          <span>Team not found</span>
        </Space>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        onBack={() => navigate('/team')}
        title="Team Details"
        ghost={false}
        extra={[
          <Button key="3" onClick={handleInviteMember} icon={<UserAddOutlined />}>
            Invite Member
          </Button>,
          <Button key="2" onClick={handleEdit} icon={<EditOutlined />}>
            Edit
          </Button>,
          <Button key="1" danger onClick={handleDelete}>
            Delete
          </Button>,
        ]}
        style={{
          padding: '20px 0px',
          background: 'none'
        }}
      />
      <Divider orientation="left">Team Information</Divider>
      <Descriptions variant="bordered" column={2}>
        <Descriptions.Item label="Team Name" span={2}>
          <Typography.Text strong>{item.name}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>
          {item.description || 'No description provided'}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={item.enabled ? 'green' : 'red'}>{item.enabled ? 'Active' : 'Inactive'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Team Lead">
          {item.teamLead?.name || 'No team lead assigned'}
        </Descriptions.Item>
        <Descriptions.Item label="Created">{formatDate(item.created)}</Descriptions.Item>
        <Descriptions.Item label="Last Updated">{formatDate(item.updated)}</Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">Team Members</Divider>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
        <TabPane tab="Members" key="members">
          {' '}
          <Table
            columns={memberColumns}
            dataSource={item?.members || []}
            rowKey="_id"
            pagination={false}
          />
        </TabPane>
      </Tabs>
    </>
  );
};
