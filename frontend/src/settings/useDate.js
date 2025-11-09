import { useSelector } from 'react-redux';
import { selectAppSettings } from '@/redux/settings/selectors';
import dayjs from 'dayjs';

/**
 * Custom hook for date formatting features
 */
export function useDate() {
  // Get app settings from Redux
  const appSettings = useSelector(selectAppSettings);
  
  // Default to DD/MM/YYYY if not specified in settings
  const dateFormat = appSettings?.app_date_format || 'DD/MM/YYYY';
  
  /**
   * Format a date according to app settings
   * @param {Date|string} date - The date to format
   * @param {string} format - Optional custom format to use instead of app settings
   * @returns {string} - Formatted date string
   */
  const formatDate = (date, format = dateFormat) => {
    if (!date) return '-';
    return dayjs(date).format(format);
  };
  
  return {
    dateFormat,
    formatDate,
  };
};
