import React, { useState } from "react";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function TenantOnboarding() {
  const [params] = useSearchParams();
  const user_id = params.get("user_id");
  const [form, setForm] = useState({
    phone: "",
    property_id: "",
    unit: "",
    lease_start: "",
    lease_end: "",
    monthly_rent: "",
    emergency_contact: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.post("/api/onboard/tenant", { user_id, ...form });
      setSuccess("Tenant onboarding complete!");
    } catch (err) {
      setError("Failed to complete onboarding.");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto", color: "white" }}>
      <Typography variant="h5" gutterBottom>Tenant Onboarding</Typography>
      <TextField fullWidth name="phone" label="Phone" onChange={handleChange} margin="normal" />
      <TextField fullWidth name="property_id" label="Property ID or Invite Code" onChange={handleChange} margin="normal" />
      <TextField fullWidth name="unit" label="Unit Number" onChange={handleChange} margin="normal" />
      <TextField fullWidth name="lease_start" label="Lease Start" type="date" InputLabelProps={{ shrink: true }} onChange={handleChange} margin="normal" />
      <TextField fullWidth name="lease_end" label="Lease End" type="date" InputLabelProps={{ shrink: true }} onChange={handleChange} margin="normal" />
      <TextField fullWidth name="monthly_rent" label="Monthly Rent" type="number" onChange={handleChange} margin="normal" />
      <TextField fullWidth name="emergency_contact" label="Emergency Contact (optional)" onChange={handleChange} margin="normal" />
      <Button onClick={handleSubmit} variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
        {loading ? "Submitting..." : "Finish Onboarding"}
      </Button>
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
