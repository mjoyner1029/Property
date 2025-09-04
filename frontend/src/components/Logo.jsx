import React from 'react';

/**
 * Logo component renders the application logo
 * Simple SVG logo for AssetAnchor
 */
export default function Logo({ sx = {} }) {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={sx}
    >
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      <path 
        d="M16 6L25 15H21V26H11V15H7L16 6Z" 
        fill="white"
      />
    </svg>
  );
}
