// frontend/src/pages/PayPortal.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import axios from "axios";

export default function PayPortal() {
  const [myPayments, setMyPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/payments") // optionally filter on backend by tenant ID
      .then(res => setMyPayments(res.data))
      .catch(() => setError("Unable to load your payments"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">My Payment Portal</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : myPayments.length === 0 ? (
        <Typography>No payments found.</Typography>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Paid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>${p.amount}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>{p.due_date}</TableCell>
                  <TableCell>{p.paid_date || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
