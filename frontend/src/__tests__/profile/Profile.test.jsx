// frontend/src/__tests__/profile/Profile.test.jsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'src/test-utils/renderWithProviders';
import Profile from 'src/pages/Profile';

describe('Profile Component', () => {
  const mockUser = {
    id: 1,
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-123-4567',
    role: 'tenant',
  };

  let getItemSpy;
  let setItemSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock localStorage
    getItemSpy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key) => {
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

    setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  test('renders profile with user data from localStorage', async () => {
    renderWithProviders(<Profile />);

    // Title
    expect(await screen.findByText(/My Profile/i)).toBeInTheDocument();

    // Fields populated
    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    expect(nameInput).toHaveValue('Jane Doe');
    expect(emailInput).toHaveValue('jane@example.com');

    // Role text is capitalized in UI ("Tenant")
    expect(screen.getByText(/Tenant/i)).toBeInTheDocument();

    // Ensure localStorage was read
    expect(getItemSpy).toHaveBeenCalledWith('user');
  });

  test('updates profile and shows success message (simulated delay)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);

    const nameInput = await screen.findByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });

    // Change values
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Smith');

    await user.clear(emailInput);
    await user.type(emailInput, 'jane.smith@example.com');

    // Submit
    await user.click(saveButton);

    // Button should show loading state
    expect(screen.getByRole('button')).toHaveAttribute('disabled');
    expect(screen.getByRole('button')).toHaveTextContent(/Saving.../i);

    // Fast-forward the simulated API delay (800ms)
    jest.runAllTimers();

    // Success alert appears and button returns to normal
    await waitFor(() => {
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button')).toHaveTextContent(/Save Changes/i);
    expect(screen.getByRole('button')).not.toHaveAttribute('disabled');

    // localStorage should be updated with new name and email
    expect(setItemSpy).toHaveBeenCalledWith(
      'user',
      expect.stringContaining('"full_name":"Jane Smith"')
    );
    expect(setItemSpy).toHaveBeenCalledWith(
      'user',
      expect.stringContaining('"email":"jane.smith@example.com"')
    );
  });

  test('falls back to placeholders when user has no name or role', async () => {
    // Override getItem to return a user without name/role
    getItemSpy.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ email: 'no-name@example.com' });
      return null;
    });

    renderWithProviders(<Profile />);

    // Title
    expect(await screen.findByText(/My Profile/i)).toBeInTheDocument();

    // Name fallback text shown in the header block
    expect(screen.getByText(/Your Name/i)).toBeInTheDocument();

    // Role fallback text "User"
    expect(screen.getByText(/^User$/i)).toBeInTheDocument();

    // Email field populated from localStorage
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('no-name@example.com');
  });
});
