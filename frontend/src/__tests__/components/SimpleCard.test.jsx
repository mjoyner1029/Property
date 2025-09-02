import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

// Create an extremely simple component with no external dependencies
const SimpleCard = ({ title, children }) => (
  <div data-testid="simple-card">
    {title && <h2 data-testid="simple-title">{title}</h2>}
    <div data-testid="simple-content">{children}</div>
  </div>
);

describe('Simple Card Tests', () => {
  test('renders a simple card', () => {
    renderWithProviders(
      <SimpleCard title="Simple Title">
        <p>Simple Content</p>
      </SimpleCard>
    );
    
    console.log('Document content:', document.body.innerHTML);
    
    // Check for the basic elements
    expect(screen.getByTestId('simple-card')).toBeInTheDocument();
    expect(screen.getByText('Simple Title')).toBeInTheDocument();
    expect(screen.getByText('Simple Content')).toBeInTheDocument();
  });
});
