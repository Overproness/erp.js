import dayjs from 'dayjs';


// Get current user information (can be replaced with actual user data)
const currentUser = {
  _id: 'current-user-id',
  name: 'Current User',
  email: 'user@example.com',
  avatar: null
};

// Create dummy tasks data with some assigned to current user
const dummyTasks = [
  {
    _id: 'task-001',
    title: 'Complete Website Redesign',
    description: 'Finish the new website design mockups and prepare for client presentation.',
    status: 'in_progress',
    priority: 'high',
    deadline: dayjs().add(2, 'day').toISOString(),
    created: dayjs().subtract(5, 'day').toISOString(),
    assignedTo: currentUser,
    project: {
      _id: 'project-001',
      name: 'Website Revamp'
    },
    tags: ['design', 'client', 'priority'],
    attachments: []
  },
  {
    _id: 'task-002',
    title: 'Fix API Integration Issues',
    description: 'Resolve the authentication issues with the payment gateway API integration.',
    status: 'todo',
    priority: 'urgent',
    deadline: dayjs().add(1, 'day').toISOString(),
    created: dayjs().subtract(2, 'day').toISOString(),
    assignedTo: currentUser,
    project: {
      _id: 'project-002',
      name: 'Payment System Upgrade'
    },
    tags: ['backend', 'api', 'bug'],
    attachments: [
      {
        name: 'error_logs.txt',
        url: '#',
        size: '24KB',
        type: 'text/plain'
      }
    ]
  },
  {
    _id: 'task-003',
    title: 'Prepare Monthly Analytics Report',
    description: 'Compile and analyze the marketing metrics for the monthly executive report.',
    status: 'completed',
    priority: 'medium',
    deadline: dayjs().subtract(1, 'day').toISOString(),
    completed: dayjs().subtract(2, 'hour').toISOString(),
    created: dayjs().subtract(7, 'day').toISOString(),
    assignedTo: currentUser,
    project: {
      _id: 'project-003',
      name: 'Marketing Analytics'
    },
    tags: ['analytics', 'report', 'monthly'],
    attachments: [
      {
        name: 'analytics_report_draft.pdf',
        url: '#',
        size: '1.2MB',
        type: 'application/pdf'
      }
    ]
  },
  {
    _id: 'task-004',
    title: 'Client Meeting Preparation',
    description: 'Prepare slides and talking points for the upcoming client meeting.',
    status: 'todo',
    priority: 'high',
    deadline: dayjs().add(3, 'day').toISOString(),
    created: dayjs().subtract(1, 'day').toISOString(),
    assignedTo: {
      _id: 'user-002',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: null
    },
    project: {
      _id: 'project-001',
      name: 'Website Revamp'
    },
    tags: ['meeting', 'presentation', 'client'],
    attachments: []
  },
  {
    _id: 'task-005',
    title: 'Update Documentation',
    description: 'Update the API documentation with the newly added endpoints and parameters.',
    status: 'in_progress',
    priority: 'low',
    deadline: dayjs().add(5, 'day').toISOString(),
    created: dayjs().subtract(3, 'day').toISOString(),
    assignedTo: {
      _id: 'user-003',
      name: 'Robert Johnson',
      email: 'robert@example.com',
      avatar: null
    },
    project: {
      _id: 'project-002',
      name: 'Payment System Upgrade'
    },
    tags: ['documentation', 'api'],
    attachments: []
  }
];

// Log tasks data for debugging

// Helper function to get tasks assigned to current user
export const getCurrentUserTasks = () => {
  return dummyTasks.filter(task => task.assignedTo._id === currentUser._id);
};

// Helper function to get task statistics
export const getTaskStats = () => {
  // Log for debugging
  
  const stats = {
    totalTasks: dummyTasks.length,
    completedTasks: dummyTasks.filter(task => task.status === 'completed').length,
    inProgressTasks: dummyTasks.filter(task => task.status === 'in_progress').length,
    overdueTasks: dummyTasks.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'cancelled' && 
      dayjs(task.deadline).isBefore(dayjs())
    ).length
  };
  
  return stats;
};

export default dummyTasks;
