// frontend/src/components/LoadingSpinner.jsx
import React from "react";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
  </div>
);

export default LoadingSpinner;