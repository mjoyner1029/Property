// frontend/src/pages/Profile.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Alert,
  Avatar,
  Stack,
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import { Layout, PageHeader } from "../components";
import { useApp } from "../context";
import { useAuth } from "../context/AuthContext";

function normalizeUser(u) {
  if (!u) return {};
  const full =
    u.full_name ||
    u.name ||
    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
    "";
  return {
    id: u.id,
    role: u.role,
    email: u.email || "",
    full_name: full,
    name: u.name || full, // Also preserve the name field
  };
}
function initials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const letters = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return letters.toUpperCase();
}
function validEmail(v) {
  // Simple but effective email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function Profile() {
  const { updatePageTitle } = useApp();
  const auth = useAuth() || {};
  const { user: ctxUser, updateProfile, setUser: setCtxUser, refreshUser } = auth;

  console.log('🔍 Profile component render:', {
    auth: !!auth,
    ctxUser: ctxUser,
    hasUpdateProfile: typeof updateProfile === 'function',
    hasSetUser: typeof setCtxUser === 'function',
    hasRefreshUser: typeof refreshUser === 'function'
  });

  // Seed from context first, fallback to localStorage for SSR/first load
  const bootstrapUser = useMemo(() => {
    const ls = JSON.parse(localStorage.getItem("user") || "{}");
    const result = normalizeUser(ctxUser || ls);
    console.log('🔍 Bootstrap user data:', { ctxUser, ls, result });
    return result;
  }, [ctxUser]);

  const [name, setName] = useState(bootstrapUser.full_name || "");
  const [email, setEmail] = useState(bootstrapUser.email || "");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    updatePageTitle("My Profile");
  }, [updatePageTitle]);

  // Keep local state in sync if context user changes (e.g., after refresh)
  useEffect(() => {
    setName(bootstrapUser.full_name || "");
    setEmail(bootstrapUser.email || "");
  }, [bootstrapUser.full_name, bootstrapUser.email]);

  const formChanged =
    (bootstrapUser.full_name || "") !== name || (bootstrapUser.email || "") !== email;

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!validEmail(email.trim())) e.email = "Enter a valid email address";
    return e;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    setLoading(true);
    try {
      const payload = { full_name: name.trim(), email: email.trim() };

      // Prefer an auth-context updater if available
      if (typeof updateProfile === "function") {
        await updateProfile(payload);
        // Optionally re-fetch fresh user data if the context supports it
        if (typeof refreshUser === "function") {
          await refreshUser();
        }
      } else {
        // Fallback to localStorage for a standalone frontend
        const current = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...current, full_name: payload.full_name, email: payload.email };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        if (typeof setCtxUser === "function") {
          setCtxUser(updatedUser);
        }
      }

      setSuccessMsg("Profile updated successfully.");
    } catch (err) {
      // Show a friendly message
      setErrorMsg(err?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName(bootstrapUser.full_name || "");
    setEmail(bootstrapUser.email || "");
    setErrors({});
    setSuccessMsg("");
    setErrorMsg("");
  };

  const avatarContent = initials(name);
  const roleLabel = bootstrapUser.role
    ? bootstrapUser.role.charAt(0).toUpperCase() + bootstrapUser.role.slice(1)
    : "User";

  return (
    <Layout>
      <PageHeader
        title="My Profile"
        breadcrumbs={[{ text: "Dashboard", link: "/" }, { text: "Profile" }]}
      />

      <Container maxWidth="sm" sx={{ pb: 6 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "primary.main",
                mb: 2,
                fontSize: 28,
              }}
            >
              {avatarContent ? avatarContent : <PersonIcon fontSize="large" />}
            </Avatar>
            <Typography variant="h6">{name || "Your Name"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {roleLabel}
            </Typography>
          </Box>

          {successMsg && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMsg}
            </Alert>
          )}
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSave} noValidate>
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              margin="normal"
              fullWidth
              required
              error={Boolean(errors.name)}
              helperText={errors.name}
              inputProps={{ maxLength: 100 }}
            />

            <TextField
              label="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              margin="normal"
              fullWidth
              required
              type="email"
              error={Boolean(errors.email)}
              helperText={errors.email}
              inputProps={{ maxLength: 120 }}
              sx={{ mb: 2 }}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !formChanged}
                sx={{ py: 1.4, borderRadius: 2 }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={handleReset}
                disabled={loading || !formChanged}
                sx={{ py: 1.4, borderRadius: 2 }}
              >
                Reset
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
}
