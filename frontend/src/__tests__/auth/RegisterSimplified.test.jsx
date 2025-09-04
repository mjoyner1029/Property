import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Register from 'src/pages/Register';
import { act } from 'react-dom/test-utils';

// Mock dependencies
const mockNavigate = jest.fn();
  const theme = useTheme();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock auth context
const mockRegister = jest.fn();
jest.mock('src/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    register: mockRegister,
    loading: false,
    error: null
  }),
}));

const _theme = createTheme();

describe('Register page simplified', () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders name, email, password, confirm and submit button', async () => {
    renderComponent();
    
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    
    // Password fields don't have a role='textbox' so we need to use a different approach
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('prevents submit when passwords do not match', async () => {
    renderComponent();
    
    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Test User');
      await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password456');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('submits and navigates on success', async () => {
    mockRegister.mockResolvedValue({ success: true });
    renderComponent();
    
    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Test User');
      await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });
    
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockRegister).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'password123',
        'tenant' // Default role
      );
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email');
    });
  });

  it('shows error message when register fails', async () => {
    mockRegister.mockRejectedValue({
      response: { data: { error: 'Registration failed' } }
    });
    renderComponent();
    
    await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Test User');
      await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });
    
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
    });
  });
});
