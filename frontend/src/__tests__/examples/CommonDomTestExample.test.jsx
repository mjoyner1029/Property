// frontend/src/__tests__/examples/CommonDomTestExample.test.jsx

/**
 * Example test file demonstrating common DOM test cases
 * 
 * This file shows how to use the pre-built test setups for common scenarios.
 */

import { clearBody } from '../../test/utils/domTestUtils';
import {
  setupNavigationTest,
  setupNotificationTest,
  setupAuthTest,
  setupPropertyTest,
  setupMaintenanceTest
} from '../../test/utils/commonDomTestCases';

// Mock any API or service functions
jest.mock('../../services/api', () => ({
  login: jest.fn().mockResolvedValue({ id: 'user1', name: 'John Doe', email: 'john@example.com' }),
  logout: jest.fn().mockResolvedValue(true),
  getNotifications: jest.fn().mockResolvedValue([
    { id: '1', title: 'New Message', message: 'You have a new message', isRead: false },
    { id: '2', title: 'Payment Received', message: 'Payment received for Property #1', isRead: false },
    { id: '3', title: 'Maintenance Complete', message: 'Your maintenance request is complete', isRead: true }
  ]),
  markNotificationAsRead: jest.fn().mockResolvedValue(true)
}));

// Import the mocked API after jest.mock
import { login, logout, getNotifications, markNotificationAsRead } from '../../services/api';

describe('Common DOM Test Cases Examples', () => {
  // Clear the body after each test
  afterEach(() => {
    clearBody();
    jest.clearAllMocks();
  });

  describe('Navigation Tests', () => {
    test('renders navigation with correct active link', () => {
      // Setup
      const { nav, links, getLink } = setupNavigationTest({
        activeLink: '/dashboard'
      });
      
      // Assert
      expect(nav).not.toBeNull();
      expect(links.length).toBe(3);
      expect(getLink('dashboard')).toHaveAttribute('aria-current', 'page');
      expect(getLink('home')).not.toHaveAttribute('aria-current');
    });
    
    test('navigates when clicking a link', () => {
      // Setup
      const onNavigate = jest.fn();
      const { clickLink } = setupNavigationTest({ onNavigate });
      
      // Act
      clickLink('dashboard');
      
      // Assert
      expect(onNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  describe('Notification Tests', () => {
    test('displays badge with unread count', () => {
      // Setup
      const { badge } = setupNotificationTest({
        count: 5,
        unreadCount: 3
      });
      
      // Assert
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe('3');
    });
    
    test('toggles dropdown when clicking notification button', () => {
      // Setup
      const onClick = jest.fn();
      const { clickToggle, dropdown } = setupNotificationTest({ onClick });
      
      // Initially hidden
      expect(dropdown.style.display).toBe('none');
      
      // Act - show dropdown
      clickToggle();
      
      // Assert
      expect(onClick).toHaveBeenCalledWith(true);
      expect(dropdown.style.display).toBe('block');
      
      // Act - hide dropdown
      clickToggle();
      
      // Assert
      expect(onClick).toHaveBeenCalledWith(false);
      expect(dropdown.style.display).toBe('none');
    });
    
    test('marks notification as read', () => {
      // Setup
      const onMarkAsRead = jest.fn();
      const { markAsRead } = setupNotificationTest({ onMarkAsRead });
      
      // Act
      markAsRead('notif-0');
      
      // Assert
      expect(onMarkAsRead).toHaveBeenCalledWith('notif-0');
    });
  });

  describe('Authentication Tests', () => {
    test('shows login form when not authenticated', () => {
      // Setup
      const { loginForm, loginButton, emailInput, passwordInput } = setupAuthTest({
        isAuthenticated: false
      });
      
      // Assert
      expect(loginForm).not.toBeNull();
      expect(loginButton).not.toBeNull();
      expect(emailInput).not.toBeNull();
      expect(passwordInput).not.toBeNull();
    });
    
    test('shows user profile when authenticated', () => {
      // Setup
      const user = { name: 'John Doe', email: 'john@example.com' };
      const { container, logoutButton } = setupAuthTest({
        isAuthenticated: true,
        user
      });
      
      // Assert
      expect(container.textContent).toContain('Welcome, John Doe');
      expect(container.textContent).toContain('john@example.com');
      expect(logoutButton).not.toBeNull();
    });
    
    test('submits login form with credentials', () => {
      // Setup
      const onLogin = jest.fn();
      const { setEmailValue, setPasswordValue, submitLoginForm } = setupAuthTest({
        onLogin
      });
      
      // Act
      setEmailValue('test@example.com');
      setPasswordValue('password123');
      submitLoginForm();
      
      // Assert
      expect(onLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    test('shows login error message', () => {
      // Setup
      const { loginError } = setupAuthTest({
        loginError: 'Invalid email or password'
      });
      
      // Assert
      expect(loginError).not.toBeNull();
      expect(loginError.textContent).toBe('Invalid email or password');
    });
  });
  
  describe('Property Tests', () => {
    test('renders property list', () => {
      // Setup
      const properties = [
        { id: 'prop1', title: 'Beach House', address: '123 Ocean Dr', rent: 2500, status: 'available' },
        { id: 'prop2', title: 'Downtown Loft', address: '456 Main St', rent: 1800, status: 'rented' }
      ];
      
      const { container, list } = setupPropertyTest({ properties });
      
      // Assert
      expect(container.textContent).toContain('Beach House');
      expect(container.textContent).toContain('Downtown Loft');
      expect(list.children.length).toBe(2);
    });
    
    test('calls view details handler when clicking view button', () => {
      // Setup
      const onViewDetails = jest.fn();
      const { viewProperty } = setupPropertyTest({ onViewDetails });
      
      // Act
      viewProperty('prop-0');
      
      // Assert
      expect(onViewDetails).toHaveBeenCalledWith('prop-0');
    });
    
    test('calls edit handler when clicking edit button', () => {
      // Setup
      const onEdit = jest.fn();
      const { editProperty } = setupPropertyTest({ onEdit });
      
      // Act
      editProperty('prop-1');
      
      // Assert
      expect(onEdit).toHaveBeenCalledWith('prop-1');
    });
  });
  
  describe('Maintenance Tests', () => {
    test('renders maintenance request list', () => {
      // Setup
      const requests = [
        { 
          id: 'req1', 
          title: 'Broken Faucet', 
          description: 'Bathroom faucet is leaking',
          priority: 'high',
          status: 'open',
          propertyId: 'prop1'
        },
        { 
          id: 'req2', 
          title: 'AC Not Working', 
          description: 'Air conditioner not cooling',
          priority: 'medium',
          status: 'in-progress',
          propertyId: 'prop2'
        }
      ];
      
      const properties = [
        { id: 'prop1', title: 'Beach House' },
        { id: 'prop2', title: 'Downtown Loft' }
      ];
      
      const { container, list } = setupMaintenanceTest({ requests, properties });
      
      // Assert
      expect(container.textContent).toContain('Broken Faucet');
      expect(container.textContent).toContain('AC Not Working');
      expect(container.textContent).toContain('Beach House');
      expect(list.children.length).toBe(2);
    });
    
    test('calls create handler when clicking create button', () => {
      // Setup
      const onCreate = jest.fn();
      const { clickCreate } = setupMaintenanceTest({ onCreate });
      
      // Act
      clickCreate();
      
      // Assert
      expect(onCreate).toHaveBeenCalled();
    });
    
    test('calls delete handler when clicking delete button', () => {
      // Setup
      const onDelete = jest.fn();
      const { deleteRequest } = setupMaintenanceTest({ onDelete });
      
      // Act
      deleteRequest('req-0');
      
      // Assert
      expect(onDelete).toHaveBeenCalledWith('req-0');
    });
  });
});
