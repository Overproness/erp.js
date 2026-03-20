import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Button,
  Tabs,
  Tab,
  Tooltip,
  Slider,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Computer as ComputerIcon,
  TabletAndroid as TabletIcon,
  PhoneAndroid as PhoneIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  GetApp as DownloadIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  SyncAlt as SyncAltIcon
} from '@mui/icons-material';

const PreviewFrame = styled('iframe')(({ theme }) => ({
  border: 'none',
  width: '100%',
  height: '100%',
  backgroundColor: 'white'
}));

const DeviceContainer = styled(Box)(({ theme, deviceType }) => {
  // Base device styling
  const deviceStyles = {
    desktop: {
      width: '100%',
      height: '100%',
      transition: 'all 0.3s ease',
      borderRadius: 0,
    },
    tablet: {
      width: '768px',
      height: '1024px',
      maxWidth: '100%',
      maxHeight: 'calc(100% - 40px)',
      margin: '20px auto',
      transition: 'all 0.3s ease',
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[3],
    },
    mobile: {
      width: '375px',
      height: '667px',
      maxWidth: '100%',
      maxHeight: 'calc(100% - 60px)',
      margin: '30px auto',
      transition: 'all 0.3s ease',
      borderRadius: '24px',
      boxShadow: theme.shadows[4],
    }
  };

  return {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.default,
    ...deviceStyles[deviceType]
  };
});

const DeviceHeader = styled(Box)(({ theme, deviceType }) => {
  // Device header styling based on device type
  if (deviceType === 'mobile') {
    return {
      height: '24px',
      width: '40%',
      backgroundColor: '#000',
      borderRadius: '0 0 12px 12px',
      margin: '0 auto 4px auto',
      position: 'relative'
    };
  }
  return { display: 'none' };
});

const PreviewContainer = styled(Box)(({ theme, deviceType, zoom }) => ({
  width: deviceType === 'desktop' ? '100%' : undefined,
  height: deviceType === 'desktop' ? 'calc(100% - 52px)' : undefined,
  transform: `scale(${zoom})`,
  transformOrigin: 'top center',
  transition: 'transform 0.2s ease',
  overflow: 'hidden'
}));

/**
 * Live preview of custom review portal with responsive design testing
 */
const ReviewPortalPreview = ({
  portalData,
  previewUrl,
  onUpdatePreview,
  onShare,
  onDownload,
  onGenerateCode,
  branding = {},
  initialDeviceType = 'desktop',
  loading = false
}) => {
  const [deviceType, setDeviceType] = useState(initialDeviceType);
  const [zoom, setZoom] = useState(1);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [activeTab, setActiveTab] = useState(0);
  const [customUrl, setCustomUrl] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    // Update zoom level based on device type
    switch (deviceType) {
      case 'desktop':
        setZoom(1);
        break;
      case 'tablet':
        setZoom(0.8);
        break;
      case 'mobile':
        setZoom(0.75);
        break;
      default:
        setZoom(1);
    }
  }, [deviceType]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(Date.now());
  };

  // Handle zoom change
  const handleZoomChange = (event, newValue) => {
    setZoom(newValue);
  };

  // Handle device type change
  const handleDeviceChange = (event) => {
    setDeviceType(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle custom URL update
  const handleCustomUrlChange = (event) => {
    setCustomUrl(event.target.value);
  };

  // Handle load custom URL
  const handleLoadCustomUrl = () => {
    if (customUrl && onUpdatePreview) {
      onUpdatePreview(customUrl);
      handleRefresh();
    }
  };

  // Handle share
  const handleShare = () => {
    if (onShare) {
      onShare(previewUrl);
    } else {
      // Fallback if no handler provided
      if (navigator.share) {
        navigator.share({
          title: 'Review Portal Preview',
          url: previewUrl
        });
      } else {
        navigator.clipboard.writeText(previewUrl).then(() => {
          setSnackbar({
            open: true,
            message: 'Link copied to clipboard',
            severity: 'success'
          });
        });
      }
    }
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getIframeUrl = () => {
    // Add refreshKey as a query parameter to prevent caching
    const separator = previewUrl.includes('?') ? '&' : '?';
    return `${previewUrl}${separator}_=${refreshKey}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Control bar */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            Portal Preview
          </Typography>
          
          <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
            <Select
              value={deviceType}
              onChange={handleDeviceChange}
              displayEmpty
              inputProps={{ 'aria-label': 'Device type' }}
            >
              <MenuItem value="desktop">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ComputerIcon fontSize="small" sx={{ mr: 1 }} />
                  Desktop
                </Box>
              </MenuItem>
              <MenuItem value="tablet">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TabletIcon fontSize="small" sx={{ mr: 1 }} />
                  Tablet
                </Box>
              </MenuItem>
              <MenuItem value="mobile">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                  Mobile
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Zoom">
            <Box sx={{ mx: 2, width: 100, display: { xs: 'none', sm: 'block' } }}>
              <Slider
                value={zoom}
                onChange={handleZoomChange}
                min={0.5}
                max={1.5}
                step={0.1}
                aria-label="Zoom"
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              />
            </Box>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Refresh preview">
            <IconButton onClick={handleRefresh} size="small" sx={{ mr: 1 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Share preview">
            <IconButton onClick={handleShare} size="small" sx={{ mr: 1 }}>
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download HTML">
            <IconButton 
              onClick={onDownload} 
              size="small" 
              sx={{ mr: 1 }}
              disabled={!onDownload}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="View code">
            <IconButton 
              onClick={onGenerateCode} 
              size="small"
              disabled={!onGenerateCode}
            >
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Tabs for preview sources */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        variant="fullWidth" 
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 2 }}
      >
        <Tab label="Live Preview" />
        <Tab label="Custom URL" />
      </Tabs>
      
      {/* Custom URL input */}
      {activeTab === 1 && (
        <Box sx={{ mb: 2, display: 'flex' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter custom preview URL"
            value={customUrl}
            onChange={handleCustomUrlChange}
            InputProps={{
              startAdornment: (
                <LinkIcon color="action" sx={{ mr: 1 }} />
              )
            }}
          />
          <Button
            variant="outlined"
            sx={{ ml: 1 }}
            onClick={handleLoadCustomUrl}
            startIcon={<SyncAltIcon />}
          >
            Load
          </Button>
        </Box>
      )}
      
      {/* Preview container */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <DeviceContainer deviceType={deviceType}>
          <DeviceHeader deviceType={deviceType} />
          
          {/* Portal header for tablet/mobile */}
          {deviceType !== 'desktop' && branding?.logo && (
            <Box 
              sx={{ 
                p: 1, 
                borderBottom: '1px solid #eee', 
                bgcolor: branding.colors?.header || 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src={branding.logo} 
                alt="Company Logo"
                style={{ 
                  maxHeight: 40, 
                  maxWidth: '80%'
                }}
              />
            </Box>
          )}
          
          {/* Browser header for desktop */}
          {deviceType === 'desktop' && (
            <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid #ddd' }}>
              <Toolbar variant="dense" sx={{ minHeight: '52px' }}>
                <IconButton size="small" sx={{ mr: 1 }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
                
                <TextField
                  size="small"
                  value={previewUrl}
                  disabled
                  fullWidth
                  InputProps={{
                    startAdornment: <LinkIcon fontSize="small" color="action" sx={{ mr: 1 }} />,
                  }}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '& .MuiInputBase-input': {
                      fontSize: '0.8rem',
                    }
                  }}
                />
              </Toolbar>
            </AppBar>
          )}
          
          <PreviewContainer deviceType={deviceType} zoom={zoom}>
            {loading ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%',
                  flexDirection: 'column'
                }}
              >
                <CircularProgress size={40} />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Loading preview...
                </Typography>
              </Box>
            ) : (
              <PreviewFrame
                src={getIframeUrl()}
                title="Review Portal Preview"
                id="portal-preview-frame"
              />
            )}
          </PreviewContainer>
        </DeviceContainer>
      </Box>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

ReviewPortalPreview.propTypes = {
  /** Portal configuration data */
  portalData: PropTypes.object,
  
  /** Preview URL */
  previewUrl: PropTypes.string.isRequired,
  
  /** Callback to update preview URL */
  onUpdatePreview: PropTypes.func,
  
  /** Callback to share preview */
  onShare: PropTypes.func,
  
  /** Callback to download HTML */
  onDownload: PropTypes.func,
  
  /** Callback to generate/view code */
  onGenerateCode: PropTypes.func,
  
  /** Branding information */
  branding: PropTypes.shape({
    logo: PropTypes.string,
    colors: PropTypes.object,
  }),
  
  /** Initial device type for preview */
  initialDeviceType: PropTypes.oneOf(['desktop', 'tablet', 'mobile']),
  
  /** Whether preview is loading */
  loading: PropTypes.bool
};

export default ReviewPortalPreview;
