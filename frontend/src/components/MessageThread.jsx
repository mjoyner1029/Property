// frontend/src/components/MessageThread.jsx
import React, { useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Stack,
  Avatar,
  Typography,
  Paper,
  Tooltip,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

/**
 * MessageThread
 *
 * Props:
 * - messages: Array<{ id, sender_id, text|content, created_at, pending?, error?, read_by? }>
 * - currentUserId: string|number
 * - usersById?: { [id]: { name?: string, avatarUrl?: string } }
 * - typingUsers?: Array<{ id: string|number, name?: string }>
 * - onRetry?: (message) => void   // called when clicking retry for failed sends
 * - onDelete?: (message) => void  // optional
 * - height?: number|string        // scroll area height (default 384)
 * - sx?: object                   // MUI sx for container
 */
export default function MessageThread({
  messages = [],
  currentUserId,
  usersById = {},
  typingUsers = [],
  onRetry,
  onDelete,
  height = 384,
  sx,
}) {
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const lastLenRef = useRef(0);

  // Normalize + sort messages (ascending by time)
  const items = useMemo(() => {
    const copy = [...messages];
    copy.sort(
      (a, b) =>
        new Date(a.created_at || a.createdAt || 0) -
        new Date(b.created_at || b.createdAt || 0)
    );
    return copy;
  }, [messages]);

  // Group by day label
  const groups = useMemo(() => groupMessagesByDay(items), [items]);

  // Keep scroll pinned to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    const threshold = 48; // px
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  }, []);

  useEffect(() => {
    const firstRender = lastLenRef.current === 0;
    const grew = items.length > lastLenRef.current;
    const shouldStick = firstRender || grew || isNearBottom();
    if (shouldStick) scrollToBottom(!firstRender);
    lastLenRef.current = items.length;
  }, [items, isNearBottom, scrollToBottom]);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        ...sx,
      }}
    >
      <Box
        ref={listRef}
        sx={{
          p: 2,
          height,
          overflowY: "auto",
          bgcolor: "background.paper",
        }}
      >
        {groups.map((g) => (
          <DayGroup
            key={g.key}
            label={g.label}
            messages={g.messages}
            currentUserId={currentUserId}
            usersById={usersById}
            onRetry={onRetry}
            onDelete={onDelete}
          />
        ))}

        {/* Typing indicator */}
        {typingUsers?.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 1 }}>
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">
              {formatTyping(typingUsers)}
            </Typography>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>
    </Paper>
  );
}

/* ---------- Subcomponents ---------- */

function DayGroup({ label, messages, currentUserId, usersById, onRetry, onDelete }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Divider sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Divider>

      <Stack spacing={1.2}>
        {messages.map((msg, idx) => {
          const mine = String(msg.sender_id) === String(currentUserId);
          const prev = idx > 0 ? messages[idx - 1] : null;
          const isClusterTop =
            !prev ||
            String(prev.sender_id) !== String(msg.sender_id) ||
            minutesBetween(prev.created_at, msg.created_at) > 5;

          return (
            <MessageBubble
              key={msg.id || `${msg.sender_id}-${msg.created_at}-${idx}`}
              message={msg}
              mine={mine}
              showAvatar={!mine && isClusterTop}
              user={usersById[msg.sender_id] || {}}
              onRetry={onRetry}
              onDelete={onDelete}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

function MessageBubble({ message, mine, showAvatar, user, onRetry, onDelete }) {
  const text =
    message.text ?? message.content ?? message.body ?? "";

  const time = new Date(message.created_at || message.createdAt || Date.now());
  const readBy = message.read_by || message.readBy || [];
  const isPending = Boolean(message.pending);
  const hasError = Boolean(message.error);

  const bubbleSx = mine
    ? {
        bgcolor: "primary.main",
        color: "primary.contrastText",
      }
    : {
        bgcolor: "grey.100",
      };

  const avatar = !mine && showAvatar ? (
    <Avatar
      src={user.avatarUrl}
      alt={user.name || "User"}
      sx={{ width: 32, height: 32, mr: 1 }}
    >
      {initials(user.name)}
    </Avatar>
  ) : (
    <Box sx={{ width: 32, mr: 1 }} />
  );

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        alignItems: "flex-end",
      }}
    >
      {!mine && avatar}

      <Box sx={{ maxWidth: "76%" }}>
        {/* Sender name for received messages at cluster start */}
        {!mine && showAvatar && user?.name && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 0.5 }}
          >
            {user.name}
          </Typography>
        )}

        <Tooltip
          title={time.toLocaleString()}
          placement={mine ? "left" : "right"}
        >
          <Paper
            elevation={0}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: mine ? 2 : 2,
              ...bubbleSx,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {text}
            </Typography>

            {/* Meta row: status + time */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
                opacity: 0.8,
              }}
            >
              {mine ? (
                <>
                  {isPending && (
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption">Sending…</Typography>
                    </Box>
                  )}
                  {hasError && (
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <ErrorOutlineIcon color="error" sx={{ fontSize: 14 }} />
                      <Typography variant="caption" color="error">
                        Failed
                      </Typography>
                      {typeof onRetry === "function" && (
                        <IconButton
                          size="small"
                          onClick={() => onRetry(message)}
                          sx={{ ml: -0.5 }}
                          aria-label="Retry sending"
                        >
                          <ReplayIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  )}
                  {!isPending && !hasError && (
                    <Tooltip title={`Read by ${readBy?.length || 0}`}>
                      <DoneAllIcon
                        sx={{ fontSize: 16, opacity: (readBy?.length || 0) > 0 ? 1 : 0.45 }}
                        color={(readBy?.length || 0) > 0 ? "inherit" : "disabled"}
                      />
                    </Tooltip>
                  )}
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {formatTime(time)}
                  </Typography>
                </>
              ) : (
                <Typography variant="caption">{formatTime(time)}</Typography>
              )}
            </Box>
          </Paper>
        </Tooltip>
      </Box>

      {mine && <Box sx={{ width: 32, ml: 1 }} />}
    </Box>
  );
}

/* ---------- Utilities ---------- */

function initials(name) {
  if (!name) return "";
  const parts = String(name).trim().split(/\s+/);
  return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
}

function formatTime(d) {
  try {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function sameDay(a, b) {
  const A = new Date(a);
  const B = new Date(b);
  return (
    A.getFullYear() === B.getFullYear() &&
    A.getMonth() === B.getMonth() &&
    A.getDate() === B.getDate()
  );
}

function dayLabel(date) {
  const d = new Date(date);
  const now = new Date();
  const yday = new Date(now);
  yday.setDate(now.getDate() - 1);

  if (sameDay(d, now)) return "Today";
  if (sameDay(d, yday)) return "Yesterday";
  return d.toLocaleDateString();
}

function minutesBetween(a, b) {
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (Number.isNaN(A) || Number.isNaN(B)) return 999;
  return Math.abs(B - A) / 60000;
}

function groupMessagesByDay(list) {
  const buckets = new Map();
  list.forEach((m) => {
    const k = new Date(m.created_at || m.createdAt || 0);
    const key = `${k.getFullYear()}-${k.getMonth() + 1}-${k.getDate()}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(m);
  });

  const rows = Array.from(buckets.entries())
    .map(([key, msgs]) => ({
      key,
      label: dayLabel(msgs[0].created_at || msgs[0].createdAt),
      messages: msgs,
    }))
    .sort(
      (a, b) =>
        new Date(a.messages[0].created_at || a.messages[0].createdAt) -
        new Date(b.messages[0].created_at || b.messages[0].createdAt)
    );

  return rows;
}

function formatTyping(typingUsers = []) {
  const names = typingUsers
    .map((u) => u?.name)
    .filter(Boolean)
    .slice(0, 2);
  if (typingUsers.length === 1) return `${names[0] || "Someone"} is typing…`;
  if (typingUsers.length === 2) return `${names[0] || "Someone"} and ${names[1] || "someone"} are typing…`;
  if (typingUsers.length > 2) return `${names.join(", ")} and others are typing…`;
  return "Someone is typing…";
}
