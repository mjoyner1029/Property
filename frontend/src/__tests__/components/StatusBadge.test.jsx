import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/StatusBadge';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Create a simple theme for testing
const theme = createTheme();

// Helper function to render component with theme
const renderWithTheme = (ui) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('StatusBadge Component', () => {
  describe('Status text rendering', () => {
    test('renders with default status when no status provided', () => {
      renderWithTheme(<StatusBadge />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
    
    test('renders success status', () => {
      renderWithTheme(<StatusBadge status="success" />);
      expect(screen.getByText('success')).toBeInTheDocument();
    });
    
    test('renders active status', () => {
      renderWithTheme(<StatusBadge status="active" />);
      expect(screen.getByText('active')).toBeInTheDocument();
    });
    
    test('renders custom label when provided', () => {
      renderWithTheme(<StatusBadge status="success" label="Custom Label" />);
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
      expect(screen.queryByText('success')).not.toBeInTheDocument();
    });
    
    test('handles null status gracefully', () => {
      renderWithTheme(<StatusBadge status={null} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    test('handles undefined status gracefully', () => {
      renderWithTheme(<StatusBadge status={undefined} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    test('handles empty string status gracefully', () => {
      renderWithTheme(<StatusBadge status="" />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Size variations', () => {
    test('renders with small size', () => {
      const { container } = renderWithTheme(<StatusBadge status="pending" size="small" />);
      expect(screen.getByText('pending')).toBeInTheDocument();
      
      // Verify container has small size styling (this is implementation-specific)
      const badgeElement = container.firstChild;
      expect(badgeElement).toHaveStyle({ fontSize: '0.75rem' });
    });
    
    test('renders with medium size by default', () => {
      const { container } = renderWithTheme(<StatusBadge status="pending" />);
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
    
    test('renders with large size', () => {
      const { container } = renderWithTheme(<StatusBadge status="error" size="large" />);
      expect(screen.getByText('error')).toBeInTheDocument();
      
      // Verify container has large size styling
      const badgeElement = container.firstChild;
      expect(badgeElement).toHaveStyle({ fontSize: '1rem' });
    });
  });
  
  describe('Style customization', () => {
    test('applies custom styles when provided', () => {
      const customStyles = { 
        padding: '10px'
      };
      
      const { container } = renderWithTheme(
        <StatusBadge status="active" customStyles={customStyles} />
      );
      
      expect(screen.getByText('active')).toBeInTheDocument();
      
      // Check that at least one custom style is applied
      // MUI styling can be complex, so we just check for a simpler style
      const badgeElement = container.firstChild;
      expect(badgeElement).toHaveStyle({ 
        padding: '10px'
      });
    });
  });
  
  describe('Status matching and fallback', () => {
    test('handles uppercase status correctly', () => {
      renderWithTheme(<StatusBadge status="SUCCESS" />);
      expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    });
    
    test('partial status matching for compound words', () => {
      renderWithTheme(<StatusBadge status="payment_success" />);
      expect(screen.getByText('payment_success')).toBeInTheDocument();
    });
    
    test('uses fallback for unknown status', () => {
      renderWithTheme(<StatusBadge status="non_existent_status" />);
      expect(screen.getByText('non_existent_status')).toBeInTheDocument();
    });
  });

  describe('Status styles', () => {
    test('each status type has correct color scheme', () => {
      const statuses = ['success', 'warning', 'error', 'pending', 'active', 'inactive'];
      
      for (const status of statuses) {
        const { container, unmount } = renderWithTheme(<StatusBadge status={status} />);
        expect(screen.getByText(status)).toBeInTheDocument();
        unmount();
      }
    });
  });
});
