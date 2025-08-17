// frontend/src/components/NotificationBadge.jsx
import React from "react";

const NotificationBadge = ({ count, onClick, className = "", maxCount = 99 }) => {
  if (!count || count < 1) return null;
  
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  
  return (
    <div className="relative">
      <span 
        data-testid="notification-badge"
        onClick={onClick}
        className={`absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full badge ${className}`}
      >
        {displayCount}
      </span>
    </div>
  );
};

export default NotificationBadge;