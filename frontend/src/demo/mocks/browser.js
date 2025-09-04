// MSW Browser setup for demo mode
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create the service worker for browser usage
export const worker = setupWorker(...handlers);

// Function to initialize MSW
export const initializeMSW = async () => {
  if (process.env.REACT_APP_DEMO_MODE === '1') {
    console.log('🧪 Demo mode is active - using MSW to mock API calls');
    
    // Start the worker
    await worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    });
    
    return true;
  }
  
  return false;
};

export default worker;
