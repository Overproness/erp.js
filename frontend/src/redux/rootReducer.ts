import { combineReducers } from '@reduxjs/toolkit';

import { reducer as authReducer } from './auth';
import { reducer as permissionsReducer } from './permissions';

// Import slim UI slices (Apollo Client migration)
import crudUiReducer from './crud/crudUiSlice';
import erpUiReducer from './erp/erpUiSlice';
import settingsUiReducer from './settings/settingsUiSlice';
import authUiReducer from './auth/authUiSlice';
import permissionsUiReducer from './permissions/permissionsUiSlice';
import aiUiReducer from './ai/aiUiSlice';
import socialMediaUiReducer from './socialMedia/socialMediaUiSlice';
import workflowUiReducer from './workflow/workflowUiSlice';
import reputationUiReducer from './reputation/reputationUiSlice';
import urlUiReducer from './url/urlUiSlice';
import marketingUiReducer from './marketing/marketingUiSlice';

// Combine all reducers
const rootReducer = combineReducers({
  // Core slices
  auth: authReducer,
  permissions: permissionsReducer,

  // UI slices (Apollo Client integration)
  crudUi: crudUiReducer,
  erpUi: erpUiReducer,
  settingsUi: settingsUiReducer,
  authUi: authUiReducer,
  permissionsUi: permissionsUiReducer,
  aiUi: aiUiReducer,
  socialMediaUi: socialMediaUiReducer,
  workflowUi: workflowUiReducer,
  reputationUi: reputationUiReducer,
  urlUi: urlUiReducer,
  marketingUi: marketingUiReducer,
});

export default rootReducer;
