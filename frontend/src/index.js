import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Import CSS
import App from "./App";

// Check which entry point to use
if (process.env.REACT_APP_DEMO_MODE === '1') {
  // Import the demo entry point
  import('./demo-entry');
} else if (process.env.REACT_APP_ENTRY === 'dev') {
  // Import the development entry point
  import('./dev');
} else {
  // Standard application rendering
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
