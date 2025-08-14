// frontend/src/utils/errorHandler.js

import { toast } from 'react-toastify';

/**
 * Standardized error handling for API responses
 */
const errorHandler = {
  /**
   * Process API error and extract appropriate error message
   * 
   * @param {Error} error - The error object from an API call
   * @param {Object} options - Configuration options
   * @param {boolean} options.showToast - Whether to show a toast notification (default: true)
   * @param {string} options.fallbackMessage - Fallback message if error doesn't have a message
   * @returns {string} The formatted error message
   */
  handleError: (error, options = {}) => {
    const { showToast = true, fallbackMessage = 'An unexpected error occurred' } = options;
    
    // Initialize variables
    let errorMessage = fallbackMessage;
    let statusCode = error?.response?.status;
    let errorCode = null;
    
    // Extract error message from various error response formats
    if (error?.response?.data) {
      const { data } = error.response;
      
      // Handle our standard error format
      if (data.error && typeof data.error === 'object') {
        errorMessage = data.error.message || errorMessage;
        errorCode = data.error.code;
      } 
      // Handle simple error string
      else if (data.error && typeof data.error === 'string') {
        errorMessage = data.error;
      } 
      // Handle message field
      else if (data.message) {
        errorMessage = data.message;
      }
    }
    
    // Network errors
    if (error.message === 'Network Error') {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // Rate limit error
    if (statusCode === 429) {
      errorMessage = 'Too many requests. Please try again later.';
    }
    
    // Log the error for debugging
    console.error('API Error:', {
      message: errorMessage,
      status: statusCode,
      code: errorCode,
      originalError: error
    });
    
    // Show toast if enabled
    if (showToast) {
      toast.error(errorMessage);
    }
    
    return {
      message: errorMessage,
      status: statusCode,
      code: errorCode
    };
  },
  
  /**
   * Determine if an error is an authentication error
   * 
   * @param {Error} error - The error object
   * @returns {boolean} True if auth error
   */
  isAuthError: (error) => {
    return error?.response?.status === 401;
  },
  
  /**
   * Handle validation errors (usually 422 status)
   * 
   * @param {Error} error - The error object
   * @returns {Object} Object with field keys and error messages
   */
  getValidationErrors: (error) => {
    const validationErrors = {};
    
    if (error?.response?.data?.error?.details?.validation) {
      return error.response.data.error.details.validation;
    }
    
    if (error?.response?.data?.errors) {
      return error.response.data.errors;
    }
    
    return validationErrors;
  }
};

export default errorHandler;
