/**
 * Compatibility layer for the demo mode
 * This ensures that the demo auth context is used instead of the real one when in demo mode
 */

import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { DemoAuthContext } from '../providers/DemoAuthProvider';

// This is a compatibility hook to replace useAuth in demo mode
export const useCompatibleAuth = () => {
  const isDemoMode = process.env.REACT_APP_DEMO_MODE === '1';
  
  if (isDemoMode) {
    // In demo mode, use the demo auth context
    const demoContext = useContext(DemoAuthContext);
    if (!demoContext) {
      throw new Error('useCompatibleAuth must be used within a DemoAuthProvider when in demo mode');
    }
    return demoContext;
  } else {
    // In normal mode, use the regular auth context
    const authContext = useContext(AuthContext);
    if (!authContext) {
      throw new Error('useCompatibleAuth must be used within an AuthProvider when in normal mode');
    }
    return authContext;
  }
};
