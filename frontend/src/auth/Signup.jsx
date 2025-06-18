// frontend/src/auth/Signup.jsx
import React, { useState } from "react";
import { TextField, Button, Typography, Box, MenuItem } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("tenant");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/auth/signup", { email, password, role });
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8 }}>
      <Typography variant="h5" gutterBottom>
        Sign Up
      </Typography>
      <form onSubmit={handleSignup}>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Role"
          select
          fullWidth
          margin="normal"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <MenuItem value="tenant">Tenant</MenuItem>
          <MenuItem value="landlord">Landlord</MenuItem>
        </TextField>
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Sign Up
        </Button>
      </form>
    </Box>
  );
}
