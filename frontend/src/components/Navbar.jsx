// frontend/src/components/Navbar.jsx
import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { logout } from "../utils/auth";

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          PortfolioPilot
        </Typography>
        <Button color="inherit" onClick={logout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
