import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from 'src/components/Card';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Create a simple theme for testing
const theme = createTheme({
  palette: {
    primary: {
      main: '#3B82F6',
    },
    text: {
      secondary: '#94A3B8',
    }
  }
});

// Helper function to render Card with ThemeProvider
const renderWithTheme = (ui) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Card Component', () => {
  test('renders with title and children', () => {
    renderWithTheme(
      <Card title="Test Card">
        <p data-testid="card-content">Card Content</p>
      </Card>
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
  
  test('renders with subtitle', () => {
    renderWithTheme(
      <Card title="Test Card" subtitle="Card subtitle">
        <p>Card Content</p>
      </Card>
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toBeInTheDocument();
  });
  
  test('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    
    renderWithTheme(
      <Card title="Test Card" icon={<TestIcon />}>
        <p>Card Content</p>
      </Card>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
  
  test('renders with action', () => {
    const ActionButton = () => <button data-testid="action-button">Action</button>;
    
    renderWithTheme(
      <Card title="Test Card" action={<ActionButton />}>
        <p>Card Content</p>
      </Card>
    );
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });
  
  test('applies all variant styles', () => {
    const variants = ['primary', 'success', 'warning', 'error', 'info', 'default'];
    
    variants.forEach(variant => {
      const { container, unmount } = renderWithTheme(
        <Card title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Card`} variant={variant} data-testid={`${variant}-card`}>
          <p>Card Content</p>
        </Card>
      );
      
      // Check if the component renders without errors
      expect(screen.getByText(`${variant.charAt(0).toUpperCase() + variant.slice(1)} Card`)).toBeInTheDocument();
      unmount();
    });
  });
  
  test('renders without title or icon', () => {
    renderWithTheme(
      <Card>
        <p data-testid="just-content">Just Content</p>
      </Card>
    );
    
    expect(screen.getByTestId('just-content')).toBeInTheDocument();
    expect(screen.getByText('Just Content')).toBeInTheDocument();
  });
  
  test('applies custom className', () => {
    const { container } = renderWithTheme(
      <Card className="custom-card-class" data-testid="custom-class-card">
        <p>Card with custom class</p>
      </Card>
    );
    
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('custom-card-class');
  });
  
  test('applies different elevation values', () => {
    const { container, unmount } = renderWithTheme(
      <Card elevation={3} data-testid="elevated-card">
        <p>Card with elevation 3</p>
      </Card>
    );
    
    expect(screen.getByText('Card with elevation 3')).toBeInTheDocument();
    unmount();
    
    renderWithTheme(
      <Card elevation={0} data-testid="flat-card">
        <p>Card with elevation 0</p>
      </Card>
    );
    
    expect(screen.getByText('Card with elevation 0')).toBeInTheDocument();
  });
});
