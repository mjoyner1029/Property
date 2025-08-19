import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/outline';

const NotificationDropdown = ({ notifications = [] }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unread = notifications.some(n => !n.read);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        data-testid="notification-button"
        className="relative focus:outline-none"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Show notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon className="w-6 h-6 text-gray-600" />
        {unread && (
          <span 
            className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" 
            aria-label="Unread notifications"
          />
        )}
      </button>
      {open && (
        <div 
          className="absolute right-0 mt-2 w-64 bg-white shadow-md rounded-lg z-50"
          role="menu"
          aria-labelledby="notification-menu"
          data-testid="notification-dropdown"
        >
          <ul className="p-2 max-h-64 overflow-y-auto" role="list">
            {notifications.length === 0 ? (
              <li className="text-sm text-gray-500 p-2" role="menuitem">No notifications</li>
            ) : (
              notifications.map((n, i) => (
                <li
                  key={i}
                  className={`text-sm p-2 ${n.read ? 'text-gray-600' : 'font-bold text-black'} hover:bg-gray-100 rounded`}
                  role="menuitem"
                  data-unread={!n.read}
                >
                  {n.message}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
