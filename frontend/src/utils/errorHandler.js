// frontend/src/utils/errorHandler.js
import logger from './logger';

/**
 * Extracts an error message from API error responses
 * @param {Error} error - The error object from an API call
 * @param {string} defaultMessage - Default message to show if no specific error is found
 * @returns {string} The formatted error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred. Please try again.') => {
  // Log the error for tracking purposes
  logger.error('API Error occurred', error, { 
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status 
  });

  // Check if it's an axios error with a response
  if (error.response) {
    // Server responded with a status code outside of 2xx range
    const { data, status } = error.response;
    
    if (data.error) {
      return data.error;
    }
    
    if (data.message) {
      return data.message;
    }
    
    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (status === 422) {
      // Validation errors
      if (data.errors) {
        const errorMessages = Object.values(data.errors).flat();
        return errorMessages.join('. ');
      }
    }
    
    if (status >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    
    return `Error ${status}: ${defaultMessage}`;
  } 
  
  // The request was made but no response was received
  if (error.request) {
    return 'No response received from server. Please check your connection.';
  }
  
  // Something happened in setting up the request
  return error.message || defaultMessage;
};

/**
 * Logs errors to console in development and to monitoring service in production
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 */
export const logError = (error, context = 'unknown') => {
  // Always log to console in development
  console.error(`Error in ${context}:`, error);
  
  // In production, we would send this to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example integration with a monitoring service
    // monitoringService.logError(error, { context });
    
    // For now we'll just add additional console logging
    console.error(`[PRODUCTION ERROR - ${context}]`, {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
};
