import { request } from '@/request';
import * as actionTypes from './types';

const dispatchSettingsData = (datas) => {
  const settingsCategory = {};

  if (!datas || datas.length === 0) {
    // Return default empty settings structure if no settings found
    return {
      company: {},
      general: {},
      money_format_settings: {
        currency_code: 'USD',
        currency_symbol: '$',
        currency_position: 'before',
        decimal_sep: '.',
        thousand_sep: ',',
        cent_precision: 2,
      },
    };
  }

  // Use backend structure directly without any modifications
  datas.forEach((setting) => {
    let category, data;

    // Check if this is the new backend structure with type/settings
    if (setting.type && setting.settings) {
      category = setting.type;
      data = setting.settings;
    }
    // Or the old structure with category/data
    else if (setting.category && setting.data) {
      category = setting.category;
      data = setting.data;
    }

    if (category && data) {
      // Store settings exactly as they come from backend
      settingsCategory[category] = data;
    }
  });

  return settingsCategory;
};

export const settingsAction = {
  resetState: () => (dispatch) => {
    dispatch({
      type: actionTypes.RESET_STATE,
    });
  },
  updateCurrency:
    ({ data }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.UPDATE_CURRENCY,
        payload: data,
      });
    },
  update:
    ({ entity, settingKey, jsonData }) =>
    async (dispatch) => {
      // Validate entity parameter
      if (!entity) {
        console.error('Settings update failed: entity parameter is required');
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
        return {
          success: false,
          message: 'Entity parameter is required for settings update',
        };
      }

      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });
      let data = await request.patch({
        entity: entity + '/updateBySettingKey/' + settingKey,
        jsonData,
      });

      if (data.success === true) {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
        });

        // Use request.get instead of request.listAll
        let data = await request.get({ entity });

        if (data.success === true) {
          const payload = dispatchSettingsData(data.result);

          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            payload,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
          });
        }
      } else {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
      }
    },
  updateMany:
    ({ entity, jsonData }) =>
    async (dispatch) => {
      // Validate entity parameter
      if (!entity) {
        console.error('Settings updateMany failed: entity parameter is required');
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
        return {
          success: false,
          message: 'Entity parameter is required for settings update',
        };
      }

      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });

      // Convert old format to new format for batch update
      if (jsonData.settings) {
        // Group settings by category for the new structure
        const settingsByCategory = {};

        jsonData.settings.forEach((setting) => {
          let category = setting.settingCategory || 'general';

          // Auto-determine category if not provided
          if (!setting.settingCategory && setting.settingKey) {
            if (setting.settingKey.startsWith('company_')) {
              category = 'company_settings';
            } else if (
              setting.settingKey.includes('currency') ||
              setting.settingKey.includes('decimal') ||
              setting.settingKey.includes('thousand')
            ) {
              category = 'money_format_settings';
            } else if (setting.settingKey.startsWith('app_')) {
              category = 'app_settings';
            } else if (
              setting.settingKey.includes('invoice') ||
              setting.settingKey.includes('quote') ||
              setting.settingKey.includes('payment')
            ) {
              category = 'finance_settings';
            }
          }

          if (!settingsByCategory[category]) {
            settingsByCategory[category] = {};
          }

          settingsByCategory[category][setting.settingKey] = setting.settingValue;
        });

        // Convert to new batch format
        jsonData.settings = Object.entries(settingsByCategory).map(([category, data]) => ({
          category,
          data,
        }));
      }

      console.log('Updating settings with data:', jsonData);

      let data = await request.post({
        entity: entity + '/updateManySetting',
        jsonData,
      });

      if (data.success === true) {
        // All settings are now stored in the settings table - no need for special handling

        dispatch({
          type: actionTypes.REQUEST_LOADING,
        });

        // Always fetch fresh data from backend after update
        let data = await request.get({
          entity,
          // Force fresh data with cache-busting parameter
          params: { _t: new Date().getTime() },
        });

        if (data.success === true) {
          const payload = dispatchSettingsData(data.result);

          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            payload,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
          });
        }
      } else {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
      }
    },
  list:
    (
      { entity, forceRefresh = true } // Always force refresh by default
    ) =>
    async (dispatch) => {
      // Validate entity parameter
      if (!entity) {
        console.error('Settings list failed: entity parameter is required');
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
        return {
          success: false,
          message: 'Entity parameter is required for settings list',
        };
      }

      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });

      try {
        // Always clear cached settings to ensure fresh data from backend
        window.localStorage.removeItem('settings');

        // Always use fresh data from backend with cache-busting parameter
        let data = await request.get({
          entity,
          // Always add cache-busting parameter to ensure fresh data
          params: { _t: new Date().getTime() },
        });


        // Process the settings data even if result is empty
        const payload = dispatchSettingsData(data.result);

        // Only add default values for money_format_settings if completely missing AND not already set by user
        if (
          !payload.money_format_settings ||
          Object.keys(payload.money_format_settings).length === 0
        ) {
          const defaultCode = 'USD'; // Default to USD instead of EUR

          payload.money_format_settings = {
            currency_code: defaultCode,
            default_currency_code: defaultCode,
            currency_symbol: '$',
            currency_position: 'before',
            decimal_sep: '.',
            thousand_sep: ',',
            cent_precision: 2,
          };

        }

        dispatch({
          type: actionTypes.REQUEST_SUCCESS,
          payload,
        });
      } catch (error) {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
          error: error.message,
        });
      }
    },
  upload:
    ({ entity, settingKey, jsonData }) =>
    async (dispatch) => {
      // Validate entity parameter
      if (!entity) {
        console.error('Settings upload failed: entity parameter is required');
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
        return {
          success: false,
          message: 'Entity parameter is required for settings upload',
        };
      }

      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });

      let data = await request.upload({
        entity: entity,
        id: settingKey,
        jsonData,
      });

      if (data.success === true) {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
        });

        // Use request.get instead of request.listAll
        let data = await request.get({ entity });

        if (data.success === true) {
          const payload = dispatchSettingsData(data.result);
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            payload,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
          });
        }
      } else {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
      }
    },
};
