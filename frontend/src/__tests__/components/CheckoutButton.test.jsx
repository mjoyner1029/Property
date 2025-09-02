import React from 'react';
import { screen, render } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import CheckoutButton from 'src/components/CheckoutButton';
import { ThemeProvider } from '@mui/material/styles';
import theme from 'src/theme';

// Simple render helper that only includes necessary context
const renderButton = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('CheckoutButton Component', () => {
  test('renders with default props', () => {
    renderButton(<CheckoutButton onClick={() => {}} />);
    
    const button = screen.getByTestId('checkout-button');
    
    // Check default text
    expect(button).toHaveTextContent('Checkout');
    
    // Check button is enabled by default
    expect(button).toBeEnabled();
    
    // Check spinner is not visible
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  test('renders with custom text', () => {
    renderButton(<CheckoutButton text="Pay Now" onClick={() => {}} />);
    
    const button = screen.getByTestId('checkout-button');
    expect(button).toHaveTextContent('Pay Now');
  });

  test('handles click events', async () => {
    const handleClick = jest.fn();
    renderButton(<CheckoutButton onClick={handleClick} />);
    
    const button = screen.getByTestId('checkout-button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    renderButton(<CheckoutButton isLoading onClick={() => {}} />);
    
    const button = screen.getByTestId('checkout-button');
    
    // Button should be disabled when loading
    expect(button).toBeDisabled();
    
    // Check button is disabled when loading
    expect(button).toBeDisabled();
  });

  test('can be disabled', () => {
    renderButton(<CheckoutButton disabled onClick={() => {}} />);
    
    const button = screen.getByTestId('checkout-button');
    expect(button).toBeDisabled();
  });

  test('applies different variants', () => {
    const { rerender } = renderButton(<CheckoutButton variant="primary" onClick={() => {}} />);
    let button = screen.getByTestId('checkout-button');
    expect(button).toHaveClass('bg-blue-600');
    
    // Rerender with secondary variant
    rerender(<ThemeProvider theme={theme}><CheckoutButton onClick={() => {}} variant="secondary" /></ThemeProvider>);
    button = screen.getByTestId('checkout-button');
    expect(button).toHaveClass('bg-gray-600');
    
    // Rerender with outline variant
    rerender(<ThemeProvider theme={theme}><CheckoutButton onClick={() => {}} variant="outline" /></ThemeProvider>);
    button = screen.getByTestId('checkout-button');
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('border-blue-600');
  });

  test('applies additional CSS classes', () => {
    renderButton(
      <CheckoutButton 
        onClick={() => {}} 
        className="custom-class1 custom-class2" 
      />
    );
    
    const button = screen.getByTestId('checkout-button');
    expect(button).toHaveClass('custom-class1');
    expect(button).toHaveClass('custom-class2');
  });

  // New test for uncovered branch - invalid variant fallback
  test('uses primary variant when invalid variant is provided', () => {
    renderButton(<CheckoutButton onClick={() => {}} variant="invalid" />);
    
    const button = screen.getByTestId('checkout-button');
    // Should fallback to primary styles
    expect(button).toHaveClass('bg-blue-600');
  });

  // New test for disabled/loading click behavior
  test('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    renderButton(<CheckoutButton onClick={handleClick} disabled={true} />);
    
    const button = screen.getByTestId('checkout-button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('does not call onClick when loading', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    renderButton(<CheckoutButton onClick={handleClick} isLoading={true} />);
    
    const button = screen.getByTestId('checkout-button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});
