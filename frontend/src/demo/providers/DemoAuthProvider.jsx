import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getDB } from "../data/persist";
import { useLocation, useNavigate } from "react-router-dom";

// Create context
const DemoAuthContext = createContext();

// Demo auth provider
export const DemoAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Check for saved tokens in localStorage on mount (backup auth check)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let savedToken = localStorage.getItem("demo_access_token");

        // Skip if we have a user already
        if (user) {
          setLoading(false);
          return;
        }

        if (savedToken) {
          // Try to decode the token
          const decoded = jwtDecode(savedToken);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            // Token expired, try to refresh
            try {
              const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  refresh_token: localStorage.getItem("demo_refresh_token"),
                }),
              });

              if (response.ok) {
                const data = await response.json();
                localStorage.setItem("demo_access_token", data.access_token);
                setToken(data.access_token);
                setUser(data.user);
              } else {
                // Refresh failed, clear tokens
                localStorage.removeItem("demo_access_token");
                localStorage.removeItem("demo_refresh_token");
                setToken(null);
                setUser(null);
              }
            } catch (err) {
              console.error("Demo auth refresh error:", err);
              localStorage.removeItem("demo_access_token");
              localStorage.removeItem("demo_refresh_token");
              setToken(null);
              setUser(null);
            }
          } else {
            // Token still valid, fetch user info
            try {
              const response = await fetch("/api/users/me", {
                headers: {
                  Authorization: `Bearer ${savedToken}`,
                },
              });

              if (response.ok) {
                const userData = await response.json();
                setToken(savedToken);
                setUser(userData);
              } else {
                // User fetch failed, clear tokens
                localStorage.removeItem("demo_access_token");
                localStorage.removeItem("demo_refresh_token");
                setToken(null);
                setUser(null);
              }
            } catch (err) {
              console.error("Demo auth user fetch error:", err);
              localStorage.removeItem("demo_access_token");
              localStorage.removeItem("demo_refresh_token");
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error("Demo auth check error:", err);
        localStorage.removeItem("demo_access_token");
        localStorage.removeItem("demo_refresh_token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("demo_access_token", data.access_token);
        localStorage.setItem("demo_refresh_token", data.refresh_token);
        setToken(data.access_token);
        setUser(data.user);

        // Redirect to dashboard or previous location
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });

        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Login failed");
        return { success: false, error: errorData.error || "Login failed" };
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setError("An error occurred during login");
      return { success: false, error: "An error occurred during login" };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      if (token) {
        // Call logout API
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Demo logout error:", err);
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem("demo_access_token");
      localStorage.removeItem("demo_refresh_token");
      setToken(null);
      setUser(null);
      setLoading(false);

      // Redirect to login
      navigate("/login");
    }
  };

  // Switch user function (demo mode only)
  const switchUser = async (role) => {
    setLoading(true);

    try {
      const db = await getDB();
      // Find a user with the specified role
      const users = db.users || [];
      const targetUser = users.find((u) => u.role === role);

      if (targetUser) {
        // Create a demo token
        const now = Math.floor(Date.now() / 1000);
        const token = `demo.${btoa(
          JSON.stringify({
            sub: targetUser.id,
            role: targetUser.role,
            iat: now,
            exp: now + 3600 * 24,
          }),
        )}.signature`;

        localStorage.setItem("demo_access_token", token);
        localStorage.setItem("demo_refresh_token", "demo-refresh-token");
        setToken(token);
        setUser(targetUser);
        return { success: true };
      } else {
        setError(`No demo user with role: ${role}`);
        return { success: false, error: `No demo user with role: ${role}` };
      }
    } catch (err) {
      console.error("Demo switch user error:", err);
      setError("An error occurred while switching user");
      return {
        success: false,
        error: "An error occurred while switching user",
      };
    } finally {
      setLoading(false);
    }
  };

  // Auto login function (demo mode only)
  const autoLogin = async (role = "owner") => {
    setLoading(true);

    try {
      const db = await getDB();
      // Find a user with the specified role
      const users = db.users || [];
      const targetUser = users.find((u) => u.role === role) || users[0];

      if (targetUser) {
        // Create a demo token
        const now = Math.floor(Date.now() / 1000);
        const token = `demo.${btoa(
          JSON.stringify({
            sub: targetUser.id,
            role: targetUser.role,
            iat: now,
            exp: now + 3600 * 24,
          }),
        )}.signature`;

        localStorage.setItem("demo_access_token", token);
        localStorage.setItem("demo_refresh_token", "demo-refresh-token");
        setToken(token);
        setUser(targetUser);
        return { success: true, user: targetUser };
      } else {
        console.error("No demo users found for auto-login");
        return { success: false, error: "No demo users found for auto-login" };
      }
    } catch (err) {
      console.error("Demo auto login error:", err);
      return { success: false, error: "An error occurred during auto login" };
    } finally {
      setLoading(false);
    }
  };

  // Get the current user's role
  const getUserRole = () => {
    return user?.role || null;
  };

  // Check if the user has a specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Make sure we're providing the same interface as the real AuthContext
  // for compatibility with route guards and any components that use auth context
  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    switchUser, // Demo-specific function
    autoLogin, // Demo-specific function
    getUserRole,
    hasRole,
    // These properties must match the real AuthContext for route guards to work
    isAuthenticated: Boolean(user && token),
    isRole: (role) => {
      if (Array.isArray(role)) {
        return role.some((r) => user?.role === r);
      }
      return Boolean(user && user.role === role);
    },
  };

  return (
    <DemoAuthContext.Provider value={value}>
      {children}
    </DemoAuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useDemoAuth = () => {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }
  return context;
};

export default DemoAuthContext;
