import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "tenant",
    tos_agreed: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    const value = field === "tos_agreed" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/signup", formData);
      localStorage.setItem("role", formData.role);
      navigate(`/onboarding/${formData.role}`);
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#121417",
        color: "#F3F4F6",
      }}
    >
      {/* Left: Logo */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1F2327",
        }}
      >
        <img
          src="/asset_anchor.png"
          alt="Asset Anchor Logo"
          style={{
            maxWidth: "400px",
            height: "auto",
            objectFit: "contain",
            padding: "2rem",
          }}
        />
      </Box>

      {/* Right: Signup Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
        }}
      >
        <Paper
          sx={{
            width: "100%",
            maxWidth: 400,
            p: 4,
            backgroundColor: "#1F2327",
            color: "#F3F4F6",
            textAlign: "center",
          }}
          elevation={6}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            AssetAncohor
          </Typography>
          <Typography variant="h6" gutterBottom>
            Sign Up
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Full Name"
              fullWidth
              required
              margin="normal"
              value={formData.full_name}
              onChange={handleChange("full_name")}
              InputProps={{ style: { color: "#F3F4F6" } }}
              InputLabelProps={{ style: { color: "#9CA3AF" } }}
            />

            <TextField
              label="Email"
              fullWidth
              required
              margin="normal"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              InputProps={{ style: { color: "#F3F4F6" } }}
              InputLabelProps={{ style: { color: "#9CA3AF" } }}
            />

            <TextField
              label="Password"
              fullWidth
              required
              margin="normal"
              type="password"
              value={formData.password}
              onChange={handleChange("password")}
              InputProps={{ style: { color: "#F3F4F6" } }}
              InputLabelProps={{ style: { color: "#9CA3AF" } }}
            />

            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
              <Button
                variant={formData.role === "landlord" ? "contained" : "outlined"}
                fullWidth
                sx={{ mr: 1 }}
                onClick={() => setFormData({ ...formData, role: "landlord" })}
              >
                Landlord
              </Button>
              <Button
                variant={formData.role === "tenant" ? "contained" : "outlined"}
                fullWidth
                sx={{ ml: 1 }}
                onClick={() => setFormData({ ...formData, role: "tenant" })}
              >
                Tenant
              </Button>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.tos_agreed}
                  onChange={handleChange("tos_agreed")}
                  sx={{ color: "#9CA3AF" }}
                />
              }
              label={
                <Typography sx={{ color: "#9CA3AF", fontSize: "0.875rem" }}>
                  I agree to the{" "}
                  <a href="/terms" style={{ color: "#3B82F6" }}>
                    Terms of Service
                  </a>
                </Typography>
              }
              sx={{ mt: 2, alignItems: "flex-start" }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading || !formData.tos_agreed}
              variant="contained"
              sx={{ mt: 3, backgroundColor: "#3B82F6", "&:hover": { backgroundColor: "#2563EB" } }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Continue"}
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}
