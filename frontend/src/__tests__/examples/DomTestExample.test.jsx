// frontend/src/__tests__/examples/DomTestExample.test.jsx

/**
 * Example test file demonstrating DOM-based testing approach
 * 
 * This file shows how to create reliable, focused tests without
 * React rendering or complex context setup.
 */

import { 
  createDomElement, 
  clearBody, 
  createForm,
  createConfirmDialog,
  createLoadingIndicator,
  createErrorMessage
} from '../../test/utils/domTestUtils';

// Mock any API or service functions
jest.mock('../../services/api', () => ({
  createItem: jest.fn().mockResolvedValue({ id: '123', name: 'New Item' }),
  deleteItem: jest.fn().mockResolvedValue(true),
}));

// Import the mocked API after jest.mock
import { createItem, deleteItem } from '../../services/api';

describe('DOM Testing Example', () => {
  // Clear the body after each test
  afterEach(() => {
    clearBody();
    jest.clearAllMocks();
  });

  describe('Basic DOM manipulation', () => {
    test('can create a simple button and trigger click', () => {
      // Arrange
      const handleClick = jest.fn();
      const button = createDomElement(`
        <button data-testid="test-button">Click me</button>
      `).querySelector('button');
      
      // Attach event listener
      button.addEventListener('click', handleClick);
      
      // Act
      button.click();
      
      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
    
    test('can select elements by data-testid', () => {
      // Arrange
      createDomElement(`
        <div>
          <span data-testid="message">Hello world</span>
        </div>
      `);
      
      // Act
      const element = document.querySelector('[data-testid="message"]');
      
      // Assert
      expect(element).not.toBeNull();
      expect(element.textContent).toBe('Hello world');
    });
  });
  
  describe('Form handling', () => {
    test('can submit a form with values', () => {
      // Arrange
      const handleSubmit = jest.fn();
      
      const fields = [
        { name: 'name', label: 'Name', value: 'Test User' },
        { name: 'email', label: 'Email', value: 'test@example.com' }
      ];
      
      const { form, submitButton } = createForm(
        fields, 
        handleSubmit,
        { title: 'Test Form' }
      );
      
      // Act
      submitButton.click();
      
      // Assert
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith(
        { name: 'Test User', email: 'test@example.com' },
        expect.anything()
      );
    });
    
    test('can integrate form with API call', async () => {
      // Arrange
      const fields = [
        { name: 'name', label: 'Name', value: 'New Item' }
      ];
      
      const handleSubmit = jest.fn(async (data) => {
        await createItem(data);
        return true;
      });
      
      const { submitButton } = createForm(
        fields, 
        handleSubmit,
        { title: 'Create Item' }
      );
      
      // Act
      submitButton.click();
      
      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(createItem).toHaveBeenCalledWith({ name: 'New Item' });
    });
  });
  
  describe('Dialog and notification components', () => {
    test('confirms and cancels a dialog action', () => {
      // Arrange
      const handleConfirm = jest.fn();
      const handleCancel = jest.fn();
      
      createConfirmDialog(
        'Delete Item', 
        'Are you sure you want to delete this item?',
        handleConfirm,
        handleCancel
      );
      
      const confirmButton = document.querySelector('[data-testid="confirm-button"]');
      const cancelButton = document.querySelector('[data-testid="cancel-button"]');
      
      // Act & Assert - Cancel
      cancelButton.click();
      expect(handleCancel).toHaveBeenCalledTimes(1);
      expect(handleConfirm).not.toHaveBeenCalled();
      
      // Since dialog is removed after action, recreate it
      createConfirmDialog(
        'Delete Item', 
        'Are you sure you want to delete this item?',
        handleConfirm,
        handleCancel
      );
      
      // Get new reference to confirm button
      const newConfirmButton = document.querySelector('[data-testid="confirm-button"]');
      
      // Act & Assert - Confirm
      newConfirmButton.click();
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
    
    test('displays and interacts with error message', () => {
      // Arrange
      const handleRetry = jest.fn();
      
      createErrorMessage('Failed to load data', handleRetry);
      
      const errorElement = document.querySelector('[data-testid="error-message"]');
      const retryButton = document.querySelector('[data-testid="retry-button"]');
      
      // Assert - Error message
      expect(errorElement).not.toBeNull();
      expect(errorElement.textContent).toContain('Failed to load data');
      
      // Act & Assert - Retry action
      retryButton.click();
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
    
    test('displays loading indicator', () => {
      // Arrange
      createLoadingIndicator('Loading items...');
      
      // Assert
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      expect(loadingElement).not.toBeNull();
      expect(loadingElement.textContent).toContain('Loading items...');
    });
  });

  describe('Async operations', () => {
    test('handles async delete operation with confirmation', async () => {
      // Arrange
      const itemId = '123';
      let dialogConfirmFn;
      
      // Create dialog first to intercept the confirm function
      const dialog = createConfirmDialog(
        'Delete Item',
        'Are you sure?',
        () => dialogConfirmFn(),
        () => {}
      );
      
      // Mock the delete operation
      dialogConfirmFn = async () => {
        await deleteItem(itemId);
      };
      
      // Act - Click confirm
      const confirmButton = dialog.querySelector('[data-testid="confirm-button"]');
      confirmButton.click();
      
      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(deleteItem).toHaveBeenCalledWith(itemId);
    });
  });
});
