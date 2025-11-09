// Legacy actions for compatibility with older parts of the codebase
// Most functionality is now handled by aiThunks.js

export const AI_ACTIONS = {
  // Assistant actions
  FETCH_ASSISTANTS_REQUEST: 'ai/fetchAssistantsRequest',
  FETCH_ASSISTANTS_SUCCESS: 'ai/fetchAssistantsSuccess',
  FETCH_ASSISTANTS_FAILURE: 'ai/fetchAssistantsFailure',
  
  CREATE_ASSISTANT_REQUEST: 'ai/createAssistantRequest',
  CREATE_ASSISTANT_SUCCESS: 'ai/createAssistantSuccess',
  CREATE_ASSISTANT_FAILURE: 'ai/createAssistantFailure',
  
  UPDATE_ASSISTANT_REQUEST: 'ai/updateAssistantRequest',
  UPDATE_ASSISTANT_SUCCESS: 'ai/updateAssistantSuccess',
  UPDATE_ASSISTANT_FAILURE: 'ai/updateAssistantFailure',
  
  DELETE_ASSISTANT_REQUEST: 'ai/deleteAssistantRequest',
  DELETE_ASSISTANT_SUCCESS: 'ai/deleteAssistantSuccess',
  DELETE_ASSISTANT_FAILURE: 'ai/deleteAssistantFailure',
  
  // Chat actions
  SEND_MESSAGE_REQUEST: 'ai/sendMessageRequest',
  SEND_MESSAGE_SUCCESS: 'ai/sendMessageSuccess',
  SEND_MESSAGE_FAILURE: 'ai/sendMessageFailure',
  
  ADD_MESSAGE: 'ai/addMessage',
  SET_TYPING: 'ai/setTyping',
  CLEAR_CHAT: 'ai/clearChat',
  
  // Analytics actions
  FETCH_ANALYTICS_REQUEST: 'ai/fetchAnalyticsRequest',
  FETCH_ANALYTICS_SUCCESS: 'ai/fetchAnalyticsSuccess',
  FETCH_ANALYTICS_FAILURE: 'ai/fetchAnalyticsFailure',
  
  // Suggestions actions
  FETCH_SUGGESTIONS_REQUEST: 'ai/fetchSuggestionsRequest',
  FETCH_SUGGESTIONS_SUCCESS: 'ai/fetchSuggestionsSuccess',
  FETCH_SUGGESTIONS_FAILURE: 'ai/fetchSuggestionsFailure',
  
  // UI actions
  SET_CURRENT_ASSISTANT: 'ai/setCurrentAssistant',
  SET_CHAT_OPEN: 'ai/setChatOpen',
  SET_SELECTED_MODULE: 'ai/setSelectedModule',
  SET_CONTEXT_DATA: 'ai/setContextData',
  
  // Settings actions
  UPDATE_PREFERENCES: 'ai/updatePreferences',
  UPDATE_MODEL_CONFIG: 'ai/updateModelConfig',
  
  // Data Processing actions
  PROCESS_OCR_REQUEST: 'ai/processOCRRequest',
  PROCESS_OCR_SUCCESS: 'ai/processOCRSuccess',
  PROCESS_OCR_FAILURE: 'ai/processOCRFailure',
  
  EXTRACT_DATA_REQUEST: 'ai/extractDataRequest',
  EXTRACT_DATA_SUCCESS: 'ai/extractDataSuccess',
  EXTRACT_DATA_FAILURE: 'ai/extractDataFailure',
  
  CREATE_TEMPLATE_REQUEST: 'ai/createTemplateRequest',
  CREATE_TEMPLATE_SUCCESS: 'ai/createTemplateSuccess',
  CREATE_TEMPLATE_FAILURE: 'ai/createTemplateFailure',
  
  FETCH_TEMPLATES_REQUEST: 'ai/fetchTemplatesRequest',
  FETCH_TEMPLATES_SUCCESS: 'ai/fetchTemplatesSuccess',
  FETCH_TEMPLATES_FAILURE: 'ai/fetchTemplatesFailure',
  
  PROCESS_WORKFLOW_REQUEST: 'ai/processWorkflowRequest',
  PROCESS_WORKFLOW_SUCCESS: 'ai/processWorkflowSuccess',
  PROCESS_WORKFLOW_FAILURE: 'ai/processWorkflowFailure',
  
  FETCH_PROCESSING_STATS_REQUEST: 'ai/fetchProcessingStatsRequest',
  FETCH_PROCESSING_STATS_SUCCESS: 'ai/fetchProcessingStatsSuccess',
  FETCH_PROCESSING_STATS_FAILURE: 'ai/fetchProcessingStatsFailure',
  
  // Data Processing UI actions
  CLEAR_OCR_RESULTS: 'ai/clearOCRResults',
  CLEAR_EXTRACTION_RESULTS: 'ai/clearExtractionResults',
  SET_CURRENT_WORKFLOW: 'ai/setCurrentWorkflow',
  ADD_OCR_RESULT: 'ai/addOCRResult',
  REMOVE_OCR_RESULT: 'ai/removeOCRResult',
};

// Action creators for backward compatibility
export const aiActions = {
  // Assistant actions
  fetchAssistantsRequest: () => ({ type: AI_ACTIONS.FETCH_ASSISTANTS_REQUEST }),
  fetchAssistantsSuccess: (data) => ({ type: AI_ACTIONS.FETCH_ASSISTANTS_SUCCESS, payload: data }),
  fetchAssistantsFailure: (error) => ({ type: AI_ACTIONS.FETCH_ASSISTANTS_FAILURE, payload: error }),
  
  createAssistantRequest: () => ({ type: AI_ACTIONS.CREATE_ASSISTANT_REQUEST }),
  createAssistantSuccess: (assistant) => ({ type: AI_ACTIONS.CREATE_ASSISTANT_SUCCESS, payload: assistant }),
  createAssistantFailure: (error) => ({ type: AI_ACTIONS.CREATE_ASSISTANT_FAILURE, payload: error }),
  
  updateAssistantRequest: () => ({ type: AI_ACTIONS.UPDATE_ASSISTANT_REQUEST }),
  updateAssistantSuccess: (assistant) => ({ type: AI_ACTIONS.UPDATE_ASSISTANT_SUCCESS, payload: assistant }),
  updateAssistantFailure: (error) => ({ type: AI_ACTIONS.UPDATE_ASSISTANT_FAILURE, payload: error }),
  
  deleteAssistantRequest: () => ({ type: AI_ACTIONS.DELETE_ASSISTANT_REQUEST }),
  deleteAssistantSuccess: (id) => ({ type: AI_ACTIONS.DELETE_ASSISTANT_SUCCESS, payload: id }),
  deleteAssistantFailure: (error) => ({ type: AI_ACTIONS.DELETE_ASSISTANT_FAILURE, payload: error }),
  
  // Chat actions
  sendMessageRequest: () => ({ type: AI_ACTIONS.SEND_MESSAGE_REQUEST }),
  sendMessageSuccess: (response) => ({ type: AI_ACTIONS.SEND_MESSAGE_SUCCESS, payload: response }),
  sendMessageFailure: (error) => ({ type: AI_ACTIONS.SEND_MESSAGE_FAILURE, payload: error }),
  
  addMessage: (message) => ({ type: AI_ACTIONS.ADD_MESSAGE, payload: message }),
  setTyping: (typing) => ({ type: AI_ACTIONS.SET_TYPING, payload: typing }),
  clearChat: () => ({ type: AI_ACTIONS.CLEAR_CHAT }),
  
  // Analytics actions
  fetchAnalyticsRequest: () => ({ type: AI_ACTIONS.FETCH_ANALYTICS_REQUEST }),
  fetchAnalyticsSuccess: (data) => ({ type: AI_ACTIONS.FETCH_ANALYTICS_SUCCESS, payload: data }),
  fetchAnalyticsFailure: (error) => ({ type: AI_ACTIONS.FETCH_ANALYTICS_FAILURE, payload: error }),
  
  // Suggestions actions
  fetchSuggestionsRequest: () => ({ type: AI_ACTIONS.FETCH_SUGGESTIONS_REQUEST }),
  fetchSuggestionsSuccess: (suggestions) => ({ type: AI_ACTIONS.FETCH_SUGGESTIONS_SUCCESS, payload: suggestions }),
  fetchSuggestionsFailure: (error) => ({ type: AI_ACTIONS.FETCH_SUGGESTIONS_FAILURE, payload: error }),
  
  // UI actions
  setCurrentAssistant: (assistant) => ({ type: AI_ACTIONS.SET_CURRENT_ASSISTANT, payload: assistant }),
  setChatOpen: (open) => ({ type: AI_ACTIONS.SET_CHAT_OPEN, payload: open }),
  setSelectedModule: (module) => ({ type: AI_ACTIONS.SET_SELECTED_MODULE, payload: module }),
  setContextData: (data) => ({ type: AI_ACTIONS.SET_CONTEXT_DATA, payload: data }),
  
  // Settings actions
  updatePreferences: (preferences) => ({ type: AI_ACTIONS.UPDATE_PREFERENCES, payload: preferences }),
  updateModelConfig: (config) => ({ type: AI_ACTIONS.UPDATE_MODEL_CONFIG, payload: config }),
  
  // Data Processing actions
  processOCRRequest: () => ({ type: AI_ACTIONS.PROCESS_OCR_REQUEST }),
  processOCRSuccess: (result) => ({ type: AI_ACTIONS.PROCESS_OCR_SUCCESS, payload: result }),
  processOCRFailure: (error) => ({ type: AI_ACTIONS.PROCESS_OCR_FAILURE, payload: error }),
  
  extractDataRequest: () => ({ type: AI_ACTIONS.EXTRACT_DATA_REQUEST }),
  extractDataSuccess: (result) => ({ type: AI_ACTIONS.EXTRACT_DATA_SUCCESS, payload: result }),
  extractDataFailure: (error) => ({ type: AI_ACTIONS.EXTRACT_DATA_FAILURE, payload: error }),
  
  createTemplateRequest: () => ({ type: AI_ACTIONS.CREATE_TEMPLATE_REQUEST }),
  createTemplateSuccess: (template) => ({ type: AI_ACTIONS.CREATE_TEMPLATE_SUCCESS, payload: template }),
  createTemplateFailure: (error) => ({ type: AI_ACTIONS.CREATE_TEMPLATE_FAILURE, payload: error }),
  
  fetchTemplatesRequest: () => ({ type: AI_ACTIONS.FETCH_TEMPLATES_REQUEST }),
  fetchTemplatesSuccess: (templates) => ({ type: AI_ACTIONS.FETCH_TEMPLATES_SUCCESS, payload: templates }),
  fetchTemplatesFailure: (error) => ({ type: AI_ACTIONS.FETCH_TEMPLATES_FAILURE, payload: error }),
  
  processWorkflowRequest: () => ({ type: AI_ACTIONS.PROCESS_WORKFLOW_REQUEST }),
  processWorkflowSuccess: (result) => ({ type: AI_ACTIONS.PROCESS_WORKFLOW_SUCCESS, payload: result }),
  processWorkflowFailure: (error) => ({ type: AI_ACTIONS.PROCESS_WORKFLOW_FAILURE, payload: error }),
  
  fetchProcessingStatsRequest: () => ({ type: AI_ACTIONS.FETCH_PROCESSING_STATS_REQUEST }),
  fetchProcessingStatsSuccess: (stats) => ({ type: AI_ACTIONS.FETCH_PROCESSING_STATS_SUCCESS, payload: stats }),
  fetchProcessingStatsFailure: (error) => ({ type: AI_ACTIONS.FETCH_PROCESSING_STATS_FAILURE, payload: error }),
  
  // Data Processing UI actions
  clearOCRResults: () => ({ type: AI_ACTIONS.CLEAR_OCR_RESULTS }),
  clearExtractionResults: () => ({ type: AI_ACTIONS.CLEAR_EXTRACTION_RESULTS }),
  setCurrentWorkflow: (workflow) => ({ type: AI_ACTIONS.SET_CURRENT_WORKFLOW, payload: workflow }),
  addOCRResult: (result) => ({ type: AI_ACTIONS.ADD_OCR_RESULT, payload: result }),
  removeOCRResult: (resultId) => ({ type: AI_ACTIONS.REMOVE_OCR_RESULT, payload: resultId }),
};

export default aiActions;
