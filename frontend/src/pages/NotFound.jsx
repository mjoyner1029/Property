import React from "react";
import { Link } from "react-router-dom";

export default function NotFound(){
  return (
    <div>
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/">
        <button>Back to Home</button>
      </Link>
    </div>
  );
}