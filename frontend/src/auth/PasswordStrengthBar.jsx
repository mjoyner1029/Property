import React from "react";
import zxcvbn from "zxcvbn";
import { LinearProgress, Box, Typography } from "@mui/material";

const strengthLabels = ["Too Weak", "Weak", "Fair", "Good", "Strong"];

export default function PasswordStrengthBar({ password }) {
  const score = zxcvbn(password).score;

  return (
    <Box sx={{ mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={(score + 1) * 20}
        color={score < 2 ? "error" : score < 4 ? "warning" : "success"}
      />
      <Typography variant="caption" sx={{ color: "white" }}>
        {strengthLabels[score]}
      </Typography>
    </Box>
  );
}
