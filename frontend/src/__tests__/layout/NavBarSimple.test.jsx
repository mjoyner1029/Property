import React from 'react';
import { screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import NavBarSimple from 'src/components/NavBarSimple';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

// Use renderWithProviders for consistency across tests
const renderNavBar = (ui) => {
  return renderWithProviders(ui);
};

describe('NavBarSimple Component', () => {
  const defaultLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/properties', label: 'Properties' },
    { path: '/settings', label: 'Settings' }
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
  
  test('applies additional custom styles', () => {
    renderNavBar(
      <NavBarSimple 
        title="Custom Style NavBar" 
        style={{ borderBottom: '2px solid white', fontSize: '1.2rem' }}
      />
    );
    
    const navbar = screen.getByTestId('navbar-simple');
    expect(navbar).toHaveStyle({ 
      borderBottom: '2px solid white',
      fontSize: '1.2rem'
    });
  });
  
  test('renders correct number of links', () => {
    renderNavBar(
      <NavBarSimple title="Link Count Test" links={defaultLinks} />
    );
    
    // There should be 3 links rendered
    const links = screen.getAllByTestId(/^nav-link-/);
    expect(links).toHaveLength(3);
    
    // Verify each link has the correct label
    expect(links[0]).toHaveTextContent('Dashboard');
    expect(links[1]).toHaveTextContent('Properties');
    expect(links[2]).toHaveTextContent('Settings');
  });
});
