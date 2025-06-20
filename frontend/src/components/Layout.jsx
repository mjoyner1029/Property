// frontend/src/auth/Login.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/login", {
        email,
        password,
        role,
      });

      const token = res.data.access_token;
      const user = res.data.user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error", err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#121417",
        color: "#F3F4F6",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Paper
        sx={{
          width: 360,
          p: 4,
          textAlign: "center",
          backgroundColor: "#1F2327",
          color: "#F3F4F6",
        }}
        elevation={6}
      >
        <img
          src="/logo.png"
          alt="Portfolio Pilot Logo"
          style={{ width: "150px", marginBottom: "1rem" }}
        />

        <Typography variant="h5" gutterBottom>
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          InputProps={{ style: { color: "#F3F4F6" } }}
          InputLabelProps={{ style: { color: "#9CA3AF" } }}
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          InputProps={{ style: { color: "#F3F4F6" } }}
          InputLabelProps={{ style: { color: "#9CA3AF" } }}
        />

        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
          <Button
            variant={role === "landlord" ? "contained" : "outlined"}
            color="primary"
            fullWidth
            sx={{ mr: 1 }}
            onClick={() => setRole("landlord")}
          >
            Landlord
          </Button>
          <Button
            variant={role === "tenant" ? "contained" : "outlined"}
            color="primary"
            fullWidth
            sx={{ ml: 1 }}
            onClick={() => setRole("tenant")}
          >
            Tenant
          </Button>
        </Box>

        <Button
          fullWidth
          disabled={loading}
          variant="contained"
          sx={{ mt: 3, backgroundColor: "#3B82F6", "&:hover": { backgroundColor: "#2563EB" } }}
          onClick={handleLogin}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : "Log In"}
        </Button>
      </Paper>
    </Box>
  );
}
