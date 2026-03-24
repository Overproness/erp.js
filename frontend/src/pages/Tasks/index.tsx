import useLanguage from '@/locale/useLanguage';
import {
  AlertOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Collapse,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Typography,
  message,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import task API request service
import taskRequest from '@/request/taskRequest';
// Import custom task modules
import { DataImportButton } from '@/components/DataEntry';
import AISuggestionsModal from './TaskModule/AISuggestionsModal';
import CreateTaskModule from './TaskModule/CreateTaskModule';
import TaskDetailModule from './TaskModule/TaskDetailModule';
import ViewTaskModule from './TaskModule/ViewTaskModule';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function Tasks() {
  const translate = useLanguage();
  const navigate = useNavigate();

  // State for tasks and UI
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskStatistics, setTaskStatistics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const loadedRef = useRef(false);

  // Load tasks from API on component mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadTasks();
    loadTaskStats();
  }, []);

  // Function to load tasks from API
  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await taskRequest.list();

      if (response.success) {
        const taskData = response.result?.items || response.result || [];
        setTasks(Array.isArray(taskData) ? taskData : []);
      } else if (response.message === 'Collection is Empty') {
        setTasks([]);
      } else {
        message.error(translate(response.message || 'Failed to load tasks'));
        setTasks([]);
      }
    } catch (error) {
      if (error.response?.data?.message === 'Collection is Empty') {
        setTasks([]);
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to load tasks';
        message.error(translate(errorMsg));
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to load task statistics from API
  const loadTaskStats = async () => {
    setStatsLoading(true);
    try {
      const response = await taskRequest.statistics();

      if (response.success && response.result) {
        setTaskStatistics({
          totalTasks: response.result.totalTasks || 0,
          completedTasks: response.result.completed || 0,
          inProgressTasks: response.result.inProgress || 0,
          overdueTasks: response.result.overdue || 0,
        });
      }
    } catch (error) {
      setTaskStatistics({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleOpenAISuggestions = () => {
    setAiModalVisible(true);
  };

  const handleAISuggestionsApply = async () => {
    // Reload tasks and stats after applying AI suggestions
    await loadTasks();
    await loadTaskStats();
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setModalMode('view');
    setModalVisible(true);
  };

  const handleDeleteTask = async (task) => {
    Modal.confirm({
      title: translate('Delete Task'),
      content: translate('Are you sure you want to delete this task?'),
      okText: translate('Yes'),
      okType: 'danger',
      cancelText: translate('No'),
      async onOk() {
        try {
          const response = await taskRequest.delete(task._id);
          if (response.success) {
            message.success(translate('Task deleted successfully'));
            // Reload tasks and stats
            await loadTasks();
            await loadTaskStats();

            // If viewing the task that was deleted, close the modal
            if (modalVisible && selectedTask && selectedTask._id === task._id) {
              setModalVisible(false);
            }
          } else {
            message.error(translate('Failed to delete task'));
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          message.error(translate('Failed to delete task'));
        }
      },
    });
  };

  const handleMarkComplete = async (task) => {
    try {
      const response = await taskRequest.update(task._id, {
        status: 'completed',
        completed: new Date().toISOString(),
      });

      if (response.success) {
        message.success(translate('Task marked as completed'));
        // Reload tasks and stats
        await loadTasks();
        await loadTaskStats();
      } else {
        message.error(translate('Failed to mark task as completed'));
      }
    } catch (error) {
      console.error('Error marking task as complete:', error);
      message.error(translate('Failed to mark task as completed'));
    }
  };

  const handleSaveTask = async (values, taskId) => {
    try {
      if (taskId) {
        // Update existing task
        const response = await taskRequest.update(taskId, values);
        if (response.success) {
          message.success(translate('Task updated successfully'));
          // Reload tasks and stats
          await loadTasks();
          await loadTaskStats();
          setModalVisible(false);
        } else {
          message.error(translate('Failed to update task'));
        }
      } else {
        // Create new task
        const response = await taskRequest.create(values);
        if (response.success) {
          message.success(translate('Task created successfully'));
          // Reload tasks and stats
          await loadTasks();
          await loadTaskStats();
          setModalVisible(false);
        } else {
          message.error(translate('Failed to create task'));
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
      message.error(translate('Failed to save task'));
      throw error;
    }
  };

  // Determine what to render in the modal
  const renderModalContent = () => {
    switch (modalMode) {
      case 'create':
        return <CreateTaskModule onSave={handleSaveTask} onCancel={() => setModalVisible(false)} />;
      case 'edit':
        return (
          <CreateTaskModule
            initialValues={selectedTask}
            isUpdateForm={true}
            onSave={handleSaveTask}
            onCancel={() => setModalVisible(false)}
          />
        );
      case 'view':
        return (
          <TaskDetailModule
            task={selectedTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onBack={() => setModalVisible(false)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {translate('Tasks')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              {translate("Organize and track your team's tasks and activities")}
            </Text>
          </div>
          <Space>
            <Button icon={<BulbOutlined />} onClick={handleOpenAISuggestions}>
              {translate('AI Suggestions')}
            </Button>
            <DataImportButton
              moduleName="task"
              onImportComplete={(result) => {
                loadTasks();
                message.success(`Imported ${result.saved || 0} tasks successfully!`);
              }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTask}>
              {translate('Add New Task')}
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Total Tasks')}
                  value={taskStatistics.totalTasks || 0}
                  valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                  prefix={<CheckCircleOutlined style={{ color: '#8b45ff' }} />}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Completed')}
                  value={taskStatistics.completedTasks || 0}
                  valueStyle={{ color: '#3b851cff', fontWeight: '700' }}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('In Progress')}
                  value={taskStatistics.inProgressTasks || 0}
                  valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                  prefix={<ExclamationCircleOutlined style={{ color: '#6366f1' }} />}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {translate('Overdue')}
                      {(taskStatistics.overdueTasks || 0) > 0 && (
                        <AlertOutlined style={{ fontSize: '10px' }} />
                      )}
                    </span>
                  }
                  value={taskStatistics.overdueTasks || 0}
                  valueStyle={{ color: '#ef4444', fontWeight: '700' }}
                  prefix={<ClockCircleOutlined style={{ color: '#ef4444' }} />}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content - ViewTaskModule */}
      {loading ? (
        <Card style={{ borderRadius: '12px', textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>{translate('Loading tasks...')}</div>
        </Card>
      ) : (
        <ViewTaskModule
          tasks={tasks}
          loading={loading}
          onEdit={handleEditTask}
          onView={handleViewTask}
          onDelete={handleDeleteTask}
          onMarkComplete={handleMarkComplete}
        />
      )}

      {/* Modal for Create/Edit/View Task */}
      <Modal
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        footer={null}
        width={modalMode === 'view' ? 1000 : 800}
        styles={{ body: { padding: 0 } }}
        destroyOnHidden
      >
        {renderModalContent()}
      </Modal>

      {/* AI Suggestions Modal */}
      <AISuggestionsModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        tasks={tasks}
        onApply={handleAISuggestionsApply}
      />
    </div>
  );
}
