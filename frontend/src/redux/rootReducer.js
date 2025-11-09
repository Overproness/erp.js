import { combineReducers } from '@reduxjs/toolkit';

import aiReducer from './ai/aiSlice';
import { reducer as authReducer } from './auth';
import { reducer as crudReducer } from './crud';
import { reducer as erpReducer } from './erp';
import { reducer as permissionsReducer } from './permissions';
import reputationReducer from './reputation/reputationSlice'; // Import the default export
import { reducer as settingsReducer } from './settings';
import { reducer as socialMediaReducer } from './socialMedia';
import { urlReducer } from './url';

// Import marketing reducers
import {
  behaviorReducer,
  campaignReducer,
  marketingReducer,
  retargetingReducer,
} from './marketing';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  crud: crudReducer,
  erp: erpReducer,
  settings: settingsReducer,
  ai: aiReducer,
  socialMedia: socialMediaReducer,
  url: urlReducer,
  reputation: reputationReducer, // Use the default export
  // Add marketing related reducers
  marketing: marketingReducer,
  behavior: behaviorReducer,
  retargeting: retargetingReducer,
  campaign: campaignReducer,
  permissions: permissionsReducer,
});

export default rootReducer;
