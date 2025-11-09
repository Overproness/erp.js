import {
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Link as LinkIcon,
  MoreVert as MoreIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useState } from 'react';

/**
 * Quick review link creation widget with QR code generation and sharing options
 */
export const ReviewLinkGenerator = ({
  url,
  title = 'Review Link',
  description = 'Share this link with your customers to collect reviews',
  onCopy,
  onGenerateQr,
  onShare,
  onEmail,
  onSms,
  onEdit,
  editable = false,
  showQrCode = true,
  showSharingOptions = true,
  customMessage = '',
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [linkValue, setLinkValue] = useState(url);
  const [message, setMessage] = useState(customMessage);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [qrSize, setQrSize] = useState(128);

  // Handle link copy
  const handleCopy = () => {
    navigator.clipboard.writeText(linkValue);
    setSnackbar({
      open: true,
      message: 'Link copied to clipboard',
      severity: 'success',
    });

    if (onCopy) {
      onCopy(linkValue);
    }
  };

  // Handle QR code download
  const handleDownloadQr = () => {
    const canvas = document.getElementById('review-qr-code');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'review-qr-code.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setSnackbar({
        open: true,
        message: 'QR code downloaded',
        severity: 'success',
      });
    }

    if (onGenerateQr) {
      onGenerateQr(linkValue);
    }
  };

  // Handle share action
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Leave us a review',
          text: message || 'Please leave us a review',
          url: linkValue,
        })
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Link shared successfully',
            severity: 'success',
          });
        })
        .catch((error) => {
          console.error('Sharing failed:', error);
        });
    } else {
      handleCopy();
    }

    if (onShare) {
      onShare(linkValue, message);
    }
  };

  // Handle email share
  const handleEmailShare = () => {
    const emailSubject = 'Please leave us a review';
    const emailBody = `${message || 'We would appreciate your feedback!'}\n\n${linkValue}`;
    window.open(
      `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    );

    if (onEmail) {
      onEmail(linkValue, message);
    }
  };

  // Handle SMS share
  const handleSmsShare = () => {
    const smsBody = `${message || 'Please leave us a review'}: ${linkValue}`;
    window.open(`sms:?body=${encodeURIComponent(smsBody)}`);

    if (onSms) {
      onSms(linkValue, message);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle edit button click
  const handleEdit = () => {
    if (onEdit) {
      onEdit(linkValue);
    }
  };

  // Handle menu open
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle QR code size change
  const handleQrSizeChange = (size) => {
    setQrSize(size);
    handleMenuClose();
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          {editable && (
            <IconButton size="small" onClick={handleEdit} color="primary">
              <EditIcon />
            </IconButton>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            value={linkValue}
            onChange={(e) => editable && setLinkValue(e.target.value)}
            disabled={!editable}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Copy link">
                    <IconButton edge="end" onClick={handleCopy} size="small">
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              readOnly: !editable,
            }}
          />
        </Box>

        {showSharingOptions && (
          <Paper variant="outlined" sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<ShareIcon />} label="Share" />
              {showQrCode && <Tab icon={<QrCodeIcon />} label="QR Code" />}
            </Tabs>

            <Box p={2}>
              {activeTab === 0 ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Custom Message (optional)"
                    placeholder="We value your feedback! Please take a moment to share your experience with us."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="small"
                  />

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} justifyContent="center">
                    <Button variant="outlined" startIcon={<ShareIcon />} onClick={handleShare}>
                      Share
                    </Button>

                    <Button variant="outlined" startIcon={<EmailIcon />} onClick={handleEmailShare}>
                      Email
                    </Button>

                    <Button variant="outlined" startIcon={<SmsIcon />} onClick={handleSmsShare}>
                      SMS
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <QRCode
                      id="review-qr-code"
                      value={linkValue}
                      size={qrSize}
                      level="M"
                      includeMargin
                      renderAs="canvas"
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                      }}
                      size="small"
                      onClick={handleMenuOpen}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Button variant="contained" startIcon={<QrCodeIcon />} onClick={handleDownloadQr}>
                    Download QR Code
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        <Box sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            This link is optimized for review collection and tracks click-through rates. You can
            edit this link's settings at any time.
          </Typography>
        </Box>
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleQrSizeChange(128)}>Small (128px)</MenuItem>
        <MenuItem onClick={() => handleQrSizeChange(256)}>Medium (256px)</MenuItem>
        <MenuItem onClick={() => handleQrSizeChange(512)}>Large (512px)</MenuItem>
      </Menu>
    </Card>
  );
};

ReviewLinkGenerator.propTypes = {
  /** Review link URL */
  url: PropTypes.string.isRequired,

  /** Component title */
  title: PropTypes.string,

  /** Component description */
  description: PropTypes.string,

  /** Copy handler function */
  onCopy: PropTypes.func,

  /** QR code generator handler */
  onGenerateQr: PropTypes.func,

  /** Share handler function */
  onShare: PropTypes.func,

  /** Email share handler */
  onEmail: PropTypes.func,

  /** SMS share handler */
  onSms: PropTypes.func,

  /** Edit handler function */
  onEdit: PropTypes.func,

  /** Whether the link is editable */
  editable: PropTypes.bool,

  /** Whether to show QR code tab */
  showQrCode: PropTypes.bool,

  /** Whether to show sharing options */
  showSharingOptions: PropTypes.bool,

  /** Default custom message */
  customMessage: PropTypes.string,
};

export default ReviewLinkGenerator;
