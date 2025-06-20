// frontend/src/pages/Maintenance.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
} from "@mui/material";
import axios from "axios";

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/maintenance")
      .then(res => setRequests(res.data))
      .catch(() => setError("Failed to load maintenance requests"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Maintenance Requests</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper sx={{ mt: 2 }}>
          <List>
            {requests.map((req) => (
              <ListItem key={req.id}>
                <ListItemText
                  primary={req.title}
                  secondary={`${req.description} – Status: ${req.status}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
