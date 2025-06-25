// frontend/src/components/MessageThread.jsx
import React from "react";

const MessageThread = ({ messages, currentUserId }) => (
  <div className="p-4 h-64 overflow-y-scroll border rounded bg-white">
    {messages.map((m, idx) => (
      <div
        key={idx}
        className={`${m.sender_id === currentUserId ? "text-right" : "text-left"} mb-2`}
      >
        <div className="inline-block px-3 py-2 rounded bg-gray-100 shadow">
          <p>{m.content}</p>
          <p className="text-xs text-gray-400">
            {new Date(m.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    ))}
  </div>
);

export default MessageThread;
