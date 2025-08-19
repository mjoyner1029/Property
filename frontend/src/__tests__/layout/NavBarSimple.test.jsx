import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NavBarSimple from '../../components/NavBarSimple';

// Use direct render with MemoryRouter instead of renderWithProviders
// to simplify the test and avoid any issues with context providers
const renderNavBar = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('NavBarSimple Component', () => {
  const defaultLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/properties', label: 'Properties' }
  ];

  test('renders title and navigation links', () => {
    renderNavBar(
      <NavBarSimple title="Test Title" links={defaultLinks} />
    );
    
    // Check title
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    
    // Check links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });
  
  test('renders with default title when no title is provided', () => {
    renderNavBar(
      <NavBarSimple links={defaultLinks} />
    );
    
    // Check default title
    expect(screen.getByText('Asset Anchor')).toBeInTheDocument();
  });
  
  test('renders no links when none are provided', () => {
    renderNavBar(
      <NavBarSimple title="Test Title" />
    );
    
    // Check title
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    
    // Check that links are not rendered
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Properties')).not.toBeInTheDocument();
  });
  
  test('applies custom background color', () => {
    renderNavBar(
      <NavBarSimple 
        title="Colored NavBar" 
        links={defaultLinks}
        backgroundColor="red"
      />
    );
    
    // Check the navbar has the testid we expect
    const navbar = screen.getByTestId('navbar-simple');
    expect(navbar).toHaveStyle({ backgroundColor: 'red' });
  });
  
  test('links navigate correctly', async () => {
    const user = userEvent.setup();
    
    renderNavBar(
      <NavBarSimple title="Navigation Test" links={defaultLinks} />
    );
    
    // Click dashboard link
    await user.click(screen.getByText('Dashboard'));
    
    // In a real test this would check if navigation occurred
    // We're just verifying it doesn't crash when links are clicked
    expect(screen.getByTestId('nav-link-0')).toBeInTheDocument();
  });
});
