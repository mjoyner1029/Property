// frontend/src/pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import NotificationBadge from "../components/NotificationBadge";

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const res = await axios.get(`/api/notifications/${userId}`);
    setNotifications(res.data);
  };

  const markAsRead = async (id) => {
    await axios.post(`/api/notifications/mark_read/${id}`);
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
        Notifications
        <NotificationBadge count={notifications.filter(n => !n.is_read).length} />
      </h1>
      {notifications.map((note) => (
        <div
          key={note.id}
          className={`p-4 rounded mb-2 ${note.is_read ? "bg-gray-100" : "bg-red-100"}`}
        >
          <div className="font-semibold">{note.message}</div>
          <div className="text-sm text-gray-600">
            {note.type} - {new Date(note.created_at).toLocaleString()}
          </div>
          {!note.is_read && (
            <button
              onClick={() => markAsRead(note.id)}
              className="text-blue-500 mt-2"
            >
              Mark as read
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Notifications;