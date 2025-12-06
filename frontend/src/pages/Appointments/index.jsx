import { DataImportButton } from '@/components/DataEntry';
import AppointmentForm from '@/forms/AppointmentForm';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PercentageOutlined,
  PlusOutlined,
  TableOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Calendar,
  Card,
  Col,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Option } = Select;

export default function AppointmentsPage() {
  const translate = useLanguage();
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterType, setFilterType] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;

      const response = await request.list({ entity: 'appointments', params });
      if (response.success) {
        setAppointments(response.result);
      }
    } catch (error) {
      message.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const now = dayjs();
    const upcoming = appointments.filter(
      (apt) => dayjs(apt.startTime).isAfter(now) && ['scheduled', 'confirmed'].includes(apt.status)
    ).length;

    const today = appointments.filter(
      (apt) =>
        dayjs(apt.startTime).isSame(now, 'day') && ['scheduled', 'confirmed'].includes(apt.status)
    ).length;

    const confirmed = appointments.filter((apt) => apt.status === 'confirmed').length;

    const completed = appointments.filter((apt) => apt.status === 'completed').length;
    const total = appointments.length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    return { upcoming, today, confirmed, completionRate };
  }, [appointments]);

  const handleCreate = () => {
    setCurrentAppointment(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setCurrentAppointment(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await request.delete({ entity: 'appointments', id });
      if (response.success) {
        message.success('Appointment deleted successfully');
        fetchAppointments();
      }
    } catch (error) {
      message.error('Failed to delete appointment');
    }
  };

  const handleConfirm = async (id) => {
    try {
      const response = await request.post({
        entity: `appointments/${id}/confirm`,
        jsonData: {},
      });
      if (response.success) {
        message.success('Appointment confirmed');
        fetchAppointments();
      }
    } catch (error) {
      message.error('Failed to confirm appointment');
    }
  };

  const handleCancel = async (id) => {
    Modal.confirm({
      title: 'Cancel Appointment',
      content: 'Are you sure you want to cancel this appointment?',
      onOk: async () => {
        try {
          const response = await request.post({
            entity: `appointments/${id}/cancel`,
            jsonData: { reason: 'Cancelled by user' },
          });
          if (response.success) {
            message.success('Appointment cancelled');
            fetchAppointments();
          }
        } catch (error) {
          message.error('Failed to cancel appointment');
        }
      },
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'blue',
      confirmed: 'green',
      'in-progress': 'orange',
      completed: 'success',
      cancelled: 'red',
      'no-show': 'default',
      rescheduled: 'purple',
    };
    return colors[status] || 'default';
  };

  const getTypeIcon = (type) => {
    const icons = {
      consultation: '💬',
      meeting: '🤝',
      demo: '🎥',
      support: '🆘',
      training: '📚',
      interview: '👔',
      followup: '📞',
      other: '📋',
    };
    return icons[type] || '📋';
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <span>{getTypeIcon(record.type)}</span>
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>,
    },
    {
      title: 'Date & Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime, record) => (
        <div>
          <div>{dayjs(startTime).format('MMM DD, YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {dayjs(startTime).format('HH:mm')} - {dayjs(record.endTime).format('HH:mm')}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix(),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} min`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status.charAt(0).toUpperCase() + status.slice(1)}</Tag>
      ),
    },
    {
      title: 'Attendees',
      dataIndex: 'attendees',
      key: 'attendees',
      render: (attendees) => (
        <Tooltip title={attendees.map((a) => a.name).join(', ')}>
          <Tag>{attendees.length} attendee(s)</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Location',
      dataIndex: ['location', 'type'],
      key: 'location',
      render: (locationType) => {
        const icons = {
          virtual: '💻',
          physical: '📍',
          phone: '📞',
          hybrid: '🔄',
        };
        return (
          <span>
            {icons[locationType]} {locationType}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'scheduled' && (
            <Tooltip title="Confirm">
              <Button
                icon={<CheckCircleOutlined />}
                size="small"
                type="primary"
                onClick={() => handleConfirm(record._id)}
              />
            </Tooltip>
          )}
          {record.bookingUrl?.shortCode && (
            <Tooltip title="Copy Booking URL">
              <Button
                icon={<LinkOutlined />}
                size="small"
                onClick={() => {
                  const url = `${window.location.origin}/book-appointment/${record.bookingUrl.shortCode}`;
                  navigator.clipboard.writeText(url);
                  message.success('Booking URL copied!');
                }}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          </Tooltip>
          {['scheduled', 'confirmed'].includes(record.status) && (
            <Tooltip title="Cancel">
              <Button
                icon={<CloseCircleOutlined />}
                size="small"
                danger
                onClick={() => handleCancel(record._id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Appointment',
                  content: 'Are you sure?',
                  onOk: () => handleDelete(record._id),
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    return appointments.filter((apt) => dayjs(apt.startTime).format('YYYY-MM-DD') === dateStr);
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {listData.map((item) => (
          <li key={item._id}>
            <Badge
              status={getStatusColor(item.status)}
              text={
                <span style={{ fontSize: '12px' }}>
                  {dayjs(item.startTime).format('HH:mm')} - {item.title}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Upcoming"
              value={statistics.upcoming}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today"
              value={statistics.today}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Confirmed"
              value={statistics.confirmed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={statistics.completionRate}
              prefix={<PercentageOutlined />}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Appointments Card */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>{translate('Appointments')}</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: 150 }}
              onChange={setFilterStatus}
            >
              <Option value="scheduled">Scheduled</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
            <Select
              placeholder="Filter by Type"
              allowClear
              style={{ width: 150 }}
              onChange={setFilterType}
            >
              <Option value="consultation">Consultation</Option>
              <Option value="meeting">Meeting</Option>
              <Option value="demo">Demo</Option>
              <Option value="support">Support</Option>
              <Option value="training">Training</Option>
            </Select>
            <Button
              icon={viewMode === 'list' ? <CalendarOutlined /> : <TableOutlined />}
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            >
              {viewMode === 'list' ? 'Calendar View' : 'List View'}
            </Button>
            <DataImportButton
              moduleName="appointment"
              onImportComplete={(result) => {
                fetchAppointments();
                message.success(`Imported ${result.saved || 0} appointments successfully!`);
              }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {translate('New Appointment')}
            </Button>
          </Space>
        }
      >
        {viewMode === 'list' ? (
          <Table
            columns={columns}
            dataSource={appointments}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Calendar dateCellRender={dateCellRender} />
        )}
      </Card>

      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        title={currentAppointment ? 'Edit Appointment' : 'New Appointment'}
        footer={null}
        width={800}
      >
        <AppointmentForm
          current={currentAppointment}
          onSuccess={() => {
            setModalVisible(false);
            fetchAppointments();
          }}
        />
      </Modal>
    </div>
  );
}
