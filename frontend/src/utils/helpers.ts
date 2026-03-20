export function get(obj, key) {
  return key.split('.').reduce(function (o, x) {
    return o === undefined || o === null ? o : o[x];
  }, obj);
}

Object.byString = function (o, s) {
  s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  s = s.replace(/^\./, ''); // strip a leading dot
  let a = s.split('.');
  for (let i = 0, n = a.length; i < n; ++i) {
    let k = a[i];
    if (o !== null) {
      if (k in o) {
        o = o[k];
      } else {
        return;
      }
    } else {
      return;
    }
  }
  return o;
};

/* 
 To check only if a property exists, without getting its value. It similar get function.
*/
export function has(obj, key) {
  return key.split('.').every(function (x) {
    if (typeof obj !== 'object' || obj === null || x in obj === false)
      /// !x in obj or  x in obj === true *** if you find any bug
      return false;
    obj = obj[x];
    return true;
  });
}

/* 
 convert indexes to properties
*/
export function valueByString(obj, string, devider) {
  if (devider === undefined) {
    devider = '|';
  }
  return string
    .split(devider)
    .map(function (key) {
      return get(obj, key);
    })
    .join(' ');
}

/*
 Submit multi-part form using ajax.
*/
export function toFormData(form) {
  let formData = new FormData();
  const elements = form.querySelectorAll('input, select, textarea');

  // Maximum file size in bytes (50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  for (let i = 0; i < elements.length; ++i) {
    const element = elements[i];
    const name = element.name;

    if (name && element.dataset.disabled !== 'true') {
      if (element.type === 'file') {
        // Handle file uploads properly
        if (element.files && element.files.length > 0) {
          const file = element.files[0];

          // Check file size before appending
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(
              `File size exceeds the maximum limit of 50MB. Your file is ${(
                file.size /
                (1024 * 1024)
              ).toFixed(2)}MB.`
            );
          }

          formData.append(name, file);
          // Also add the file name and type for reference
          formData.append(`${name}_filename`, file.name);
          formData.append(`${name}_type`, file.type);
          formData.append(`${name}_size`, file.size);
        }
      } else {
        const value = element.value;
        if (value && value.trim()) {
          formData.append(name, value);
        }
      }
    }
  }

  return formData;
}

/*
 Format Date to display admin
*/
export function formatDate(param) {
  const date = new Date(param);
  let day = date.getDate().toString();
  let month = (date.getMonth() + 1).toString();
  const year = date.getFullYear();
  if (month.length < 2) month = `0${month}`;
  if (day.length < 2) day = `0${day}`;
  const fullDate = `${day}/${month}/${year}`;
  return fullDate;
}

export const isDate = function ({ date, format = 'YYYY-MM-DD' }) {
  if (typeof date == 'boolean') return false;
  if (typeof date == 'number') return false;
  if (dayjs(date, format).isValid()) return true;
  return false;
};
/*
 Format Datetime to display admin
*/
export function formatDatetime(param) {
  let time = new Date(param).toLocaleTimeString();
  return formatDate(param) + ' ' + time;
}

/*
  Regex to validate phone number format
*/
export const validatePhoneNumber = /^(?:[+\d()\-\s]+)$/;

/*
 Set object value in html
*/

/**
 * Build advanced search query parameters
 * @param {Object} searchParams - The search parameters object
 * @returns {Object} - Formatted query parameters for API request
 */
export function buildAdvancedSearchQuery(searchParams) {
  const query = {};

  // Process each valid search parameter
  Object.keys(searchParams).forEach((key) => {
    const value = searchParams[key];

    // Only add parameters with valid values
    if (value !== undefined && value !== null && value !== '') {
      // Handle arrays (like tags, documentType)
      if (Array.isArray(value)) {
        if (value.length > 0) {
          // Keep as array for POST request body
          query[key] = value;
        }
      }
      // Handle date objects
      else if (value instanceof Date) {
        query[key] = value.toISOString().split('T')[0];
      }
      // Handle custom fields object
      else if (key === 'customFields' && typeof value === 'object') {
        query[key] = value;
      }
      // Regular value
      else {
        query[key] = value;
      }
    }
  });

  return query;
}

/**
 * Format search results for display
 * @param {Array} results - Search results to format
 * @param {Array} highlightTerms - Terms to highlight
 * @returns {Array} - Formatted results with highlighted text
 */
export function formatSearchResults(results, highlightTerms = []) {
  if (!results || !Array.isArray(results)) return [];

  return results.map((item) => {
    // Create a copy of the item to avoid modifying original
    const formattedItem = { ...item };

    // If we have terms to highlight, process text fields
    if (highlightTerms.length > 0) {
      // Fields that might contain text to highlight
      const textFields = ['title', 'description', 'fileName'];

      textFields.forEach((field) => {
        if (formattedItem[field]) {
          let text = formattedItem[field];

          // Apply highlighting for each term
          highlightTerms.forEach((term) => {
            if (term.trim()) {
              const regex = new RegExp(`(${term.trim()})`, 'gi');
              text = text.replace(regex, '<mark>$1</mark>');
            }
          });

          formattedItem[`${field}Highlighted`] = text;
        }
      });
    }

    return formattedItem;
  });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function copyToClipboard(text) {
  try {
    // Modern browser approach
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        textArea.remove();
        console.error('Copy to clipboard failed:', err);
        return false;
      }
    }
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    return false;
  }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} - Validation result with valid boolean and message
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, message: 'URL is required' };
  }

  // Trim whitespace
  url = url.trim();

  if (!url) {
    return { valid: false, message: 'URL is required' };
  }

  try {
    // Add protocol if missing
    let testUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      testUrl = 'https://' + url;
    }

    const urlObj = new URL(testUrl);

    // Check for valid protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, message: 'URL must use HTTP or HTTPS protocol' };
    }

    // Check for valid hostname
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return { valid: false, message: 'URL must have a valid hostname' };
    }

    // Check for localhost or private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return { valid: false, message: 'Private/local URLs are not allowed' };
      }
    }

    // Check for minimum domain length
    if (urlObj.hostname.split('.').length < 2) {
      return { valid: false, message: 'URL must have a valid domain' };
    }

    return { valid: true, message: '' };
  } catch (error) {
    return { valid: false, message: 'Invalid URL format' };
  }
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the string to generate
 * @returns {string} - Random string
 */
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
