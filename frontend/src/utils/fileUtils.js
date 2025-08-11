// frontend/src/utils/fileUtils.js

/**
 * Convert file size to readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Check if file type is allowed
 * @param {File} file - File to check
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if file type is allowed
 */
export const isAllowedFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

/**
 * Convert a file to a data URL
 * @param {File} file - File to convert
 * @returns {Promise<string>} Promise resolving to data URL
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Check if a file exceeds maximum size
 * @param {File} file - File to check
 * @param {number} maxSizeInBytes - Maximum size in bytes
 * @returns {boolean} True if file size is allowed
 */
export const isFileSizeAllowed = (file, maxSizeInBytes) => {
  return file.size <= maxSizeInBytes;
};