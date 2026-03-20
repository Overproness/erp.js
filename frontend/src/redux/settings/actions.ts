import apolloClient from '@/graphql/client';
import { GET_ALL_SETTINGS } from '@/graphql/operations/settings';
import { UPDATE_SETTING_BY_KEY, UPDATE_MANY_SETTINGS } from '@/graphql/operations/settings';
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
      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });

      try {
        await apolloClient.mutate({
          mutation: UPDATE_SETTING_BY_KEY,
          variables: { settingKey, input: jsonData },
        });

        // Refetch all settings after update
        const { data } = await apolloClient.query({
          query: GET_ALL_SETTINGS,
          fetchPolicy: 'network-only',
        });

        const payload = dispatchSettingsData(data?.settingListAll?.result);
        dispatch({
          type: actionTypes.REQUEST_SUCCESS,
          payload,
        });
      } catch (error) {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
      }
    },
  updateMany:
    ({ entity, jsonData }) =>
    async (dispatch) => {
      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });

      try {
        // Convert old format to new format for batch update
        let settingsInput = jsonData.settings || [];
        if (Array.isArray(settingsInput) && settingsInput.length > 0 && settingsInput[0].settingKey) {
          const settingsByCategory = {};
          settingsInput.forEach((setting) => {
            let category = setting.settingCategory || 'general';
            if (!setting.settingCategory && setting.settingKey) {
              if (setting.settingKey.startsWith('company_')) category = 'company_settings';
              else if (setting.settingKey.includes('currency') || setting.settingKey.includes('decimal') || setting.settingKey.includes('thousand')) category = 'money_format_settings';
              else if (setting.settingKey.startsWith('app_')) category = 'app_settings';
              else if (setting.settingKey.includes('invoice') || setting.settingKey.includes('quote') || setting.settingKey.includes('payment')) category = 'finance_settings';
            }
            if (!settingsByCategory[category]) settingsByCategory[category] = {};
            settingsByCategory[category][setting.settingKey] = setting.settingValue;
          });
          settingsInput = Object.entries(settingsByCategory).map(([category, data]) => ({
            category,
            data,
          }));
        }

        await apolloClient.mutate({
          mutation: UPDATE_MANY_SETTINGS,
          variables: { input: settingsInput },
        });

        // Refetch all settings after batch update
        const { data } = await apolloClient.query({
          query: GET_ALL_SETTINGS,
          fetchPolicy: 'network-only',
        });

        const payload = dispatchSettingsData(data?.settingListAll?.result);
        dispatch({
          type: actionTypes.REQUEST_SUCCESS,
          payload,
        });
      } catch (error) {
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
      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });

      try {
        window.localStorage.removeItem('settings');

        const { data } = await apolloClient.query({
          query: GET_ALL_SETTINGS,
          fetchPolicy: 'network-only',
        });

        const result = data?.settingListAll?.result;
        const payload = dispatchSettingsData(result);

        if (
          !payload.money_format_settings ||
          Object.keys(payload.money_format_settings).length === 0
        ) {
          payload.money_format_settings = {
            currency_code: 'USD',
            default_currency_code: 'USD',
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
      dispatch({
        type: actionTypes.REQUEST_LOADING,
      });

      // File upload stays REST
      let data = await request.upload({
        entity: entity,
        id: settingKey,
        jsonData,
      });

      if (data.success === true) {
        // Refetch settings via GraphQL
        try {
          const { data: gqlData } = await apolloClient.query({
            query: GET_ALL_SETTINGS,
            fetchPolicy: 'network-only',
          });
          const payload = dispatchSettingsData(gqlData?.settingListAll?.result);
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            payload,
          });
        } catch {
          dispatch({ type: actionTypes.REQUEST_FAILED });
        }
      } else {
        dispatch({
          type: actionTypes.REQUEST_FAILED,
        });
      }
    },
};
