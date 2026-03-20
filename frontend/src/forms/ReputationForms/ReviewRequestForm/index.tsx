import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Grid, FormControlLabel, Switch, InputLabel,
  MenuItem, FormControl, Select, Typography, Button, Alert,
  Divider, Chip, Paper, Tabs, Tab, Radio, RadioGroup,
  FormHelperText, IconButton, Stack, Tooltip, List, ListItem,
  ListItemText, ListItemIcon, Card, CardContent
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Campaign as CampaignIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';

const CHANNEL_TYPES = {
  EMAIL: 'email',
  SMS: 'sms'
};

const FREQUENCY_TYPES = {
  ONE_TIME: 'one_time',
  SCHEDULED: 'scheduled',
  AUTOMATED: 'automated'
};

const ReviewRequestForm = ({
  initialValues = {},
  onSubmit,
  loading = false,
  submitButtonText = 'Create Campaign',
  error = null,
  success = null,
  platforms = [],
  reviewLinks = []
}) => {
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    active: true,
    recipients: [],
    recipientType: 'csv',
    recipientSource: '',
    channel: CHANNEL_TYPES.EMAIL,
    frequency: FREQUENCY_TYPES.ONE_TIME,
    schedule: {
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: null,
      sendTime: '10:00',
      repeatEvery: 7, // Days
      daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    },
    content: {
      emailSubject: 'We value your feedback!',
      emailBody: 'Dear {{customerName}},\n\nThank you for choosing our services. We would greatly appreciate it if you could take a moment to share your experience.\n\nClick the link below to leave a review:\n{{reviewLink}}\n\nThank you for your time!\n\nBest regards,\n{{businessName}}',
      smsText: 'Thank you for choosing {{businessName}}! We value your feedback. Please share your experience: {{reviewLink}}',
    },
    reviewLinkId: '',
    platformId: '',
    delayAfterService: 2, // days
    reminders: [
      {
        days: 3,
        enabled: true,
        message: 'Just a friendly reminder to share your feedback. {{reviewLink}}'
      }
    ],
    settings: {
      limitRequestsPerCustomer: true,
      requestsLimit: 1,
      minimumDaysBetweenRequests: 90,
      preventPreviousReviewers: true,
      smartSending: true,
      sendingTimeWindow: '09:00-17:00',
      throttleRate: 50 // per hour
    },
    ...initialValues
  });

  const [formErrors, setFormErrors] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [testRecipient, setTestRecipient] = useState('');

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!formValues.name?.trim()) {
      errors.name = 'Campaign name is required';
    }

    if (formValues.recipients.length === 0 && formValues.recipientType === 'manual') {
      errors.recipients = 'At least one recipient is required';
    }

    if (formValues.recipientType === 'csv' && !formValues.recipientSource?.trim()) {
      errors.recipientSource = 'Please select a recipient source';
    }

    if (formValues.channel === CHANNEL_TYPES.EMAIL) {
      if (!formValues.content.emailSubject?.trim()) {
        errors.emailSubject = 'Email subject is required';
      }
      if (!formValues.content.emailBody?.trim()) {
        errors.emailBody = 'Email body is required';
      }
    } else if (formValues.channel === CHANNEL_TYPES.SMS) {
      if (!formValues.content.smsText?.trim()) {
        errors.smsText = 'SMS text is required';
      } else if (formValues.content.smsText.length > 160) {
        errors.smsText = 'SMS text must be 160 characters or less';
      }
    }

    if (formValues.frequency !== FREQUENCY_TYPES.ONE_TIME) {
      if (!formValues.schedule.startDate) {
        errors.startDate = 'Start date is required for scheduled campaigns';
      }
      if (formValues.frequency === FREQUENCY_TYPES.SCHEDULED && !formValues.schedule.endDate) {
        errors.endDate = 'End date is required for scheduled campaigns';
      }
    }

    // Validate all recipient emails if manually added
    if (formValues.recipientType === 'manual') {
      const invalidEmails = formValues.recipients.filter(r => !isValidEmail(r.email));
      if (invalidEmails.length > 0) {
        errors.recipients = `${invalidEmails.length} invalid email(s)`;
      }
    }

    if (!formValues.reviewLinkId && !formValues.platformId) {
      errors.reviewLink = 'Please select a review link or platform';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Email validation
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Phone validation
  const isValidPhone = (phone) => {
    return /^\+?[\d\s-]{10,15}$/.test(phone);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormValues(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  // Add recipient
  const handleAddRecipient = () => {
    if (!testRecipient) return;
    
    let type = 'email';
    let value = testRecipient;
    
    if (isValidPhone(testRecipient)) {
      type = 'phone';
    } else if (!isValidEmail(testRecipient)) {
      setFormErrors(prev => ({ ...prev, testRecipient: 'Please enter a valid email or phone' }));
      return;
    }
    
    setFormValues(prev => ({
      ...prev,
      recipients: [...prev.recipients, { 
        id: Date.now().toString(),
        type,
        value,
        name: '',
        metadata: {} 
      }]
    }));
    
    setTestRecipient('');
    setFormErrors(prev => ({ ...prev, testRecipient: null, recipients: null }));
  };

  // Remove recipient
  const handleRemoveRecipient = (id) => {
    setFormValues(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r.id !== id)
    }));
  };

  // Add reminder
  const handleAddReminder = () => {
    const newReminder = {
      days: formValues.reminders.length === 0 ? 3 : formValues.reminders[formValues.reminders.length - 1].days + 3,
      enabled: true,
      message: 'We noticed you haven\'t left a review yet. We would still love to hear from you: {{reviewLink}}'
    };
    
    setFormValues(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder]
    }));
  };

  // Remove reminder
  const handleRemoveReminder = (index) => {
    setFormValues(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  // Handle reminder change
  const handleReminderChange = (index, field, value) => {
    setFormValues(prev => ({
      ...prev,
      reminders: prev.reminders.map((reminder, i) => {
        if (i === index) {
          return { ...reminder, [field]: value };
        }
        return reminder;
      })
    }));
  };

  // Handle schedule setting change
  const handleScheduleChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }));
  };

  // Handle settings change
  const handleSettingsChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  // Handle batch import of recipients
  const handleBatchImport = (recipientsData) => {
    // This would be implemented to handle CSV or integration import
    console.log('Importing batch recipients:', recipientsData);
  };

  // Preview content with variables replaced
  const previewContent = () => {
    const replacements = {
      customerName: 'John Doe',
      businessName: 'Your Business',
      reviewLink: 'https://review.example.com/abcd1234',
      date: new Date().toLocaleDateString()
    };
    
    let content = formValues.channel === CHANNEL_TYPES.EMAIL 
      ? formValues.content.emailBody 
      : formValues.content.smsText;
      
    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return content;
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<CampaignIcon />} label="Campaign Details" iconPosition="start" />
          <Tab icon={<PeopleIcon />} label="Recipients" iconPosition="start" />
          <Tab icon={<EmailIcon />} label="Message" iconPosition="start" />
          <Tab icon={<ScheduleIcon />} label="Schedule" iconPosition="start" />
          <Tab icon={<SettingsIcon />} label="Settings" iconPosition="start" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Campaign Details */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Campaign Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Campaign Name"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name || 'Name for your review request campaign'}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.active}
                      onChange={handleChange}
                      name="active"
                      color="primary"
                    />
                  }
                  label="Campaign active"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  name="description"
                  value={formValues.description}
                  onChange={handleChange}
                  helperText="Internal description of this campaign's purpose"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Send Method
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    name="channel"
                    value={formValues.channel}
                    onChange={handleChange}
                  >
                    <FormControlLabel 
                      value={CHANNEL_TYPES.EMAIL} 
                      control={<Radio />} 
                      label="Email" 
                    />
                    <FormControlLabel 
                      value={CHANNEL_TYPES.SMS} 
                      control={<Radio />} 
                      label="SMS" 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Review Collection
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.reviewLink}>
                  <InputLabel>Review Link</InputLabel>
                  <Select
                    name="reviewLinkId"
                    value={formValues.reviewLinkId}
                    onChange={handleChange}
                    label="Review Link"
                  >
                    <MenuItem value="">
                      <em>None (use platform directly)</em>
                    </MenuItem>
                    {reviewLinks.map(link => (
                      <MenuItem key={link.id} value={link.id}>
                        {link.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.reviewLink && (
                    <FormHelperText>{formErrors.reviewLink}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!!formValues.reviewLinkId}>
                  <InputLabel>Direct Platform</InputLabel>
                  <Select
                    name="platformId"
                    value={formValues.platformId}
                    onChange={handleChange}
                    label="Direct Platform"
                  >
                    <MenuItem value="">
                      <em>None (use review link)</em>
                    </MenuItem>
                    {platforms.map(platform => (
                      <MenuItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formValues.reviewLinkId ? 'Using review link instead of direct platform' : 'Direct link to platform review page'}
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Delay After Service (Days)"
                  name="delayAfterService"
                  value={formValues.delayAfterService}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 30 }}
                  helperText="How many days to wait after service before sending request"
                />
              </Grid>
            </Grid>
          )}
          
          {/* Recipients */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Recipients
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    name="recipientType"
                    value={formValues.recipientType}
                    onChange={handleChange}
                  >
                    <FormControlLabel 
                      value="manual" 
                      control={<Radio />} 
                      label="Add recipients manually" 
                    />
                    <FormControlLabel 
                      value="csv" 
                      control={<Radio />} 
                      label="Import from CSV or integration" 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              
              {formValues.recipientType === 'manual' ? (
                <>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <TextField
                        fullWidth
                        label="Add Recipient"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        error={!!formErrors.testRecipient}
                        helperText={formErrors.testRecipient || `Enter email or phone number for ${formValues.channel === CHANNEL_TYPES.EMAIL ? 'email' : 'SMS'}`}
                        sx={{ mr: 1 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddRecipient}
                        startIcon={<AddIcon />}
                        sx={{ mt: 1 }}
                      >
                        Add
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    {formErrors.recipients && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {formErrors.recipients}
                      </Alert>
                    )}
                    
                    <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                      <List dense>
                        {formValues.recipients.length === 0 ? (
                          <ListItem>
                            <ListItemText primary="No recipients added yet" />
                          </ListItem>
                        ) : (
                          formValues.recipients.map((recipient) => (
                            <ListItem
                              key={recipient.id}
                              secondaryAction={
                                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveRecipient(recipient.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              }
                            >
                              <ListItemIcon>
                                {recipient.type === 'email' ? <EmailIcon /> : <SmsIcon />}
                              </ListItemIcon>
                              <ListItemText 
                                primary={recipient.value}
                                secondary={recipient.name || '(No name provided)'}
                              />
                            </ListItem>
                          ))
                        )}
                      </List>
                    </Paper>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.recipientSource}>
                    <InputLabel>Recipient Source</InputLabel>
                    <Select
                      name="recipientSource"
                      value={formValues.recipientSource}
                      onChange={handleChange}
                      label="Recipient Source"
                    >
                      <MenuItem value="customers">Customer Database</MenuItem>
                      <MenuItem value="recent_customers">Recent Customers (Last 30 Days)</MenuItem>
                      <MenuItem value="csv_upload">Upload CSV File</MenuItem>
                    </Select>
                    {formErrors.recipientSource && (
                      <FormHelperText>{formErrors.recipientSource}</FormHelperText>
                    )}
                  </FormControl>
                  
                  {formValues.recipientSource === 'csv_upload' && (
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        variant="outlined" 
                        component="label"
                        fullWidth
                      >
                        Upload CSV File
                        <input
                          type="file"
                          accept=".csv"
                          hidden
                          onChange={(e) => {
                            // Handle file upload
                            console.log('File selected:', e.target.files[0]);
                          }}
                        />
                      </Button>
                      <FormHelperText>
                        CSV should include headers: email, name (optional), phone (optional)
                      </FormHelperText>
                    </Box>
                  )}
                </Grid>
              )}
            </Grid>
          )}
          
          {/* Message Content */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Message Content
                </Typography>
              </Grid>
              
              {formValues.channel === CHANNEL_TYPES.EMAIL ? (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Email Subject"
                      name="content.emailSubject"
                      value={formValues.content.emailSubject}
                      onChange={handleChange}
                      error={!!formErrors.emailSubject}
                      helperText={formErrors.emailSubject}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      rows={8}
                      label="Email Body"
                      name="content.emailBody"
                      value={formValues.content.emailBody}
                      onChange={handleChange}
                      error={!!formErrors.emailBody}
                      helperText={formErrors.emailBody}
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    label="SMS Text"
                    name="content.smsText"
                    value={formValues.content.smsText}
                    onChange={handleChange}
                    error={!!formErrors.smsText}
                    helperText={formErrors.smsText || `${formValues.content.smsText?.length || 0}/160 characters`}
                    inputProps={{ maxLength: 160 }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Available Variables
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="{{customerName}}" variant="outlined" onClick={() => {
                    // Copy to clipboard or insert at cursor position
                  }} />
                  <Chip label="{{businessName}}" variant="outlined" />
                  <Chip label="{{reviewLink}}" variant="outlined" />
                  <Chip label="{{date}}" variant="outlined" />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Reminders
                </Typography>
              </Grid>
              
              {formValues.reminders.map((reminder, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1">
                          Reminder #{index + 1}
                        </Typography>
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={reminder.enabled}
                                onChange={(e) => handleReminderChange(index, 'enabled', e.target.checked)}
                              />
                            }
                            label="Enabled"
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveReminder(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Send after (days)"
                            value={reminder.days}
                            onChange={(e) => handleReminderChange(index, 'days', parseInt(e.target.value) || 0)}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Reminder Message"
                            value={reminder.message}
                            onChange={(e) => handleReminderChange(index, 'message', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Button 
                  startIcon={<AddIcon />}
                  onClick={handleAddReminder}
                  disabled={formValues.reminders.length >= 3}
                >
                  Add Reminder
                </Button>
                {formValues.reminders.length >= 3 && (
                  <FormHelperText>Maximum 3 reminders allowed</FormHelperText>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Message Preview
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                    {previewContent()}
                  </Typography>
                </Paper>
                
                <Button
                  startIcon={<ContentCopyIcon />}
                  onClick={() => {
                    navigator.clipboard.writeText(previewContent());
                    setNotification('Preview copied to clipboard');
                  }}
                  size="small"
                >
                  Copy preview
                </Button>
              </Grid>
            </Grid>
          )}
          
          {/* Schedule */}
          {tabValue === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Schedule
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    name="frequency"
                    value={formValues.frequency}
                    onChange={handleChange}
                  >
                    <FormControlLabel 
                      value={FREQUENCY_TYPES.ONE_TIME} 
                      control={<Radio />} 
                      label="One-time" 
                    />
                    <FormControlLabel 
                      value={FREQUENCY_TYPES.SCHEDULED} 
                      control={<Radio />} 
                      label="Scheduled" 
                    />
                    <FormControlLabel 
                      value={FREQUENCY_TYPES.AUTOMATED} 
                      control={<Radio />} 
                      label="Automated (After service/transaction)" 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              
              {formValues.frequency !== FREQUENCY_TYPES.ONE_TIME && (
                <>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Start Date"
                        value={formValues.schedule.startDate}
                        onChange={(newValue) => handleScheduleChange('startDate', newValue)}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth 
                            required
                            error={!!formErrors.startDate}
                            helperText={formErrors.startDate}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  {formValues.frequency === FREQUENCY_TYPES.SCHEDULED && (
                    <Grid item xs={12} md={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                          label="End Date (Optional)"
                          value={formValues.schedule.endDate}
                          onChange={(newValue) => handleScheduleChange('endDate', newValue)}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              error={!!formErrors.endDate}
                              helperText={formErrors.endDate || 'Leave empty for no end date'}
                            />
                          )}
                        />
                      </LocalizationProvider>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Send Time"
                      type="time"
                      name="schedule.sendTime"
                      value={formValues.schedule.sendTime}
                      onChange={(e) => handleScheduleChange('sendTime', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 300, // 5 min
                      }}
                    />
                  </Grid>
                  
                  {formValues.frequency === FREQUENCY_TYPES.SCHEDULED && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Repeat Every (Days)"
                        value={formValues.schedule.repeatEvery}
                        onChange={(e) => handleScheduleChange('repeatEvery', parseInt(e.target.value) || 7)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  )}
                </>
              )}
              
              {formValues.frequency === FREQUENCY_TYPES.ONE_TIME && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    One-time campaigns will be sent immediately after saving.
                  </Alert>
                </Grid>
              )}
              
              {formValues.frequency === FREQUENCY_TYPES.AUTOMATED && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Automated campaigns will be sent based on customer activity triggers.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
          
          {/* Settings */}
          {tabValue === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Campaign Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.settings.limitRequestsPerCustomer}
                      onChange={(e) => handleSettingsChange('limitRequestsPerCustomer', e.target.checked)}
                      name="settings.limitRequestsPerCustomer"
                    />
                  }
                  label="Limit requests per customer"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Requests Per Customer"
                  value={formValues.settings.requestsLimit}
                  onChange={(e) => handleSettingsChange('requestsLimit', parseInt(e.target.value) || 1)}
                  disabled={!formValues.settings.limitRequestsPerCustomer}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Days Between Requests"
                  value={formValues.settings.minimumDaysBetweenRequests}
                  onChange={(e) => handleSettingsChange('minimumDaysBetweenRequests', parseInt(e.target.value) || 30)}
                  disabled={!formValues.settings.limitRequestsPerCustomer}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.settings.preventPreviousReviewers}
                      onChange={(e) => handleSettingsChange('preventPreviousReviewers', e.target.checked)}
                      name="settings.preventPreviousReviewers"
                    />
                  }
                  label="Prevent sending to customers who already left a review"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Smart Sending
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.settings.smartSending}
                      onChange={(e) => handleSettingsChange('smartSending', e.target.checked)}
                      name="settings.smartSending"
                    />
                  }
                  label="Enable smart sending"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Smart sending optimizes delivery times based on recipient activity patterns
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sending Time Window"
                  value={formValues.settings.sendingTimeWindow}
                  onChange={(e) => handleSettingsChange('sendingTimeWindow', e.target.value)}
                  disabled={!formValues.settings.smartSending}
                  helperText="Format: HH:MM-HH:MM (24-hour format)"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Throttle Rate (per hour)"
                  value={formValues.settings.throttleRate}
                  onChange={(e) => handleSettingsChange('throttleRate', parseInt(e.target.value) || 50)}
                  inputProps={{ min: 1 }}
                  helperText="Maximum number of messages to send per hour"
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={<CampaignIcon />}
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Processing...' : submitButtonText}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewRequestForm;
