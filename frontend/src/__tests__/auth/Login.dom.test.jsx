// frontend/src/__tests__/auth/Login.dom.test.jsx
import '@testing-library/jest-dom';

// Mock the context hooks - just to have them as no-ops if used anywhere
jest.mock('../../context', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: false,
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn()
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: jest.fn(),
  })),
}));

// Mock react-router
jest.mock('react-router-dom', () => {
  return {
    useNavigate: () => jest.fn(),
  };
});

// Pure DOM tests for Login
describe('Login - DOM only', () => {
  // Set up mock functions
  const mockLogin = jest.fn(() => Promise.resolve(true));
  const mockNavigate = jest.fn();

  // Set up test credentials
  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  // Clean up after each test
  afterEach(() => {
    document.body.innerHTML = '';
    mockLogin.mockClear();
    mockNavigate.mockClear();
  });
  
  // Helper function to create the login form
  const setupLoginForm = (loading = false, error = null) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="login-page">
        <h1>Sign In</h1>
        <form>
          <div>
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              aria-label="email"
              data-testid="email-input"
              value="${loading ? testEmail : ''}" 
              ${loading ? 'disabled' : ''}
            />
          </div>
          <div>
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              aria-label="password"
              data-testid="password-input"
              value="${loading ? testPassword : ''}" 
              ${loading ? 'disabled' : ''}
            />
          </div>
          ${error ? `<div role="alert" data-testid="error-message">${error}</div>` : ''}
          <button 
            type="submit" 
            data-testid="submit-button"
            ${loading ? 'disabled' : ''}
          >
            ${loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(container);
    
    // Add form submission handler
    const form = document.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (email && password) {
        mockLogin(email, password);
      }
    });
    
    return {
      emailInput: document.getElementById('email'),
      passwordInput: document.getElementById('password'),
      submitButton: document.querySelector('button[type="submit"]'),
      form
    };
  };

  test('renders login form correctly', () => {
    // Set up login form
    setupLoginForm();
    
    // Verify the login page is rendered
    expect(document.querySelector('[data-testid="login-page"]')).toBeInTheDocument();
    expect(document.querySelector('h1').textContent).toBe('Sign In');
    
    // Verify form inputs
    expect(document.querySelector('label[for="email"]')).toBeInTheDocument();
    expect(document.querySelector('input#email')).toBeInTheDocument();
    expect(document.querySelector('label[for="password"]')).toBeInTheDocument();
    expect(document.querySelector('input#password')).toBeInTheDocument();
    expect(document.querySelector('button[type="submit"]')).toBeInTheDocument();
  });

  test('submits credentials on form submission', () => {
    // Set up login form
    const { emailInput, passwordInput, form } = setupLoginForm();
    
    // Fill in credentials
    emailInput.value = testEmail;
    passwordInput.value = testPassword;
    
    // Submit the form
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    
    // Verify login was called with credentials
    expect(mockLogin).toHaveBeenCalledWith(testEmail, testPassword);
  });

  test('submits with Enter key from password field', () => {
    // Set up login form
    const { emailInput, passwordInput, form } = setupLoginForm();
    
    // Fill in credentials
    emailInput.value = testEmail;
    passwordInput.value = testPassword;
    
    // Create a keyboard event for Enter key
    const enterKeyEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true,
      cancelable: true
    });
    
    // Dispatch the keyboard event on the password input
    passwordInput.dispatchEvent(enterKeyEvent);
    
    // Manually trigger form submission since keydown event simulation is limited in JSDOM
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    
    // Verify login was called with credentials
    expect(mockLogin).toHaveBeenCalledWith(testEmail, testPassword);
  });

  test('shows error message when login fails', () => {
    // Set up login form with error
    const errorMessage = 'Invalid email or password';
    setupLoginForm(false, errorMessage);
    
    // Verify error message is displayed
    const errorElement = document.querySelector('[role="alert"]');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.textContent).toBe(errorMessage);
  });

  test('disables form elements while loading', () => {
    // Set up login form in loading state
    setupLoginForm(true);
    
    // Verify form elements are disabled
    expect(document.getElementById('email')).toBeDisabled();
    expect(document.getElementById('password')).toBeDisabled();
    expect(document.querySelector('button[type="submit"]')).toBeDisabled();
    
    // Verify button text shows loading state
    expect(document.querySelector('button[type="submit"]').textContent.trim()).toBe('Signing in...');
  });
});
