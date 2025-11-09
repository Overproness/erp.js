import { createSelector } from 'reselect';

export const selectSettings = (state) => state.settings;

export const selectCurrentSettings = createSelector([selectSettings], (settings) => {
  // Add debugging to see what's being loaded
  return settings.result || {};
});

export const selectMoneyFormat = createSelector([selectCurrentSettings], (settings) => {
  // Get money format settings directly from backend structure

  // Use money_format_settings directly from backend
  if (settings.money_format_settings && Object.keys(settings.money_format_settings).length > 0) {
    return { ...settings.money_format_settings };
  }

  // Fallback to defaults if no settings found
  return {
    currency_code: 'USD',
    currency_symbol: '$',
    currency_position: 'before',
    decimal_sep: '.',
    thousand_sep: ',',
    cent_precision: 2,
    zero_format: false,
  };
});

export const selectDateFormat = createSelector(
  [selectCurrentSettings],
  (settings) => settings.date_format || 'DD/MM/YYYY'
);

// App settings selector
export const selectAppSettings = createSelector([selectCurrentSettings], (settings) => {
  // Get app settings from the new structure
  const appSettings = settings?.app_settings || settings?.general || {};

  return {
    app_name: appSettings.site_name || appSettings.app_name || 'ERP System',
    app_date_format: appSettings.date_format || appSettings.app_date_format || 'DD/MM/YYYY',
    app_timezone: appSettings.timezone || appSettings.app_timezone || 'UTC',
    app_language: appSettings.language || appSettings.app_language || 'en',
    app_country: appSettings.country || appSettings.app_country || 'US',
    ...appSettings,
  };
});

// Finance settings selector
export const selectFinanceSettings = createSelector([selectCurrentSettings], (settings) => {

  // Get settings from the new structure
  const financeSettings = settings?.finance || {};
  const moneyFormatSettings = settings?.money_format_settings || {};
  const currencySettings = settings?.currency || {};

  // Get currency info from the appropriate sources
  let currencySymbol = '$';
  let currencyCode = 'USD';
  let currencyPosition = 'before';

  // Priority: currency settings > money_format_settings > defaults
  if (currencySettings?.symbol || currencySettings?.code) {
    currencySymbol = currencySettings.symbol || '$';
    currencyCode = currencySettings.code || currencySettings.default || 'USD';
    currencyPosition = currencySettings.position || 'before';
  } else if (moneyFormatSettings?.currency_symbol || moneyFormatSettings?.currency_code) {
    currencySymbol = moneyFormatSettings.currency_symbol || '$';
    currencyCode =
      moneyFormatSettings.currency_code || moneyFormatSettings.default_currency_code || 'USD';
    currencyPosition = moneyFormatSettings.currency_position || 'before';
  }

  // Get finance counters
  const counters = financeSettings?.counters || {};

  // Create consolidated finance settings object
  const result = {
    // Currency settings
    currency_symbol: currencySymbol,
    currency_code: currencyCode,
    currency_position: currencyPosition,

    // Finance document counters
    last_invoice_number: counters.invoice || financeSettings?.last_invoice_number || 0,
    last_quote_number: counters.quote || financeSettings?.last_quote_number || 0,
    last_payment_number: counters.payment || financeSettings?.last_payment_number || 0,

    // Tax settings
    tax_rate: financeSettings?.defaults?.taxRate || financeSettings?.tax_rate || 0,
  };

  return result;
});

// CRM settings selector
export const selectCrmSettings = createSelector(
  [selectCurrentSettings],
  (settings) => settings.crm_settings
);

// Company settings selector
export const selectCompanySettings = createSelector([selectCurrentSettings], (settings) => {
  // Try to get company settings from different sources in order of priority
  let companySettings = {};

  // First try dedicated company_settings object
  if (settings.company_settings && Object.keys(settings.company_settings).length > 0) {
    console.log('Using company_settings object');
    companySettings = settings.company_settings;
  }
  // Then check finance_settings
  else if (settings.finance_settings && settings.finance_settings.companyName) {
    console.log('Using finance_settings company data');
    companySettings = {
      company_name: settings.finance_settings.companyName,
      // Add other properties if available in finance_settings
    };

    // Merge in any individual company properties
    for (const key in settings) {
      if (key.startsWith('company_')) {
        companySettings[key] = settings[key];
      }
    }
  }
  // Collect individual company_ properties
  else {
    console.log('Using individual company properties');
    for (const key in settings) {
      if (key.startsWith('company_')) {
        companySettings[key] = settings[key];
      }
    }

    // Also look for app_company properties
    if (settings.app_company_email) {
      companySettings.company_email = settings.app_company_email;
    }
  }

  console.log('Final company settings:', companySettings);
  return companySettings;
});

// AI settings selector
export const selectAiSettings = createSelector(
  [selectCurrentSettings],
  (settings) => settings.ai_settings
);
