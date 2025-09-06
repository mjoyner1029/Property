// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { backendUrl } from '../utils/api';
import { logger } from '../utils/logger';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStore';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAccessToken());
  const [loading, setLoading] = useState(true);
  const initCalled = useRef(false);

  // Helper to keep memory token + state in sync
  const updateToken = (t) => {
    setAccessToken(t);
    setTokenState(t);
  };

  // Bootstrap once using httpOnly refresh cookie
  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;
    let mounted = true;
    console.log('🔍 AuthContext bootstrap starting...');
    (async () => {
      try {
        const r = await api.post('/auth/refresh', {});
        const t = r?.data?.access_token || null;
        const u = r?.data?.user || null;
        console.log('🔍 AuthContext refresh response:', { hasToken: !!t, user: u });
        if (!mounted) return;
        if (t) updateToken(t);
        if (u) setUser(u);
      } catch (error) {
        console.log('🔍 Auth bootstrap failed:', error.message);
        logger.info('Auth bootstrap: no active session');
      } finally {
        if (mounted) {
          console.log('🔍 AuthContext bootstrap complete, loading=false');
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    const t = r?.data?.access_token || null;
    const u = r?.data?.user || null;
    if (t) updateToken(t);
    if (u) setUser(u);
    return u;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    updateToken(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await api.get('/auth/me');
      const userData = response?.data?.user || null;
      if (userData) {
        setUser(userData);
        return userData;
      }
    } catch (error) {
      logger.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    if (!user || !token) throw new Error('User not authenticated');
    
    try {
      // For now, update user data locally since there's no backend endpoint
      // In a real app, this would make an API call to update the profile
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      
      // Also update localStorage to persist the changes
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      logger.error('Failed to update profile:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    updateProfile,
    setUser,
    isAuthenticated: Boolean(token),
    isRole: (role) => Boolean(user && user.role === role),
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
