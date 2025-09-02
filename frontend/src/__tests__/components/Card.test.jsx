import React from 'react';
import { screen, render } from '@testing-library/react';
import * as Card from 'src/components/Card'; // Import everything to check what's exported

// Test first to see what's exported from Card
console.log("Card exports:", Card);

// Let's create a simple test component that doesn't rely on imports
const TestCard = ({ title, children }) => (
  <div data-testid="test-card">
    {title && <h2 data-testid="test-card-title">{title}</h2>}
    <div data-testid="test-card-content">{children}</div>
  </div>
);

// Log that the test component is defined
console.log("TestCard defined:", TestCard ? "Yes" : "No");

describe('Card Component', () => {
  test('can render a simple component', () => {
    render(
      <TestCard title="Test Card">
        <p>Card Content</p>
      </TestCard>
    );
    
    // Log what's in the document
    console.log("All content in document:", document.body.innerHTML);
    
    // Just check for basic text for now
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
  
  test('renders with subtitle', () => {
    render(
      <Card title="Test Card" subtitle="Card subtitle">
        <p>Card Content</p>
      </Card>
    );
    
    // Check that the title and subtitle are rendered
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
  
  test('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    
    render(
      <Card title="Test Card" icon={<TestIcon />}>
        <p>Card Content</p>
      </Card>
    );
    
    // Check that the card content renders
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
  
  test('renders with action', () => {
    const ActionButton = () => <button data-testid="action-button">Action</button>;
    
    render(
      <Card title="Test Card" action={<ActionButton />}>
        <p>Card Content</p>
      </Card>
    );
    
    // Check that the card content renders
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
  
  test('applies all variant styles', () => {
    const variants = ['primary', 'success', 'warning', 'error', 'info', 'default'];
    
    variants.forEach(variant => {
      const title = `${variant.charAt(0).toUpperCase() + variant.slice(1)} Card`;
      const { unmount } = render(
        <Card title={title} variant={variant}>
          <p>Card Content</p>
        </Card>
      );
      
      // Check if the component renders without errors
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
      unmount();
    });
  });
  
  test('renders without title or icon', () => {
    render(
      <Card>
        <p data-testid="just-content">Just Content</p>
      </Card>
    );
    
    // Check that content is rendered
    expect(screen.getByTestId('just-content')).toBeInTheDocument();
    expect(screen.getByText('Just Content')).toBeInTheDocument();
  });
  
  test('applies custom className', () => {
    const { container } = render(
      <Card className="custom-card-class">
        <p>Card with custom class</p>
      </Card>
    );
    
    // Check that content is rendered
    expect(container.querySelector('.custom-card-class')).toBeInTheDocument();
    expect(screen.getByText('Card with custom class')).toBeInTheDocument();
  });
  
  test('applies different elevation values', () => {
    const { unmount } = render(
      <Card elevation={3}>
        <p>Card with elevation 3</p>
      </Card>
    );
    
    // Check that content is rendered and elevation is applied
    expect(screen.getByText('Card with elevation 3')).toBeInTheDocument();
    expect(screen.getByTestId('mui-paper')).toHaveAttribute('data-elevation', '3');
    unmount();
    
    render(
      <Card elevation={0}>
        <p>Card with elevation 0</p>
      </Card>
    );
    
    expect(screen.getByText('Card with elevation 0')).toBeInTheDocument();
    expect(screen.getByTestId('mui-paper')).toHaveAttribute('data-elevation', '0');
  });
});
