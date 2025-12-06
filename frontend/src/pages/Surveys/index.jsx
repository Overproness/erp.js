import useLanguage from '@/locale/useLanguage';
import { crud } from '@/redux/crud/actions';
import { request } from '@/request';
import {
  BarChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  message,
  Modal,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Survey() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();
  const entity = 'surveys';

  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const { result: surveys, isLoading, pagination } = useSelector((state) => state.crud.list);
  const surveyList = Array.isArray(surveys?.items) ? surveys.items : [];

  useEffect(() => {
    dispatch(crud.list({ entity }));
  }, [dispatch]);

  const handlePublish = async (surveyId) => {
    try {
      await request.post(`/${entity}/${surveyId}/publish`);
      message.success('Survey published successfully');
      dispatch(crud.list({ entity }));
    } catch (error) {
      message.error('Failed to publish survey');
    }
  };

  const handlePause = async (surveyId) => {
    try {
      await request.post(`/${entity}/${surveyId}/pause`);
      message.success('Survey paused successfully');
      dispatch(crud.list({ entity }));
    } catch (error) {
      message.error('Failed to pause survey');
    }
  };

  const handleDuplicate = async (surveyId) => {
    try {
      await request.post(`/${entity}/${surveyId}/duplicate`);
      message.success('Survey duplicated successfully');
      dispatch(crud.list({ entity }));
    } catch (error) {
      message.error('Failed to duplicate survey');
    }
  };

  const handleDelete = async () => {
    try {
      await request.delete(`/${entity}/${selectedSurvey._id}`);
      message.success('Survey deleted successfully');
      setDeleteModalVisible(false);
      dispatch(crud.list({ entity }));
    } catch (error) {
      message.error('Failed to delete survey');
    }
  };

  const handleShare = (survey) => {
    setSelectedSurvey(survey);
    setShareModalVisible(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'success',
      paused: 'warning',
      closed: 'error',
      archived: 'default',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: translate('Survey Title'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: '#888' }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: translate('Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type?.toUpperCase()}</Tag>,
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>,
    },
    {
      title: translate('Responses'),
      dataIndex: ['analytics', 'totalResponses'],
      key: 'responses',
      render: (count) => count || 0,
    },
    {
      title: translate('Completion Rate'),
      dataIndex: ['analytics', 'completionRate'],
      key: 'completionRate',
      render: (rate) => `${rate || 0}%`,
    },
    {
      title: translate('NPS Score'),
      dataIndex: ['analytics', 'npsScore'],
      key: 'npsScore',
      render: (score) => (score !== null && score !== undefined ? score : 'N/A'),
    },
    {
      title: translate('Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View',
                onClick: () => navigate(`/survey/${record._id}`),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => navigate(`/survey/${record._id}/edit`),
              },
              {
                key: 'analytics',
                icon: <BarChartOutlined />,
                label: 'Analytics',
                onClick: () => navigate(`/survey/${record._id}/analytics`),
              },
              {
                key: 'share',
                icon: <ShareAltOutlined />,
                label: 'Share',
                onClick: () => handleShare(record),
              },
              {
                type: 'divider',
              },
              ...(record.status === 'draft' || record.status === 'paused'
                ? [
                    {
                      key: 'publish',
                      icon: <PlayCircleOutlined />,
                      label: 'Publish',
                      onClick: () => handlePublish(record._id),
                    },
                  ]
                : []),
              ...(record.status === 'active'
                ? [
                    {
                      key: 'pause',
                      icon: <PauseCircleOutlined />,
                      label: 'Pause',
                      onClick: () => handlePause(record._id),
                    },
                  ]
                : []),
              {
                key: 'duplicate',
                icon: <CopyOutlined />,
                label: 'Duplicate',
                onClick: () => handleDuplicate(record._id),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => {
                  setSelectedSurvey(record);
                  setDeleteModalVisible(true);
                },
              },
            ],
          }}
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // Statistics
  const totalSurveys = surveyList.length;
  const activeSurveys = surveyList.filter((s) => s.status === 'active').length;
  const totalResponses = surveyList.reduce((sum, s) => sum + (s.analytics?.totalResponses || 0), 0);
  const avgNPS = surveyList
    .filter((s) => s.analytics?.npsScore !== null && s.analytics?.npsScore !== undefined)
    .reduce((sum, s, _, arr) => sum + (s.analytics.npsScore || 0) / arr.length, 0);

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: '0 0 8px 0' }}>
            {translate('Customer Surveys')}
          </Title>
          <Text style={{ color: '#6b7280', fontSize: 16 }}>
            Create and manage customer feedback surveys with AI-powered analysis
          </Text>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Surveys" value={totalSurveys} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Active Surveys" value={activeSurveys} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Responses" value={totalResponses} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Average NPS" value={avgNPS.toFixed(1)} suffix="/100" />
            </Card>
          </Col>
        </Row>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/survey/create')}
        >
          {translate('Create Survey')}
        </Button>
      </div>

      {/* Survey Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={surveyList}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: pagination?.current || 1,
            pageSize: pagination?.pageSize || 10,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} surveys`,
          }}
        />
      </Card>

      {/* Delete Modal */}
      <Modal
        title="Delete Survey"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete the survey <strong>{selectedSurvey?.title}</strong>?
        </p>
        <p>This action cannot be undone.</p>
      </Modal>

      {/* Share Modal */}
      <Modal
        title="Share Survey"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedSurvey && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Survey URL:</Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <Input
                  value={`${window.location.origin}/public/survey/${selectedSurvey.customUrl?.shortCode}`}
                  readOnly
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() =>
                    copyToClipboard(
                      `${window.location.origin}/public/survey/${selectedSurvey.customUrl?.shortCode}`
                    )
                  }
                >
                  Copy
                </Button>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Short Code:</Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <Input value={selectedSurvey.customUrl?.shortCode} readOnly />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(selectedSurvey.customUrl?.shortCode)}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
