import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");
    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password });
      setMessage("Password reset successful!");
    } catch {
      setError("Failed to reset password.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New password"
          className="w-full border p-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="w-full bg-blue-600 text-white py-2" type="submit">
          Reset Password
        </button>
        {message && <div className="text-green-600">{message}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
};

export default ResetPassword;