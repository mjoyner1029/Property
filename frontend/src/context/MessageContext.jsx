// frontend/src/context/MessageContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const MessageContext = createContext();

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

// ---- Payload shape helpers ----
function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}
function extractThreads(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.threads)) return payload.threads;
  return extractList(payload);
}
function extractMessages(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.messages)) return payload.messages;
  return extractList(payload);
}
function extractCursor(payload) {
  if (!payload || typeof payload !== "object") return {};
  const { nextCursor, prevCursor, next, previous, cursor } = payload;
  return {
    nextCursor: nextCursor ?? next ?? null,
    prevCursor: prevCursor ?? previous ?? null,
    cursor: cursor ?? null,
  };
}

function toStrId(v) {
  return v == null ? "" : String(v);
}
function sortByCreatedAsc(arr) {
  return [...arr].sort(
    (a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0)
  );
}
function mergeById(existing, incoming) {
  const map = new Map();
  [...existing, ...incoming].forEach((item) => {
    const key = toStrId(item.id);
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...item });
  });
  return Array.from(map.values());
}

function computeUnread(threads, messagesByThread, myUserId) {
  const unreadByThread = {};
  const list = Array.isArray(threads) ? threads : [];
  list.forEach((t) => {
    const tid = toStrId(t.id);
    // Prefer API-provided unread count if present
    let count =
      t.unread_count ??
      t.unread ??
      null;

    if (count == null) {
      // Derive from messages if available
      const msgs = messagesByThread[tid] || [];
      count = msgs.filter((m) => {
        const fromOther = toStrId(m.sender_id || m.senderId) !== toStrId(myUserId);
        const readFlag = Boolean(m.read);
        const readBy = Array.isArray(m.read_by || m.readBy) ? m.read_by || m.readBy : [];
        const iReadIt = readBy.map(toStrId).includes(toStrId(myUserId));
        return fromOther && !(readFlag || iReadIt);
      }).length;
    }
    unreadByThread[tid] = count || 0;
  });

  const unreadTotal = Object.values(unreadByThread).reduce((s, n) => s + (n || 0), 0);
  return { unreadByThread, unreadTotal };
}

export const MessageProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const myUserId = toStrId(user?.id);

  // Core state
  const [threads, setThreads] = useState([]);
  const [messagesByThread, setMessagesByThread] = useState({});
  const [cursorsByThread, setCursorsByThread] = useState({}); // { [threadId]: { nextCursor, prevCursor } }
  const [activeThreadId, setActiveThreadId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingByThread, setLoadingByThread] = useState({}); // per-thread loading flag
  const [error, setError] = useState(null);

  // Typing indicators (ephemeral)
  const [typingByThread, setTypingByThread] = useState({}); // { [threadId]: Set(userId) }
  const typingTimeoutsRef = useRef({}); // { [threadId_userId]: timeoutId }

  // Socket
  const socketRef = useRef(null);

  // ---- Derived unread counts ----
  const { unreadByThread, unreadTotal } = useMemo(
    () => computeUnread(threads, messagesByThread, myUserId),
    [threads, messagesByThread, myUserId]
  );

  // ---- Fetch Threads ----
  const fetchThreads = useCallback(async () => {
    if (!isAuthenticated) {
      setThreads([]);
      return;
    }
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setError("Authentication token missing");
      return;
    }
    setLoadingThreads(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/messages/threads", { headers: authHeaders });
      const list = extractThreads(data);
      setThreads(list);
      // Optionally hydrate messages for activeThread if present, left to caller
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("fetchThreads error:", err);
      setError(err?.response?.data?.error || "Failed to load message threads");
    } finally {
      setLoadingThreads(false);
    }
  }, [isAuthenticated]);

  // ---- Fetch Messages (per thread) ----
  const fetchThreadMessages = useCallback(
    async (threadId, { cursor = null, limit = 25, direction = "backward" } = {}) => {
      if (!threadId) return;
      const authHeaders = getAuthHeaders();
      if (!authHeaders) {
        setError("Authentication token missing");
        return;
      }
      setLoadingByThread((p) => ({ ...p, [threadId]: true }));
      setError(null);
      try {
        // Typical query params for pagination (server may ignore unknown ones)
        const params = {
          limit,
          cursor,
          direction, // "backward" for older, "forward" for newer
        };
        const { data } = await axios.get(`/api/messages/threads/${threadId}`, {
          headers: authHeaders,
          params,
        });
        const msgs = extractMessages(data);
        const cursors = extractCursor(data);

        setMessagesByThread((prev) => {
          const existing = prev[threadId] || [];
          const merged = mergeById(existing, msgs);
          return { ...prev, [threadId]: sortByCreatedAsc(merged) };
        });
        setCursorsByThread((prev) => ({ ...prev, [threadId]: cursors }));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("fetchThreadMessages error:", err);
        setError(err?.response?.data?.error || "Failed to load messages");
      } finally {
        setLoadingByThread((p) => ({ ...p, [threadId]: false }));
      }
    },
    []
  );

  // ---- Create a new thread (optional helper) ----
  const createThread = useCallback(
    async ({ recipientIds = [], subject, initialMessage }) => {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) throw new Error("Authentication token missing");

      setLoading(true);
      setError(null);
      try {
        const payload = { recipients: recipientIds, subject, text: initialMessage };
        const { data } = await axios.post(`/api/messages/threads`, payload, {
          headers: { ...authHeaders },
        });
        const thread = data?.thread || data?.data || data;
        if (thread?.id) {
          setThreads((prev) => mergeById(prev, [thread]));
          return thread;
        }
        return null;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("createThread error:", err);
        const msg = err?.response?.data?.error || "Failed to create thread";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ---- Send Message (in existing thread or new) ----
  const sendMessage = useCallback(
    async ({ threadId, recipientIds = [], text, attachments = [] }) => {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) throw new Error("Authentication token missing");
      if (!text && (!attachments || attachments.length === 0)) return null;

      // Optimistic temp message
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        thread_id: threadId || null,
        sender_id: myUserId,
        text: text || "",
        attachments:
          attachments?.map((f, i) => ({ id: `tmpfile-${i}`, name: f.name || "file" })) || [],
        created_at: new Date().toISOString(),
        pending: true,
      };

      setError(null);

      // If sending into existing thread, add optimistic message immediately
      if (threadId) {
        setMessagesByThread((prev) => {
          const existing = prev[threadId] || [];
          const merged = mergeById(existing, [optimisticMsg]);
          return { ...prev, [threadId]: sortByCreatedAsc(merged) };
        });
      }

      try {
        let dataOut;
        if (attachments && attachments.length > 0) {
          const formData = new FormData();
          if (text) formData.append("text", text);
          if (threadId) formData.append("thread_id", threadId);
          if (recipientIds?.length) recipientIds.forEach((id) => formData.append("recipients", id));
          attachments.forEach((file) => formData.append("attachments", file));

          const { data } = await axios.post(`/api/messages`, formData, {
            headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
          });
          dataOut = data;
        } else {
          const payload = { thread_id: threadId, recipients: recipientIds, text };
          const { data } = await axios.post(`/api/messages`, payload, {
            headers: { ...authHeaders },
          });
          dataOut = data;
        }

        // Server may return the created message and/or thread
        const createdMessage =
          dataOut?.message || (Array.isArray(dataOut?.messages) ? dataOut.messages[0] : null) || dataOut;
        const thread =
          dataOut?.thread || dataOut?.data?.thread || (createdMessage?.thread || null);

        let finalThreadId = threadId || toStrId(thread?.id) || toStrId(createdMessage?.thread_id || createdMessage?.threadId);

        if (!finalThreadId) {
          // As a fallback, refresh threads and try to infer it
          await fetchThreads();
          return createdMessage || null;
        }

        // Ensure thread is in the list + update last activity
        if (thread?.id) {
          setThreads((prev) => mergeById(prev, [thread]));
        }

        // Replace optimistic with real message
        if (threadId) {
          setMessagesByThread((prev) => {
            const existing = prev[finalThreadId] || [];
            const withoutTemp = existing.filter((m) => m.id !== tempId);
            const merged = mergeById(withoutTemp, [createdMessage]);
            return { ...prev, [finalThreadId]: sortByCreatedAsc(merged) };
          });
        } else {
          // New thread path: add message to its bucket
          setMessagesByThread((prev) => {
            const existing = prev[finalThreadId] || [];
            const merged = mergeById(existing, [createdMessage]);
            return { ...prev, [finalThreadId]: sortByCreatedAsc(merged) };
          });
          // Make it active
          setActiveThreadId(finalThreadId);
          // Ensure thread exists visually
          if (thread?.id) {
            setThreads((prev) => mergeById(prev, [thread]));
          }
        }

        return createdMessage;
      } catch (err) {
        // Rollback optimistic if we added one
        if (threadId) {
          setMessagesByThread((prev) => {
            const existing = prev[threadId] || [];
            return { ...prev, [threadId]: existing.filter((m) => m.id !== `temp-${tempId}`) };
          });
        }
        // eslint-disable-next-line no-console
        console.error("sendMessage error:", err);
        const msg = err?.response?.data?.error || "Failed to send message";
        setError(msg);
        throw new Error(msg);
      }
    },
    [myUserId, fetchThreads]
  );

  // ---- Mark thread as read (optimistic) ----
  const markThreadRead = useCallback(
    async (threadId) => {
      if (!threadId) return;
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const prevThreads = threads;
      const tid = toStrId(threadId);

      // Optimistically zero unread for this thread
      setThreads((prev) =>
        prev.map((t) => (toStrId(t.id) === tid ? { ...t, unread: 0, unread_count: 0 } : t))
      );

      try {
        await axios.put(`/api/messages/threads/${tid}/read`, null, { headers: authHeaders });
      } catch (err) {
        // rollback on error
        // eslint-disable-next-line no-console
        console.error("markThreadRead error:", err);
        setThreads(prevThreads);
      }
    },
    [threads]
  );

  // ---- Delete a message (optimistic) ----
  const deleteMessage = useCallback(async (messageId, { threadId } = {}) => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) throw new Error("Authentication token missing");
    const mid = toStrId(messageId);
    const tid = toStrId(threadId);

    let snapshot = null;
    if (tid) snapshot = messagesByThread[tid];

    if (tid) {
      setMessagesByThread((prev) => {
        const existing = prev[tid] || [];
        return { ...prev, [tid]: existing.filter((m) => toStrId(m.id) !== mid) };
      });
    }

    try {
      await axios.delete(`/api/messages/${mid}`, { headers: authHeaders });
    } catch (err) {
      // rollback
      // eslint-disable-next-line no-console
      console.error("deleteMessage error:", err);
      if (tid && snapshot) {
        setMessagesByThread((prev) => ({ ...prev, [tid]: snapshot }));
      }
      throw err;
    }
  }, [messagesByThread]);

  // ---- Typing indicators ----
  const _expireTyping = (threadId, userId) => {
    const key = `${threadId}_${userId}`;
    if (typingTimeoutsRef.current[key]) {
      clearTimeout(typingTimeoutsRef.current[key]);
    }
    typingTimeoutsRef.current[key] = setTimeout(() => {
      setTypingByThread((prev) => {
        const set = new Set(prev[threadId] || []);
        set.delete(userId);
        return { ...prev, [threadId]: set };
      });
      delete typingTimeoutsRef.current[key];
    }, 3000);
  };

  const handleTypingEvent = useCallback((threadId, fromUserId) => {
    if (!threadId || !fromUserId || toStrId(fromUserId) === myUserId) return;
    setTypingByThread((prev) => {
      const set = new Set(prev[threadId] || []);
      set.add(toStrId(fromUserId));
      return { ...prev, [threadId]: set };
    });
    _expireTyping(threadId, toStrId(fromUserId));
  }, [myUserId]);

  const sendTyping = useCallback(
    async (threadId) => {
      const tid = toStrId(threadId);
      if (!tid) return;
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("typing", { threadId: tid });
        return;
      }
      // Fallback to HTTP if desired (optional)
      const authHeaders = getAuthHeaders();
      if (authHeaders) {
        try {
          await axios.post(
            `/api/messages/threads/${tid}/typing`,
            {},
            { headers: authHeaders }
          );
        } catch {
          // silent
        }
      }
    },
    []
  );

  // ---- Realtime socket setup ----
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const token = localStorage.getItem("token");
    if (!token) return;

    async function connect() {
      try {
        let ioClient = null;
        try {
          const mod = await import("socket.io-client");
          ioClient = mod?.io || null;
        } catch {
          ioClient = typeof window !== "undefined" ? window.io : null;
        }
        if (!ioClient) return;

        if (socketRef.current?.connected) return;

        const socket = ioClient("/", {
          transports: ["websocket", "polling"],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        // New message
        socket.on("message:new", (payload) => {
          if (!isMounted || !payload) return;
          const msg = payload.message || payload;
          const tid =
            toStrId(msg.thread_id || msg.threadId || payload.thread_id || payload.threadId);
          if (!tid) return;

          setMessagesByThread((prev) => {
            const existing = prev[tid] || [];
            const merged = mergeById(existing, [msg]);
            return { ...prev, [tid]: sortByCreatedAsc(merged) };
          });

          // ensure thread exists / update last activity
          const thread = payload.thread || msg.thread;
          if (thread?.id) {
            setThreads((prev) => mergeById(prev, [thread]));
          }
        });

        // New / updated thread
        socket.on("thread:update", (payload) => {
          if (!isMounted || !payload) return;
          const thread = payload.thread || payload;
          if (thread?.id) {
            setThreads((prev) => mergeById(prev, [thread]));
          }
        });

        // Message deleted
        socket.on("message:deleted", (payload) => {
          const mid = toStrId(payload?.message_id || payload?.id);
          const tid = toStrId(payload?.thread_id);
          if (!mid || !tid) return;
          setMessagesByThread((prev) => {
            const existing = prev[tid] || [];
            return { ...prev, [tid]: existing.filter((m) => toStrId(m.id) !== mid) };
          });
        });

        // Read receipts
        socket.on("message:read", (payload) => {
          const tid = toStrId(payload?.thread_id);
          const mid = toStrId(payload?.message_id);
          const readerId = toStrId(payload?.user_id);
          if (!tid || !mid || !readerId) return;

          setMessagesByThread((prev) => {
            const msgs = prev[tid] || [];
            const next = msgs.map((m) => {
              if (toStrId(m.id) !== mid) return m;
              const readBy = Array.isArray(m.read_by || m.readBy) ? (m.read_by || m.readBy) : [];
              if (readBy.map(toStrId).includes(readerId)) return m;
              return { ...m, read_by: [...readBy, readerId] };
            });
            return { ...prev, [tid]: next };
          });
        });

        // Typing
        socket.on("typing", (payload) => {
          const tid = toStrId(payload?.threadId || payload?.thread_id);
          const fromUid = toStrId(payload?.userId || payload?.user_id);
          handleTypingEvent(tid, fromUid);
        });

        socketRef.current = socket;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Messages socket init failed:", e);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off("message:new");
        socketRef.current.off("thread:update");
        socketRef.current.off("message:deleted");
        socketRef.current.off("message:read");
        socketRef.current.off("typing");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, handleTypingEvent]);

  // Auto-load threads on login
  useEffect(() => {
    if (isAuthenticated) fetchThreads();
    else {
      setThreads([]);
      setMessagesByThread({});
      setCursorsByThread({});
      setActiveThreadId(null);
    }
  }, [isAuthenticated, fetchThreads]);

  // Convenience: set active thread and ensure messages are present
  const setActiveThread = useCallback(
    async (threadId) => {
      const tid = toStrId(threadId);
      setActiveThreadId(tid);
      if (!messagesByThread[tid]?.length) {
        await fetchThreadMessages(tid);
      }
      // Optionally mark as read on open
      await markThreadRead(tid);
    },
    [messagesByThread, fetchThreadMessages, markThreadRead]
  );

  const value = {
    // state
    threads,
    messagesByThread,
    cursorsByThread,
    unreadByThread,
    unreadTotal,
    typingByThread,
    loading: loading || loadingThreads || Object.values(loadingByThread).some(Boolean),
    error,
    activeThreadId,

    // actions
    fetchThreads,
    fetchThreadMessages,
    createThread,
    sendMessage,
    deleteMessage,
    markThreadRead,
    sendTyping,
    setActiveThread,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export const useMessages = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessages must be used within a MessageProvider");
  return ctx;
};
