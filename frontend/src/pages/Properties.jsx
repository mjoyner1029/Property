// frontend/src/pages/Properties.jsx
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
  TablePagination,
} from "@mui/material";
import axios from "axios";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    axios.get("/api/properties")
      .then(res => setProperties(res.data))
      .catch(() => setError("Failed to load properties"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Properties</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>City</TableCell>
                <TableCell>State</TableCell>
                <TableCell>ZIP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.address}</TableCell>
                    <TableCell>{p.city}</TableCell>
                    <TableCell>{p.state}</TableCell>
                    <TableCell>{p.zip_code}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={properties.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
