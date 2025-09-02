// A simplified test double for NotificationDetail
import React from 'react';

export function NotificationDetailSimple({ notificationId, onMarkRead, onDelete }) {
  return (
    <div data-testid="notification-detail">
      <h1>Notification Detail</h1>
      <p>Notification ID: {notificationId}</p>
      <button onClick={onMarkRead}>Mark as Read</button>
      <button onClick={onDelete}>Delete</button>
      <button onClick={() => window.history.back()}>Back</button>
    </div>
  );
}

export default NotificationDetailSimple;
