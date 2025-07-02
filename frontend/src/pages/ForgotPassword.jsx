import React, { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setMessage("Password reset email sent!");
    } catch {
      setError("Failed to send reset email.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Your email"
          className="w-full border p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button className="w-full bg-blue-600 text-white py-2" type="submit">
          Send Reset Link
        </button>
        {message && <div className="text-green-600">{message}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
};

export default ForgotPassword;