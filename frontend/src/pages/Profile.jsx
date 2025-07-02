import React, { useState } from "react";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [name, setName] = useState(user.full_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [message, setMessage] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: Add API call to update profile
    setMessage("Profile updated (not really, demo only)");
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <input
          aria-label="Full Name"
          className="w-full border p-2"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full Name"
        />
        <input
          aria-label="Email"
          className="w-full border p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />
        <button className="w-full bg-blue-600 text-white py-2" type="submit">
          Save
        </button>
        {message && <div className="text-green-600">{message}</div>}
      </form>
    </div>
  );
};

export default Profile;