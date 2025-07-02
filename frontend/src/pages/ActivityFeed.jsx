import React, { useEffect, useState } from "react";
import axios from "axios";

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // TODO: Replace with your real API endpoint
    axios.get("/api/activity").then(res => setActivities(res.data || []));
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4">Activity Feed</h2>
      <ul className="space-y-2">
        {activities.length === 0 && <li>No recent activity.</li>}
        {activities.map((a, i) => (
          <li key={i} className="bg-gray-100 p-2 rounded">
            <span className="font-bold">{a.action}</span> — {a.detail} <span className="text-xs text-gray-500">{a.timestamp}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityFeed;