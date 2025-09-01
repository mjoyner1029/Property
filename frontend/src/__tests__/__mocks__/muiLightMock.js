// src/__tests__/__mocks__/muiLightMock.js
import React from 'react';

// Import the real module to proxy most components
const actualMui = jest.requireActual('@mui/material');

// Lightweight TextField mock
const TextField = React.forwardRef(({ 
  label, 
  error, 
  helperText, 
  variant = 'outlined',
  fullWidth,
  required,
  disabled,
  value = '',
  onChange = () => {},
  inputProps = {},
  InputProps = {},
  ...props 
}, ref) => {
  return (
    <div 
      className={`MuiTextField-root MuiTextField-${variant}`} 
      data-testid="mui-text-field" 
      ref={ref}
    >
      {label && (
        <label className="MuiInputLabel-root">
          {label}{required && <span className="MuiInputLabel-required"> *</span>}
        </label>
      )}
      <div className="MuiInputBase-root">
        <input
          className={`MuiInputBase-input ${error ? 'Mui-error' : ''} ${disabled ? 'Mui-disabled' : ''}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-label={label || props['aria-label']}
          {...inputProps}
          {...props}
        />
        {InputProps.endAdornment && (
          <div className="MuiInputAdornment-root MuiInputAdornment-end">
            {InputProps.endAdornment}
          </div>
        )}
      </div>
      {helperText && (
        <p className={`MuiFormHelperText-root ${error ? 'Mui-error' : ''}`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

// Lightweight Select mock
const Select = React.forwardRef(({ 
  children, 
  value, 
  onChange,
  label,
  fullWidth,
  required,
  disabled,
  error,
  ...props 
}, ref) => {
  return (
    <div 
      className="MuiSelect-root" 
      data-testid="mui-select" 
      ref={ref}
    >
      {label && (
        <label className="MuiInputLabel-root">
          {label}{required && <span className="MuiInputLabel-required"> *</span>}
        </label>
      )}
      <select
        className={`MuiSelect-select ${error ? 'Mui-error' : ''} ${disabled ? 'Mui-disabled' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label || props['aria-label']}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

// Lightweight MenuItem mock
const MenuItem = React.forwardRef(({ 
  children, 
  value, 
  disabled,
  ...props 
}, ref) => {
  return (
    <option 
      className={`MuiMenuItem-root ${disabled ? 'Mui-disabled' : ''}`}
      value={value}
      disabled={disabled}
      ref={ref}
      {...props}
    >
      {children}
    </option>
  );
});

// Lightweight Snackbar mock
const Snackbar = ({ 
  open, 
  autoHideDuration, 
  onClose, 
  children,
  anchorOrigin,
  ...props 
}) => {
  return open ? (
    <div 
      className="MuiSnackbar-root" 
      data-testid="mui-snackbar" 
      role="alert"
      {...props}
    >
      {children}
    </div>
  ) : null;
};

// Lightweight Alert mock
const Alert = React.forwardRef(({ 
  severity = 'info',
  variant = 'standard',
  children, 
  onClose,
  ...props 
}, ref) => {
  return (
    <div 
      className={`MuiAlert-root MuiAlert-${severity} MuiAlert-${variant}`} 
      role="alert" 
      ref={ref}
      {...props}
    >
      <div className="MuiAlert-icon">
        {/* Simple icon representation */}
        <span role="img" aria-label={severity}>
          {severity === 'error' && '❌'}
          {severity === 'warning' && '⚠️'}
          {severity === 'info' && 'ℹ️'}
          {severity === 'success' && '✅'}
        </span>
      </div>
      <div className="MuiAlert-message">{children}</div>
      {onClose && (
        <div className="MuiAlert-action">
          <button 
            className="MuiButtonBase-root MuiIconButton-root MuiAlert-closeButton" 
            type="button" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});

// Export a mixed module with the lightweight mocks and the actual components for the rest
module.exports = {
  ...actualMui, // Pass through all other components
  TextField,
  Select,
  MenuItem,
  Snackbar,
  Alert,
};
