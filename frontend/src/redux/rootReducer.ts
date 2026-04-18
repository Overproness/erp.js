import { combineReducers } from '@reduxjs/toolkit';

import { reducer as authReducer } from './auth';
import { reducer as crudReducer } from './crud';
import { reducer as erpReducer } from './erp';
import { reducer as permissionsReducer } from './permissions';
import { reducer as settingsReducer } from './settings';

// Import slim UI slices (Apollo Client migration)
import aiUiReducer from './ai/aiUiSlice';
import authUiReducer from './auth/authUiSlice';
import crudUiReducer from './crud/crudUiSlice';
import erpUiReducer from './erp/erpUiSlice';
import marketingUiReducer from './marketing/marketingUiSlice';
import permissionsUiReducer from './permissions/permissionsUiSlice';
import reputationUiReducer from './reputation/reputationUiSlice';
import settingsUiReducer from './settings/settingsUiSlice';
import socialMediaUiReducer from './socialMedia/socialMediaUiSlice';
import subscriptionReducer from './subscription/subscriptionSlice';
import urlUiReducer from './url/urlUiSlice';
import workflowUiReducer from './workflow/workflowUiSlice';

// Combine all reducers
const rootReducer = combineReducers({
  // Core slices
  auth: authReducer,
  crud: crudReducer,
  erp: erpReducer,
  permissions: permissionsReducer,
  settings: settingsReducer,
  subscription: subscriptionReducer,

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
