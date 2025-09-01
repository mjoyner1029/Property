import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutButton from 'src/components/CheckoutButton';

describe('CheckoutButton Component', () => {
  test('renders with default props', () => {
    render(<CheckoutButton onClick={() => {}} />);
    
    const button = screen.getByTestId('checkout-button');
    
    // Check default text
    expect(button).toHaveTextContent('Checkout');
    
    // Check button is enabled by default
    expect(button).not.toBeDisabled();
    
    // Check spinner is not visible
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  test('renders with custom text', () => {
    render(<CheckoutButton text="Complete Purchase" onClick={() => {}} />);
    
    const button = screen.getByTestId('checkout-button');
    expect(button).toHaveTextContent('Complete Purchase');
  });

  test('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<CheckoutButton onClick={handleClick} />);
    
    const button = screen.getByTestId('checkout-button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    render(<CheckoutButton onClick={() => {}} isLoading={true} />);
    
    const button = screen.getByTestId('checkout-button');
    
    // Check loading spinner is visible
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Check button shows "Processing..." text
    expect(button).toHaveTextContent('Processing...');
    
    // Check button is disabled when loading
    expect(button).toBeDisabled();
  });

  test('can be disabled', () => {
    render(<CheckoutButton onClick={() => {}} disabled={true} />);
    
    const button = screen.getByTestId('checkout-button');
    expect(button).toBeDisabled();
  });

  test('applies different variants', () => {
    const { rerender } = render(<CheckoutButton onClick={() => {}} variant="primary" />);
    let button = screen.getByTestId('checkout-button');
    expect(button.className).toContain('bg-blue-600');
    
    // Rerender with secondary variant
    rerender(<CheckoutButton onClick={() => {}} variant="secondary" />);
    button = screen.getByTestId('checkout-button');
    expect(button.className).toContain('bg-gray-600');
    
    // Rerender with outline variant
    rerender(<CheckoutButton onClick={() => {}} variant="outline" />);
    button = screen.getByTestId('checkout-button');
    expect(button.className).toContain('bg-transparent');
    expect(button.className).toContain('border-blue-600');
  });

  test('applies additional CSS classes', () => {
    render(<CheckoutButton onClick={() => {}} className="custom-class" />);
    
    const button = screen.getByTestId('checkout-button');
    expect(button.className).toContain('custom-class');
  });

  // New test for uncovered branch - invalid variant fallback
  test('uses primary variant when invalid variant is provided', () => {
    render(<CheckoutButton onClick={() => {}} variant="invalid" />);
    
    const button = screen.getByTestId('checkout-button');
    // Should fallback to primary styles
    expect(button.className).toContain('bg-blue-600');
  });

  // New test for disabled/loading click behavior
  test('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<CheckoutButton onClick={handleClick} disabled={true} />);
    
    const button = screen.getByTestId('checkout-button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('does not call onClick when loading', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<CheckoutButton onClick={handleClick} isLoading={true} />);
    
    const button = screen.getByTestId('checkout-button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});
