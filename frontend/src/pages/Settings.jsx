import React from "react";

const Settings = () => (
  <div className="max-w-md mx-auto mt-10">
    <h2 className="text-2xl font-semibold mb-4">Settings</h2>
    <div className="space-y-4">
      <div>
        <label className="block font-medium">Notification Preferences</label>
        <input type="checkbox" id="email" /> <label htmlFor="email">Email Notifications</label>
      </div>
      <div>
        <label className="block font-medium">Change Password</label>
        <input className="w-full border p-2 mb-2" type="password" placeholder="New Password" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Change Password</button>
      </div>
    </div>
  </div>
);

export default Settings;