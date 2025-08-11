/**
 * Format a number as currency (USD)
 * @param {number} amount - Amount to format
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  if (amount === null || amount === undefined) return '';
  
  const defaultOptions = { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  
  return new Intl.NumberFormat('en-US', { ...defaultOptions, ...options }).format(amount);
};

/**
 * Format a phone number to (XXX) XXX-XXXX
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Strip all non-numeric characters
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  // Check if the input is of correct length
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  
  return phone;
};

/**
 * Truncate text with ellipsis if it exceeds max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
};