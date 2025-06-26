import React, { useState } from "react";
import { TextField, Button, Typography } from "@mui/material";
import axios from "axios";

export default function InviteTenant() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");

  const handleInvite = async () => {
    const res = await axios.post("/api/invite/tenant", {
      email,
      landlord_id: JSON.parse(localStorage.getItem("user")).id
    });
    setSuccess(res.data.message);
  };

  return (
    <div>
      <Typography variant="h5">Invite Tenant</Typography>
      <TextField label="Tenant Email" value={email} onChange={e => setEmail(e.target.value)} />
      <Button onClick={handleInvite}>Send Invite</Button>
      {success && <p>{success}</p>}
    </div>
  );
}
