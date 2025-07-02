import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const JoinProperty = () => {
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleSubmit = async () => {
    setSuccess("");
    setError("");
    try {
      await axios.post(`/api/properties/invite/${code}`, {
        user_id: user.id,
      });
      setSuccess("Successfully joined!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to join property.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Join Property</h1>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter invite code"
        className="border px-3 py-2 rounded w-full mb-2"
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded"
      >
        Join
      </button>
      {success && <div className="mt-2 text-green-600">{success}</div>}
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  );
};

export default JoinProperty;