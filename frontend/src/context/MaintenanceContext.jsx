// frontend/src/context/MaintenanceContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

// Create the context
export const MaintenanceContext = createContext();

function computeStats(list) {
  const arr = Array.isArray(list) ? list : [];
  const open = arr.filter((r) => r.status === "open").length;
  const inProgress = arr.filter((r) => r.status === "in_progress").length;
  const completed = arr.filter((r) => r.status === "completed").length;
  return { open, inProgress, completed, total: arr.length };
}

// Normalizes API response shapes like {requests: [...]}, {data: [...]}, or [...]
function extractRequestsPayload(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.requests)) return data.requests;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export const MaintenanceProvider = ({ children }) => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
  });

  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Fetch maintenance requests based on user role
  const fetchRequests = useCallback(async () => {
    // Wait for auth to be fully ready (not loading and authenticated)
    if (!isAuthenticated || authLoading) {
      // Clear state if we aren't authenticated or still loading
      setMaintenanceRequests([]);
      setStats({ open: 0, inProgress: 0, completed: 0, total: 0 });
      return;
    }

    // Also ensure we have user data before making role-based API calls
    if (!user?.role) {
      console.log("MaintenanceContext: Waiting for user role...");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine endpoint based on user role
      let endpoint = "/maintenance";
      if (user?.role === "tenant") endpoint = "/maintenance/tenant";
      else if (user?.role === "landlord") endpoint = "/maintenance/landlord";

      const { data } = await api.get(endpoint);
      const requestsData = extractRequestsPayload(data);

      setMaintenanceRequests(requestsData);
      setStats(computeStats(requestsData));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching maintenance requests:", err);
      setError(err?.response?.data?.error || "Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  // Load requests when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
    } else {
      // Reset state when user logs out
      setMaintenanceRequests([]);
      setStats({ open: 0, inProgress: 0, completed: 0, total: 0 });
    }
  }, [isAuthenticated, fetchRequests]);

  // Fetch a single request by id (from API; useful when deep linking)
  const fetchRequestById = useCallback(
    async (id) => {
      if (!isAuthenticated) {
        setError("Not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/maintenance/${id}`);
        const item =
          (data && typeof data === "object" && (data.request || data.data)) || data || null;

        if (item) {
          // Merge/replace into local state
          setMaintenanceRequests((prev) => {
            const exists = prev.some((r) => String(r.id) === String(item.id));
            const next = exists ? prev.map((r) => (String(r.id) === String(item.id) ? item : r)) : [item, ...prev];
            setStats(computeStats(next));
            return next;
          });
        }
        return item || null;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching maintenance request:", err);
        setError(err?.response?.data?.error || "Failed to load maintenance request");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  // Create a new maintenance request
  const createRequest = async (requestData) => {
    if (!isAuthenticated) {
      setError("Not authenticated");
      throw new Error("Not authenticated");
    }

    setLoading(true);
    setError(null);

    try {
      // Build FormData
      const formData = new FormData();
      Object.entries(requestData || {}).forEach(([key, val]) => {
        if (key === "images") return; // append below
        if (val !== undefined && val !== null) formData.append(key, val);
      });

      if (Array.isArray(requestData?.images) && requestData.images.length > 0) {
        requestData.images.forEach((image) => {
          // Append using common conventions; many servers accept repeated "images" keys
          formData.append("images", image);
        });
      }

      const { data } = await api.post(`/maintenance`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Normalize created payload; some APIs return {request: {...}}
      const created = (data && (data.request || data.data)) || data;

      setMaintenanceRequests((prev) => {
        const next = [created, ...prev];
        setStats(computeStats(next));
        return next;
      });

      return created;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error creating maintenance request:", err);
      const msg = err?.response?.data?.error || "Failed to create maintenance request";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Update a maintenance request (accepts partials)
  const updateRequest = async (id, updateData) => {
    if (!isAuthenticated) {
      setError("Not authenticated");
      throw new Error("Not authenticated");
    }

    setLoading(true);
    setError(null);

    try {
      // If images included, use multipart; otherwise JSON
      let config = {};
      let payload = updateData;

      if (updateData && Array.isArray(updateData.images) && updateData.images.length > 0) {
        const formData = new FormData();
        Object.entries(updateData).forEach(([key, val]) => {
          if (key === "images") return;
          if (val !== undefined && val !== null) formData.append(key, val);
        });
        updateData.images.forEach((file) => formData.append("images", file));
        payload = formData;
        config = { headers: { "Content-Type": "multipart/form-data" } };
      }

      const { data } = await api.put(`/maintenance/${id}`, payload, config);
      const updated = (data && (data.request || data.data)) || data;

      setMaintenanceRequests((prev) => {
        const next = prev.map((req) => (req.id === id ? updated : req));
        setStats(computeStats(next));
        return next;
      });

      return updated;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error updating maintenance request:", err);
      const msg = err?.response?.data?.error || "Failed to update maintenance request";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Delete a maintenance request
  const deleteRequest = async (id) => {
    if (!isAuthenticated) {
      setError("Not authenticated");
      throw new Error("Not authenticated");
    }

    setLoading(true);
    setError(null);

    try {
      await api.delete(`/maintenance/${id}`);

      setMaintenanceRequests((prev) => {
        const next = prev.filter((req) => req.id !== id);
        setStats(computeStats(next));
        return next;
      });

      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error deleting maintenance request:", err);
      const msg = err?.response?.data?.error || "Failed to delete maintenance request";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Add a comment to a maintenance request
  const addComment = async (id, text) => {
    if (!isAuthenticated) {
      setError("Not authenticated");
      throw new Error("Not authenticated");
    }
    if (!text || !String(text).trim()) return null;

    setError(null);
    try {
      const { data } = await api.post(
        `/maintenance/${id}/comments`,
        { text }
      );

      // API may return the new comment or the full updated request
      const maybeComment =
        (data && (data.comment || data.data)) || data;

      if (maybeComment && (maybeComment.id || maybeComment.text)) {
        // Append comment locally
        setMaintenanceRequests((prev) =>
          prev.map((r) =>
            String(r.id) === String(id)
              ? { ...r, comments: [...(r.comments || []), maybeComment] }
              : r
          )
        );
        return maybeComment;
      }

      // If full request returned, replace it
      if (maybeComment && maybeComment.status && maybeComment.id) {
        setMaintenanceRequests((prev) => {
          const next = prev.map((r) => (String(r.id) === String(id) ? maybeComment : r));
          setStats(computeStats(next));
          return next;
        });
        return maybeComment;
      }

      // As a fallback, trigger a refetch
      await fetchRequests();
      return null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error adding maintenance comment:", err);
      const msg = err?.response?.data?.error || "Failed to add comment";
      setError(msg);
      throw new Error(msg);
    }
  };

  const value = {
    maintenanceRequests,
    stats,
    loading,
    error,
    fetchRequests,
    fetchRequestById,
    createRequest,
    updateRequest,
    deleteRequest,
    addComment,
  };

  return <MaintenanceContext.Provider value={value}>{children}</MaintenanceContext.Provider>;
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
};
