import React from 'react';
import { render, screen } from '@testing-library/react';
import { BasicTest } from '../components/BasicTest';

// This is a basic test to make sure the testing environment is working correctly
describe('Basic Test Component', () => {
  test('renders a simple message', () => {
    render(<BasicTest />);
    expect(screen.getByText('This is a basic test component')).toBeInTheDocument();
  });
});
