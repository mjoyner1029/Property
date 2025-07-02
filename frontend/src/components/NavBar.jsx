import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => (
  <nav className="bg-sidebar text-textPrimary px-4 py-3 flex gap-6 items-center">
    <Link to="/" className="font-bold text-lg">PropertyPilot</Link>
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/properties">Properties</Link>
    <Link to="/pay">Payments</Link>
    <Link to="/maintenance">Maintenance</Link>
    <Link to="/tenants">Tenants</Link>
    <Link to="/notifications">Notifications</Link>
    <Link to="/profile">Profile</Link>
    <Link to="/settings">Settings</Link>
    <Link to="/support">Support</Link>
  </nav>
);

export default NavBar;