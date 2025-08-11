import React, { useEffect, useRef } from "react";

const MessageThread = ({ messages, currentUserId }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="p-4 h-96 overflow-y-scroll border rounded bg-white">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`my-2 flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`inline-block px-3 py-2 rounded-lg ${
              msg.sender_id === currentUserId
                ? "bg-blue-500 text-white"
                : "bg-blue-100 text-gray-900"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageThread;
