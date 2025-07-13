// frontend/src/pages/Dashboard.jsx
import React from "react";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome to Asset Anchor</h1>
      <p>
        Logged in as: <strong>{user.full_name}</strong> ({user.role})
      </p>

      {user.role === "landlord" && (
        <div>
          <h2>Landlord Dashboard</h2>
          <ul>
            <li>Manage Properties</li>
            <li>View Payments</li>
            <li>Tenant Activity</li>
          </ul>
        </div>
      )}

      {user.role === "tenant" && (
        <div>
          <h2>Tenant Dashboard</h2>
          <ul>
            <li>Pay Rent</li>
            <li>View Lease</li>
            <li>Submit Maintenance</li>
          </ul>
        </div>
      )}
    </div>
  );
}
