import React from 'react';
import PropTypes from 'prop-types';

/**
 * A reusable checkout button component with customizable styling and loading state.
 * 
 * @param {Object} props
 * @param {string} props.text - The text to display on the button
 * @param {Function} props.onClick - The function to call when the button is clicked
 * @param {boolean} props.isLoading - Whether the button is in a loading state
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.variant - The variant of the button ('primary', 'secondary', 'outline')
 * @param {string} props.className - Additional CSS classes to apply to the button
 * @returns {React.Element} A checkout button component
 */
const CheckoutButton = ({
  text = 'Checkout',
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  className = '',
}) => {
  // Define base button styles
  const baseStyles = 'px-6 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2';
  
  // Define variant-specific styles
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };
  
  // Disabled and loading styles
  const disabledStyles = 'opacity-50 cursor-not-allowed';
  
  // Combine styles
  const buttonStyles = `
    ${baseStyles} 
    ${variantStyles[variant] || variantStyles.primary} 
    ${(disabled || isLoading) ? disabledStyles : ''}
    ${className}
  `;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonStyles}
      data-testid="checkout-button"
      type="button"
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            data-testid="loading-spinner"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        text
      )}
    </button>
  );
};

CheckoutButton.propTypes = {
  text: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  className: PropTypes.string,
};

export default CheckoutButton;
