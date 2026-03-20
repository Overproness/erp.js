import {
  selectFinanceSettings,
  selectMoneyFormat,
  selectSettings,
} from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';

/**
 * Custom hook for currency and money formatting features
 * This uses admin-specific currency settings from Redux
 */
export function useMoney() {
  // Get finance settings from Redux
  const financeSettings = useSelector(selectFinanceSettings);
  const moneyFormat = useSelector(selectMoneyFormat);
  const settingsState = useSelector(selectSettings);

  // Check if settings are still loading
  const isSettingsLoading = settingsState.isLoading;
  const hasSettingsLoaded = settingsState.isSuccess;

  // Log what sources we have
  console.debug('useMoney hook sources:', {
    moneyFormat: moneyFormat ? Object.keys(moneyFormat) : null,
    financeSettings: financeSettings ? Object.keys(financeSettings) : null,
    isSettingsLoading,
    hasSettingsLoaded,
    // Log actual values for debugging
    actualCurrencyCode: moneyFormat?.currency_code,
    actualCurrencySymbol: moneyFormat?.currency_symbol,
  });

  // First determine currency code from available sources
  // Check these in priority order - most specific to most generic
  // If settings are still loading, prefer to use defaults rather than fallback values
  const currencyCode =
    moneyFormat?.currency_code ||
    financeSettings?.currencySettings?.defaultCurrency?.code ||
    financeSettings?.currency_code ||
    (!hasSettingsLoaded ? 'USD' : 'USD'); // Use USD as default

  // Map common currency codes to symbols
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
  };

  // Get currency symbol with better fallbacks - prioritize using the symbol for the current currency code
  const currencySymbol = currencySymbols[currencyCode] || currencyCode;

  const currency =
    moneyFormat?.currency_symbol ||
    financeSettings?.currency_symbol ||
    financeSettings?.currencySettings?.defaultCurrency?.symbol ||
    currencySymbol;

  // Determine position with better defaults based on currency code
  const currencyPosition =
    moneyFormat?.currency_position ||
    financeSettings?.currency_position ||
    (currencyCode === 'JPY' ? 'before' : currencyCode === 'EUR' ? 'after' : 'before');

  // Get decimal and thousand separators with currency-specific defaults
  const decimalSep =
    moneyFormat?.decimal_sep || (currencyCode === 'JPY' ? '.' : currencyCode === 'EUR' ? ',' : '.');

  const thousandSep =
    moneyFormat?.thousand_sep ||
    (currencyCode === 'JPY' ? ',' : currencyCode === 'EUR' ? '.' : ',');

  // Different currencies have different decimal precision
  // JPY has 0 decimal places by convention
  const centPrecision = currencyCode === 'JPY' ? 0 : moneyFormat?.cent_precision || 2;

  /**
   * Format amount with currency symbol
   * @param {number} amount - The amount to format
   * @returns {string} - Formatted amount with currency
   */
  const formatMoney = (amount) => {
    // Ensure amount is a valid number
    const numAmount = amount !== undefined && amount !== null ? Number(amount) : 0;

    if (isNaN(numAmount)) {
      return currencyPosition === 'before'
        ? `${currency}0${decimalSep}00`
        : `0${decimalSep}00 ${currency}`;
    }

    // Format the number with the correct separators
    let [whole, fraction] = numAmount.toFixed(centPrecision).split('.');

    // Add thousand separators
    if (thousandSep && whole.length > 3) {
      whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
    }

    // Create the formatted amount with correct decimal separator
    // For JPY, don't show decimal part at all
    const formattedAmount =
      currencyCode === 'JPY' || centPrecision === 0
        ? whole
        : `${whole}${decimalSep}${fraction || '00'}`;

    // Position the currency symbol based on settings
    return currencyPosition === 'before'
      ? `${currency}${formattedAmount}`
      : `${formattedAmount} ${currency}`;
  };

  /**
   * Format amount with currency symbol
   * @param {object|number} params - Either the amount to format or an object with amount and currency_code
   * @returns {string} - Formatted amount with currency
   */
  const moneyFormatter = (params) => {
    // Handle both direct amount and object with amount property
    if (params === undefined || params === null) {
      return formatMoney(0);
    }

    if (typeof params === 'object') {
      // If it's an object with amount, use that value
      if (params.amount !== undefined) {
        return formatMoney(params.amount);
      }
      return formatMoney(0);
    } else {
      // If it's a direct amount
      return formatMoney(params);
    }
  };

  // Expose a parser function to convert formatted values back to numbers
  const moneyParse = (formattedValue) => {
    if (!formattedValue) return 0;

    // Remove currency symbol and cleanup
    let valueString = formattedValue.toString();
    if (currency) {
      valueString = valueString.replace(currency, '');
    }

    // Remove thousand separators
    if (thousandSep) {
      valueString = valueString.split(thousandSep).join('');
    }

    // Replace decimal separator with dot for parsing
    if (decimalSep !== '.') {
      valueString = valueString.replace(decimalSep, '.');
    }

    // Parse to float and return
    return parseFloat(valueString.trim()) || 0;
  };

  return {
    currency,
    currencyCode,
    currencyPosition,
    decimalSep,
    thousandSep,
    centPrecision,
    formatMoney,
    moneyFormatter,
    moneyParse
  };
}
