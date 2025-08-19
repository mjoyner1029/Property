import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../../components/Card';
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

describe('Card Component', () => {
  test('renders with title and children', () => {
    render(
      <ThemeProvider theme={theme}>
        <Card title="Test Card">
          <p data-testid="card-content">Card Content</p>
        </Card>
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
  
  test('renders with subtitle', () => {
    render(
      <ThemeProvider theme={theme}>
        <Card title="Test Card" subtitle="Card subtitle">
          <p>Card Content</p>
        </Card>
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toBeInTheDocument();
  });
  
  test('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    
    render(
      <ThemeProvider theme={theme}>
        <Card title="Test Card" icon={<TestIcon />}>
          <p>Card Content</p>
        </Card>
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
  
  test('renders with action', () => {
    const ActionButton = () => <button data-testid="action-button">Action</button>;
    
    render(
      <ThemeProvider theme={theme}>
        <Card title="Test Card" action={<ActionButton />}>
          <p>Card Content</p>
        </Card>
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });
  
  test('applies variant style', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Card title="Primary Card" variant="primary">
          <p>Card Content</p>
        </Card>
      </ThemeProvider>
    );
    
    // Check if the component renders without errors
    expect(screen.getByText('Primary Card')).toBeInTheDocument();
    
    // We'd need to use a different approach to test the actual style application
    // since the styles are applied via sx prop, but we can at least verify it renders
  });
  
  test('renders without title or icon', () => {
    render(
      <ThemeProvider theme={theme}>
        <Card>
          <p data-testid="just-content">Just Content</p>
        </Card>
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('just-content')).toBeInTheDocument();
    expect(screen.getByText('Just Content')).toBeInTheDocument();
  });
});
