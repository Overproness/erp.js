import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createResponse,
  updateResponse,
  deleteResponse,
  fetchResponseTemplates,
  createResponseTemplate,
  updateResponseTemplate,
  deleteResponseTemplate,
  updateAutoResponseSettings,
  triggerAutoResponse
} from '../../redux/reputation/reputationActions';
import {
  selectResponses,
  selectResponseTemplates,
  selectAutoResponseSettings,
  selectResponsesByReview
} from '../../redux/reputation/reputationSelectors';
import { updateAutoResponseSettings as updateLocalAutoResponseSettings } from '../../redux/reputation/reputationSlice';

/**
 * Custom hook for review response management
 */
export const useReviewResponses = (options = {}) => {
  const {
    autoFetchTemplates = true,
    enableAutoResponse = true,
    defaultTemplate = null
  } = options;

  const dispatch = useDispatch();
  const responses = useSelector(selectResponses);
  const templates = useSelector(selectResponseTemplates);
  const autoResponseSettings = useSelector(selectAutoResponseSettings);
  const responsesByReview = useSelector(selectResponsesByReview);

  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [responseForm, setResponseForm] = useState({
    reviewId: null,
    content: '',
    templateId: null,
    isPublic: true,
    scheduledAt: null
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    sentiment: 'all',
    ratingRange: 'all',
    variables: [],
    isActive: true
  });

  // Fetch templates on mount
  useEffect(() => {
    if (autoFetchTemplates) {
      dispatch(fetchResponseTemplates());
    }
  }, [dispatch, autoFetchTemplates]);

  // Create new response
  const createNewResponse = useCallback(async (responseData) => {
    try {
      const result = await dispatch(createResponse(responseData)).unwrap();
      
      // Reset form after successful creation
      setResponseForm({
        reviewId: null,
        content: '',
        templateId: null,
        isPublic: true,
        scheduledAt: null
      });
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Update existing response
  const updateExistingResponse = useCallback(async (responseId, updateData) => {
    try {
      const result = await dispatch(updateResponse({ responseId, updateData })).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Delete response
  const removeResponse = useCallback(async (responseId) => {
    try {
      await dispatch(deleteResponse(responseId)).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Template management
  const templateActions = useMemo(() => ({
    async create(templateData) {
      try {
        const result = await dispatch(createResponseTemplate(templateData)).unwrap();
        setTemplateForm({
          name: '',
          content: '',
          sentiment: 'all',
          ratingRange: 'all',
          variables: [],
          isActive: true
        });
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error };
      }
    },

    async update(templateId, updateData) {
      try {
        const result = await dispatch(updateResponseTemplate({ templateId, updateData })).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error };
      }
    },

    async delete(templateId) {
      try {
        await dispatch(deleteResponseTemplate(templateId)).unwrap();
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },

    async duplicate(templateId) {
      const template = templates.find(t => t.id === templateId);
      if (!template) return { success: false, error: 'Template not found' };

      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined
      };

      return this.create(duplicatedTemplate);
    }
  }), [dispatch, templates, selectedTemplate]);

  // Apply template to response form
  const applyTemplate = useCallback((templateId, variables = {}) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return false;

    let content = template.content;
    
    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    setResponseForm(prev => ({
      ...prev,
      content,
      templateId
    }));

    setSelectedTemplate(template);
    return true;
  }, [templates]);

  // Generate response using template with review context
  const generateResponse = useCallback((reviewId, templateId, customVariables = {}) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return null;

    // Default variables that can be used in templates
    const variables = {
      customerName: 'Valued Customer',
      businessName: 'Our Business',
      date: new Date().toLocaleDateString(),
      ...customVariables
    };

    let content = template.content;
    
    // Replace all variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    return {
      reviewId,
      content,
      templateId,
      isPublic: template.isPublic !== false,
      variables
    };
  }, [templates]);

  // Filter templates by criteria
  const getFilteredTemplates = useCallback((criteria = {}) => {
    return templates.filter(template => {
      if (criteria.sentiment && criteria.sentiment !== 'all') {
        if (template.sentiment !== 'all' && template.sentiment !== criteria.sentiment) {
          return false;
        }
      }

      if (criteria.rating !== undefined) {
        if (template.ratingRange && template.ratingRange !== 'all') {
          const [min, max] = template.ratingRange.split('-').map(Number);
          if (criteria.rating < min || criteria.rating > max) {
            return false;
          }
        }
      }

      if (criteria.isActive !== undefined && template.isActive !== criteria.isActive) {
        return false;
      }

      return true;
    });
  }, [templates]);

  // Auto response management
  const autoResponseActions = useMemo(() => ({
    async updateSettings(settings) {
      try {
        const result = await dispatch(updateAutoResponseSettings(settings)).unwrap();
        dispatch(updateLocalAutoResponseSettings(settings));
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error };
      }
    },

    async triggerForReview(reviewId) {
      try {
        const result = await dispatch(triggerAutoResponse(reviewId)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error };
      }
    },

    shouldAutoRespond(review) {
      if (!autoResponseSettings.enabled) return false;

      // Check sentiment triggers
      if (autoResponseSettings.sentimentTriggers && 
          !autoResponseSettings.sentimentTriggers.includes(review.sentiment)) {
        return false;
      }

      // Check rating triggers
      if (autoResponseSettings.ratingTriggers && 
          !autoResponseSettings.ratingTriggers.includes(review.rating)) {
        return false;
      }

      // Check if already responded
      if (responsesByReview[review.id]) {
        return false;
      }

      return true;
    }
  }), [dispatch, autoResponseSettings, responsesByReview]);

  // Bulk response actions
  const bulkActions = useMemo(() => ({
    async respondToMultiple(reviewIds, templateId, variables = {}) {
      const results = [];
      
      for (const reviewId of reviewIds) {
        const responseData = generateResponse(reviewId, templateId, variables);
        if (responseData) {
          const result = await createNewResponse(responseData);
          results.push({ reviewId, ...result });
        }
      }
      
      return {
        success: results.every(r => r.success),
        results
      };
    },

    async scheduleResponses(reviewIds, templateId, scheduleTime, variables = {}) {
      const results = [];
      
      for (const reviewId of reviewIds) {
        const responseData = generateResponse(reviewId, templateId, variables);
        if (responseData) {
          responseData.scheduledAt = scheduleTime;
          const result = await createNewResponse(responseData);
          results.push({ reviewId, ...result });
        }
      }
      
      return {
        success: results.every(r => r.success),
        results
      };
    }
  }), [generateResponse, createNewResponse]);

  // Get response statistics
  const responseStats = useMemo(() => {
    const totalResponses = responses.length;
    const publicResponses = responses.filter(r => r.isPublic).length;
    const privateResponses = totalResponses - publicResponses;
    const scheduledResponses = responses.filter(r => r.scheduledAt && !r.publishedAt).length;

    // Template usage statistics
    const templateUsage = responses.reduce((acc, response) => {
      if (response.templateId) {
        acc[response.templateId] = (acc[response.templateId] || 0) + 1;
      }
      return acc;
    }, {});

    const mostUsedTemplate = templates.find(t => 
      t.id === Object.entries(templateUsage).sort(([,a], [,b]) => b - a)[0]?.[0]
    );

    return {
      totalResponses,
      publicResponses,
      privateResponses,
      scheduledResponses,
      templateUsage,
      mostUsedTemplate,
      responseRate: totalResponses > 0 ? Math.round((publicResponses / totalResponses) * 100) : 0
    };
  }, [responses, templates]);

  // Form handlers
  const updateResponseForm = useCallback((updates) => {
    setResponseForm(prev => ({ ...prev, ...updates }));
  }, []);

  const updateTemplateForm = useCallback((updates) => {
    setTemplateForm(prev => ({ ...prev, ...updates }));
  }, []);

  const resetResponseForm = useCallback(() => {
    setResponseForm({
      reviewId: null,
      content: '',
      templateId: null,
      isPublic: true,
      scheduledAt: null
    });
    setSelectedTemplate(null);
  }, []);

  const resetTemplateForm = useCallback(() => {
    setTemplateForm({
      name: '',
      content: '',
      sentiment: 'all',
      ratingRange: 'all',
      variables: [],
      isActive: true
    });
  }, []);

  return {
    // Data
    responses,
    templates,
    autoResponseSettings,
    responsesByReview,
    responseStats,
    
    // Forms
    responseForm,
    templateForm,
    selectedTemplate,
    
    // Response actions
    createResponse: createNewResponse,
    updateResponse: updateExistingResponse,
    deleteResponse: removeResponse,
    
    // Template actions
    templateActions,
    applyTemplate,
    generateResponse,
    getFilteredTemplates,
    
    // Auto response
    autoResponseActions,
    
    // Bulk actions
    bulkActions,
    
    // Form handlers
    updateResponseForm,
    updateTemplateForm,
    resetResponseForm,
    resetTemplateForm,
    setSelectedTemplate
  };
};

export default useReviewResponses;
