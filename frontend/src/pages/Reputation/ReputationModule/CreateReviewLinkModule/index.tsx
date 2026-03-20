import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Stepper, Step, StepLabel, StepContent,
  Button, TextField, Grid, Card, CardContent, FormControlLabel,
  Switch, Chip, IconButton, Alert, Divider, CircularProgress
} from '@mui/material';
import {
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createReviewLink, updateReviewLink, fetchReviewLinks } from '@/redux/reputation/reputationActions';
import { selectReviewLinks, selectActiveReviewLink } from '@/redux/reputation/reputationSelectors';
import { setActiveReviewLink } from '@/redux/reputation/reputationSlice';

// Components
import ReviewLinkForm from '@/forms/ReputationForms/ReviewLinkForm';
import { ReviewLinkGenerator } from '@/components/ReputationComponents/ReviewLinkGenerator';
import ReviewPortalPreview from '@/components/ReputationComponents/ReviewPortalPreview';

const CreateReviewLinkModule = ({ mode = 'list' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { linkId } = useParams();
  
  const reviewLinks = useSelector(selectReviewLinks);
  const activeLink = useSelector(selectActiveReviewLink);
  
  // Local state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state
  const [linkForm, setLinkForm] = useState({
    name: '',
    platform: 'custom',
    expiryDays: 30,
    maxResponses: 500,
    redirectUrl: '',
    trackingParams: '',
    branding: {
      logo: null,
      companyName: 'Our Company',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      accentColor: '#17a2b8'
    },
    fields: {
      title: { visible: true, required: false },
      content: { visible: true, required: true },
      rating: { visible: true, required: true },
      email: { visible: true, required: true },
      phone: { visible: false, required: false }
    },
    messages: {
      welcome: 'We appreciate your feedback!',
      thankYou: 'Thank you for your review!'
    }
  });
  
  // Load data if editing
  useEffect(() => {
    if (mode === 'edit' && linkId) {
      setLoading(true);
      
      // Fetch links if not already loaded
      if (reviewLinks.data.length === 0) {
        dispatch(fetchReviewLinks());
      }
      
      // Find active link
      const link = reviewLinks.data.find(link => link.id === linkId) || activeLink;
      
      if (link) {
        setLinkForm(link);
        dispatch(setActiveReviewLink(link));
        setLoading(false);
      } else {
        setError('Link not found');
        setLoading(false);
      }
    }
  }, [mode, linkId, dispatch, reviewLinks.data, activeLink]);
  
  // Update form fields
  const updateForm = (updates) => {
    setLinkForm(prev => ({ ...prev, ...updates }));
  };
  
  // Update branding
  const updateBranding = (updates) => {
    setLinkForm(prev => ({
      ...prev,
      branding: { ...prev.branding, ...updates }
    }));
  };
  
  // Update field settings
  const updateField = (field, settings) => {
    setLinkForm(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: { ...prev.fields[field], ...settings }
      }
    }));
  };
  
  // Update messages
  const updateMessage = (key, value) => {
    setLinkForm(prev => ({
      ...prev,
      messages: { ...prev.messages, [key]: value }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (mode === 'edit') {
        await dispatch(updateReviewLink({ linkId, updateData: linkForm })).unwrap();
        setSuccess('Link updated successfully');
      } else {
        const result = await dispatch(createReviewLink(linkForm)).unwrap();
        dispatch(setActiveReviewLink(result));
        setSuccess('Link created successfully');
        navigate(`/reputation/links/${result.id}`);
      }
      
      setLoading(false);
      setActiveStep(2); // Move to final step
    } catch (err) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };
  
  // Handle step navigation
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Generate link view
  const linkUrl = activeLink?.url || 'https://example.com/review/abc123';
  
  // Copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(linkUrl);
    setSuccess('Link copied to clipboard');
  };
  
  // Generate QR code
  const generateQrCode = () => {
    // This would typically trigger a modal or download
    console.log('Generate QR code for:', linkUrl);
  };
  
  // Share link
  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: `Review ${linkForm.branding.companyName}`,
        text: `Please leave a review for ${linkForm.branding.companyName}`,
        url: linkUrl
      });
    } else {
      copyToClipboard();
    }
  };
  
  // If in list mode, show all review links
  if (mode === 'list') {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Review Collection Links
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<LinkIcon />}
            onClick={() => navigate('/reputation/links/create')}
          >
            Create New Link
          </Button>
        </Box>
        
        {loading && <CircularProgress />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {reviewLinks.data.map(link => (
            <Grid item xs={12} md={6} lg={4} key={link.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{link.name}</Typography>
                    <Chip 
                      label={link.platform} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Created on {new Date(link.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Link:</strong>
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mr: 1
                        }}
                      >
                        {link.url || 'https://example.com/review/abc123'}
                      </Typography>
                      <IconButton size="small" onClick={() => copyToClipboard()}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Chip 
                        label={`${link.stats?.responses || 0} Responses`} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      <Chip 
                        label={`${link.stats?.clicks || 0} Clicks`} 
                        size="small" 
                      />
                    </Box>
                    
                    <Box>
                      <IconButton size="small" onClick={() => navigate(`/reputation/links/${link.id}`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => generateQrCode()}>
                        <QrCodeIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {/* Create new link card */}
          <Grid item xs={12} md={6} lg={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 3,
                cursor: 'pointer',
                border: '2px dashed',
                borderColor: 'divider'
              }}
              onClick={() => navigate('/reputation/links/create')}
            >
              <LinkIcon sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
              <Typography variant="h6" align="center">
                Create New Link
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Generate a new review collection link with custom branding and settings
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }
  
  // Create/Edit mode with stepper
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {mode === 'edit' ? 'Edit Review Link' : 'Create Review Link'}
        </Typography>
        
        {loading && <CircularProgress />}
        
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
        
        {previewMode ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Button 
                onClick={() => setPreviewMode(false)}
                variant="outlined"
                startIcon={<EditIcon />}
              >
                Back to Editor
              </Button>
            </Box>
            <ReviewPortalPreview settings={linkForm} />
          </>
        ) : (
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Basic Information */}
            <Step>
              <StepLabel>Basic Information</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <ReviewLinkForm 
                    formData={linkForm}
                    onUpdate={updateForm}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={() => navigate('/reputation/links')}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Cancel
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            {/* Step 2: Branding and Customization */}
            <Step>
              <StepLabel>Branding and Customization</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Branding Settings
                    </Typography>
                    <TextField
                      label="Company Name"
                      fullWidth
                      margin="normal"
                      value={linkForm.branding.companyName}
                      onChange={(e) => updateBranding({ companyName: e.target.value })}
                    />
                    <TextField
                      label="Primary Color"
                      fullWidth
                      margin="normal"
                      value={linkForm.branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      type="color"
                    />
                    <TextField
                      label="Secondary Color"
                      fullWidth
                      margin="normal"
                      value={linkForm.branding.secondaryColor}
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                      type="color"
                    />
                    <TextField
                      label="Welcome Message"
                      fullWidth
                      margin="normal"
                      value={linkForm.messages.welcome}
                      onChange={(e) => updateMessage('welcome', e.target.value)}
                    />
                    <TextField
                      label="Thank You Message"
                      fullWidth
                      margin="normal"
                      value={linkForm.messages.thankYou}
                      onChange={(e) => updateMessage('thankYou', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Form Fields
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={linkForm.fields.title?.visible}
                            onChange={(e) => updateField('title', { visible: e.target.checked })}
                          />
                        }
                        label="Title field"
                      />
                      {linkForm.fields.title?.visible && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={linkForm.fields.title?.required}
                              onChange={(e) => updateField('title', { required: e.target.checked })}
                            />
                          }
                          label="Required"
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={linkForm.fields.content?.visible}
                            onChange={(e) => updateField('content', { visible: e.target.checked })}
                          />
                        }
                        label="Review content field"
                      />
                      {linkForm.fields.content?.visible && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={linkForm.fields.content?.required}
                              onChange={(e) => updateField('content', { required: e.target.checked })}
                            />
                          }
                          label="Required"
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={linkForm.fields.email?.visible}
                            onChange={(e) => updateField('email', { visible: e.target.checked })}
                          />
                        }
                        label="Email field"
                      />
                      {linkForm.fields.email?.visible && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={linkForm.fields.email?.required}
                              onChange={(e) => updateField('email', { required: e.target.checked })}
                            />
                          }
                          label="Required"
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={linkForm.fields.phone?.visible}
                            onChange={(e) => updateField('phone', { visible: e.target.checked })}
                          />
                        }
                        label="Phone field"
                      />
                      {linkForm.fields.phone?.visible && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={linkForm.fields.phone?.required}
                              onChange={(e) => updateField('phone', { required: e.target.checked })}
                            />
                          }
                          label="Required"
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<VisibilityIcon />}
                    sx={{ mr: 1 }}
                    onClick={() => setPreviewMode(true)}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{ mr: 1 }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save and Continue'}
                  </Button>
                  <Button
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            {/* Step 3: Generated Link */}
            <Step>
              <StepLabel>Your Review Link</StepLabel>
              <StepContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Your review link has been created!
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    Share this link with your customers to collect reviews.
                  </Typography>
                  
                  <ReviewLinkGenerator 
                    url={linkUrl} 
                    onCopy={copyToClipboard}
                    onGenerateQr={generateQrCode}
                    onShare={shareLink}
                  />
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Distribution options
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle1">
                            Email Campaign
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Send review requests via email
                          </Typography>
                        </CardContent>
                        <Box sx={{ p: 1 }}>
                          <Button size="small" color="primary">
                            Create Campaign
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle1">
                            SMS Campaign
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Send review requests via SMS
                          </Typography>
                        </CardContent>
                        <Box sx={{ p: 1 }}>
                          <Button size="small" color="primary">
                            Create Campaign
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle1">
                            QR Code
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Download QR code for printing
                          </Typography>
                        </CardContent>
                        <Box sx={{ p: 1 }}>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={generateQrCode}
                          >
                            Generate QR
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Button
                    onClick={() => navigate('/reputation/links')}
                    variant="contained"
                    sx={{ mr: 1 }}
                  >
                    Done
                  </Button>
                  
                  <Button
                    onClick={() => setActiveStep(1)}
                    sx={{ mr: 1 }}
                  >
                    Edit Link
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        )}
      </Paper>
    </Box>
  );
};

export default CreateReviewLinkModule;
