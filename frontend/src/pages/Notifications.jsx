// frontend/src/pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  List, 
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Container,
  CircularProgress
} from "@mui/material";
import { 
  Notifications as NotificationsIcon,
  Circle as CircleIcon
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/notifications/${userId}`);
      setNotifications(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.post(`/api/notifications/mark_read/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError("Failed to mark notification as read");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [userId]);

  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "Unknown time";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          mb: 3 
        }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h5" fontWeight={600} sx={{ mr: 1 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip 
                label={unreadCount} 
                color="primary" 
                size="small" 
                sx={{ 
                  borderRadius: '50%', 
                  height: 24, 
                  minWidth: 24 
                }} 
              />
            )}
          </Box>
          
          {unreadCount > 0 && (
            <Button 
              variant="outlined" 
              size="small"
              onClick={async () => {
                try {
                  await axios.post(`/api/notifications/mark_all_read/${userId}`);
                  fetchNotifications();
                } catch (err) {
                  console.error("Error marking all as read:", err);
                }
              }}
              sx={{ borderRadius: 2 }}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {notifications.length === 0 ? (
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              textAlign: "center", 
              borderRadius: 3,
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <NotificationsIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You don't have any notifications at this time
            </Typography>
          </Paper>
        ) : (
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <List disablePadding>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider />}
                  <ListItem 
                    sx={{ 
                      px: 3, 
                      py: 2,
                      bgcolor: notification.is_read ? 'background.paper' : 'action.hover'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {!notification.is_read && (
                            <CircleIcon 
                              sx={{ 
                                fontSize: 10, 
                                color: 'primary.main', 
                                mr: 1 
                              }} 
                            />
                          )}
                          <Typography variant="body1" fontWeight={500}>
                            {notification.message}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center', 
                          mt: 0.5 
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            {notification.type} • {formatNotificationTime(notification.created_at)}
                          </Typography>
                          {!notification.is_read && (
                            <Button
                              size="small"
                              onClick={() => markAsRead(notification.id)}
                              sx={{ minWidth: 'auto', p: 0 }}
                            >
                              Mark as read
                            </Button>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default Notifications;