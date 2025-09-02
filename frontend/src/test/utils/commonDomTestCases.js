// frontend/src/test/utils/commonDomTestCases.js

/**
 * Common DOM Test Cases
 * 
 * Provides pre-built test setups for common test scenarios
 * to further simplify test creation for repetitive cases.
 */

import { 
  createDomElement, 
  clearBody, 
  createForm,
  createConfirmDialog,
  createLoadingIndicator,
  createErrorMessage
} from './domTestUtils';

/**
 * Creates a standardized navigation test
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Test elements and methods
 */
export function setupNavigationTest(options = {}) {
  const {
    links = [
      { path: '/', label: 'Home' },
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/profile', label: 'Profile' }
    ],
    activeLink = '/',
    onNavigate = jest.fn()
  } = options;

  // Create navigation HTML
  const navLinks = links.map(link => `
    <li>
      <a 
        href="${link.path}" 
        data-testid="nav-${link.label.toLowerCase()}"
        ${activeLink === link.path ? 'aria-current="page"' : ''}
      >
        ${link.label}
      </a>
    </li>
  `).join('');

  const navHtml = `
    <nav data-testid="main-nav">
      <ul>
        ${navLinks}
      </ul>
    </nav>
  `;

  // Create the element
  const container = createDomElement(navHtml);
  
  // Add event listeners to links
  const linkElements = container.querySelectorAll('a');
  linkElements.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate(link.getAttribute('href'));
    });
  });

  return {
    nav: container.querySelector('[data-testid="main-nav"]'),
    links: Array.from(linkElements),
    getLink: (label) => container.querySelector(`[data-testid="nav-${label.toLowerCase()}"]`),
    clickLink: (label) => {
      const link = container.querySelector(`[data-testid="nav-${label.toLowerCase()}"]`);
      if (link) link.click();
    },
    onNavigate
  };
}

/**
 * Creates a standardized notification test
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Test elements and methods
 */
export function setupNotificationTest(options = {}) {
  const {
    count = 3,
    unreadCount = 2,
    onClick = jest.fn(),
    onClose = jest.fn(),
    onMarkAsRead = jest.fn()
  } = options;

  // Generate notification items
  const notificationItems = Array(count).fill(0).map((_, i) => ({
    id: `notif-${i}`,
    title: `Notification ${i+1}`,
    message: `This is notification ${i+1}`,
    isRead: i >= unreadCount,
    date: new Date().toISOString()
  }));

  // Create notification items HTML
  const notificationItemsHtml = notificationItems.map(item => `
    <div 
      data-testid="notification-item-${item.id}"
      class="notification-item ${!item.isRead ? 'unread' : 'read'}"
    >
      <h3>${item.title}</h3>
      <p>${item.message}</p>
      <div class="notification-actions">
        <button data-testid="read-button-${item.id}" ${item.isRead ? 'disabled' : ''}>
          Mark as Read
        </button>
        <button data-testid="close-button-${item.id}">
          Close
        </button>
      </div>
    </div>
  `).join('');

  // Create notification container HTML
  const notificationHtml = `
    <div data-testid="notification-container">
      <button data-testid="notification-toggle">
        Notifications
        ${unreadCount > 0 ? `<span data-testid="badge">${unreadCount}</span>` : ''}
      </button>
      <div data-testid="notification-dropdown" style="display: none;">
        <div data-testid="notification-list">
          ${notificationItemsHtml}
        </div>
      </div>
    </div>
  `;

  // Create the element
  const container = createDomElement(notificationHtml);

  // Add event listeners
  const toggle = container.querySelector('[data-testid="notification-toggle"]');
  const dropdown = container.querySelector('[data-testid="notification-dropdown"]');
  
  toggle.addEventListener('click', () => {
    const isHidden = dropdown.style.display === 'none';
    dropdown.style.display = isHidden ? 'block' : 'none';
    onClick(isHidden);
  });

  // Add event listeners to notification actions
  notificationItems.forEach(item => {
    const readButton = container.querySelector(`[data-testid="read-button-${item.id}"]`);
    const closeButton = container.querySelector(`[data-testid="close-button-${item.id}"]`);
    
    if (readButton) {
      readButton.addEventListener('click', () => onMarkAsRead(item.id));
    }
    
    if (closeButton) {
      closeButton.addEventListener('click', () => onClose(item.id));
    }
  });

  return {
    container,
    toggle,
    dropdown,
    badge: container.querySelector('[data-testid="badge"]'),
    getNotificationItem: (id) => container.querySelector(`[data-testid="notification-item-${id}"]`),
    clickToggle: () => toggle.click(),
    markAsRead: (id) => {
      const readButton = container.querySelector(`[data-testid="read-button-${id}"]`);
      if (readButton) readButton.click();
    },
    closeNotification: (id) => {
      const closeButton = container.querySelector(`[data-testid="close-button-${id}"]`);
      if (closeButton) closeButton.click();
    },
    notificationItems,
    onClick,
    onMarkAsRead,
    onClose
  };
}

/**
 * Creates a standardized authentication test setup
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Test elements and methods
 */
export function setupAuthTest(options = {}) {
  const {
    isAuthenticated = false,
    user = null,
    onLogin = jest.fn(),
    onLogout = jest.fn(),
    onSignup = jest.fn(),
    loginError = null
  } = options;

  // Create different views based on auth state
  const unauthenticatedHtml = `
    <div data-testid="auth-container">
      <div data-testid="login-form">
        <h2>Login</h2>
        <form>
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" data-testid="email-input" />
          </div>
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" data-testid="password-input" />
          </div>
          ${loginError ? `<div role="alert" data-testid="login-error">${loginError}</div>` : ''}
          <button type="submit" data-testid="login-button">Login</button>
        </form>
        <button data-testid="signup-link">Create an account</button>
      </div>
    </div>
  `;

  const authenticatedHtml = `
    <div data-testid="auth-container">
      <div data-testid="user-profile">
        <h2>Welcome, ${user?.name || 'User'}</h2>
        <p>Email: ${user?.email || ''}</p>
        <button data-testid="logout-button">Logout</button>
      </div>
    </div>
  `;

  // Create the element based on auth state
  const container = createDomElement(
    isAuthenticated ? authenticatedHtml : unauthenticatedHtml
  );

  // Add event listeners
  if (isAuthenticated) {
    const logoutButton = container.querySelector('[data-testid="logout-button"]');
    logoutButton.addEventListener('click', onLogout);
  } else {
    const loginForm = container.querySelector('form');
    const signupLink = container.querySelector('[data-testid="signup-link"]');
    
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[data-testid="email-input"]').value;
      const password = loginForm.querySelector('[data-testid="password-input"]').value;
      onLogin({ email, password });
    });
    
    signupLink.addEventListener('click', () => {
      onSignup();
    });
  }

  return {
    container,
    isAuthenticated,
    user,
    loginForm: container.querySelector('form'),
    loginButton: container.querySelector('[data-testid="login-button"]'),
    logoutButton: container.querySelector('[data-testid="logout-button"]'),
    signupLink: container.querySelector('[data-testid="signup-link"]'),
    emailInput: container.querySelector('[data-testid="email-input"]'),
    passwordInput: container.querySelector('[data-testid="password-input"]'),
    loginError: container.querySelector('[data-testid="login-error"]'),
    setEmailValue: (value) => {
      const input = container.querySelector('[data-testid="email-input"]');
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('change'));
      }
    },
    setPasswordValue: (value) => {
      const input = container.querySelector('[data-testid="password-input"]');
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('change'));
      }
    },
    submitLoginForm: () => {
      const form = container.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit'));
    },
    clickLogout: () => {
      const button = container.querySelector('[data-testid="logout-button"]');
      if (button) button.click();
    },
    clickSignupLink: () => {
      const link = container.querySelector('[data-testid="signup-link"]');
      if (link) link.click();
    },
    onLogin,
    onLogout,
    onSignup
  };
}

/**
 * Creates a standardized property listing test
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Test elements and methods
 */
export function setupPropertyTest(options = {}) {
  const {
    properties = Array(3).fill(0).map((_, i) => ({
      id: `prop-${i}`,
      title: `Property ${i+1}`,
      address: `123 Main St, Unit ${i+1}`,
      rent: 1000 + (i * 100),
      status: i === 0 ? 'available' : 'rented'
    })),
    onViewDetails = jest.fn(),
    onEdit = jest.fn(),
    onDelete = jest.fn()
  } = options;

  // Create property items HTML
  const propertyItemsHtml = properties.map(prop => `
    <div data-testid="property-item-${prop.id}" class="property-card">
      <h3>${prop.title}</h3>
      <p>${prop.address}</p>
      <p>$${prop.rent}/month</p>
      <p>Status: ${prop.status}</p>
      <div class="property-actions">
        <button data-testid="view-button-${prop.id}">View Details</button>
        <button data-testid="edit-button-${prop.id}">Edit</button>
        <button data-testid="delete-button-${prop.id}">Delete</button>
      </div>
    </div>
  `).join('');

  // Create property list HTML
  const propertyListHtml = `
    <div data-testid="property-list-container">
      <h2>Properties</h2>
      <div data-testid="property-list">
        ${properties.length > 0 ? propertyItemsHtml : '<p>No properties found</p>'}
      </div>
    </div>
  `;

  // Create the element
  const container = createDomElement(propertyListHtml);

  // Add event listeners
  properties.forEach(prop => {
    const viewButton = container.querySelector(`[data-testid="view-button-${prop.id}"]`);
    const editButton = container.querySelector(`[data-testid="edit-button-${prop.id}"]`);
    const deleteButton = container.querySelector(`[data-testid="delete-button-${prop.id}"]`);
    
    if (viewButton) {
      viewButton.addEventListener('click', () => onViewDetails(prop.id));
    }
    
    if (editButton) {
      editButton.addEventListener('click', () => onEdit(prop.id));
    }
    
    if (deleteButton) {
      deleteButton.addEventListener('click', () => onDelete(prop.id));
    }
  });

  return {
    container,
    list: container.querySelector('[data-testid="property-list"]'),
    getPropertyItem: (id) => container.querySelector(`[data-testid="property-item-${id}"]`),
    viewProperty: (id) => {
      const button = container.querySelector(`[data-testid="view-button-${id}"]`);
      if (button) button.click();
    },
    editProperty: (id) => {
      const button = container.querySelector(`[data-testid="edit-button-${id}"]`);
      if (button) button.click();
    },
    deleteProperty: (id) => {
      const button = container.querySelector(`[data-testid="delete-button-${id}"]`);
      if (button) button.click();
    },
    properties,
    onViewDetails,
    onEdit,
    onDelete
  };
}

/**
 * Creates a standardized maintenance request test
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Test elements and methods
 */
export function setupMaintenanceTest(options = {}) {
  const {
    requests = Array(3).fill(0).map((_, i) => ({
      id: `req-${i}`,
      title: `Maintenance Request ${i+1}`,
      description: `This is maintenance request ${i+1}`,
      priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
      status: i === 0 ? 'open' : i === 1 ? 'in-progress' : 'completed',
      date: new Date().toISOString(),
      propertyId: `prop-${i % 2}`
    })),
    properties = Array(2).fill(0).map((_, i) => ({
      id: `prop-${i}`,
      title: `Property ${i+1}`
    })),
    onView = jest.fn(),
    onCreate = jest.fn(),
    onUpdate = jest.fn(),
    onDelete = jest.fn()
  } = options;

  // Create maintenance request items HTML
  const requestItemsHtml = requests.map(req => `
    <div 
      data-testid="maintenance-item-${req.id}" 
      class="maintenance-card ${req.priority}-priority ${req.status}"
    >
      <h3>${req.title}</h3>
      <p>${req.description}</p>
      <p>Priority: ${req.priority}</p>
      <p>Status: ${req.status}</p>
      <p>Property: ${properties.find(p => p.id === req.propertyId)?.title || 'Unknown'}</p>
      <div class="maintenance-actions">
        <button data-testid="view-button-${req.id}">View Details</button>
        <button data-testid="update-button-${req.id}">Update</button>
        <button data-testid="delete-button-${req.id}">Delete</button>
      </div>
    </div>
  `).join('');

  // Create maintenance list HTML
  const maintenanceListHtml = `
    <div data-testid="maintenance-container">
      <h2>Maintenance Requests</h2>
      <button data-testid="create-button">Create New Request</button>
      <div data-testid="maintenance-list">
        ${requests.length > 0 ? requestItemsHtml : '<p>No maintenance requests found</p>'}
      </div>
    </div>
  `;

  // Create the element
  const container = createDomElement(maintenanceListHtml);

  // Add event listeners
  const createButton = container.querySelector('[data-testid="create-button"]');
  createButton.addEventListener('click', onCreate);

  // Add event listeners to maintenance actions
  requests.forEach(req => {
    const viewButton = container.querySelector(`[data-testid="view-button-${req.id}"]`);
    const updateButton = container.querySelector(`[data-testid="update-button-${req.id}"]`);
    const deleteButton = container.querySelector(`[data-testid="delete-button-${req.id}"]`);
    
    if (viewButton) {
      viewButton.addEventListener('click', () => onView(req.id));
    }
    
    if (updateButton) {
      updateButton.addEventListener('click', () => onUpdate(req.id));
    }
    
    if (deleteButton) {
      deleteButton.addEventListener('click', () => onDelete(req.id));
    }
  });

  return {
    container,
    list: container.querySelector('[data-testid="maintenance-list"]'),
    createButton,
    getMaintenanceItem: (id) => container.querySelector(`[data-testid="maintenance-item-${id}"]`),
    clickCreate: () => createButton.click(),
    viewRequest: (id) => {
      const button = container.querySelector(`[data-testid="view-button-${id}"]`);
      if (button) button.click();
    },
    updateRequest: (id) => {
      const button = container.querySelector(`[data-testid="update-button-${id}"]`);
      if (button) button.click();
    },
    deleteRequest: (id) => {
      const button = container.querySelector(`[data-testid="delete-button-${id}"]`);
      if (button) button.click();
    },
    requests,
    properties,
    onView,
    onCreate,
    onUpdate,
    onDelete
  };
}
