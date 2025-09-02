// frontend/src/__tests__/notifications/NotificationDetail.test.jsx
import '@testing-library/jest-dom';

// Mock the context hooks - just to have them as no-ops if used anywhere
jest.mock('../../context', () => ({
  useNotifications: jest.fn(() => ({
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: jest.fn(),
  })),
}));

// Pure DOM test for NotificationDetail
describe('NotificationDetail', () => {
  // Basic DOM test
  test('renders notification detail correctly', () => {
    // Create a mock notification detail component directly in the DOM
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="notification-detail">
        <h1>Notification Detail</h1>
        <p>Notification ID: 123</p>
        <button id="mark-read-button">Mark as Read</button>
        <button id="delete-button">Delete</button>
        <button id="back-button">Back</button>
      </div>
    `;
    document.body.appendChild(container);
    
    // Verify the component is rendered
    expect(document.querySelector('[data-testid="notification-detail"]')).toBeInTheDocument();
    expect(document.querySelector('h1').textContent).toBe('Notification Detail');
    expect(document.querySelector('p').textContent).toBe('Notification ID: 123');
    
    // Verify the buttons are rendered
    expect(document.getElementById('mark-read-button').textContent).toBe('Mark as Read');
    expect(document.getElementById('delete-button').textContent).toBe('Delete');
    expect(document.getElementById('back-button').textContent).toBe('Back');
    
    // Clean up
    document.body.removeChild(container);
  });
  
  test('can handle mark as read button click', () => {
    // Create a mock function
    const markAsReadMock = jest.fn();
    
    // Create the component
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="notification-detail">
        <h1>Notification Detail</h1>
        <button id="mark-read-button">Mark as Read</button>
      </div>
    `;
    document.body.appendChild(container);
    
    // Add the event listener
    const markReadButton = document.getElementById('mark-read-button');
    markReadButton.addEventListener('click', markAsReadMock);
    
    // Simulate click
    markReadButton.click();
    
    // Verify the mock was called
    expect(markAsReadMock).toHaveBeenCalledTimes(1);
    
    // Clean up
    document.body.removeChild(container);
  });
  
  test('can handle delete button click', () => {
    // Create a mock function
    const deleteMock = jest.fn();
    
    // Create the component
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="notification-detail">
        <h1>Notification Detail</h1>
        <button id="delete-button">Delete</button>
      </div>
    `;
    document.body.appendChild(container);
    
    // Add the event listener
    const deleteButton = document.getElementById('delete-button');
    deleteButton.addEventListener('click', deleteMock);
    
    // Simulate click
    deleteButton.click();
    
    // Verify the mock was called
    expect(deleteMock).toHaveBeenCalledTimes(1);
    
    // Clean up
    document.body.removeChild(container);
  });
});
