// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { backendUrl } from '../utils/api';
import { logger } from '../utils/logger';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStore';

const AuthContext = createContext(null);

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
    (async () => {
      try {
        const r = await api.post('/auth/refresh', {});
        const t = r?.data?.access_token || null;
        const u = r?.data?.user || null;
        if (!mounted) return;
        if (t) updateToken(t);
        if (u) setUser(u);
      } catch {
        logger.info('Auth bootstrap: no active session');
      } finally {
        if (mounted) setLoading(false);
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

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(token),
    isRole: (role) => Boolean(user && user.role === role),
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
