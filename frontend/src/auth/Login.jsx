// frontend/src/auth/Login.testjsx
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
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use test-login endpoint for demo purposes
      console.log('Attempting login with:', { email, password, role });
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';
      console.log('Backend URL:', baseUrl);
      
      const res = await axios.post(`${baseUrl}/auth/test-login`, { email, password, role });
      console.log('Login response:', res.data);
      
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
      
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError("Login failed: " + err.response.data.error);
      } else {
        setError("Login failed: " + (err.message || "Invalid credentials"));
      }
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
      {/* Left side with image/logo */}
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
            maxWidth: "400%",
            maxHeight: "700px",
            height: "auto",
            width: "auto",
            objectFit: "contain",
            padding: "2rem",
          }}
        />
      </Box>

      {/* Right side login form */}
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
            Asset Anchor
          </Typography>
          <Typography variant="h6" gutterBottom>
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              label="Email"
              fullWidth
              type="email"
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{ style: { color: "#F3F4F6" } }}
              InputLabelProps={{ style: { color: "#9CA3AF" } }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              type="submit"
              fullWidth
              disabled={loading}
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: "#3B82F6",
                "&:hover": { backgroundColor: "#2563EB" },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Log In"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 3 }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#3B82F6", textDecoration: "none" }}>
              Sign up
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>   
  );  
}
