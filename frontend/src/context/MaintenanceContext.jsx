// frontend/src/context/MaintenanceContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

// Create the context
const MaintenanceContext = createContext();

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
  });

  const { isAuthenticated, user } = useAuth();

  // Fetch maintenance requests based on user role
  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) {
      // Clear state if we aren't authenticated
      setMaintenanceRequests([]);
      setStats({ open: 0, inProgress: 0, completed: 0, total: 0 });
      return;
    }

    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setError("Authentication token missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine endpoint based on user role
      let endpoint = "/api/maintenance";
      if (user?.role === "tenant") endpoint = "/api/maintenance/tenant";
      else if (user?.role === "landlord") endpoint = "/api/maintenance/landlord";

      const { data } = await axios.get(endpoint, { headers: authHeaders });
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
  }, [isAuthenticated, user]);

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
      const authHeaders = getAuthHeaders();
      if (!authHeaders) {
        setError("Authentication token missing");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`/api/maintenance/${id}`, { headers: authHeaders });
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
    []
  );

  // Create a new maintenance request
  const createRequest = async (requestData) => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setError("Authentication token missing");
      throw new Error("Authentication token missing");
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

      const { data } = await axios.post(`/api/maintenance`, formData, {
        headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
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
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setError("Authentication token missing");
      throw new Error("Authentication token missing");
    }

    setLoading(true);
    setError(null);

    try {
      // If images included, use multipart; otherwise JSON
      let config = { headers: { ...authHeaders } };
      let payload = updateData;

      if (updateData && Array.isArray(updateData.images) && updateData.images.length > 0) {
        const formData = new FormData();
        Object.entries(updateData).forEach(([key, val]) => {
          if (key === "images") return;
          if (val !== undefined && val !== null) formData.append(key, val);
        });
        updateData.images.forEach((file) => formData.append("images", file));
        payload = formData;
        config = { headers: { ...authHeaders, "Content-Type": "multipart/form-data" } };
      }

      const { data } = await axios.put(`/api/maintenance/${id}`, payload, config);
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
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setError("Authentication token missing");
      throw new Error("Authentication token missing");
    }

    setLoading(true);
    setError(null);

    try {
      await axios.delete(`/api/maintenance/${id}`, { headers: authHeaders });

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
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setError("Authentication token missing");
      throw new Error("Authentication token missing");
    }
    if (!text || !String(text).trim()) return null;

    setError(null);
    try {
      const { data } = await axios.post(
        `/api/maintenance/${id}/comments`,
        { text },
        { headers: { ...authHeaders } }
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
