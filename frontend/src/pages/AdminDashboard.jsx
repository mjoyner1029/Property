import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [u, p, pay] = await Promise.all([
        axios.get("/api/admin/users"),
        axios.get("/api/admin/properties"),
        axios.get("/api/admin/payments"),
      ]);
      setUsers(u.data);
      setProperties(p.data);
      setPayments(pay.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeactivate = async (userId) => {
    await axios.post(`/api/admin/deactivate_user/${userId}`);
    fetchData();
  };

  const handleRefund = async (paymentId) => {
    try {
      await axios.post(`/api/payments/refund/${paymentId}`);
      alert("Refund issued");
      fetchData();
    } catch (err) {
      alert("Refund failed");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading admin data...</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Users Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <div className="bg-white rounded shadow p-4">
          <ul className="divide-y">
            {users.map((u) => (
              <li key={u.id} className="py-2 flex justify-between items-center">
                <span>{u.full_name} ({u.role})</span>
                <button
                  onClick={() => handleDeactivate(u.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  Deactivate
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Properties Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Properties</h2>
        <div className="bg-white rounded shadow p-4">
          <ul className="divide-y">
            {properties.map((p) => (
              <li key={p.id} className="py-2">
                <strong>{p.name}</strong> — {p.address}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Payments Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Payments</h2>
        <div className="bg-white rounded shadow p-4">
          <ul className="divide-y">
            {payments.map((p) => (
              <li key={p.id} className="py-2 flex justify-between items-center">
                <span>
                  User {p.user_id}: ${p.amount} — {p.status}
                </span>
                <button
                  onClick={() => handleRefund(p.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Refund
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
