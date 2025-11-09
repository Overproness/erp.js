import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Grid, FormControlLabel, Switch, InputLabel,
  MenuItem, FormControl, Select, Typography, Button, Alert,
  Divider, Chip, OutlinedInput, FormHelperText, InputAdornment
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Link as LinkIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { ColorPicker } from '../../../components/common/ColorPicker';

const ReviewLinkForm = ({
  initialValues = {},
  onSubmit,
  loading = false,
  submitButtonText = 'Create Link',
  error = null
}) => {
  const [formValues, setFormValues] = useState({
    name: '',
    platformId: '',
    expiryDate: null,
    maxSubmissions: '',
    limitOnePerDevice: false,
    limitOnePerEmail: true,
    redirectUrl: '',
    logoUrl: '',
    primaryColor: '#3f51b5',
    secondaryColor: '#f50057',
    showCompanyName: true,
    companyName: '',
    showHeader: true,
    headerText: 'Share Your Experience',
    customMessage: '',
    requireEmail: true,
    requireName: true,
    enableTracking: true,
    trackSource: '',
    trackMedium: '',
    trackCampaign: '',
    ...initialValues
  });

  const [formErrors, setFormErrors] = useState({});

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formValues.name?.trim()) {
      errors.name = 'Link name is required';
    }
    if (!formValues.platformId?.trim()) {
      errors.platformId = 'Please select a platform';
    }
    if (formValues.expiryDate && new Date(formValues.expiryDate) <= new Date()) {
      errors.expiryDate = 'Expiry date must be in the future';
    }
    if (formValues.maxSubmissions && (isNaN(formValues.maxSubmissions) || formValues.maxSubmissions <= 0)) {
      errors.maxSubmissions = 'Maximum submissions must be a positive number';
    }
    if (formValues.redirectUrl && !isValidUrl(formValues.redirectUrl)) {
      errors.redirectUrl = 'Please enter a valid URL';
    }
    if (formValues.logoUrl && !isValidUrl(formValues.logoUrl)) {
      errors.logoUrl = 'Please enter a valid URL';
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

  // Handle color change
  const handleColorChange = (color, field) => {
    setFormValues(prev => ({
      ...prev,
      [field]: color
    }));
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formValues);
    }
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

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <LinkIcon sx={{ mr: 1 }} /> Link Details
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Link Name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            error={!!formErrors.name}
            helperText={formErrors.name || 'Internal name for this review link'}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!formErrors.platformId}>
            <InputLabel>Platform</InputLabel>
            <Select
              name="platformId"
              value={formValues.platformId}
              onChange={handleChange}
              label="Platform"
            >
              <MenuItem value="google">Google</MenuItem>
              <MenuItem value="facebook">Facebook</MenuItem>
              <MenuItem value="yelp">Yelp</MenuItem>
              <MenuItem value="trustpilot">Trustpilot</MenuItem>
              <MenuItem value="custom">Custom Form</MenuItem>
            </Select>
            {formErrors.platformId && <FormHelperText>{formErrors.platformId}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AccessTimeIcon sx={{ mr: 1 }} /> Expiry & Limits
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Expiry Date (Optional)"
              value={formValues.expiryDate}
              onChange={(newValue) => {
                setFormValues(prev => ({ ...prev, expiryDate: newValue }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  error={!!formErrors.expiryDate}
                  helperText={formErrors.expiryDate || 'When this link will expire'}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Maximum Submissions (Optional)"
            name="maxSubmissions"
            type="number"
            value={formValues.maxSubmissions}
            onChange={handleChange}
            error={!!formErrors.maxSubmissions}
            helperText={formErrors.maxSubmissions || 'Maximum number of reviews to collect'}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formValues.limitOnePerDevice}
                onChange={handleChange}
                name="limitOnePerDevice"
                color="primary"
              />
            }
            label="Limit to one submission per device"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formValues.limitOnePerEmail}
                onChange={handleChange}
                name="limitOnePerEmail"
                color="primary"
              />
            }
            label="Limit to one submission per email address"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Redirect URL (Optional)"
            name="redirectUrl"
            value={formValues.redirectUrl}
            onChange={handleChange}
            error={!!formErrors.redirectUrl}
            helperText={formErrors.redirectUrl || 'Where to send users after submission'}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <BusinessIcon sx={{ mr: 1 }} /> Branding & Appearance
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Logo URL (Optional)"
            name="logoUrl"
            value={formValues.logoUrl}
            onChange={handleChange}
            error={!!formErrors.logoUrl}
            helperText={formErrors.logoUrl || 'URL to your company logo'}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company Name"
            name="companyName"
            value={formValues.companyName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InputLabel sx={{ mr: 2 }}>Primary Color:</InputLabel>
            <ColorPicker
              color={formValues.primaryColor}
              onChange={(color) => handleColorChange(color, 'primaryColor')}
            />
            <TextField
              size="small"
              value={formValues.primaryColor}
              onChange={(e) => handleColorChange(e.target.value, 'primaryColor')}
              sx={{ ml: 2, width: 120 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InputLabel sx={{ mr: 2 }}>Secondary Color:</InputLabel>
            <ColorPicker
              color={formValues.secondaryColor}
              onChange={(color) => handleColorChange(color, 'secondaryColor')}
            />
            <TextField
              size="small"
              value={formValues.secondaryColor}
              onChange={(e) => handleColorChange(e.target.value, 'secondaryColor')}
              sx={{ ml: 2, width: 120 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formValues.showHeader}
                onChange={handleChange}
                name="showHeader"
                color="primary"
              />
            }
            label="Show header text"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Header Text"
            name="headerText"
            value={formValues.headerText}
            onChange={handleChange}
            disabled={!formValues.showHeader}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Custom Message (Optional)"
            name="customMessage"
            value={formValues.customMessage}
            onChange={handleChange}
            helperText="Additional text to show on the review page"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SecurityIcon sx={{ mr: 1 }} /> Form Fields & Security
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formValues.requireEmail}
                onChange={handleChange}
                name="requireEmail"
                color="primary"
              />
            }
            label="Require email address"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formValues.requireName}
                onChange={handleChange}
                name="requireName"
                color="primary"
              />
            }
            label="Require name"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AnalyticsIcon sx={{ mr: 1 }} /> Tracking
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formValues.enableTracking}
                onChange={handleChange}
                name="enableTracking"
                color="primary"
              />
            }
            label="Enable UTM tracking"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Source"
            name="trackSource"
            value={formValues.trackSource}
            onChange={handleChange}
            disabled={!formValues.enableTracking}
            InputProps={{
              startAdornment: <InputAdornment position="start">utm_source=</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Medium"
            name="trackMedium"
            value={formValues.trackMedium}
            onChange={handleChange}
            disabled={!formValues.enableTracking}
            InputProps={{
              startAdornment: <InputAdornment position="start">utm_medium=</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Campaign"
            name="trackCampaign"
            value={formValues.trackCampaign}
            onChange={handleChange}
            disabled={!formValues.enableTracking}
            InputProps={{
              startAdornment: <InputAdornment position="start">utm_campaign=</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Processing...' : submitButtonText}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewLinkForm;
