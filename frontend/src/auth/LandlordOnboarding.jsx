import React, { useState } from "react";
import { Box, Button, TextField, Typography, IconButton, Paper } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function LandlordOnboarding() {
  const [params] = useSearchParams();
  const user_id = params.get("user_id");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [properties, setProperties] = useState([{ name: "", address: "", unit_count: "" }]);
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePropertyChange = (i, field, value) => {
    const updated = [...properties];
    updated[i][field] = value;
    setProperties(updated);
  };

  const addProperty = () => {
    setProperties([...properties, { name: "", address: "", unit_count: "" }]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = { user_id, phone, company_name: company, properties };
      await axios.post("/api/onboard/landlord", payload);
      setSuccess("Onboarding complete!");
    } catch (err) {
      setError("Failed to complete onboarding.");
    }
    setLoading(false);
  };

  const connectStripe = async () => {
    setStripeLoading(true);
    setError("");
    try {
      // Use the correct endpoint and payload for your backend
      const res = await axios.post("/api/stripe/create-connect-link", { email: params.get("email") });
      window.location.href = res.data.url;
    } catch (err) {
      setError("Failed to connect Stripe.");
    }
    setStripeLoading(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto", color: "white" }}>
      <Typography variant="h5" gutterBottom>Landlord Onboarding</Typography>
      <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} margin="normal" />
      <TextField fullWidth label="Company Name (optional)" value={company} onChange={(e) => setCompany(e.target.value)} margin="normal" />

      {properties.map((prop, i) => (
        <Paper key={i} sx={{ p: 2, mt: 2 }}>
          <Typography>Property #{i + 1}</Typography>
          <TextField fullWidth label="Property Name" value={prop.name} onChange={(e) => handlePropertyChange(i, "name", e.target.value)} margin="normal" />
          <TextField fullWidth label="Address" value={prop.address} onChange={(e) => handlePropertyChange(i, "address", e.target.value)} margin="normal" />
          <TextField fullWidth label="Unit Count" type="number" value={prop.unit_count} onChange={(e) => handlePropertyChange(i, "unit_count", e.target.value)} margin="normal" />
        </Paper>
      ))}

      <Button onClick={addProperty} sx={{ mt: 2 }}>+ Add Another Property</Button>
      <Button onClick={handleSubmit} variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
        {loading ? "Submitting..." : "Finish Onboarding"}
      </Button>
      <Button onClick={connectStripe} variant="outlined" fullWidth sx={{ mt: 2 }} disabled={stripeLoading}>
        {stripeLoading ? "Connecting..." : "Connect Stripe"}
      </Button>
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      {success && <Typography color="success.main" sx={{ mt: 2 }}>{success}</Typography>}
    </Box>
  );
}
