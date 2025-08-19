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

/**
 * Creates a mock provider for a context with given value
 * @param {React.Context} Context - The context to create a provider for
 * @param {*} value - The value to provide to the context
 * @returns {React.FC} A provider component that injects the given value
 */
export function makeMockProvider(Context, value) {
  return ({ children }) => (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
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
    providers = [], // New providers array param
    wrapper: OuterWrapper,
    ...options 
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  const AllProviders = ({ children }) => {
    // Start with the component children
    let tree = children;
    
    // If custom providers are specified, wrap the children with them in reverse order
    // (so the first provider in the array is the outermost one)
    if (providers.length > 0) {
      tree = providers.reduceRight((acc, [Context, value]) => {
        const ContextProvider = Context.Provider || Context;
        return <ContextProvider value={value}>{acc}</ContextProvider>;
      }, tree);
    } else {
      // Otherwise use the default providers
      tree = (
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
      );
    }
    
    // Always wrap in MemoryRouter
    tree = <MemoryRouter initialEntries={initialEntries}>{tree}</MemoryRouter>;
    
    // Apply any outer wrapper if provided
    if (OuterWrapper) {
      tree = <OuterWrapper>{tree}</OuterWrapper>;
    }
    
    return tree;
  };

  return render(ui, { wrapper: AllProviders, ...options });
}
