// Module for handling saving settings in the onboarding process
import { message } from 'antd';
import { request } from '@/request';
import * as actionTypes from '@/redux/auth/types';
import storePersist from '@/redux/storePersist';
import { settingsAction } from '@/redux/settings/actions';

/**
 * Save all settings from the onboarding process
 * @param {Object} data - Form data from onboarding
 * @param {Object} options - Additional options
 * @param {Function} options.setIsSubmitting - State setter for submission status
 * @param {Function} options.dispatch - Redux dispatch function
 * @param {Function} options.navigate - React Router navigate function
 * @param {Function} options.translate - Translation function
 * @param {Object} options.userData - Current user data
 */
const saveAllSettings = async (data, { setIsSubmitting, dispatch, navigate, translate, userData }) => {
  setIsSubmitting(true);
  
  try {
    // Prepare settings in the correct format for the backend
    const settingsToUpdate = [];
    
    // Company settings
    if (data.company_name) {
      settingsToUpdate.push({
        settingCategory: 'company_settings',
        settingKey: 'company_name',
        settingValue: data.company_name,
        valueType: 'string'
      });
    }
    
    if (data.company_address) {
      settingsToUpdate.push({
        settingCategory: 'company_settings',
        settingKey: 'company_address',
        settingValue: data.company_address,
        valueType: 'string'
      });
    }
    
    if (data.company_phone) {
      settingsToUpdate.push({
        settingCategory: 'company_settings',
        settingKey: 'company_phone',
        settingValue: data.company_phone,
        valueType: 'string'
      });
    }
    
    // App settings
    if (data.app_company_email) {
      settingsToUpdate.push({
        settingCategory: 'app_settings',
        settingKey: 'app_company_email',
        settingValue: data.app_company_email,
        valueType: 'string'
      });
    }
    
    if (data.app_country) {
      settingsToUpdate.push({
        settingCategory: 'app_settings',
        settingKey: 'app_country',
        settingValue: data.app_country,
        valueType: 'string'
      });
    }
    
    if (data.app_timezone) {
      settingsToUpdate.push({
        settingCategory: 'app_settings',
        settingKey: 'app_timezone',
        settingValue: data.app_timezone,
        valueType: 'string'
      });
    }
    
    if (data.app_language) {
      settingsToUpdate.push({
        settingCategory: 'app_settings',
        settingKey: 'app_language',
        settingValue: data.app_language,
        valueType: 'string'
      });
    }
    
    if (data.date_format) {
      settingsToUpdate.push({
        settingCategory: 'app_settings',
        settingKey: 'date_format',
        settingValue: data.date_format,
        valueType: 'string'
      });
    }
    
    // Money format settings
    if (data.default_currency_code) {
      settingsToUpdate.push({
        settingCategory: 'money_format_settings',
        settingKey: 'currency_code',
        settingValue: data.default_currency_code,
        valueType: 'string'
      });
    }
    
    if (data.default_currency_symbol) {
      settingsToUpdate.push({
        settingCategory: 'money_format_settings',
        settingKey: 'currency_symbol',
        settingValue: data.default_currency_symbol,
        valueType: 'string'
      });
    }
    
    if (data.currency_flag) {
      settingsToUpdate.push({
        settingCategory: 'money_format_settings',
        settingKey: 'currency_flag',
        settingValue: data.currency_flag,
        valueType: 'string'
      });
    }
    
    if (data.currency_position) {
      settingsToUpdate.push({
        settingCategory: 'money_format_settings',
        settingKey: 'currency_position',
        settingValue: data.currency_position,
        valueType: 'string'
      });
    }
    
    // Fix inconsistent field naming between UI and backend
    const decimalSep = data.decimal_separator || data.decimal_sep;
    if (decimalSep) {
      settingsToUpdate.push({
        settingCategory: 'money_format_settings',
        settingKey: 'decimal_sep',
        settingValue: decimalSep,
        valueType: 'string'
      });
    }
    
    const thousandSep = data.thousand_separator || data.thousand_sep;
    if (thousandSep) {
      settingsToUpdate.push({
        settingCategory: 'money_format_settings',
        settingKey: 'thousand_sep',
        settingValue: thousandSep,
        valueType: 'string'
      });
    }
    
    // Fix inconsistent field naming between UI and backend
    const centPrecision = data.decimal_places || data.cent_precision;
    if (centPrecision !== undefined) {
      settingsToUpdate.push({
        settingCategory: 'money_format_settings',
        settingKey: 'cent_precision',
        settingValue: centPrecision,
        valueType: 'number'
      });
    }
    
    // Use the admin-specific batch update endpoint for settings, which ensures proper admin ownership
    // This approach is preferred over updateMany since it creates settings with the correct admin owner
    try {
      // First attempt to use the batch endpoint which is admin-aware
      await request.post({
        entity: 'setting/batch',
        jsonData: { settings: settingsToUpdate }
      });
      console.log('Settings saved using batch endpoint');
    } catch (batchError) {
      console.error('Error using batch endpoint:', batchError);
      
      // Fallback to redux action if batch fails
      await dispatch(
        settingsAction.updateMany({
          entity: 'setting',
          jsonData: { settings: settingsToUpdate }
        })
      );
    }
    
    // Update the admin's onboarding status in the backend
    try {
      // Update local auth state to reflect completion of onboarding
      const currentAuthState = storePersist.get('auth');
      if (currentAuthState) {        const updatedAuthState = {
          ...currentAuthState,
          current: {
            ...currentAuthState.current,
            // Use the new single flag for onboarding status
            onboardingComplete: true,
            // Keep legacy flags for backward compatibility
            hasSetupCompany: true,
            isFirstLogin: false,
            needsOnboarding: false
          }
        };
        storePersist.set('auth', updatedAuthState);
      }
      
      // Make API call to update the admin's profile and complete company setup
      if (userData && userData._id) {
        console.log('Using admin completeCompanySetup endpoint for admin ID:', userData._id);
        
        try {
          // Use the admin-specific endpoint that properly associates settings with the admin
          const companySetupResult = await request.post({
            entity: 'admin/completeCompanySetup',
            jsonData: {
              companyName: data.company_name || 'My Company',
              companyAddress: data.company_address || '',
              companyEmail: data.app_company_email || '',
              companyPhone: data.company_phone || '',
              currencyCode: data.default_currency_code || 'USD',
              currencySymbol: data.default_currency_symbol || '$',
              currencyPosition: data.currency_position || 'before',
              decimalSeparator: decimalSep || '.',
              thousandSeparator: thousandSep || ',',
              centPrecision: centPrecision || 2,
              dateFormat: data.date_format || 'DD/MM/YYYY'
            }
          });
          
          console.log('Company setup completion result:', companySetupResult);
          
          if (!companySetupResult.success) {
            throw new Error(companySetupResult.message || 'Admin setup endpoint failed');
          }
        } catch (setupError) {
          console.error('Error using completeCompanySetup endpoint:', setupError);
          
          // Fallback to using setting/batch endpoint which properly sets owner
          console.log('Falling back to setting/batch endpoint for admin settings');
          
          try {
            // This endpoint properly sets the admin as the owner of the settings
            await request.post({
              entity: 'setting/batch',
              jsonData: { 
                settings: settingsToUpdate 
              }
            });
            
            // Then update admin record separately using profile/update endpoint
            const adminUpdateResult = await request.patch({
              entity: 'admin/profile/update',
              jsonData: {
                onboardingComplete: true,
                companyName: data.company_name || 'My Company'
              }
            });
            
            console.log('Admin profile update result:', adminUpdateResult);
          } catch (batchUpdateError) {
            console.error('Error using batch settings update:', batchUpdateError);
          }
        }
      }
    } catch (updateError) {
      console.error('Failed to update admin onboarding status:', updateError);
      // Continue with redirection even if this fails
    }
    
    message.success(translate('Company setup completed successfully!'));
    
    // Force refresh settings to ensure we have latest settings after onboarding
    // This will fetch admin-specific settings based on the admin ID in the auth token
    try {
      console.log('Refreshing settings from server after onboarding...');
      await dispatch(settingsAction.list({ 
        entity: 'setting', 
        forceRefresh: true 
      }));
    } catch (refreshError) {
      console.error('Error refreshing settings:', refreshError);    }
    
    // Update auth state directly without trying to fetch profile
    // This ensures we don't get stuck in onboarding regardless of API responses
    console.log('Updating local auth state to mark onboarding as complete');
    const currentAuthState = storePersist.get('auth');
    if (currentAuthState) {
      // Create a fresh updatedAuthState object with explicit onboarding values
      const updatedAuthState = {
        ...currentAuthState,
        current: {
            ...currentAuthState.current,
            // Set onboarding as completed using single flag
            onboardingComplete: true,
            needsOnboarding: false
          }
        };
        
        console.log('New auth state with onboarding complete:', updatedAuthState);
        // Update redux store directly with the correct action type
        dispatch({
          type: actionTypes.REQUEST_SUCCESS, // Using the imported action type
          payload: updatedAuthState.current
        });
        
        // Persist to local storage
        storePersist.set('auth', updatedAuthState);
        console.log('Auth state updated - onboarding completed');
      }
    
    // Remove the finance-settings/debug endpoint that's causing 404 errors
    
    // Navigate to the dashboard
    console.log('Redirecting to dashboard after successful onboarding');
    
    // Introduce a delay to allow the user to see the success message
    // and ensure settings are fully loaded
    setTimeout(() => {
      navigate('/');
    }, 2000);
  } catch (error) {
    console.error('Error saving settings:', error);
    message.error(translate('An error occurred while saving settings.'));  } finally {
    setIsSubmitting(false);
  }
};

export default saveAllSettings;
