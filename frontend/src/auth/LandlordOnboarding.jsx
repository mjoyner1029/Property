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

  const handlePropertyChange = (i, field, value) => {
    const updated = [...properties];
    updated[i][field] = value;
    setProperties(updated);
  };

  const addProperty = () => {
    setProperties([...properties, { name: "", address: "", unit_count: "" }]);
  };

  const handleSubmit = async () => {
    const payload = { user_id, phone, company_name: company, properties };
    await axios.post("/api/onboard/landlord", payload);
    alert("Onboarding complete!");
  };

  const connectStripe = async () => {
    const res = await axios.post("/api/stripe/create-connect-account", { user_id });
    window.location.href = res.data.url;
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
      <Button onClick={handleSubmit} variant="contained" fullWidth sx={{ mt: 2 }}>Finish Onboarding</Button>
      <Button onClick={connectStripe} variant="outlined" fullWidth sx={{ mt: 2 }}>Connect Stripe</Button>
    </Box>
  );
}
