import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Grid, FormControlLabel, Switch, InputLabel,
  MenuItem, FormControl, Select, Typography, Button, Alert,
  Divider, Accordion, AccordionSummary, AccordionDetails, Tabs,
  Tab, Card, CardContent, Paper, FormHelperText, Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  WebAsset as WebAssetIcon,
  TextFields as TextFieldsIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  DynamicFeed as DynamicFeedIcon,
  Save as SaveIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { ColorPicker } from '../../../components/common/ColorPicker';

const ReviewPortalForm = ({
  initialValues = {},
  onUpdate,
  loading = false,
  error = null,
  success = null,
  onPreview = () => {}
}) => {
  const [settings, setSettings] = useState({
    title: 'Review Portal',
    description: 'Share your experience with us!',
    branding: {
      logo: '',
      colors: {
        primary: '#3f51b5',
        secondary: '#f50057',
        background: '#ffffff',
        text: '#212121'
      },
      customCss: '',
      showBranding: true
    },
    layout: 'standard',
    fields: {
      name: { required: true, visible: true, label: 'Your Name' },
      email: { required: true, visible: true, label: 'Email Address' },
      phone: { required: false, visible: true, label: 'Phone Number' },
      rating: { required: true, visible: true, label: 'Your Rating' },
      review: { required: true, visible: true, label: 'Your Review' },
      title: { required: false, visible: true, label: 'Review Title' },
      photo: { required: false, visible: true, label: 'Upload Photos' }
    },
    privacy: {
      consentRequired: true,
      consentText: 'I agree to the privacy policy and terms of service.',
      privacyPolicyUrl: '',
      termsUrl: '',
      dataRetentionDays: 365
    },
    notifications: {
      sendEmailNotification: true,
      emailRecipients: '',
      notifyOnNegativeReviews: true
    },
    security: {
      captcha: true,
      preventDuplicates: true,
      moderationEnabled: false
    },
    thankYouPage: {
      message: 'Thank you for your review!',
      redirectUrl: '',
      redirectDelay: 3
    },
    advanced: {
      customHeaderHtml: '',
      customJavascript: '',
      trackingCodes: ''
    },
    ...initialValues
  });

  const [tabValue, setTabValue] = useState(0);
  const [errors, setErrors] = useState({});
  const [dirtyFields, setDirtyFields] = useState({});
  const [filePreview, setFilePreview] = useState(settings.branding.logo || null);

  // Effect to update logo preview when initialValues change
  useEffect(() => {
    if (initialValues?.branding?.logo) {
      setFilePreview(initialValues.branding.logo);
    }
  }, [initialValues?.branding?.logo]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!settings.title.trim()) {
      newErrors.title = 'Portal title is required';
    }
    
    if (settings.notifications.sendEmailNotification && !settings.notifications.emailRecipients) {
      newErrors.emailRecipients = 'Email recipients are required when notifications are enabled';
    }
    
    if (settings.thankYouPage.redirectUrl && !isValidUrl(settings.thankYouPage.redirectUrl)) {
      newErrors.redirectUrl = 'Please enter a valid URL';
    }
    
    if (settings.privacy.privacyPolicyUrl && !isValidUrl(settings.privacy.privacyPolicyUrl)) {
      newErrors.privacyPolicyUrl = 'Please enter a valid URL';
    }
    
    if (settings.privacy.termsUrl && !isValidUrl(settings.privacy.termsUrl)) {
      newErrors.termsUrl = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // URL validation helper
  const isValidUrl = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Handle basic settings change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Mark field as dirty
    setDirtyFields(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Handle nested properties with dot notation (e.g., "branding.showBranding")
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle deeply nested settings change
  const handleNestedChange = (section, field, value) => {
    // Mark field as dirty
    setDirtyFields(prev => ({
      ...prev,
      [`${section}.${field}`]: true
    }));
    
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle deeply nested settings with multiple levels
  const handleDeepNestedChange = (section, subsection, field, value) => {
    // Mark field as dirty
    setDirtyFields(prev => ({
      ...prev,
      [`${section}.${subsection}.${field}`]: true
    }));
    
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  // Handle color change
  const handleColorChange = (color, field) => {
    // Mark field as dirty
    setDirtyFields(prev => ({
      ...prev,
      [`branding.colors.${field}`]: true
    }));
    
    setSettings(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        colors: {
          ...prev.branding.colors,
          [field]: color
        }
      }
    }));
  };

  // Handle field settings change
  const handleFieldChange = (fieldName, property, value) => {
    // Mark field as dirty
    setDirtyFields(prev => ({
      ...prev,
      [`fields.${fieldName}.${property}`]: true
    }));
    
    setSettings(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          [property]: value
        }
      }
    }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle form submission
  const handleSave = () => {
    if (validateForm()) {
      onUpdate(settings);
    }
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Mark logo as dirty
    setDirtyFields(prev => ({
      ...prev,
      'branding.logo': true
    }));
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setFilePreview(dataUrl);
      
      setSettings(prev => ({
        ...prev,
        branding: {
          ...prev.branding,
          logo: dataUrl
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle preview button click
  const handlePreview = () => {
    onPreview(settings);
  };

  // Import/Export settings
  const exportSettings = () => {
    const settingsJson = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portal-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import settings from file
  const importSettings = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedSettings = JSON.parse(event.target.result);
        setSettings(importedSettings);
        setFilePreview(importedSettings.branding?.logo || null);
        
        // Mark all fields as dirty since we're replacing everything
        setDirtyFields({});
      } catch (error) {
        console.error('Invalid settings file:', error);
        setErrors(prev => ({ ...prev, import: 'Invalid settings file format' }));
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box>
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
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={handlePreview}
            startIcon={<PreviewIcon />}
          >
            Preview Portal
          </Button>
        </Stack>
        
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={exportSettings}>
            Export Settings
          </Button>
          
          <Button variant="outlined" component="label">
            Import Settings
            <input
              type="file"
              hidden
              accept="application/json"
              onChange={importSettings}
            />
          </Button>
        </Stack>
      </Box>
      
      {errors.import && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.import}
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
          <Tab icon={<WebAssetIcon />} label="Basic Settings" iconPosition="start" />
          <Tab icon={<PaletteIcon />} label="Branding & Design" iconPosition="start" />
          <Tab icon={<DynamicFeedIcon />} label="Form Fields" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="Privacy & Security" iconPosition="start" />
          <Tab icon={<CodeIcon />} label="Advanced" iconPosition="start" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Basic Settings Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Portal Title"
                  name="title"
                  value={settings.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title || 'The title displayed at the top of your review portal'}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Layout</InputLabel>
                  <Select
                    name="layout"
                    value={settings.layout}
                    onChange={handleChange}
                    label="Layout"
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="compact">Compact</MenuItem>
                    <MenuItem value="step-by-step">Step by Step</MenuItem>
                    <MenuItem value="card">Card Layout</MenuItem>
                  </Select>
                  <FormHelperText>
                    Select the layout style for your review form
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={settings.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  helperText="Short description or instructions for reviewers"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Thank You Page
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Thank You Message"
                  name="thankYouPage.message"
                  value={settings.thankYouPage.message}
                  onChange={(e) => handleNestedChange('thankYouPage', 'message', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Redirect URL (Optional)"
                  name="thankYouPage.redirectUrl"
                  value={settings.thankYouPage.redirectUrl}
                  onChange={(e) => handleNestedChange('thankYouPage', 'redirectUrl', e.target.value)}
                  error={!!errors.redirectUrl}
                  helperText={errors.redirectUrl || 'Redirect users after submission (leave empty for no redirect)'}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Redirect Delay (seconds)"
                  name="thankYouPage.redirectDelay"
                  value={settings.thankYouPage.redirectDelay}
                  onChange={(e) => handleNestedChange('thankYouPage', 'redirectDelay', 
                    parseInt(e.target.value) || 0)}
                  type="number"
                  inputProps={{ min: 0, max: 60 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Notifications
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.sendEmailNotification}
                      onChange={(e) => handleNestedChange('notifications', 'sendEmailNotification', e.target.checked)}
                      name="notifications.sendEmailNotification"
                    />
                  }
                  label="Send email notifications for new reviews"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.notifyOnNegativeReviews}
                      onChange={(e) => handleNestedChange('notifications', 'notifyOnNegativeReviews', e.target.checked)}
                      name="notifications.notifyOnNegativeReviews"
                    />
                  }
                  label="Priority notifications for negative reviews"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Recipients"
                  name="notifications.emailRecipients"
                  value={settings.notifications.emailRecipients}
                  onChange={(e) => handleNestedChange('notifications', 'emailRecipients', e.target.value)}
                  disabled={!settings.notifications.sendEmailNotification}
                  error={!!errors.emailRecipients}
                  helperText={errors.emailRecipients || 'Comma-separated email addresses'}
                />
              </Grid>
            </Grid>
          )}
          
          {/* Branding & Design Tab */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Logo
                    </Typography>
                    
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                      {filePreview ? (
                        <Box sx={{ textAlign: 'center' }}>
                          <img 
                            src={filePreview} 
                            alt="Logo" 
                            style={{ maxWidth: '100%', maxHeight: 100 }} 
                          />
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={() => {
                              setFilePreview(null);
                              setSettings(prev => ({
                                ...prev,
                                branding: {
                                  ...prev.branding,
                                  logo: ''
                                }
                              }));
                              setDirtyFields(prev => ({
                                ...prev,
                                'branding.logo': true
                              }));
                            }}
                            sx={{ mt: 1 }}
                          >
                            Remove Logo
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          component="label"
                        >
                          Upload Logo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                        </Button>
                      )}
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.branding.showBranding}
                          onChange={(e) => handleNestedChange('branding', 'showBranding', e.target.checked)}
                          name="branding.showBranding"
                        />
                      }
                      label="Display branding elements"
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Colors
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <InputLabel sx={{ width: 150 }}>Primary Color:</InputLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ColorPicker
                            color={settings.branding.colors.primary}
                            onChange={(color) => handleColorChange(color, 'primary')}
                          />
                          <TextField
                            size="small"
                            value={settings.branding.colors.primary}
                            onChange={(e) => handleColorChange(e.target.value, 'primary')}
                            sx={{ ml: 2, width: 120 }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <InputLabel sx={{ width: 150 }}>Secondary Color:</InputLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ColorPicker
                            color={settings.branding.colors.secondary}
                            onChange={(color) => handleColorChange(color, 'secondary')}
                          />
                          <TextField
                            size="small"
                            value={settings.branding.colors.secondary}
                            onChange={(e) => handleColorChange(e.target.value, 'secondary')}
                            sx={{ ml: 2, width: 120 }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <InputLabel sx={{ width: 150 }}>Background Color:</InputLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ColorPicker
                            color={settings.branding.colors.background}
                            onChange={(color) => handleColorChange(color, 'background')}
                          />
                          <TextField
                            size="small"
                            value={settings.branding.colors.background}
                            onChange={(e) => handleColorChange(e.target.value, 'background')}
                            sx={{ ml: 2, width: 120 }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InputLabel sx={{ width: 150 }}>Text Color:</InputLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ColorPicker
                            color={settings.branding.colors.text}
                            onChange={(color) => handleColorChange(color, 'text')}
                          />
                          <TextField
                            size="small"
                            value={settings.branding.colors.text}
                            onChange={(e) => handleColorChange(e.target.value, 'text')}
                            sx={{ ml: 2, width: 120 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Custom CSS
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      name="branding.customCss"
                      value={settings.branding.customCss}
                      onChange={(e) => handleNestedChange('branding', 'customCss', e.target.value)}
                      placeholder=".review-portal-container { box-shadow: 0 0 10px rgba(0,0,0,0.1); }"
                      helperText="Add custom CSS to further customize your review portal"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          
          {/* Form Fields Tab */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure which fields are visible and required in your review form.
                </Typography>
              </Grid>
              
              {Object.entries(settings.fields).map(([fieldName, fieldConfig]) => (
                <Grid item xs={12} key={fieldName}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2">
                            {fieldConfig.label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Field Label"
                            value={fieldConfig.label || ''}
                            onChange={(e) => handleFieldChange(fieldName, 'label', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={fieldConfig.visible}
                                onChange={(e) => handleFieldChange(fieldName, 'visible', e.target.checked)}
                                name={`${fieldName}-visible`}
                              />
                            }
                            label="Visible"
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={fieldConfig.required}
                                onChange={(e) => handleFieldChange(fieldName, 'required', e.target.checked)}
                                name={`${fieldName}-required`}
                                disabled={!fieldConfig.visible}
                              />
                            }
                            label="Required"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              <Grid item xs={12} mt={2}>
                <Alert severity="info">
                  Note: The "rating" field is essential for review collection and cannot be disabled completely.
                </Alert>
              </Grid>
            </Grid>
          )}
          
          {/* Privacy & Security Tab */}
          {tabValue === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Privacy Settings
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.privacy.consentRequired}
                              onChange={(e) => handleNestedChange('privacy', 'consentRequired', e.target.checked)}
                              name="privacy.consentRequired"
                            />
                          }
                          label="Require consent to privacy policy"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Consent Text"
                          name="privacy.consentText"
                          value={settings.privacy.consentText}
                          onChange={(e) => handleNestedChange('privacy', 'consentText', e.target.value)}
                          disabled={!settings.privacy.consentRequired}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Privacy Policy URL"
                          name="privacy.privacyPolicyUrl"
                          value={settings.privacy.privacyPolicyUrl}
                          onChange={(e) => handleNestedChange('privacy', 'privacyPolicyUrl', e.target.value)}
                          error={!!errors.privacyPolicyUrl}
                          helperText={errors.privacyPolicyUrl}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Terms of Service URL"
                          name="privacy.termsUrl"
                          value={settings.privacy.termsUrl}
                          onChange={(e) => handleNestedChange('privacy', 'termsUrl', e.target.value)}
                          error={!!errors.termsUrl}
                          helperText={errors.termsUrl}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Data Retention (days)"
                          name="privacy.dataRetentionDays"
                          value={settings.privacy.dataRetentionDays}
                          onChange={(e) => handleNestedChange('privacy', 'dataRetentionDays', 
                            parseInt(e.target.value) || 0)}
                          type="number"
                          inputProps={{ min: 1 }}
                          helperText="How long to store review data"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Security Settings
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.security.captcha}
                              onChange={(e) => handleNestedChange('security', 'captcha', e.target.checked)}
                              name="security.captcha"
                            />
                          }
                          label="Enable CAPTCHA"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.security.preventDuplicates}
                              onChange={(e) => handleNestedChange('security', 'preventDuplicates', e.target.checked)}
                              name="security.preventDuplicates"
                            />
                          }
                          label="Prevent duplicate submissions"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.security.moderationEnabled}
                              onChange={(e) => handleNestedChange('security', 'moderationEnabled', e.target.checked)}
                              name="security.moderationEnabled"
                            />
                          }
                          label="Enable moderation"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          
          {/* Advanced Tab */}
          {tabValue === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Custom HTML & JavaScript
                    </Typography>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Custom HTML Header</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          name="advanced.customHeaderHtml"
                          value={settings.advanced.customHeaderHtml || ''}
                          onChange={(e) => handleNestedChange('advanced', 'customHeaderHtml', e.target.value)}
                          placeholder="<meta name='description' content='Leave a review'>"
                          helperText="Custom HTML code to inject in the <head> section"
                        />
                      </AccordionDetails>
                    </Accordion>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Custom JavaScript</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          name="advanced.customJavascript"
                          value={settings.advanced.customJavascript || ''}
                          onChange={(e) => handleNestedChange('advanced', 'customJavascript', e.target.value)}
                          placeholder="// Custom JavaScript code"
                          helperText="Custom JavaScript to add additional functionality"
                        />
                      </AccordionDetails>
                    </Accordion>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Tracking Codes</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          name="advanced.trackingCodes"
                          value={settings.advanced.trackingCodes || ''}
                          onChange={(e) => handleNestedChange('advanced', 'trackingCodes', e.target.value)}
                          placeholder="<!-- Google Analytics, Facebook Pixel, etc. -->"
                          helperText="Add analytics and tracking codes to your review portal"
                        />
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
          startIcon={<SaveIcon />}
          size="large"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewPortalForm;
