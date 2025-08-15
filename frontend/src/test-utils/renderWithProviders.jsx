// frontend/src/test-utils/renderWithProviders.jsx
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';

export function renderWithProviders(ui, { route = '/', initialEntries = [route], providerProps = {}, ...options } = {}) {
  window.history.pushState({}, 'Test page', route);

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider {...providerProps}>{ui}</AuthProvider>
    </MemoryRouter>,
    options
  );
}
