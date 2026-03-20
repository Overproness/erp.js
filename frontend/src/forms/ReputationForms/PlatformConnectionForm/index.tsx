import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Grid, Typography, Button, Alert, 
  CircularProgress, Stepper, Step, StepLabel, StepContent,
  Paper, IconButton, InputAdornment, FormControlLabel, Switch,
  FormHelperText, Divider, Link, Collapse
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Help as HelpIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

const PLATFORM_CONFIG = {
  google: {
    name: 'Google Business Profile',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'locationId', label: 'Location ID', type: 'text', required: true },
      { name: 'accountEmail', label: 'Account Email', type: 'email', required: true }
    ],
    helpText: 'To find your Location ID, go to your Google Business Profile dashboard and find it in the "Info" tab.',
    helpLink: 'https://support.google.com/business/answer/7035772',
    icon: 'fab fa-google'
  },
  facebook: {
    name: 'Facebook',
    fields: [
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { name: 'pageId', label: 'Page ID', type: 'text', required: true }
    ],
    helpText: 'You need a Facebook Page Access Token with permission to read reviews.',
    helpLink: 'https://developers.facebook.com/docs/pages/access-tokens',
    icon: 'fab fa-facebook'
  },
  yelp: {
    name: 'Yelp',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'businessId', label: 'Business ID', type: 'text', required: true }
    ],
    helpText: 'You can find your Business ID in the URL of your Yelp business page.',
    helpLink: 'https://www.yelp.com/developers/documentation/v3',
    icon: 'fab fa-yelp'
  },
  trustpilot: {
    name: 'Trustpilot',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'businessUnitId', label: 'Business Unit ID', type: 'text', required: true },
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true }
    ],
    helpText: 'You need to register an API application in Trustpilot\'s developer portal.',
    helpLink: 'https://developers.trustpilot.com/',
    icon: 'fas fa-star'
  },
  custom: {
    name: 'Custom Integration',
    fields: [
      { name: 'url', label: 'API Endpoint URL', type: 'text', required: true },
      { name: 'authToken', label: 'Authentication Token', type: 'password', required: true },
      { name: 'dataFormat', label: 'Data Format', type: 'text', required: false }
    ],
    helpText: 'Custom integration for other review platforms via API.',
    icon: 'fas fa-cogs'
  }
};

// Connection setup steps
const SETUP_STEPS = [
  {
    label: 'Choose Platform',
    description: 'Select the review platform you want to connect'
  },
  {
    label: 'Enter Credentials',
    description: 'Enter the required API credentials for the selected platform'
  },
  {
    label: 'Test Connection',
    description: 'Test the connection with the provided credentials'
  },
  {
    label: 'Configure Settings',
    description: 'Configure additional settings for the platform'
  }
];

const PlatformConnectionForm = ({
  platformId = '',
  platformName = '',
  onSubmit,
  onTestConnection,
  isSubmitting = false,
  error = null,
  initialValues = {}
}) => {
  // Get platform configuration or use default
  const platformConfig = PLATFORM_CONFIG[platformId] || {
    name: platformName || 'Unknown Platform',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true }
    ],
    helpText: 'Please enter the required credentials for this platform.'
  };

  const [activeStep, setActiveStep] = useState(platformId ? 1 : 0);
  const [formValues, setFormValues] = useState({
    ...platformConfig.fields.reduce((acc, field) => {
      acc[field.name] = initialValues[field.name] || '';
      return acc;
    }, {}),
    syncFrequency: initialValues.syncFrequency || '24',
    syncHistorical: initialValues.syncHistorical || true,
    syncResponses: initialValues.syncResponses || true,
    syncImages: initialValues.syncImages || false,
    autoRespond: initialValues.autoRespond || false,
    ...initialValues
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [platformInfo, setPlatformInfo] = useState(null);
  const [helpExpanded, setHelpExpanded] = useState(false);

  // If platformId changes, reset form with fields for that platform
  useEffect(() => {
    if (platformId) {
      const config = PLATFORM_CONFIG[platformId] || {};
      setFormValues(prev => ({
        ...prev,
        ...config.fields.reduce((acc, field) => {
          acc[field.name] = initialValues[field.name] || '';
          return acc;
        }, {})
      }));
      
      if (activeStep === 0) {
        setActiveStep(1);
      }
    }
  }, [platformId, initialValues]);

  // Validation
  const validateForm = () => {
    const errors = {};
    
    // Validate required fields based on platform configuration
    platformConfig.fields.forEach(field => {
      if (field.required && !formValues[field.name]?.trim()) {
        errors[field.name] = `${field.label} is required`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle password visibility toggle
  const handleTogglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle step transitions
  const handleNext = () => {
    if (activeStep === 1) {
      // Validate before proceeding
      if (!validateForm()) {
        return;
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }
    
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const credentials = platformConfig.fields.reduce((acc, field) => {
        acc[field.name] = formValues[field.name];
        return acc;
      }, {});
      
      const result = await onTestConnection(platformId, credentials);
      
      setTestResult({
        success: result.success,
        message: result.success ? 'Connection successful!' : (result.error || 'Connection failed'),
        details: result.data || {}
      });
      
      if (result.success) {
        setPlatformInfo(result.data);
        // Auto advance to next step if test was successful
        setTimeout(() => {
          setActiveStep(3);
        }, 1500);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Connection test failed',
        details: {}
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Submit final form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Extract credentials and settings
    const credentials = platformConfig.fields.reduce((acc, field) => {
      acc[field.name] = formValues[field.name];
      return acc;
    }, {});
    
    const settings = {
      syncFrequency: formValues.syncFrequency,
      syncHistorical: formValues.syncHistorical,
      syncResponses: formValues.syncResponses,
      syncImages: formValues.syncImages,
      autoRespond: formValues.autoRespond
    };
    
    onSubmit({ 
      platformId, 
      credentials, 
      settings 
    });
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
        {SETUP_STEPS.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              {step.label}
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {step.description}
                </Typography>
                
                {index === 0 && (
                  <Grid container spacing={2}>
                    {Object.entries(PLATFORM_CONFIG).map(([key, platform]) => (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <Paper
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            borderColor: platformId === key ? 'primary.main' : 'divider',
                            borderWidth: platformId === key ? 2 : 1,
                            borderStyle: 'solid',
                            '&:hover': {
                              boxShadow: 3
                            }
                          }}
                          elevation={platformId === key ? 2 : 1}
                          onClick={() => {
                            setPlatformId(key);
                            handleNext();
                          }}
                        >
                          <Box sx={{ fontSize: 36, mb: 1 }}>
                            <i className={platform.icon}></i>
                          </Box>
                          <Typography variant="subtitle1">
                            {platform.name}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
                
                {index === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {platformConfig.name} Credentials
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {platformConfig.fields.map((field) => (
                        <Grid item xs={12} key={field.name}>
                          <TextField
                            fullWidth
                            required={field.required}
                            label={field.label}
                            name={field.name}
                            type={field.type === 'password' && !showPasswords[field.name] ? 'password' : 'text'}
                            value={formValues[field.name] || ''}
                            onChange={handleChange}
                            error={!!formErrors[field.name]}
                            helperText={formErrors[field.name]}
                            InputProps={field.type === 'password' ? {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => handleTogglePasswordVisibility(field.name)}
                                    edge="end"
                                  >
                                    {showPasswords[field.name] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            } : undefined}
                          />
                        </Grid>
                      ))}
                      
                      <Grid item xs={12}>
                        <Button
                          startIcon={<HelpIcon />}
                          onClick={() => setHelpExpanded(!helpExpanded)}
                          size="small"
                          color="inherit"
                        >
                          {helpExpanded ? 'Hide help' : 'Need help?'}
                        </Button>
                        
                        <Collapse in={helpExpanded}>
                          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                            <Typography variant="body2" paragraph>
                              {platformConfig.helpText}
                            </Typography>
                            
                            {platformConfig.helpLink && (
                              <Link
                                href={platformConfig.helpLink}
                                target="_blank"
                                rel="noopener"
                                sx={{ display: 'flex', alignItems: 'center' }}
                              >
                                Documentation <LaunchIcon fontSize="small" sx={{ ml: 0.5 }} />
                              </Link>
                            )}
                          </Paper>
                        </Collapse>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                {index === 2 && (
                  <Box>
                    <Typography variant="body2" paragraph>
                      Let's verify that we can connect to {platformConfig.name} with the provided credentials.
                    </Typography>
                    
                    {testResult && (
                      <Alert
                        severity={testResult.success ? 'success' : 'error'}
                        icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="subtitle2">
                          {testResult.message}
                        </Typography>
                        {testResult.success && testResult.details && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Successfully connected to {platformConfig.name}
                            {testResult.details.accountName && ` account: ${testResult.details.accountName}`}
                            {testResult.details.reviewCount && ` (${testResult.details.reviewCount} reviews available)`}
                          </Typography>
                        )}
                      </Alert>
                    )}
                    
                    <Button
                      variant="contained"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      startIcon={testingConnection ? <CircularProgress size={20} /> : null}
                    >
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </Box>
                )}
                
                {index === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Sync Settings
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          select
                          fullWidth
                          label="Sync Frequency"
                          name="syncFrequency"
                          value={formValues.syncFrequency}
                          onChange={handleChange}
                          SelectProps={{
                            native: true,
                          }}
                        >
                          <option value="6">Every 6 hours</option>
                          <option value="12">Every 12 hours</option>
                          <option value="24">Every 24 hours</option>
                          <option value="48">Every 2 days</option>
                          <option value="168">Every week</option>
                        </TextField>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formValues.syncHistorical}
                              onChange={handleChange}
                              name="syncHistorical"
                              color="primary"
                            />
                          }
                          label="Sync historical reviews"
                        />
                        <FormHelperText>
                          Import existing reviews from the platform during initial sync
                        </FormHelperText>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formValues.syncResponses}
                              onChange={handleChange}
                              name="syncResponses"
                              color="primary"
                            />
                          }
                          label="Sync existing responses"
                        />
                        <FormHelperText>
                          Import your existing responses to reviews
                        </FormHelperText>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formValues.syncImages}
                              onChange={handleChange}
                              name="syncImages"
                              color="primary"
                            />
                          }
                          label="Sync review images"
                        />
                        <FormHelperText>
                          Import images attached to reviews (if available)
                        </FormHelperText>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Response Settings
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formValues.autoRespond}
                              onChange={handleChange}
                              name="autoRespond"
                              color="primary"
                            />
                          }
                          label="Enable auto-response"
                        />
                        <FormHelperText>
                          Automatically respond to reviews based on templates and rules
                        </FormHelperText>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    disabled={index === 0 || (index === 2 && !testResult?.success)}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Back
                  </Button>
                  
                  {index === SETUP_STEPS.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      type="submit"
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                    >
                      {isSubmitting ? 'Connecting...' : 'Connect Platform'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={index === 2 ? handleTestConnection : handleNext}
                      disabled={(index === 1 && !validateForm()) || (index === 2 && testingConnection)}
                    >
                      {index === 2 ? 'Test Connection' : 'Continue'}
                    </Button>
                  )}
                </Box>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default PlatformConnectionForm;
