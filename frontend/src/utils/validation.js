// frontend/src/utils/validation.js

/**
 * Check if an email is valid
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Check if a password meets minimum requirements
 * @param {string} password - Password to validate
 * @returns {Object} Object with isValid boolean and error message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate required fields in a form
 * @param {Object} formData - Form data to validate
 * @param {Array} requiredFields - List of required field names
 * @returns {Object} Object with isValid boolean and errors object
 */
export const validateRequiredFields = (formData, requiredFields) => {
  const errors = {};
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
      errors[field] = 'This field is required';
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

/**
 * Check if a phone number is valid
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // Strip all non-numeric characters
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  // Check if the input is the right length
  return cleaned.length === 10;
};