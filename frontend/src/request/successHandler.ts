import { message } from '@/components/ui';

const successHandler = (response, options = { notifyOnSuccess: false, notifyOnFailed: true }) => {
  const { data } = response;

  if (!data) {
    return {
      success: false,
      result: null,
      message: 'No response data received',
    };
  }

  if (data.success === true) {
    const msg = data.message || 'Success';
    if (options.notifyOnSuccess) {
      message.success(msg);
    }

    // If there's a result.result structure (common in list endpoints), normalize it
    if (data.result && typeof data.result === 'object' && data.result.items) {
      return {
        ...data,
        result: {
          items: data.result.items,
          pagination: data.result.pagination || {
            page: 1,
            limit: 10,
            total: data.result.items.length,
          },
        },
      };
    }

    return data;
  }

  const msg = data.message || 'Operation failed';
  
  // Special handling for permission-related failures
  if (msg.toLowerCase().includes('permission') || 
      msg.toLowerCase().includes('access denied') ||
      msg.toLowerCase().includes('insufficient permissions') ||
      msg.toLowerCase().includes('not authorized')) {
    if (options.notifyOnFailed) {
      message.error(`Access Denied: ${msg}`, 5); // Show for 5 seconds
    }
    
    return {
      success: false,
      result: null,
      message: msg,
      permissionError: true,
    };
  }

  if (options.notifyOnFailed) {
    message.error(msg);
  }

  return {
    success: false,
    result: null,
    message: msg,
  };
};

export default successHandler;
