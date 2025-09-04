/**
 * Demo mode entry point monkey patching
 * This file patches critical modules to work with demo mode
 */

// Import the original auth hook
import { useAuth as originalUseAuth } from '../context/AuthContext';

// Import demo auth hook
import { useDemoAuth } from './providers/DemoAuthProvider';

// Patch the auth hook in the routes/guards.jsx module
// This ensures that the route guards will work with demo mode
const patchRouteGuards = () => {
  // Find the module in webpack's module cache
  const webpackModules = window.__webpack_require__.m;
  let guardsModule = null;
  
  // Find the routes/guards.jsx module by its content pattern
  for (const moduleId in webpackModules) {
    const module = webpackModules[moduleId];
    
    // Check if it's a function (modules are functions in webpack)
    if (typeof module === 'function') {
      const moduleString = module.toString();
      
      // Look for specific content that would identify the guards module
      if (
        moduleString.includes('ProtectedRoute') && 
        moduleString.includes('PublicOnlyRoute') && 
        moduleString.includes('RoleRoute')
      ) {
        guardsModule = moduleId;
        break;
      }
    }
  }
  
  if (guardsModule) {
    // Create a monkeypatched version of the useAuth hook
    const patchedUseAuth = () => {
      // In demo mode, use the demo auth context
      if (process.env.REACT_APP_DEMO_MODE === '1') {
        return useDemoAuth();
      } else {
        // In normal mode, use the regular auth context
        return originalUseAuth();
      }
    };
    
    // Replace the useAuth import in the guards module
    try {
      const originalModule = window.__webpack_require__.c[guardsModule];
      if (originalModule && originalModule.exports) {
        // Store original exports
        const originalExports = { ...originalModule.exports };
        
        // Override the module to patch the useAuth import
        window.__webpack_require__.c[guardsModule].exports = {
          ...originalExports,
          useAuth: patchedUseAuth
        };
        
        console.log('🔮 [Demo Mode] Successfully patched route guards to work with demo mode');
        return true;
      }
    } catch (err) {
      console.error('Failed to patch route guards module:', err);
    }
  } else {
    console.error('Could not find route guards module to patch');
  }
  
  return false;
};

// Export the patch function
export const applyDemoPatches = () => {
  let success = true;
  
  // Patch route guards
  if (!patchRouteGuards()) {
    success = false;
    console.error('Failed to apply all demo patches');
  }
  
  return success;
};

export default applyDemoPatches;
