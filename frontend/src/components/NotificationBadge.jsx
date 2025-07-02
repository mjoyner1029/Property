// frontend/src/components/NotificationBadge.jsx
import React from "react";

const NotificationBadge = ({ count }) => {
  if (!count || count < 1) return null;
  return (
    <div className="relative">
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  );
};

export default NotificationBadge;