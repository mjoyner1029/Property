// frontend/src/pages/Messages.jsx
import React, { useEffect, useState } from "react";
import { socket } from "../utils/socket";
import axios from "axios";

const Messages = ({ userId, receiverId, propertyId }) => {
  const [room, setRoom] = useState(`room-${userId}-${receiverId}-${propertyId}`);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    socket.emit("join", { room });
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.emit("leave", { room });
      socket.off("receive_message");
    };
  }, [room]);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await axios.get(`/api/messages/conversation?sender_id=${userId}&receiver_id=${receiverId}&property_id=${propertyId}`);
      setMessages(res.data);
    };
    fetchMessages();
  }, []);

  const sendMessage = async () => {
    const msg = {
      sender_id: userId,
      receiver_id: receiverId,
      property_id: propertyId,
      content,
    };
    await axios.post("/api/messages/", msg);
    socket.emit("send_message", { ...msg, room });
    setContent("");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Chat</h1>
      <div className="border p-4 rounded h-64 overflow-y-scroll bg-gray-50">
        {messages.map((m, idx) => (
          <div key={idx} className={`mb-2 ${m.sender_id === userId ? "text-right" : "text-left"}`}>
            <div className="inline-block bg-white px-3 py-2 rounded shadow">
              <div>{m.content}</div>
              <div className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-2 flex-grow rounded-l"
        />
        <button onClick={sendMessage} className="bg-red-600 text-white px-4 rounded-r">
          Send
        </button>
      </div>
    </div>
  );
};

export default Messages;