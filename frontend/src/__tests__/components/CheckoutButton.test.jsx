import React from 'react';
import { screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import CheckoutButton from 'src/components/CheckoutButton';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

describe('CheckoutButton Component', () => {
  test('renders with default props', () => {
    renderWithProviders(<CheckoutButton onClick={() => {}} />);
    
    const button = screen.getByTestId('checkout-button');
    
    // Check default text
    expect(button).toHaveTextContent('Checkout');
    
    // Check button is enabled by default
    expect(button).toBeEnabled();
    
    // Check spinner is not visible
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  test('renders with custom text', () => {
    renderWithProviders(<CheckoutButton text="Complete Purchase" onClick={() => {}} />);
    
    const button = screen.getByTestId('checkout-button');
    expect(button).toHaveTextContent('Complete Purchase');
  });

  test('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    renderWithProviders(<CheckoutButton onClick={handleClick} />);
    
    const button = screen.getByTestId('checkout-button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    renderWithProviders(<CheckoutButton onClick={() => {}} isLoading={true} />);
    
    const button = screen.getByTestId('checkout-button');
    
    // Check loading spinner is visible
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Check button shows "Processing..." text
    expect(button).toHaveTextContent('Processing...');
    
    // Check button is disabled when loading
    expect(button).toBeDisabled();
  });

  test('can be disabled', () => {
    renderWithProviders(<CheckoutButton onClick={() => {}} disabled={true} />);
    
    const button = screen.getByTestId('checkout-button');
    expect(button).toBeDisabled();
  });

  test('applies different variants', () => {
    const { rerender } = renderWithProviders(<CheckoutButton onClick={() => {}} variant="primary" />);
    let button = screen.getByTestId('checkout-button');
    expect(button).toHaveClass('bg-blue-600');
    
    // Rerender with secondary variant
    rerenderWithProviders(<CheckoutButton onClick={() => {}} variant="secondary" />);
    button = screen.getByTestId('checkout-button');
    expect(button).toHaveClass('bg-gray-600');
    
    // Rerender with outline variant
    rerenderWithProviders(<CheckoutButton onClick={() => {}} variant="outline" />);
    button = screen.getByTestId('checkout-button');
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('border-blue-600');
  });

  test('applies additional CSS classes', () => {
    renderWithProviders(<CheckoutButton onClick={() => {}} className="custom-class" />);
    
    const button = screen.getByTestId('checkout-button');
    expect(button).toHaveClass('custom-class');
  });

  // New test for uncovered branch - invalid variant fallback
  test('uses primary variant when invalid variant is provided', () => {
    renderWithProviders(<CheckoutButton onClick={() => {}} variant="invalid" />);
    
    const button = screen.getByTestId('checkout-button');
    // Should fallback to primary styles
    expect(button).toHaveClass('bg-blue-600');
  });

  // New test for disabled/loading click behavior
  test('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    renderWithProviders(<CheckoutButton onClick={handleClick} disabled={true} />);
    
    const button = screen.getByTestId('checkout-button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('does not call onClick when loading', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    renderWithProviders(<CheckoutButton onClick={handleClick} isLoading={true} />);
    
    const button = screen.getByTestId('checkout-button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});
