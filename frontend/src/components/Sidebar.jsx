// frontend/src/components/Sidebar.jsx
import React from "react";
import { Drawer, List, ListItem, ListItemText } from "@mui/material";
import { useNavigate } from "react-router-dom";

const items = [
  { text: "Dashboard", path: "/dashboard" },
  { text: "Properties", path: "/properties" },
  { text: "Tenants", path: "/tenants" },
  { text: "Payments", path: "/payments" },
  { text: "Maintenance", path: "/maintenance" },
  { text: "Pay Portal", path: "/pay" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <Drawer variant="permanent" anchor="left">
      <List>
        {items.map((item) => (
          <ListItem button key={item.text} onClick={() => navigate(item.path)}>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
