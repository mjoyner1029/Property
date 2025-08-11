import React, { useState } from "react";
import axios from "axios";

const ResendVerification = ({ email }) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    setMessage(""); setError("");
    try {
      await axios.post("/api/auth/resend-verification", { email });
      setMessage("Verification email resent!");
    } catch {
      setError("Failed to resend verification email.");
    }
  };

  return (
    <div>
      <button onClick={handleResend} className="text-blue-600 underline">
        Resend Verification Email
      </button>
      {message && <div className="text-green-600">{message}</div>}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
};

export default ResendVerification;