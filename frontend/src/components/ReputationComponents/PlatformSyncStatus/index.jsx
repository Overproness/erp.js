import React from 'react';
import { 
  Box, Typography, Paper, Alert, Chip, 
  LinearProgress, Divider
} from '@mui/material';
import { 
  SyncProblem as SyncProblemIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

export const PlatformSyncStatus = ({ 
  status = { inProgress: false, errors: [] }, 
  lastSync = 'Never',
  connectedCount = 0
}) => {

  // Alert for sync in progress
  if (status.inProgress) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Alert severity="info" icon={false}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              Platform synchronization in progress...
            </Typography>
            <Chip
              size="small"
              color="primary"
              label="Syncing"
            />
          </Box>
          <LinearProgress />
        </Alert>
      </Paper>
    );
  }

  // Alert for sync errors
  if (status.errors && status.errors.length > 0) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Alert 
          severity="warning"
          icon={<SyncProblemIcon />}
        >
          <Typography variant="subtitle1" gutterBottom>
            Some synchronization errors occurred
          </Typography>
          <Typography variant="body2">
            {status.errors.length} error(s) occurred during the last sync. Check platform details for more information.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  // Normal status display
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon color="action" sx={{ mr: 1.5 }} />
          <Typography variant="subtitle1">
            Last sync: {lastSync}
          </Typography>
        </Box>
        
        {connectedCount > 0 ? (
          <Chip 
            icon={<CheckCircleIcon />} 
            label={`${connectedCount} Platform${connectedCount !== 1 ? 's' : ''} Connected`} 
            color="success" 
            variant="outlined" 
          />
        ) : (
          <Chip 
            label="No Platforms Connected" 
            color="default" 
            variant="outlined" 
          />
        )}
      </Box>
    </Paper>
  );
};

export default PlatformSyncStatus;
