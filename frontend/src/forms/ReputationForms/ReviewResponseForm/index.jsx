import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Grid, FormControlLabel, Switch, InputLabel,
  MenuItem, FormControl, Select, Typography, Button, Alert,
  Divider, Chip, FormHelperText, Paper, Tabs, Tab, Radio,
  RadioGroup, FormLabel
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  FormatQuote as FormatQuoteIcon,
  FilterAlt as FilterAltIcon,
  Schedule as ScheduleIcon,
  Tune as TuneIcon,
  AddBox as AddBoxIcon
} from '@mui/icons-material';
import { ResponseTemplateEditor } from '../../../components/ReputationComponents/ResponseTemplateEditor';

const variableOptions = [
  { label: 'Customer Name', value: '{customerName}', description: 'The name of the customer who left the review' },
  { label: 'Business Name', value: '{businessName}', description: 'Your business name' },
  { label: 'Rating', value: '{rating}', description: 'The star rating from the review (1-5)' },
  { label: 'Date', value: '{date}', description: 'Current date in local format' },
  { label: 'Review Date', value: '{reviewDate}', description: 'Date when the review was submitted' },
  { label: 'Platform', value: '{platform}', description: 'The platform where the review was posted' },
  { label: 'Review Content', value: '{reviewContent}', description: 'Content of the review (first 100 chars)' }
];

const ReviewResponseForm = ({
  initialValues = {},
  onSubmit,
  loading = false,
  isTemplate = false, 
  submitButtonText = 'Save Template',
  error = null,
  platformOptions = ['google', 'facebook', 'yelp', 'trustpilot', 'custom'],
  reviewData = null
}) => {
  const [formValues, setFormValues] = useState({
    name: '',
    content: '',
    sentiment: 'all',
    ratingRange: 'all',
    platforms: [],
    isActive: true,
    isPublic: true,
    scheduledAt: null,
    variables: [],
    reviewId: null,
    templateId: null,
    ...initialValues
  });

  const [tabValue, setTabValue] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [previewVariables, setPreviewVariables] = useState({
    customerName: reviewData?.author || 'John Smith',
    businessName: 'Your Business Name',
    rating: reviewData?.rating || 5,
    date: new Date().toLocaleDateString(),
    reviewDate: reviewData?.createdAt ? new Date(reviewData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    platform: reviewData?.platform || 'Google',
    reviewContent: reviewData?.content || 'This is a sample review content.'
  });

  // Update preview when reviewData changes
  useEffect(() => {
    if (reviewData) {
      setPreviewVariables(prev => ({
        ...prev,
        customerName: reviewData.author || prev.customerName,
        rating: reviewData.rating || prev.rating,
        reviewDate: reviewData.createdAt ? new Date(reviewData.createdAt).toLocaleDateString() : prev.reviewDate,
        platform: reviewData.platform || prev.platform,
        reviewContent: reviewData.content || prev.reviewContent
      }));
      
      setFormValues(prev => ({
        ...prev,
        reviewId: reviewData.id || null
      }));
    }
  }, [reviewData]);

  // Validation
  const validateForm = () => {
    const errors = {};
    
    if (isTemplate) {
      if (!formValues.name?.trim()) {
        errors.name = 'Template name is required';
      }
    }
    
    if (!formValues.content?.trim()) {
      errors.content = 'Response content is required';
    } else if (formValues.content.length < 10) {
      errors.content = 'Response must be at least 10 characters';
    } else if (formValues.content.length > 1000) {
      errors.content = 'Response cannot exceed 1000 characters';
    }
    
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

  // Handle multi-select change
  const handleMultiSelectChange = (e) => {
    const { value } = e.target;
    setFormValues(prev => ({
      ...prev,
      platforms: value
    }));
  };

  // Handle content change from editor
  const handleContentChange = (newContent) => {
    setFormValues(prev => ({
      ...prev,
      content: newContent
    }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Insert variable at cursor position
  const insertVariable = (variable) => {
    const textArea = document.getElementById('response-content');
    if (!textArea) return;
    
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd;
    const text = formValues.content;
    const newText = text.substring(0, startPos) + variable + text.substring(endPos);
    
    setFormValues(prev => ({
      ...prev,
      content: newText
    }));
    
    // Focus and set cursor position after the inserted variable
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(startPos + variable.length, startPos + variable.length);
    }, 50);
  };

  // Replace variables in content
  const processContentWithVariables = (content) => {
    let processedContent = content;
    Object.entries(previewVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });
    return processedContent;
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  // Update preview variables
  const handlePreviewVarChange = (e) => {
    const { name, value } = e.target;
    setPreviewVariables(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isTemplate && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Template Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Template Name"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name || 'Name for this response template'}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Content" icon={<FormatQuoteIcon />} iconPosition="start" />
          {isTemplate && <Tab label="Conditions" icon={<FilterAltIcon />} iconPosition="start" />}
          {!isTemplate && <Tab label="Scheduling" icon={<ScheduleIcon />} iconPosition="start" />}
          <Tab label="Preview" icon={<TuneIcon />} iconPosition="start" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Content Tab */}
          {tabValue === 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Response Content
              </Typography>
              
              <ResponseTemplateEditor
                content={formValues.content}
                onChange={handleContentChange}
                error={!!formErrors.content}
                id="response-content"
              />
              
              {formErrors.content && (
                <FormHelperText error>{formErrors.content}</FormHelperText>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Insert Variables
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {variableOptions.map((variable) => (
                    <Chip
                      key={variable.value}
                      label={variable.label}
                      onClick={() => insertVariable(variable.value)}
                      color="primary"
                      variant="outlined"
                      title={variable.description}
                    />
                  ))}
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Tip: Use variables to personalize your response.
                </Typography>
              </Box>
              
              {!isTemplate && (
                <Box sx={{ mt: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.isPublic}
                        onChange={handleChange}
                        name="isPublic"
                        color="primary"
                      />
                    }
                    label="Make this response public"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Public responses will be visible on the review platform. Private responses are for internal use only.
                  </Typography>
                </Box>
              )}
            </>
          )}
          
          {/* Conditions Tab (for templates) */}
          {tabValue === 1 && isTemplate && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                When to Use This Template
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Sentiment</InputLabel>
                    <Select
                      name="sentiment"
                      value={formValues.sentiment}
                      onChange={handleChange}
                      label="Sentiment"
                    >
                      <MenuItem value="all">All Sentiments</MenuItem>
                      <MenuItem value="positive">Positive</MenuItem>
                      <MenuItem value="neutral">Neutral</MenuItem>
                      <MenuItem value="negative">Negative</MenuItem>
                    </Select>
                    <FormHelperText>
                      Select which review sentiment this template applies to
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Rating Range</InputLabel>
                    <Select
                      name="ratingRange"
                      value={formValues.ratingRange}
                      onChange={handleChange}
                      label="Rating Range"
                    >
                      <MenuItem value="all">All Ratings</MenuItem>
                      <MenuItem value="1-2">1-2 Stars</MenuItem>
                      <MenuItem value="3">3 Stars</MenuItem>
                      <MenuItem value="4-5">4-5 Stars</MenuItem>
                    </Select>
                    <FormHelperText>
                      Select which rating range this template applies to
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Platforms</InputLabel>
                    <Select
                      multiple
                      name="platforms"
                      value={formValues.platforms}
                      onChange={handleMultiSelectChange}
                      label="Platforms"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {platformOptions.map((platform) => (
                        <MenuItem key={platform} value={platform}>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Select which platforms this template applies to (leave empty for all)
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.isActive}
                        onChange={handleChange}
                        name="isActive"
                        color="primary"
                      />
                    }
                    label="Template is active"
                  />
                </Grid>
              </Grid>
            </>
          )}
          
          {/* Scheduling Tab (for direct responses) */}
          {tabValue === 1 && !isTemplate && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Response Scheduling
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={formValues.scheduledAt ? "scheduled" : "immediate"}
                      onChange={(e) => {
                        if (e.target.value === "immediate") {
                          setFormValues(prev => ({ ...prev, scheduledAt: null }));
                        } else {
                          // Set default scheduled time to tomorrow
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(10, 0, 0, 0);
                          setFormValues(prev => ({ ...prev, scheduledAt: tomorrow }));
                        }
                      }}
                    >
                      <FormControlLabel value="immediate" control={<Radio />} label="Send immediately" />
                      <FormControlLabel value="scheduled" control={<Radio />} label="Schedule for later" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                
                {formValues.scheduledAt && (
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Schedule Date & Time"
                        value={formValues.scheduledAt}
                        onChange={(newValue) => {
                          setFormValues(prev => ({ ...prev, scheduledAt: newValue }));
                        }}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth 
                            helperText="When to send this response" 
                          />
                        )}
                        minDateTime={new Date()}
                      />
                    </LocalizationProvider>
                  </Grid>
                )}
              </Grid>
            </>
          )}
          
          {/* Preview Tab */}
          {tabValue === 2 || (!isTemplate && tabValue === 1 && !formValues.scheduledAt) && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Response Preview
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                  {processContentWithVariables(formValues.content)}
                </Typography>
              </Paper>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Customize Preview Variables
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    name="customerName"
                    value={previewVariables.customerName}
                    onChange={handlePreviewVarChange}
                    size="small"
                    margin="dense"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    name="businessName"
                    value={previewVariables.businessName}
                    onChange={handlePreviewVarChange}
                    size="small"
                    margin="dense"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rating"
                    name="rating"
                    value={previewVariables.rating}
                    onChange={handlePreviewVarChange}
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    size="small"
                    margin="dense"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Platform"
                    name="platform"
                    value={previewVariables.platform}
                    onChange={handlePreviewVarChange}
                    size="small"
                    margin="dense"
                  />
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={isTemplate ? <AddBoxIcon /> : null}
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Processing...' : submitButtonText}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewResponseForm;
