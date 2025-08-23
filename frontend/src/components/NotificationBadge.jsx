// frontend/src/components/NotificationBadge.jsx
import React from "react";
import { Badge, IconButton, Tooltip, Box } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

/**
 * NotificationBadge
 *
 * Props:
 * - count: number of unread notifications
 * - maxCount: cap the displayed number (default 99)
 * - onClick: click handler (opens notifications panel, etc.)
 * - children: optional element to wrap (icon, avatar, etc.). If not provided, renders a bell icon.
 * - color: MUI color for the badge (default "error")
 * - overlap: "circular" | "rectangular" (default "circular")
 * - anchorOrigin: MUI anchor origin for badge position
 * - className: optional className applied to the clickable wrapper
 * - sx: MUI system sx for the wrapper
 * - tooltip: text shown on hover (default "Notifications")
 */
const NotificationBadge = ({
  count = 0,
  maxCount = 99,
  onClick,
  children,
  color = "error",
  overlap = "circular",
  anchorOrigin = { vertical: "top", horizontal: "right" },
  className = "",
  sx,
  tooltip = "Notifications",
  ...rest
}) => {
  const showBadge = Number(count) > 0;
  const ariaLabel =
    showBadge ? `Open notifications (${Math.min(count, maxCount)} unread)` : "Open notifications";

  const content = children ? (
    <Box
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(e);
        }
      }}
      className={className}
      sx={{ display: "inline-flex", ...sx }}
      aria-label={ariaLabel}
    >
      {children}
    </Box>
  ) : (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      sx={sx}
      size="medium"
    >
      <NotificationsIcon />
    </IconButton>
  );

  return (
    <Tooltip title={tooltip}>
      <Badge
        data-testid="notification-badge"
        badgeContent={Math.min(count, maxCount)}
        color={color}
        max={maxCount}
        overlap={overlap}
        anchorOrigin={anchorOrigin}
        invisible={!showBadge}
        {...rest}
      >
        {content}
      </Badge>
    </Tooltip>
  );
};

export default NotificationBadge;
