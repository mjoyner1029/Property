import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <h1 className="text-3xl font-bold mb-4">Unauthorized</h1>
    <p className="mb-4">You do not have permission to view this page.</p>
    <Link to="/" className="text-blue-600 underline">Go Home</Link>
  </div>
);

export default Unauthorized;