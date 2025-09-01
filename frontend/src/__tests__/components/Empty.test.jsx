import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import Empty from 'src/components/Empty';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

describe('Empty component', () => {
  test('renders with default props', () => {
    renderWithProviders(<Empty />);
    
    // Should render the default title as a heading
    expect(screen.getByRole('heading', { name: 'No data found' })).toBeInTheDocument();
    
    // Should render the default message
    expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
  });
  
  test('renders with custom title and message', () => {
    const title = 'Custom Empty State';
    const message = 'This is a custom empty state message';
    
    renderWithProviders(<Empty title={title} message={message} />);
    
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });
  
  test('renders action button when actionText and onActionClick are provided', () => {
    const actionText = 'Add New Item';
    const handleClick = jest.fn();
    
    renderWithProviders(<Empty actionText={actionText} onActionClick={handleClick} />);
    
    const actionButton = screen.getByRole('button', { name: actionText });
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('does not trigger action without onActionClick handler', () => {
    const actionText = 'Add New Item';
    
    renderWithProviders(<Empty actionText={actionText} />);
    
    // Button should be rendered even without onActionClick
    const button = screen.getByRole('button', { name: actionText });
    expect(button).toBeInTheDocument();
    
    // But clicking it shouldn't cause errors
    fireEvent.click(button);
    // No assertion needed - we're just making sure it doesn't error
  });
  
  test('does not render action button when only onActionClick is provided', () => {
    const handleClick = jest.fn();
    
    renderWithProviders(<Empty onActionClick={handleClick} />);
    
    // There should be no button element since actionText is required
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
