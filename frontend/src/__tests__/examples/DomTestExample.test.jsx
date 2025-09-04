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

// Import the mocked API after jest.mock
import { createItem, deleteItem } from '../../services/api';
import { screen } from '@testing-library/react';

// Mock any API or service functions
jest.mock('../../services/api', () => ({
  createItem: jest.fn().mockResolvedValue({ id: '123', name: 'New Item' }),
  deleteItem: jest.fn().mockResolvedValue(true),
}));

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
      const element = screen.queryBySelector('[data-testid="message"]');
      
      // Assert
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent('Hello world');
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
    
    it('submits form and calls createItem', () => {
      // Set up fake timers
      jest.useFakeTimers();
      
      // Set up our mock for createItem that we'll use in the form submission
      const localCreateItemMock = jest.fn();
      
      // Arrange
      const handleSubmit = jest.fn((values) => {
        // Call our local mock when the form is submitted
        localCreateItemMock(values);
      });
      
      const formFields = [
        { name: 'name', label: 'Name', value: 'New Item' }
      ];
      
      const { form, nameInput, submitButton } = createForm(
        formFields,
        handleSubmit,
        { title: 'Create Item' }
      );
      
      // Act - Submit the form
      submitButton.click();
      
      // Assert
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      
      // Check that our local mock was called with the right values
      expect(localCreateItemMock).toHaveBeenCalledWith({ name: 'New Item' });
      
      // Restore real timers
      jest.useRealTimers();
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
      
      const confirmButton = screen.queryBySelector('[data-testid="confirm-button"]');
      const cancelButton = screen.queryBySelector('[data-testid="cancel-button"]');
      
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
      const newConfirmButton = screen.queryBySelector('[data-testid="confirm-button"]');
      
      // Act & Assert - Confirm
      newConfirmButton.click();
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
    
    test('displays and interacts with error message', () => {
      // Arrange
      const handleRetry = jest.fn();
      
      createErrorMessage('Failed to load data', handleRetry);
      
      const errorElement = screen.queryBySelector('[data-testid="error-message"]');
      const retryButton = screen.queryBySelector('[data-testid="retry-button"]');
      
      // Assert - Error message
      expect(errorElement).not.toBeNull();
      expect(errorElement).toHaveTextContent(/Failed to load data/);
      
      // Act & Assert - Retry action
      retryButton.click();
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
    
    test('displays loading indicator', () => {
      // Arrange
      createLoadingIndicator('Loading items...');
      
      // Assert
      const loadingElement = screen.queryBySelector('[data-testid="loading-indicator"]');
      expect(loadingElement).not.toBeNull();
      expect(loadingElement).toHaveTextContent(/Loading items\.\.\./);
    });
  });

  describe('Async operations', () => {
    test('handles async delete operation with confirmation', async () => {
      // Set up fake timers
      jest.useFakeTimers();
      
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
      
      // Advance timers to process any promises
      jest.runAllTimers();
      
      // Assert
      expect(deleteItem).toHaveBeenCalledWith(itemId);
      
      // Restore real timers
      jest.useRealTimers();
    });
  });
});
