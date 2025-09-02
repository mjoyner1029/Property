// frontend/src/test/utils/domTestUtils.js

/**
 * DOM Test Utilities
 * 
 * This file provides helper functions for creating DOM-based tests
 * that bypass React rendering issues by working directly with the DOM.
 */

/**
 * Creates a simple DOM element with the given HTML
 * 
 * @param {string} html The HTML content to create
 * @param {boolean} appendToBody Whether to append to document.body (default: true)
 * @returns {HTMLElement} The created container element
 */
export function createDomElement(html, appendToBody = true) {
  const container = document.createElement('div');
  container.innerHTML = html.trim();
  
  if (appendToBody) {
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * Clears the document body
 */
export function clearBody() {
  document.body.innerHTML = '';
}

/**
 * Creates a simple form with the given fields and a submit handler
 * 
 * @param {Array<{name: string, label: string, type: string, value: string, required?: boolean}>} fields Form field configurations
 * @param {Function} onSubmit Submit handler function
 * @param {Object} options Additional options (title, submitText, disabled)
 * @returns {Object} The form elements (form, fields, submitButton)
 */
export function createForm(fields, onSubmit, options = {}) {
  const { 
    title = 'Form',
    submitText = 'Submit', 
    disabled = false,
    error = null
  } = options;
  
  // Create field HTML
  const fieldHtml = fields.map(field => `
    <div>
      <label for="${field.name}">${field.label}</label>
      <input 
        type="${field.type || 'text'}" 
        id="${field.name}" 
        name="${field.name}" 
        aria-label="${field.name}"
        data-testid="${field.name}-input"
        value="${field.value || ''}" 
        ${disabled ? 'disabled' : ''}
        ${field.required ? 'required' : ''}
      />
      <span data-testid="${field.name}-error"></span>
    </div>
  `).join('');
  
  // Create form HTML
  const formHtml = `
    <div data-testid="form-container">
      <h2>${title}</h2>
      <form data-testid="test-form">
        ${fieldHtml}
        ${error ? `<div role="alert" data-testid="form-error">${error}</div>` : ''}
        <button 
          type="submit" 
          data-testid="submit-button"
          ${disabled ? 'disabled' : ''}
        >
          ${submitText}
        </button>
      </form>
    </div>
  `;
  
  // Create the element
  const container = createDomElement(formHtml);
  
  // Add form submission handler
  const form = container.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    // Call the handler
    onSubmit(data, e);
  });
  
  // Create field references
  const fieldRefs = {};
  fields.forEach(field => {
    fieldRefs[field.name] = document.getElementById(field.name);
  });
  
  return {
    form,
    fields: fieldRefs,
    submitButton: form.querySelector('button[type="submit"]')
  };
}

/**
 * Creates a confirm dialog with confirm and cancel buttons
 * 
 * @param {string} title The dialog title
 * @param {string} message The dialog message
 * @param {Function} onConfirm Handler for confirm button click
 * @param {Function} onCancel Handler for cancel button click
 * @returns {HTMLElement} The created dialog element
 */
export function createConfirmDialog(title, message, onConfirm, onCancel) {
  const dialogHtml = `
    <div role="dialog" aria-modal="true" data-testid="confirm-dialog">
      <h2>${title}</h2>
      <p>${message}</p>
      <div>
        <button data-testid="cancel-button">Cancel</button>
        <button data-testid="confirm-button">Confirm</button>
      </div>
    </div>
  `;
  
  const dialog = createDomElement(dialogHtml);
  
  // Add event listeners
  const cancelButton = dialog.querySelector('[data-testid="cancel-button"]');
  const confirmButton = dialog.querySelector('[data-testid="confirm-button"]');
  
  cancelButton.addEventListener('click', () => {
    onCancel?.();
    dialog.remove();
  });
  
  confirmButton.addEventListener('click', () => {
    onConfirm?.();
    dialog.remove();
  });
  
  return dialog.querySelector('[data-testid="confirm-dialog"]');
}

/**
 * Creates a loading indicator
 * 
 * @param {string} message The loading message
 * @returns {HTMLElement} The created loading element
 */
export function createLoadingIndicator(message = 'Loading...') {
  const loadingHtml = `
    <div data-testid="loading-indicator" aria-label="${message}">
      <div role="progressbar"></div>
      <p>${message}</p>
    </div>
  `;
  
  return createDomElement(loadingHtml);
}

/**
 * Creates an error message display
 * 
 * @param {string} message The error message
 * @param {Function} onRetry Optional retry handler
 * @returns {HTMLElement} The created error element
 */
export function createErrorMessage(message, onRetry = null) {
  const errorHtml = `
    <div data-testid="error-message" role="alert">
      <p>${message}</p>
      ${onRetry ? '<button data-testid="retry-button">Retry</button>' : ''}
    </div>
  `;
  
  const container = createDomElement(errorHtml);
  
  // Add retry handler if provided
  if (onRetry) {
    const retryButton = container.querySelector('[data-testid="retry-button"]');
    retryButton.addEventListener('click', onRetry);
  }
  
  return container.querySelector('[data-testid="error-message"]');
}
