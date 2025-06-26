
import React from 'react';
import { BellIcon } from '@heroicons/react/outline';

const NotificationDropdown = ({ notifications }) => {
  return (
    <div className="relative">
      <BellIcon className="w-6 h-6 text-gray-600" />
      {notifications.some(n => !n.read) && (
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
      )}
      <div className="absolute right-0 mt-2 w-64 bg-white shadow-md rounded-lg z-50">
        <ul className="p-2">
          {notifications.map((n, i) => (
            <li key={i} className={`text-sm p-2 ${n.read ? 'text-gray-600' : 'font-bold text-black'}`}>
              {n.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NotificationDropdown;
