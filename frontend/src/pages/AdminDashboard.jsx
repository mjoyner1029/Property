// frontend/src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [u, p, pay] = await Promise.all([
        axios.get("/api/admin/users"),
        axios.get("/api/admin/properties"),
        axios.get("/api/admin/payments"),
      ]);
      setUsers(u.data);
      setProperties(p.data);
      setPayments(pay.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold">Users ({users.length})</h2>
          <ul>{users.map((u) => <li key={u.id}>{u.full_name} - {u.role}</li>)}</ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold">Properties ({properties.length})</h2>
          <ul>{properties.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold">Payments ({payments.length})</h2>
          <ul>{payments.map((p) => <li key={p.id}>User {p.user_id} - ${p.amount}</li>)}</ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;