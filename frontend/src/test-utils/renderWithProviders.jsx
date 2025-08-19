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

export function renderWithProviders(
  ui,
  { 
    route = '/', 
    initialEntries = [route], 
    providerProps = {}, 
    propertyValue,
    appValue,
    maintenanceValue,
    paymentValue,
    tenantValue,
    wrapper: OuterWrapper,
    ...options 
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  const AllProviders = ({ children }) => {
    let tree = (
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider {...providerProps}>
          <AppProvider {...(appValue && { value: appValue })}>
            <PropertyProvider {...(propertyValue && { value: propertyValue })}>
              <MaintenanceProvider {...(maintenanceValue && { value: maintenanceValue })}>
                <PaymentProvider {...(paymentValue && { value: paymentValue })}>
                  <TenantProvider {...(tenantValue && { value: tenantValue })}>
                    {children}
                  </TenantProvider>
                </PaymentProvider>
              </MaintenanceProvider>
            </PropertyProvider>
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    
    if (OuterWrapper) {
      tree = <OuterWrapper>{tree}</OuterWrapper>;
    }
    
    return tree;
  };

  return render(ui, { wrapper: AllProviders, ...options });
}
