import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';
import ForgotPassword from 'src/pages/ForgotPassword';
import { act } from 'react';

// Mock axios
jest.mock('axios');

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock auth context
const mockAuthActions = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn()
};

jest.mock('src/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    ...mockAuthActions
  }),
}));

const theme = createTheme();

describe('ForgotPassword page simplified', () => {
  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ForgotPassword {...props} />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    renderComponent();
    
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows success message when form is submitted successfully', async () => {
    // Mock axios post to simulate a successful response
    jest.spyOn(axios, 'post').mockResolvedValueOnce({ data: {} });
    
    renderComponent();
    
    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });
    
    expect(axios.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'test@example.com' });
    expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
  });
  
  it('shows error message when form submission fails', async () => {
    // Mock axios post to simulate an error response
    jest.spyOn(axios, 'post').mockRejectedValueOnce({ 
      response: { data: { message: 'Email not found' } }
    });
    
    renderComponent();
    
    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'invalid@example.com');
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });
    
    expect(axios.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'invalid@example.com' });
    expect(screen.getByText(/email not found/i)).toBeInTheDocument();
  });
});
