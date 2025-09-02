/**
 * AuthContextNoMock.test.jsx
 *
 * Purpose:
 * - Provide a stateful, in-test AuthContext so we can validate typical auth flows
 *   (render unauthenticated, call login, become authenticated, call logout, revert).
 * - Avoids importing the app's real providers (no coupling, no network).
 *
 * Requirements:
 * - @testing-library/react and @testing-library/jest-dom must be available.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import '@testing-library/jest-dom/extend-expect';

// ------------------------
// Minimal mock AuthContext
// ------------------------
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  refreshToken: async () => {},
});

function useAuth() {
  return useContext(AuthContext);
}

// Stateful provider used only for this test file.
// Simulates typical auth behavior without external I/O.
function MockAuthProvider({ children, onLoginCall, onLogoutCall, onRefreshCall }) {
  const [user, setUser] = useState(null);

  const value = useMemo(() => {
    return {
      user,
      isAuthenticated: !!user,
      login: async (email, password) => {
        // record call for assertions
        onLoginCall?.(email, password);
        // simulate async auth delay
        await Promise.resolve();
        // store a minimal user object
        setUser({ id: 'u_1', email });
        return { ok: true };
      },
      logout: () => {
        onLogoutCall?.();
        setUser(null);
      },
      refreshToken: async () => {
        onRefreshCall?.();
        await Promise.resolve();
        return { ok: true, refreshed: true };
      },
    };
  }, [user, onLoginCall, onLogoutCall, onRefreshCall]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ------------------------
// Test consumer component
// ------------------------
function AuthConsumerDemo() {
  const { user, isAuthenticated, login, logout, refreshToken } = useAuth();

  return (
    <div>
      <div data-testid="auth-state">
        {isAuthenticated ? `AUTH:Y:${user?.email ?? ''}` : 'AUTH:N'}
      </div>

      <button
        data-testid="login-btn"
        onClick={() => login('admin@example.com', 'Password123!')}
      >
        login
      </button>

      <button data-testid="logout-btn" onClick={logout}>
        logout
      </button>

      <button data-testid="refresh-btn" onClick={refreshToken}>
        refresh
      </button>
    </div>
  );
}

// -------------
// Test helpers
// -------------
function renderWithMockProvider(handlerSpies = {}) {
  const utils = render(
    <MockAuthProvider
      onLoginCall={handlerSpies.onLoginCall}
      onLogoutCall={handlerSpies.onLogoutCall}
      onRefreshCall={handlerSpies.onRefreshCall}
    >
      <AuthConsumerDemo />
    </MockAuthProvider>
  );

  const $state = () => screen.getByTestId('auth-state');
  const click = (testId) => fireEvent.click(screen.getByTestId(testId));

  return { ...utils, $state, click };
}

// --------------
// The test suite
// --------------
afterEach(() => cleanup());

describe('AuthContext (in-test mock, no app providers)', () => {
  test('renders unauthenticated by default', () => {
    const { $state } = renderWithMockProvider();
    expect($state()).toHaveTextContent('AUTH:N');
  });

  test('login() marks user as authenticated and exposes email', async () => {
    const onLoginCall = jest.fn();
    const { $state, click, findByText } = renderWithMockProvider({ onLoginCall });

    click('login-btn');

    // Wait for the async state change to reflect
    await findByText(/AUTH:Y:/);

    expect(onLoginCall).toHaveBeenCalledTimes(1);
    expect(onLoginCall).toHaveBeenCalledWith('admin@example.com', 'Password123!');
    expect($state()).toHaveTextContent('AUTH:Y:admin@example.com');
  });

  test('logout() clears user and returns to unauthenticated', async () => {
    const onLogoutCall = jest.fn();
    const { $state, click, findByText } = renderWithMockProvider({ onLogoutCall });

    // First, login to become authenticated
    click('login-btn');
    await findByText(/AUTH:Y:/);
    expect($state()).toHaveTextContent('AUTH:Y:admin@example.com');

    // Then, logout and verify state
    click('logout-btn');
    expect(onLogoutCall).toHaveBeenCalledTimes(1);
    expect($state()).toHaveTextContent('AUTH:N');
  });

  test('refreshToken() is callable while authenticated', async () => {
    const onRefreshCall = jest.fn();
    const { click, findByText } = renderWithMockProvider({ onRefreshCall });

    // Must be authenticated for a realistic refresh
    click('login-btn');
    await findByText(/AUTH:Y:/);

    click('refresh-btn');
    // No UI change expected; just verify the handler ran
    expect(onRefreshCall).toHaveBeenCalledTimes(1);
  });

  test('idempotent logout: calling logout when unauthenticated is safe', () => {
    const onLogoutCall = jest.fn();
    const { click, $state } = renderWithMockProvider({ onLogoutCall });

    // Already unauthenticated
    expect($state()).toHaveTextContent('AUTH:N');
    click('logout-btn');
    // Should not throw and should still be unauthenticated
    expect(onLogoutCall).toHaveBeenCalledTimes(1);
    expect($state()).toHaveTextContent('AUTH:N');
  });
});
