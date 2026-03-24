import React, { useEffect, useRef } from 'react';
import { EyeOutlined, EditOutlined, DeleteOutlined, MailOutlined } from '@ant-design/icons';
import { Dropdown, Table, Button, Space, Tag } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { useSelector, useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { selectListItems } from '@/redux/erp/selectors';
import { useErpContext } from '@/context/erp';
import { useAppContext } from '@/context/appContext';
import { TEAM_ENTITY } from './config';
import { useNavigate } from 'react-router-dom';
import { useDate } from '@/settings'; // Import from settings index
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';
import { data } from 'autoprefixer';

const TeamDataTableModule = ({ config = {} }) => {
  const translate = useLanguage();
  const { DATATABLE_TITLE = translate('team_list'), entity = TEAM_ENTITY } = config;
  const { state } = useAppContext();
  const { isPanelOpen } = state;
  const { erpContextAction } = useErpContext();
  const { panel } = erpContextAction;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get date formatting settings - safely handle undefined formatDate
  const { dateFormat, formatDate: originalFormatDate } = useDate();
  
  // Create a safe format date function that won't crash if the hook doesn't provide one
  const formatDate = (date) => {
    if (originalFormatDate) {
      return originalFormatDate(date);
    }
    
    // Fallback date formatting using dayjs
    if (!date) return '-';
    return dayjs(date).format(dateFormat || 'DD/MM/YYYY');
  };
  
  const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);

  // Make sure to safely destructure and provide fallbacks
  const dataSource = listResult?.items || [];
  const pagination = listResult?.pagination || { current: 1, pageSize: 10, total: 0 };
  const isLoading = listIsLoading || false;

  const columns = [
    {
      title: 'Team Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/team/read/${record._id}`)}
          style={{ padding: 0, fontWeight: 'bold' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Team Lead',
      key: 'teamLead',
      render: (_, record) => {
        const leadMember = (record.members || []).find(m => m.role === 'lead');
        return leadMember && leadMember.name
          ? leadMember.name
          : 'No team lead assigned';
      },
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members) => (
        <Tag color="blue" key="members-count">{members?.length || 0} members</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'} key={enabled ? 'active' : 'inactive'}>
          {enabled ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },    {      title: 'Created Date',
      dataIndex: 'created',
      key: 'created',
      render: (date) => formatDate(date),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const menuItems = [
          {
            label: 'Read',
            key: 'read',
            icon: <EyeOutlined />,
            onClick: () => navigate(`/team/read/${record._id}`),
          },
          {
            label: 'Edit',
            key: 'edit',
            icon: <EditOutlined />,
            onClick: () => navigate(`/team/update/${record._id}`),
          },
          {
            label: 'Invite Member',
            key: 'invite',
            icon: <MailOutlined />,
            onClick: () => panel && panel.open ? panel.open({ entity: TEAM_ENTITY, mode: 'invite', recordId: record._id }) : null,
          },
          {
            label: 'Delete',
            key: 'delete',
            icon: <DeleteOutlined />,
            onClick: () => {
              dispatch(erp.delete({ entity: TEAM_ENTITY, id: record._id }));
            },
          },
        ];
        return (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
            <Button>Actions</Button>
          </Dropdown>
        );
      },
    },
  ];
  const handelDataTableLoad = (pagination) => {
    const options = { page: pagination.current || 1, items: pagination.pageSize || 10 };
    dispatch(erp.list({ entity, options }));
  };

  const dispatcher = () => {
    dispatch(erp.list({ entity }));
  };

  useEffect(() => {
    const controller = new AbortController();
    dispatcher();
    return () => {
      controller.abort();
    };
  }, []);
  return (
    <>
      <PageHeader
        title={DATATABLE_TITLE || translate('team_list')}
        ghost={false}
        extra={[
          <Button
            key="1"
            onClick={() => navigate('/team/create')}
            type="primary"
          >
            {translate('add_team')}
          </Button>,
        ]}
        style={{
          padding: '20px 0px',
        }}
      />
      <Table
        columns={columns}
        rowKey={(item) => item._id}
        dataSource={dataSource}
        pagination={pagination}
        loading={listIsLoading || isLoading}
        onChange={handelDataTableLoad}
        scroll={{ x: true }}
      />
    </>
  );
};

export { TeamDataTableModule };
