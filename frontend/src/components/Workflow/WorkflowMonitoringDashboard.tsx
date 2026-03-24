import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Status color mapping
const STATUS_COLORS = {
  running: '#2196f3', // Blue
  completed: '#4caf50', // Green
  failed: '#f44336', // Red
  cancelled: '#ff9800', // Orange
};

// RECHARTS pie chart colors
const CHART_COLORS = ['#4caf50', '#f44336', '#2196f3', '#ff9800'];

const WorkflowMonitoringDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [stats, setStats] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [liveExecutions, setLiveExecutions] = useState([]);
  const [bottlenecks, setBottlenecks] = useState(null);

  // Filter states
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Workflows list (for filter dropdown)
  const [workflows, setWorkflows] = useState([]);

  // Use the authentication state from Redux store
  const { token } = useSelector((state) => state.auth);

  // Helper to format durations
  const formatDuration = (ms) => {
    if (!ms) return 'N/A';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format for charts
  const formatStatsForChart = (stats) => {
    if (!stats?.byStatus) return [];

    return Object.entries(stats.byStatus).map(([status, data]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      count: data.count,
      avgDuration: data.avgDuration ? Math.round(data.avgDuration / 1000) : 0, // Convert to seconds
    }));
  };

  // Fetch workflow list for filters
  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflow/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch workflows');

      const data = await response.json();
      if (data.success) {
        setWorkflows(data.workflows || []);
      } else {
        console.error('Error fetching workflows:', data.message);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  // Fetch execution statistics
  const fetchStats = async () => {
    try {
      const days = 30;
      let url = `/api/workflow-execution/stats?days=${days}`;

      if (workflowFilter) {
        url += `&workflowId=${workflowFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch execution stats');

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to fetch stats');
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch execution history
  const fetchExecutions = async () => {
    try {
      let url = `/api/workflow-execution/history?page=${page}&limit=${limit}`;

      if (workflowFilter) {
        url += `&workflowId=${workflowFilter}`;
      }

      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      if (dateRange.startDate) {
        url += `&startDate=${dateRange.startDate}`;
      }

      if (dateRange.endDate) {
        url += `&endDate=${dateRange.endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch executions');

      const data = await response.json();
      if (data.success) {
        setExecutions(data.executions || []);
      } else {
        setError(data.message || 'Failed to fetch executions');
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching executions:', error);
    }
  };

  // Fetch live executions
  const fetchLiveExecutions = async () => {
    try {
      const response = await fetch('/api/workflow-execution/live', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch live executions');

      const data = await response.json();
      if (data.success) {
        setLiveExecutions(data.executions || []);
      } else {
        console.error('Error fetching live executions:', data.message);
      }
    } catch (error) {
      console.error('Error fetching live executions:', error);
    }
  };

  // Fetch bottleneck analysis
  const fetchBottlenecks = async () => {
    try {
      let url = '/api/workflow-execution/bottlenecks';

      if (workflowFilter) {
        url += `?workflowId=${workflowFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bottleneck analysis');

      const data = await response.json();
      if (data.success) {
        setBottlenecks(data);
      } else {
        console.error('Error fetching bottlenecks:', data.message);
      }
    } catch (error) {
      console.error('Error fetching bottlenecks:', error);
    }
  };

  // Load data based on active tab
  const prevTabKeyRef = useRef('');
  useEffect(() => {
    const tabKey = `${activeTab}_${workflowFilter}_${statusFilter}_${dateRange}_${page}_${limit}`;
    if (prevTabKeyRef.current === tabKey) return;
    prevTabKeyRef.current = tabKey;

    const loadTabData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load workflows for filters (once)
        if (workflows.length === 0) {
          await fetchWorkflows();
        }

        // Load data based on active tab
        switch (activeTab) {
          case 0: // Overview
            await Promise.all([fetchStats(), fetchLiveExecutions()]);
            break;
          case 1: // History
            await fetchExecutions();
            break;
          case 2: // Bottlenecks
            await fetchBottlenecks();
            break;
          default:
            break;
        }
      } catch (error) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Dashboard loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTabData();

    // Live updates for running workflows
    let liveUpdateInterval;
    if (activeTab === 0) {
      liveUpdateInterval = setInterval(() => {
        fetchLiveExecutions();
      }, 5000); // Update every 5 seconds
    }

    return () => {
      if (liveUpdateInterval) clearInterval(liveUpdateInterval);
    };
  }, [activeTab, workflowFilter, statusFilter, dateRange, page, limit]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page when applying filters
    if (activeTab === 1) {
      fetchExecutions();
    } else if (activeTab === 0) {
      fetchStats();
    } else if (activeTab === 2) {
      fetchBottlenecks();
    }
  };

  // Reset filters
  const resetFilters = () => {
    setWorkflowFilter('');
    setStatusFilter('');
    setDateRange({ startDate: '', endDate: '' });
    setPage(1);
  };

  // Render statistics overview
  const renderOverview = () => {
    if (!stats) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="body1">No statistics available.</Typography>
        </Box>
      );
    }

    const chartData = formatStatsForChart(stats);
    const pieData = chartData.map((item) => ({ name: item.name, value: item.count }));

    return (
      <Grid container spacing={3}>
        {/* Stats summary cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Executions (Last 30 Days)
              </Typography>
              <Typography variant="h3">{stats.total || 0}</Typography>
              <Box sx={{ mt: 2 }}>
                {stats.byStatus &&
                  Object.entries(stats.byStatus).map(([status, data]) => (
                    <Box
                      key={status}
                      sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}
                    >
                      <Chip
                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                        size="small"
                        sx={{ bgcolor: STATUS_COLORS[status], color: 'white' }}
                      />
                      <Typography>{data.count}</Typography>
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Duration
              </Typography>
              <Typography variant="h3">{formatDuration(stats.averageDuration)}</Typography>
              <Box sx={{ mt: 2 }}>
                {stats.slowestExecutions &&
                  stats.slowestExecutions.slice(0, 3).map((exec, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                        {exec.workflowName || 'Unnamed'}
                      </Typography>
                      <Typography variant="body2">{formatDuration(exec.duration)}</Typography>
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h3">
                {stats.byStatus && stats.total
                  ? `${Math.round(((stats.byStatus.completed?.count || 0) / stats.total) * 100)}%`
                  : 'N/A'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Completed: {stats.byStatus?.completed?.count || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Failed: {stats.byStatus?.failed?.count || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Running: {stats.byStatus?.running?.count || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Execution Status Distribution</Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} executions`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Average Duration by Status</Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="s" />
                    <Tooltip formatter={(value) => [`${value} seconds`, 'Duration']} />
                    <Legend />
                    <Bar dataKey="avgDuration" name="Avg. Duration (seconds)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live executions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Live Executions</Typography>
              <Box sx={{ mt: 2 }}>
                {liveExecutions.length === 0 ? (
                  <Typography variant="body2">No workflows currently running</Typography>
                ) : (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Workflow</TableCell>
                          <TableCell>Started</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Started By</TableCell>
                          <TableCell>Current Node</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {liveExecutions.map((execution) => {
                          // Get the latest node execution
                          const currentNode =
                            execution.nodeExecutions && execution.nodeExecutions.length > 0
                              ? execution.nodeExecutions[execution.nodeExecutions.length - 1]
                              : null;

                          return (
                            <TableRow key={execution._id}>
                              <TableCell>
                                {execution.workflowName ||
                                  (execution.workflowId && execution.workflowId.name) ||
                                  'Unnamed'}
                              </TableCell>
                              <TableCell>
                                {formatDistanceToNow(new Date(execution.startTime), {
                                  addSuffix: true,
                                })}
                              </TableCell>
                              <TableCell>
                                {formatDistanceToNow(new Date(execution.startTime), {
                                  includeSeconds: true,
                                }).replace('about ', '')}
                              </TableCell>
                              <TableCell>
                                {execution.executedBy ? execution.executedBy.name : 'System'}
                              </TableCell>
                              <TableCell>
                                {currentNode
                                  ? currentNode.nodeName ||
                                    `${currentNode.nodeType} (${currentNode.nodeId})`
                                  : 'N/A'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render execution history
  const renderHistory = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Workflow Execution History
          </Typography>

          <Box sx={{ mb: 3 }}>
            {executions.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Workflow</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Executed By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {executions.map((execution) => (
                      <TableRow key={execution._id}>
                        <TableCell>
                          {execution.workflowName ||
                            (execution.workflowId && execution.workflowId.name) ||
                            'Unnamed'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(execution.startTime), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              execution.status.charAt(0).toUpperCase() + execution.status.slice(1)
                            }
                            size="small"
                            sx={{ bgcolor: STATUS_COLORS[execution.status], color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>{formatDuration(execution.duration)}</TableCell>
                        <TableCell>
                          {execution.executedBy ? execution.executedBy.name : 'System'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              // Navigate to execution detail view
                              window.location.href = `/workflow/execution/${execution._id}`;
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No executions found matching the criteria.</Typography>
            )}
          </Box>

          {/* Add pagination controls here */}
        </CardContent>
      </Card>
    );
  };

  // Render bottleneck analysis
  const renderBottlenecks = () => {
    if (!bottlenecks || !bottlenecks.nodeStats || bottlenecks.nodeStats.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="body1">No bottleneck data available.</Typography>
        </Box>
      );
    }

    // Prepare chart data - top 5 slowest nodes
    const chartData = bottlenecks.bottlenecks.map((node) => ({
      name: node.nodeName || node.nodeId,
      avgDuration: Math.round(node.avgDuration / 1000), // Convert to seconds
    }));

    return (
      <Grid container spacing={3}>
        {/* Chart showing bottlenecks */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Top 5 Workflow Bottlenecks</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Based on {bottlenecks.totalExecutionsAnalyzed} workflow executions
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit="s" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value) => [`${value} seconds`, 'Avg. Duration']} />
                    <Legend />
                    <Bar dataKey="avgDuration" name="Average Duration (seconds)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Node performance table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Node Performance Details
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Node</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Executions</TableCell>
                      <TableCell align="right">Avg Duration</TableCell>
                      <TableCell align="right">Max Duration</TableCell>
                      <TableCell align="right">Failure Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bottlenecks.nodeStats
                      .sort((a, b) => b.avgDuration - a.avgDuration)
                      .map((node) => (
                        <TableRow key={node.nodeId}>
                          <TableCell>{node.nodeName || node.nodeId}</TableCell>
                          <TableCell>{node.nodeType}</TableCell>
                          <TableCell align="right">{node.executions}</TableCell>
                          <TableCell align="right">{formatDuration(node.avgDuration)}</TableCell>
                          <TableCell align="right">{formatDuration(node.maxDuration)}</TableCell>
                          <TableCell align="right">
                            {node.failures > 0
                              ? `${Math.round((node.failures / node.executions) * 100)}%`
                              : '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render filters
  const renderFilters = () => {
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="workflow-filter-label">Workflow</InputLabel>
            <Select
              labelId="workflow-filter-label"
              id="workflow-filter"
              value={workflowFilter}
              label="Workflow"
              onChange={(e) => setWorkflowFilter(e.target.value)}
            >
              <MenuItem value="">All Workflows</MenuItem>
              {workflows.map((workflow) => (
                <MenuItem key={workflow._id} value={workflow._id}>
                  {workflow.name || 'Unnamed Workflow'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {activeTab === 1 && (
          <>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                label="End Date"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} md={2}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={applyFilters} fullWidth>
              Apply
            </Button>
            <Button variant="outlined" onClick={resetFilters} fullWidth>
              Reset
            </Button>
          </Box>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Workflow Monitoring Dashboard
      </Typography>

      {/* Filters */}
      {renderFilters()}

      {/* Error messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tab navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="workflow monitoring tabs">
          <Tab label="Overview" />
          <Tab label="Execution History" />
          <Tab label="Bottleneck Analysis" />
        </Tabs>
      </Box>

      {/* Tab content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {activeTab === 0 && renderOverview()}
          {activeTab === 1 && renderHistory()}
          {activeTab === 2 && renderBottlenecks()}
        </Box>
      )}
    </Box>
  );
};

export default WorkflowMonitoringDashboard;
