import React from "react";
import Badge from "@mui/material/Badge";
import _IconButton from "@mui/material/IconButton";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function NotificationBadge({ count=0, onClick, className="" }) {
  if (count === 0) return null; // tests expect no render
  return (
    <Badge data-testid="notification-badge" className={`badge ${className}`} badgeContent={count > 99 ? "99+" : count} color="error">
      <IconButton aria-label={`Open notifications${count>0?` (${count} unread)`:''}`} onClick={onClick}>
        <NotificationsIcon />
      </IconButton>
    </Badge>
  );
}
