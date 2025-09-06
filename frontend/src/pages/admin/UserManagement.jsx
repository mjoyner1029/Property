// frontend/src/pages/admin/UserManagement.jsx
import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  useMediaQuery,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth, useApp } from "../../context";
import { PageHeader } from "../../components";

// Mock user data
const MOCK_USERS = [
  {
    id: 1,
    name: "Test Admin",
    email: "admin@example.com",
    role: "admin",
    isActive: true,
    lastLogin: "2025-09-05T14:30:00Z",
    createdAt: "2025-08-01T10:00:00Z",
  },
  {
    id: 2,
    name: "Test Landlord",
    email: "landlord@example.com",
    role: "landlord",
    isActive: true,
    lastLogin: "2025-09-05T12:15:00Z",
    createdAt: "2025-08-15T09:30:00Z",
  },
  {
    id: 3,
    name: "Test Tenant",
    email: "tenant@example.com",
    role: "tenant",
    isActive: true,
    lastLogin: "2025-09-05T11:45:00Z",
    createdAt: "2025-08-20T14:20:00Z",
  },
  {
    id: 4,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    role: "tenant",
    isActive: true,
    lastLogin: "2025-09-04T16:20:00Z",
    createdAt: "2025-09-01T11:15:00Z",
  },
  {
    id: 5,
    name: "Mike Chen",
    email: "mike.chen@email.com",
    role: "landlord",
    isActive: false,
    lastLogin: "2025-09-02T08:30:00Z",
    createdAt: "2025-08-25T13:45:00Z",
  },
];

export default function UserManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updatePageTitle } = useApp();

  const [users, setUsers] = useState(MOCK_USERS);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    updatePageTitle("User Management");
  }, [updatePageTitle]);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setOpenDialog(true);
  };

  const handleCreateUser = () => {
    setEditingUser({
      id: null,
      name: "",
      email: "",
      role: "tenant",
      isActive: true,
    });
    setOpenDialog(true);
  };

  const handleSaveUser = () => {
    if (editingUser.id) {
      // Update existing user
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    } else {
      // Create new user
      const newUser = {
        ...editingUser,
        id: Math.max(...users.map(u => u.id)) + 1,
        lastLogin: null,
        createdAt: new Date().toISOString(),
      };
      setUsers([...users, newUser]);
    }
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error";
      case "landlord":
        return "primary";
      case "tenant":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
      <PageHeader
        title="User Management"
        subtitle="Manage users, roles, and permissions"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        }
      />

      <Grid container spacing={3}>
        {/* User Stats */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Typography variant="h4" fontWeight={600} color="primary.main">
              {users.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Users
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Typography variant="h4" fontWeight={600} color="success.main">
              {users.filter(u => u.isActive).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Users
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: "center", p: 2 }}>
            <Typography variant="h4" fontWeight={600} color="warning.main">
              {users.filter(u => !u.isActive).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inactive Users
            </Typography>
          </Card>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Role"
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="landlord">Landlord</MenuItem>
                    <MenuItem value="tenant">Tenant</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Users Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={500} gutterBottom>
                Users ({filteredUsers.length})
              </Typography>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell>{userData.name}</TableCell>
                        <TableCell>{userData.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={userData.role}
                            color={getRoleColor(userData.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={userData.isActive ? "Active" : "Inactive"}
                            color={userData.isActive ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(userData.lastLogin)}</TableCell>
                        <TableCell>{formatDate(userData.createdAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(userData)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(userData.id)}
                            disabled={userData.id === user?.id} // Can't delete self
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit/Create User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser?.id ? "Edit User" : "Create New User"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={editingUser?.name || ""}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={editingUser?.email || ""}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editingUser?.role || "tenant"}
                label="Role"
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="landlord">Landlord</MenuItem>
                <MenuItem value="tenant">Tenant</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editingUser?.isActive || false}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {editingUser?.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
