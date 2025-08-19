import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Basic Tests', () => {
  test('basic rendering works', () => {
    render(<div data-testid="test">Test Component</div>);
    expect(screen.getByTestId('test')).toBeInTheDocument();
  });
});
