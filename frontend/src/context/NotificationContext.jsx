// frontend/src/context/NotificationContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export const NotificationContext = createContext();

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.notifications)) return payload.notifications;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function computeUnread(list) {
  return (list || []).filter((n) => !n.read).length;
}

export const NotificationProvider = ({ children }) => {
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated || false;

  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // socket ref (avoid re-connecting on re-renders)
  const socketRef = useRef(null);

  const refreshDerived = useCallback((list) => {
    setUnreadCount(computeUnread(list));
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setError("Authentication token missing");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/notifications", {
        headers: authHeaders,
      });
      const list = extractList(data);
      setNotifications(list);
      refreshDerived(list);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching notifications:", err);
      setError(err?.response?.data?.error || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshDerived]);

  // Load notifications when the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Mark a single notification read (optimistic)
  const markAsRead = useCallback(async (notificationId) => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;

    const prev = notifications;
    const next = prev.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(next);
    refreshDerived(next);

    try {
      await axios.put(`/api/notifications/${notificationId}/read`, null, {
        headers: authHeaders,
      });
    } catch (err) {
      // rollback on error
      // eslint-disable-next-line no-console
      console.error("Error marking notification as read:", err);
      setNotifications(prev);
      refreshDerived(prev);
    }
  }, [notifications, refreshDerived]);

  // Mark all read (optimistic)
  const markAllAsRead = useCallback(async () => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;

    const prev = notifications;
    const next = prev.map((n) => ({ ...n, read: true }));
    setNotifications(next);
    refreshDerived(next);

    try {
      await axios.put("/api/notifications/read-all", null, {
        headers: authHeaders,
      });
    } catch (err) {
      // rollback on error
      // eslint-disable-next-line no-console
      console.error("Error marking all notifications as read:", err);
      setNotifications(prev);
      refreshDerived(prev);
    }
  }, [notifications, refreshDerived]);

  // Remove a notification (optimistic)
  const clearNotification = useCallback(async (notificationId) => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;

    const prev = notifications;
    const _toRemove = prev.find((n) => n.id === notificationId);
    const next = prev.filter((n) => n.id !== notificationId);
    setNotifications(next);
    refreshDerived(next);

    try {
      await axios.delete(`/api/notifications/${notificationId}`, {
        headers: authHeaders,
      });
    } catch (err) {
      // rollback
      // eslint-disable-next-line no-console
      console.error("Error removing notification:", err);
      setNotifications(prev);
      refreshDerived(prev);
    }
  }, [notifications, refreshDerived]);

  // Add (e.g., from realtime channel). De-dupe by id; newest first.
  const addNotification = useCallback((notification) => {
    if (!notification) return;
    setNotifications((prev) => {
      const exists = prev.some((n) => String(n.id) === String(notification.id));
      const next = exists
        ? prev.map((n) => (String(n.id) === String(notification.id) ? notification : n))
        : [notification, ...prev];
      return next;
    });
    if (!notification.read) {
      setUnreadCount((c) => c + 1);
    }
  }, []);

  // Real-time via Socket.IO (auth token in auth payload; fallback to window.io if bundled via CDN)
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const token = localStorage.getItem("token");
    if (!token) return;

    async function connect() {
      try {
        let ioClient = null;
        try {
          // Prefer installed package
          const mod = await import("socket.io-client");
          ioClient = mod?.io || null;
        } catch {
          // Fallback to global (CDN)
          ioClient = typeof window !== "undefined" ? window.io : null;
        }
        if (!ioClient) return;

        // Avoid double connect
        if (socketRef.current?.connected) return;

        const socket = ioClient("/", {
          // Adjust path if your server uses a custom socket.io path
          // path: "/socket.io",
          transports: ["websocket", "polling"],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on("connect_error", (err) => {
          // eslint-disable-next-line no-console
          console.warn("Notifications socket connect_error:", err?.message || err);
        });

        socket.on("notification", (payload) => {
          if (!isMounted) return;
          addNotification(payload);
        });

        socketRef.current = socket;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Socket initialization failed:", e);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off("notification");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, addNotification]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
};
