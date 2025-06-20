import React, { useState } from 'react';
import PasswordStrengthBar from '../components/PasswordStrengthBar';

const Signup = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'tenant',
    tosAgreed: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // submit logic here
    console.log('Submitting signup form', form);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Strength Meter */}
        <PasswordStrengthBar password={form.password} />

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Role:</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="border p-1 rounded"
          >
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="tosAgreed"
            checked={form.tosAgreed}
            onChange={handleChange}
          />
          <label className="text-sm">
            I agree to the Terms of Service and Privacy Policy
          </label>
        </div>

        <button
          type="submit"
          disabled={!form.tosAgreed}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;
