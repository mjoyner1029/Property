import React from 'react';
import { screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import Unauthorized from 'src/pages/Unauthorized';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

describe('Unauthorized Page', () => {
  test('renders unauthorized page with correct heading', () => {
    renderWithProviders(<Unauthorized />);

    // Check for unauthorized heading or message
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to view this page/i)).toBeInTheDocument();
  });
});
