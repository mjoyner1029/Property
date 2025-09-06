import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css"; // Import CSS
import App from "./App";

console.log('[Index.js] Starting Asset Anchor Property Management Dashboard...');

// Standard application rendering
const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  console.error('[Index.js] Root container not found!');
}
