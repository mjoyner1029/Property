// frontend/src/components/LoadingSpinner.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Backdrop,
} from "@mui/material";

/**
 * LoadingSpinner
 *
 * Props:
 * - variant: "circular" | "linear" (default "circular")
 * - label: optional text under/over the spinner
 * - size: CircularProgress size (default 40)
 * - thickness: CircularProgress thickness (default 4)
 * - fullPage: render with Backdrop that covers the whole screen (default false)
 * - overlay: render as absolute overlay over parent (default false)
 * - delayMs: delay before showing spinner (avoid flash), default 0
 * - height: container height when not fullPage/overlay (default "100%")
 * - sx: MUI sx for the container
 * - labelPlacement: "below" | "above" (default "below")
 * - linearProps: props passed to LinearProgress when variant="linear"
 * - spinnerProps: props passed to CircularProgress when variant="circular"
 */
const LoadingSpinner = ({
  variant = "circular",
  label,
  size = 40,
  thickness = 4,
  fullPage = false,
  overlay = false,
  delayMs = 0,
  height = "100%",
  sx,
  labelPlacement = "below",
  linearProps,
  spinnerProps,
  ...boxProps
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return;
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (!visible) return null;

  // Common spinner content
  const SpinnerContent =
    variant === "linear" ? (
      <Box sx={{ width: "100%" }}>
        <LinearProgress {...linearProps} />
        {label && labelPlacement === "below" && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1, textAlign: "center" }}
          >
            {label}
          </Typography>
        )}
      </Box>
    ) : (
      <Box
        sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {label && labelPlacement === "above" && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            {label}
          </Typography>
        )}
        <CircularProgress size={size} thickness={thickness} color="primary" {...spinnerProps} />
        {label && labelPlacement === "below" && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {label}
          </Typography>
        )}
      </Box>
    );

  // Full-page Backdrop
  if (fullPage) {
    return (
      <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
        {SpinnerContent}
      </Backdrop>
    );
  }

  // Absolute overlay over parent
  if (overlay) {
    return (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(1px)",
          ...sx,
        }}
        {...boxProps}
      >
        {SpinnerContent}
      </Box>
    );
  }

  // Inline centered container (default)
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height,
        ...sx,
      }}
      {...boxProps}
    >
      {SpinnerContent}
    </Box>
  );
};

export default LoadingSpinner;
