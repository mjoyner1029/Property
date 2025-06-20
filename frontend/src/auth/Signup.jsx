import React, { useState } from "react";
import { Box, Button, TextField, Typography, Checkbox, FormControlLabel, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PasswordStrengthBar from "../components/PasswordStrengthBar";

export default function Signup() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "tenant" });
  const [tos, setTos] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tos) return setError("You must agree to the Terms of Service");
    try {
      const res = await axios.post("/api/auth/signup", form);
      const { user_id, role } = res.data;
      navigate(`/onboarding/${role}?user_id=${user_id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 3, background: "#1F2327", color: "white", borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Sign Up</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField name="full_name" label="Full Name" fullWidth required onChange={handleChange} margin="normal" />
        <TextField name="email" label="Email" fullWidth required onChange={handleChange} margin="normal" />
        <TextField name="password" label="Password" type="password" fullWidth required onChange={handleChange} margin="normal" />
        <PasswordStrengthBar password={form.password} />
        <Box sx={{ display: "flex", mt: 2, gap: 2 }}>
          <Button variant={form.role === "landlord" ? "contained" : "outlined"} onClick={() => setForm({ ...form, role: "landlord" })}>Landlord</Button>
          <Button variant={form.role === "tenant" ? "contained" : "outlined"} onClick={() => setForm({ ...form, role: "tenant" })}>Tenant</Button>
        </Box>
        <FormControlLabel
          control={<Checkbox checked={tos} onChange={(e) => setTos(e.target.checked)} />}
          label="I agree to the Terms of Service & Privacy Policy"
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Create Account</Button>
      </form>
    </Box>
  );
}
