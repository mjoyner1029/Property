// frontend/src/pages/Tenants.jsx
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
  Container,
  TableContainer,
  Button,
  TextField,
  InputAdornment
} from "@mui/material";
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon
} from "@mui/icons-material";
import axios from "axios";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.get("/api/tenants")
      .then(res => setTenants(res.data))
      .catch(() => setError("Failed to load tenants"))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page when searching
  };

  const filteredTenants = tenants.filter(tenant => 
    tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Tenants
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
            sx={{ 
              width: { xs: '100%', sm: 300 },
              "& .MuiOutlinedInput-root": {
                backgroundColor: 'background.paper',
              }
            }}
            size="small"
          />
          
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            sx={{ 
              display: { xs: 'none', sm: 'flex' },
              borderRadius: 2
            }}
          >
            Add Tenant
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : filteredTenants.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No tenants found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {searchTerm ? "Try a different search term" : "Add your first tenant to get started"}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<PersonAddIcon />}
              sx={{ mt: 3, borderRadius: 2 }}
            >
              Add Tenant
            </Button>
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.paperAlt' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Property</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Lease End</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTenants
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((tenant) => (
                    <TableRow 
                      key={tenant.id}
                      hover
                      sx={{ 
                        cursor: 'pointer',
                        '&:last-child td, &:last-child th': { border: 0 } 
                      }}
                      onClick={() => {/* Handle row click */}}
                    >
                      <TableCell>{tenant.name}</TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>{tenant.phone}</TableCell>
                      <TableCell>{tenant.property || 'N/A'}</TableCell>
                      <TableCell>{tenant.unit || 'N/A'}</TableCell>
                      <TableCell>
                        {tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredTenants.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </TableContainer>
        )}
        
        {/* Mobile add button (only visible on small screens) */}
        <Box sx={{ position: 'fixed', right: 16, bottom: 16, display: { xs: 'block', sm: 'none' } }}>
          <Button
            variant="contained"
            sx={{ 
              borderRadius: '50%', 
              minWidth: 'auto', 
              width: 56, 
              height: 56,
              boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)'
            }}
          >
            <PersonAddIcon />
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
