// frontend/src/test-utils/renderWithProviders.jsx
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider } from '../context/AuthContext';
import { PropertyProvider } from '../context/PropertyContext';
import { AppProvider } from '../context/AppContext';
import { MaintenanceProvider } from '../context/MaintenanceContext';
import { PaymentProvider } from '../context/PaymentContext';
import { TenantProvider } from '../context/TenantContext';

// Mock axios defaults
if (!axios.defaults) {
  axios.defaults = { headers: { common: {} } };
}

export function renderWithProviders(ui, { route = '/', initialEntries = [route], providerProps = {}, ...options } = {}) {
  window.history.pushState({}, 'Test page', route);

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider {...providerProps}>
        <AppProvider>
          <PropertyProvider>
            <MaintenanceProvider>
              <PaymentProvider>
                <TenantProvider>
                  {ui}
                </TenantProvider>
              </PaymentProvider>
            </MaintenanceProvider>
          </PropertyProvider>
        </AppProvider>
      </AuthProvider>
    </MemoryRouter>,
    options
  );
}
