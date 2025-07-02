import React, { useState } from "react";
import { TextField, Button, Typography, Alert, Box } from "@mui/material";
import axios from "axios";

export default function InviteTenant() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleInvite = async () => {
    setSuccess("");
    setError("");
    try {
      const res = await axios.post("/api/invite/tenant", {
        email,
        landlord_id: JSON.parse(localStorage.getItem("user")).id
      });
      setSuccess(res.data.message || "Invite sent!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send invite.");
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 6, p: 3, background: "#fff", borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Invite Tenant</Typography>
      <TextField
        label="Tenant Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" onClick={handleInvite} fullWidth sx={{ mt: 2 }}>
        Send Invite
      </Button>
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
