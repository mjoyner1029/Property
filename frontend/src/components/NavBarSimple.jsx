import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A simplified navigation bar component for basic navigation needs.
 * This component provides a clean, minimal navigation bar with configurable links.
 * 
 * @param {Object} props
 * @param {string} props.title - The title to display in the navbar
 * @param {Array} props.links - Array of link objects with path and label
 * @param {string} props.backgroundColor - Optional background color
 * @param {Object} props.style - Additional styling
 * @returns {React.Element} A simple navigation bar component
 */
const NavBarSimple = ({ 
  title = 'Asset Anchor',
  links = [],
  backgroundColor = 'blue',
  style = {}
}) => {
  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    backgroundColor,
    color: 'white',
    ...style
  };

  const linkContainerStyle = {
    display: 'flex',
    gap: '1rem'
  };

  return (
    <nav 
      style={navStyle}
      data-testid="navbar-simple"
    >
      <h1>{title}</h1>
      <div style={linkContainerStyle}>
        {links.map((link, index) => (
          <Link
            key={index}
            to={link.path}
            style={{ color: 'white', textDecoration: 'none' }}
            data-testid={`nav-link-${index}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default NavBarSimple;
