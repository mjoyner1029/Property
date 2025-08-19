import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/StatusBadge';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Create a simple theme for testing
const theme = createTheme();

describe('StatusBadge Component', () => {
  test('renders with default status', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatusBadge />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
  
  test('renders success status', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatusBadge status="success" />
      </ThemeProvider>
    );
    
    expect(screen.getByText('success')).toBeInTheDocument();
  });
  
  test('renders active status', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatusBadge status="active" />
      </ThemeProvider>
    );
    
    expect(screen.getByText('active')).toBeInTheDocument();
  });
  
  test('renders custom label', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatusBadge status="success" label="Custom Label" />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });
  
  test('renders with small size', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <StatusBadge status="pending" size="small" />
      </ThemeProvider>
    );
    
    // Check text is rendered
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
  
  test('renders with large size', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <StatusBadge status="error" size="large" />
      </ThemeProvider>
    );
    
    // Check text is rendered
    expect(screen.getByText('error')).toBeInTheDocument();
  });
  
  test('applies custom styles', () => {
    const customStyles = { 
      fontWeight: 'bold',
      borderRadius: 4
    };
    
    render(
      <ThemeProvider theme={theme}>
        <StatusBadge status="active" customStyles={customStyles} />
      </ThemeProvider>
    );
    
    // Check that the component renders with the custom text
    expect(screen.getByText('active')).toBeInTheDocument();
  });
  
  test('uses fallback for unknown status', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatusBadge status="non_existent_status" />
      </ThemeProvider>
    );
    
    expect(screen.getByText('non_existent_status')).toBeInTheDocument();
  });
});
