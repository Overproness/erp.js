import { useSelector } from 'react-redux';
import { selectAppSettings } from '@/redux/settings/selectors';
import dayjs from 'dayjs';

/**
 * Custom hook for date formatting features
 */
export function useDate() {
  const appSettings = useSelector(selectAppSettings);
  const dateFormat = appSettings?.app_date_format ?? 'DD/MM/YYYY';

  /**
   * Format date using the app's date format
   * @param {Date|string} date - The date to format
   * @returns {string} - Formatted date string
   */
  const formatDate = (date) => {
    if (!date) return '-';
    return dayjs(date).format(dateFormat);
  };

  return {
    dateFormat,
    formatDate,
  };
};
