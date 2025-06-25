import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const JoinProperty = () => {
  const [code, setCode] = useState("");
  const { user } = useAuth();

  const handleSubmit = async () => {
    await axios.post(`/api/properties/invite/${code}`, {
      user_id: user.id,
    });
    alert("Successfully joined!");
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Join Property</h1>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter invite code" />
      <button onClick={handleSubmit} className="ml-2 bg-red-600 text-white px-4 py-1 rounded">Join</button>
    </div>
  );
};

export default JoinProperty;