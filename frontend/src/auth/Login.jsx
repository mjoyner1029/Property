// frontend/src/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Box } from "@mui/material";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8 }}>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>
      <form onSubmit={handleLogin}>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          fullWidth
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Log In
        </Button>
      </form>
    </Box>
  );
}
