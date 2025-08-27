import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Import CSS
import App from "./App";

// Check if we should use the development entry point
if (process.env.REACT_APP_ENTRY === 'dev') {
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
