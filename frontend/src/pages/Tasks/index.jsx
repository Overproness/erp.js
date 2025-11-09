import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Card, 
  Tag, 
  Spin, 
  Modal, 
  message,
  Alert,
  Collapse
} from 'antd';
import { 
  PlusOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  UserOutlined, 
  AlertOutlined,
  BugOutlined 
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';
import { useTaskStats } from '@/hooks/useStatistics';
// Import dummy data
import dummyTasks, { getTaskStats } from '@/data/dummyTasksData';
// Import custom task modules
import ViewTaskModule from './TaskModule/ViewTaskModule';
import CreateTaskModule from './TaskModule/CreateTaskModule';
import TaskDetailModule from './TaskModule/TaskDetailModule';

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
    overdueTasks: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true); // Add statsLoading state
  const [debugState, setDebugState] = useState({
    tasksLoaded: false,
    loadError: null,
    dummyTasksAvailable: Array.isArray(dummyTasks) ? dummyTasks.length : 'not an array',
    lastAction: null,
    timestamps: {
      componentMounted: null,
      dataLoaded: null
    }
  });
  
  // Record component mount time
  useEffect(() => {
    const timestamp = new Date().toISOString();
    setDebugState(prev => ({
      ...prev, 
      timestamps: {
        ...prev.timestamps,
        componentMounted: timestamp
      }
    }));

  }, []);
  
  // Load dummy data on component mount
  useEffect(() => {
    setLoading(true);
    setStatsLoading(true); // Set stats loading to true
    
    // Check if dummyTasks is valid
    if (!Array.isArray(dummyTasks)) {
      console.error('dummyTasks is not an array:', dummyTasks);
      setDebugState(prev => ({
        ...prev,
        loadError: 'dummyTasks is not an array',
        tasksLoaded: false
      }));
      setLoading(false);
      setStatsLoading(false); // Set stats loading to false
      return;
    }
    
    try {
      // Simulate API delay
      setTimeout(() => {
        setTasks(dummyTasks);
        setTaskStatistics(getTaskStats());
        setLoading(false);
        setStatsLoading(false); // Set stats loading to false
        
        // Update debug state
        const timestamp = new Date().toISOString();
        setDebugState(prev => ({
          ...prev,
          tasksLoaded: true,
          tasksCount: dummyTasks.length,
          timestamps: {
            ...prev.timestamps,
            dataLoaded: timestamp
          }
        }));
        
      }, 500);
    } catch (error) {
      console.error('Error loading dummy tasks:', error);
      setDebugState(prev => ({
        ...prev,
        loadError: error.message,
        tasksLoaded: false
      }));
      setLoading(false);
      setStatsLoading(false); // Set stats loading to false
    }
  }, []);

  const handleCreateTask = () => {
    setSelectedTask(null);
    setModalMode('create');
    setModalVisible(true);
    setDebugState(prev => ({
      ...prev,
      lastAction: 'create-task-clicked'
    }));
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setModalVisible(true);
    setDebugState(prev => ({
      ...prev,
      lastAction: `edit-task-clicked:${task?._id}`
    }));
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setModalMode('view');
    setModalVisible(true);
    setDebugState(prev => ({
      ...prev,
      lastAction: `view-task-clicked:${task?._id}`
    }));
  };

  const handleDeleteTask = (task) => {
    setDebugState(prev => ({
      ...prev,
      lastAction: `delete-task-clicked:${task?._id}`
    }));
    
    Modal.confirm({
      title: translate('Delete Task'),
      content: translate('Are you sure you want to delete this task?'),
      okText: translate('Yes'),
      okType: 'danger',
      cancelText: translate('No'),
      onOk() {
        // In a real app, this would call an API
        try {
          const updatedTasks = tasks.filter(t => t._id !== task._id);
          setTasks(updatedTasks);
          
          // Update stats after deletion
          setTaskStatistics(prev => ({
            ...prev,
            totalTasks: prev.totalTasks - 1,
            completedTasks: task.status === 'completed' ? prev.completedTasks - 1 : prev.completedTasks,
            inProgressTasks: task.status === 'in_progress' ? prev.inProgressTasks - 1 : prev.inProgressTasks,
            // Recalculate overdue
            overdueTasks: updatedTasks.filter(
              t => t.status !== 'completed' && dayjs(t.deadline).isBefore(dayjs())
            ).length
          }));
          
          setDebugState(prev => ({
            ...prev,
            lastAction: `delete-task-confirmed:${task?._id}`,
            tasksCount: updatedTasks.length
          }));
          
          message.success(translate('Task deleted successfully'));
          
          // If viewing the task that was deleted, close the modal
          if (modalVisible && selectedTask && selectedTask._id === task._id) {
            setModalVisible(false);
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          message.error('Failed to delete task: ' + error.message);
        }
      }
    });
  };

  const handleSaveTask = (values, taskId) => {
    setDebugState(prev => ({
      ...prev,
      lastAction: taskId ? `update-task:${taskId}` : 'create-new-task',
      formValues: values
    }));
    
    return new Promise((resolve, reject) => {
      try {
        // In a real app, this would call an API
        if (taskId) {
          // Update existing task
          const updatedTasks = tasks.map(task => 
            task._id === taskId ? { ...task, ...values, updatedAt: new Date().toISOString() } : task
          );
          setTasks(updatedTasks);
          
          setDebugState(prev => ({
            ...prev,
            lastAction: `update-task-success:${taskId}`,
            tasksCount: updatedTasks.length
          }));
        } else {
          // Create new task
          const newTask = {
            _id: `task-${Math.floor(Math.random() * 1000)}`,
            ...values,
            created: new Date().toISOString()
          };
          const updatedTasks = [...tasks, newTask];
          setTasks(updatedTasks);
          
          // Update statistics
          setTaskStatistics(prev => ({
            ...prev,
            totalTasks: prev.totalTasks + 1,
            inProgressTasks: values.status === 'in_progress' ? prev.inProgressTasks + 1 : prev.inProgressTasks,
            completedTasks: values.status === 'completed' ? prev.completedTasks + 1 : prev.completedTasks,
            // Recalculate overdue if needed
            overdueTasks: values.status !== 'completed' && dayjs(values.deadline).isBefore(dayjs()) 
              ? prev.overdueTasks + 1 
              : prev.overdueTasks
          }));
          
          setDebugState(prev => ({
            ...prev,
            lastAction: 'create-task-success',
            tasksCount: updatedTasks.length,
            newTaskId: newTask._id
          }));
        }
        
        setModalVisible(false);
        resolve();
      } catch (error) {
        console.error('Error saving task:', error);
        setDebugState(prev => ({
          ...prev,
          lastAction: 'task-save-error',
          error: error.message
        }));
        reject(error);
      }
    });
  };

  // Determine what to render in the modal
  const renderModalContent = () => {
    switch (modalMode) {
      case 'create':
        return (
          <CreateTaskModule
            onSave={handleSaveTask}
            onCancel={() => setModalVisible(false)}
          />
        );
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

  // Debug information about current state
  const debugData = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    dummyTasksAvailable: Array.isArray(dummyTasks) ? dummyTasks.length : 'not an array',
    currentState: {
      tasksState: Array.isArray(tasks) ? tasks.length : 'not an array',
      tasksStatistics: taskStatistics,
      loading,
      modalVisible,
      modalMode,
      selectedTaskId: selectedTask?._id
    },
    ...debugState
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Debug Panel (only in development) */}

      {/* Show error alert if there was an issue loading data */}
      {debugState.loadError && (
        <Alert
          message="Error Loading Tasks"
          description={`There was a problem loading the task data: ${debugState.loadError}`}
          type="error"
          showIcon
          icon={<BugOutlined />}
          style={{ marginBottom: '16px' }}
        />
      )}
      
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {translate('Tasks')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              {translate('Organize and track your team\'s tasks and activities')}
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '8px',
              height: '40px',
              fontWeight: '500'
            }}
          >
            {translate('Add New Task')}
          </Button>
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
                  valueStyle={{ color: '#52c41a', fontWeight: '700' }}
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
                      {(taskStatistics.overdueTasks || 0) > 0 && <AlertOutlined style={{ fontSize: '10px' }} />}
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
        />
      )}
      
      {/* Modal for Create/Edit/View Task */}
      <Modal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setDebugState(prev => ({...prev, lastAction: 'modal-closed'}));
        }}
        footer={null}
        width={modalMode === 'view' ? 1000 : 800}
        bodyStyle={{ padding: 0 }}
        destroyOnClose
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}