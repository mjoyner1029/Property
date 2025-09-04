import { DemoAuthProvider, useDemoAuth } from './providers/DemoAuthProvider';
import { DemoPanel } from './ui/DemoPanel';
import { worker } from './mocks/browser';
import { getDB, resetDB } from './data/persist';
import { updateDemoConfig, getDemoConfig } from './mocks/handlers';

// Function to initialize demo mode
export const initDemoMode = async () => {
  // Clear any existing data to start fresh
  resetDB();
  console.log('🔮 [Demo Mode] Database reset with fresh seed data');
  
  // Start MSW based on environment
  if (process.env.NODE_ENV !== 'production') {
    // Start MSW in development
    await worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    });
    console.log('🔮 [Demo Mode] Mock Service Worker started');
  } else {
    // Start MSW in production
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
      onUnhandledRequest: 'bypass',
    });
    console.log('🔮 [Demo Mode] Mock Service Worker started in production');
  }
  
  // Always initialize the database to ensure we have fresh seed data
  resetDB();
  
  // Expose MSW worker to window for debugging
  window.mswWorker = worker;
};

// Function to stop demo mode
export const stopDemoMode = async () => {
  await worker.stop();
  console.log('🔮 [Demo Mode] Mock Service Worker stopped');
};

// Export everything needed for demo mode
export {
  DemoAuthProvider,
  useDemoAuth,
  DemoPanel,
  getDB,
  resetDB,
  updateDemoConfig,
  getDemoConfig
};
