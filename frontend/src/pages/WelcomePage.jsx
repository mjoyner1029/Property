import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // Update path if needed

// Assume you have a way to get the user's role, e.g. from context or localStorage
import { useAuth } from "../context/AuthContext"; // adjust import as needed

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // user.role should be 'tenant' or 'landlord'

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === "landlord") {
        navigate("/landlord/dashboard");
      } else if (user?.role === "tenant") {
        navigate("/tenant/dashboard");
      } else {
        navigate("/dashboard"); // fallback
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
      bgcolor="#f5f7fa"
    >
      <img
        src={logo}
        alt="Asset Anchor logo"
        style={{ width: 120, marginBottom: 32 }}
      />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome to Asset Anchor
      </Typography>
    </Box>
  );
};

export default WelcomePage;