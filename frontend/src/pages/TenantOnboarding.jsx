import React, { useState } from 'react';

export default function TenantOnboarding() {
  const [form, setForm] = useState({
    phone: "",
    property_id: "",
    unit: "",
    lease_start: "",
    lease_end: "",
    monthly_rent: "",
    emergency_contact: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/onboard/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      setSuccess("Tenant onboarding complete!");
    } catch (err) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4">Tenant Onboarding</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <input
          name="property_id"
          placeholder="Property ID or Invite Code"
          value={form.property_id}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <input
          name="unit"
          placeholder="Unit Number"
          value={form.unit}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <input
          name="lease_start"
          type="date"
          placeholder="Lease Start"
          value={form.lease_start}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <input
          name="lease_end"
          type="date"
          placeholder="Lease End"
          value={form.lease_end}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <input
          name="monthly_rent"
          type="number"
          placeholder="Monthly Rent"
          value={form.monthly_rent}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <input
          name="emergency_contact"
          placeholder="Emergency Contact (optional)"
          value={form.emergency_contact}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        {success && <p className="text-green-600 mt-2">{success}</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
}