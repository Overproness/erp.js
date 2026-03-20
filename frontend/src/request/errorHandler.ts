import { message } from 'antd';

// Helper function to show error messages
const showErrorMessage = (errorMsg, duration = 4.5) => {
  console.error(errorMsg);

  try {
    message.error(errorMsg, duration);
  } catch (err) {
    // If Ant Design message fails, just log to console
    console.error('Failed to show error message:', err);
  }
};

const errorHandler = (error) => {
  const response = error.response;

  // Handle 403 Forbidden - Permission errors
  if (response && response.status === 403) {
    const errorMessage =
      response.data?.message || 'Access denied. You do not have permission to perform this action.';

    // Show permission errors for API calls (not route access)
    showErrorMessage(`Permission Error: ${errorMessage}`, 6);

    return {
      success: false,
      result: null,
      message: errorMessage,
      permissionError: true,
      statusCode: 403,
    };
  }

  // Handle 401 Unauthorized
  if (response && response.status === 401) {
    const errorMessage = response.data?.message || 'Authentication required. Please login again.';

    // Don't show auth error for public endpoints (document shares, URL redirects, etc.)
    const isPublicEndpoint =
      response.config?.url?.includes('/public/') ||
      response.config?.url?.includes('/s/') ||
      response.config?.headers?.['X-Public-Request'] === 'true' ||
      response.data?.requiresPassword; // Password-protected shares are expected 401s

    if (!isPublicEndpoint) {
      showErrorMessage(`Authentication Error: ${errorMessage}`, 5);
    }

    return {
      success: false,
      result: null,
      message: errorMessage,
      authError: true,
      statusCode: 401,
    };
  }

  // Handle 400 Bad Request
  if (response && response.status === 400) {
    const errorMessage = response.data?.message || 'Validation error';

    // Check if it's a permission-related 400 error (ensure errorMessage is a string)
    if (
      typeof errorMessage === 'string' &&
      (errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('access') ||
        errorMessage.toLowerCase().includes('not authorized'))
    ) {
      showErrorMessage(`Permission Error: ${errorMessage}`, 5);
      return {
        success: false,
        result: null,
        message: errorMessage,
        permissionError: true,
        statusCode: 400,
      };
    }

    showErrorMessage(errorMessage);
    return {
      success: false,
      result: null,
      message: errorMessage,
      statusCode: 400,
    };
  }

  // Handle other HTTP status codes
  if (response && response.status) {
    const errorMessage = response.data?.message || `Server error (${response.status})`;

    // Check for permission-related messages in any status code (ensure errorMessage is a string)
    if (
      typeof errorMessage === 'string' &&
      (errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('access denied') ||
        errorMessage.toLowerCase().includes('insufficient permissions') ||
        errorMessage.toLowerCase().includes('not authorized'))
    ) {
      showErrorMessage(`Access Denied: ${errorMessage}`, 6);
      return {
        success: false,
        result: null,
        message: errorMessage,
        permissionError: true,
        statusCode: response.status,
      };
    }

    showErrorMessage(errorMessage);
    return {
      success: false,
      result: null,
      message: errorMessage,
      statusCode: response.status,
    };
  }

  // Network or other errors
  const errorMessage = error.message || 'There was an error processing your request';
  showErrorMessage(errorMessage);

  return {
    success: false,
    result: null,
    message: errorMessage,
    networkError: true,
  };
};

export default errorHandler;
