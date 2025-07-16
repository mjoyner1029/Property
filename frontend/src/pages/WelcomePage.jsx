import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Container, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Start redirect timer
    const redirectTimer = setTimeout(() => {
      if (user) {
        if (user.role === "landlord") {
          navigate("/dashboard");
        } else if (user.role === "tenant") {
          navigate("/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/login");
      }
    }, 5000);

    // Update countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    // Cleanup timers on unmount
    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownTimer);
    };
  }, [navigate, user]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 3,
            boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
            width: "100%",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            gutterBottom
            align="center"
          >
            Welcome to Asset Anchor
          </Typography>

          <Box
            sx={{
              my: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Redirecting in {countdown} seconds...
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
          >
            You'll be redirected to your dashboard automatically. If not, please
            click{" "}
            <Box
              component="span"
              onClick={() => navigate("/dashboard")}
              sx={{
                color: "primary.main",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              here
            </Box>
            .
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default WelcomePage;