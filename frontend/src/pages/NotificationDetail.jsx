import React from 'react';
import { useParams } from 'react-router-dom';
import { useNotifications, useApp } from '../context';

/**
 * NotificationDetail page component
 * 
 * This is a placeholder component for test compatibility.
 * 
 * @returns {JSX.Element} The NotificationDetail page
 */
export function NotificationDetail() {
  const { id } = useParams();
  const { updatePageTitle } = useApp();
  
  React.useEffect(() => {
    updatePageTitle('Notification Detail');
  }, [updatePageTitle]);
  
  return (
    <div>
      <h1 data-testid="notification-detail">Notification Detail</h1>
      <p>Notification ID: {id}</p>
    </div>
  );
}

export default NotificationDetail;
