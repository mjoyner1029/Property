import { useState, useCallback } from 'react';
import { useFeedback } from '../context/FeedbackContext';
import { getErrorMessage } from './errorHandler';
import logger from './logger';
import performance from './performance';

/**
 * Custom hook for handling form submissions with validation and error handling
 * 
 * @param {Function} submitFunction - The function to call on form submission
 * @param {Object} options - Configuration options
 * @returns {Object} Form submission utilities
 */
const useFormSubmit = (submitFunction, options = {}) => {
  const {
    successMessage = 'Operation completed successfully',
    errorMessage = 'An error occurred',
    validationSchema = null,
    initialValues = {},
    onSuccess = null,
    onError = null,
    trackPerformance = true,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [values, setValues] = useState(initialValues);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { showSuccess, showError } = useFeedback();

  // Reset the form state
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setValidationErrors({});
    setSubmitError(null);
  }, [initialValues]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field when it changes
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // Set a specific field value programmatically
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // Validate the form data
  const validate = useCallback((formData) => {
    if (!validationSchema) return true;
    
    try {
      validationSchema.validateSync(formData, { abortEarly: false });
      setValidationErrors({});
      return true;
    } catch (err) {
      const errors = {};
      
      err.inner.forEach((error) => {
        errors[error.path] = error.message;
      });
      
      setValidationErrors(errors);
      return false;
    }
  }, [validationSchema]);

  // Handle form submission
  const handleSubmit = useCallback(async (e, additionalData = {}) => {
    if (e) e.preventDefault();
    
    const formData = { ...values, ...additionalData };
    
    // Validate form data if validation schema exists
    if (validationSchema && !validate(formData)) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Start performance tracking if enabled
    if (trackPerformance) {
      performance.startTimer('form_submit');
    }
    
    try {
      const result = await submitFunction(formData);
      
      // Show success message
      showSuccess(successMessage);
      
      // Call success callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(result);
      }
      
      // Log success for analytics
      logger.info('Form submission successful', { 
        formName: options.formName || 'unknown'
      });
      
      return result;
    } catch (error) {
      const formattedError = getErrorMessage(error, errorMessage);
      
      // Set error state
      setSubmitError(formattedError);
      
      // Show error message
      showError(formattedError);
      
      // Call error callback if provided
      if (onError && typeof onError === 'function') {
        onError(error);
      }
      
      // Log error for analytics
      logger.error('Form submission failed', error, { 
        formName: options.formName || 'unknown'
      });
      
      throw error;
    } finally {
      setIsSubmitting(false);
      
      // End performance tracking if enabled
      if (trackPerformance) {
        const duration = performance.endTimer('form_submit');
        logger.debug('Form submission time', { duration: `${duration}ms` });
      }
    }
  }, [
    values, 
    validationSchema, 
    validate, 
    submitFunction, 
    showSuccess, 
    showError, 
    successMessage, 
    errorMessage,
    onSuccess,
    onError,
    trackPerformance,
    options.formName
  ]);

  return {
    values,
    setValues,
    handleChange,
    setFieldValue,
    handleSubmit,
    isSubmitting,
    submitError,
    validationErrors,
    resetForm,
  };
};

export default useFormSubmit;
