// frontend/src/auth/ForgotPassword.jsx
import React from "react";
import { TextField, Button, Typography, Box } from "@mui/material";

export default function ForgotPassword() {
  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8 }}>
      <Typography variant="h5" gutterBottom>
        Forgot Password
      </Typography>
      <form>
        <TextField label="Email" fullWidth margin="normal" />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Reset Password
        </Button>
      </form>
    </Box>
  );
}
