import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Divider,
  CircularProgress,
  useTheme
} from "@mui/material";
import {
  Notifications as NotificationIcon,
  Payment as PaymentIcon,
  Build as MaintenanceIcon,
  Home as PropertyIcon,
  Person as PersonIcon
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";

const ActivityFeed = () => {
  const theme = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const _theme = useTheme();

  useEffect(() => {
    // Fetch activity data
    axios.get("/api/activity")
      .then(res => {
        setActivities(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching activity:", err);
        setError("Failed to load activity data");
        setLoading(false);
      });
  }, []);

  // Get appropriate icon based on activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case "payment":
        return <PaymentIcon fontSize="small" />;
      case "maintenance":
        return <MaintenanceIcon fontSize="small" />;
      case "property":
        return <PropertyIcon fontSize="small" />;
      case "tenant":
        return <PersonIcon fontSize="small" />;
      default:
        return <NotificationIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Activity Feed
      </Typography>
      
      <Card sx={{ 
        boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
        borderRadius: 3
      }}>
        <CardHeader title="Recent Activities" />
        <Divider />
        <CardContent>
          <List disablePadding>
            {activities.length === 0 && (
              <ListItem>
                <ListItemText primary="No recent activity" />
              </ListItem>
            )}
            
            {activities.map((activity, i) => (
              <ListItem
                key={i}
                sx={{
                  py: 1.5,
                  borderBottom: i < activities.length - 1 ? `1px solid ${theme.palette.divider}` : "none",
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ 
                    color: theme.palette.primary.main,
                    display: "flex",
                    alignItems: "center"
                  }}>
                    {getActivityIcon(activity.type)}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {activity.action}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {activity.detail}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : ""}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ActivityFeed;