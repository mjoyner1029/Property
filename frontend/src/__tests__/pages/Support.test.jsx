import React from 'react';
import { screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import Support from 'src/pages/Support';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

jest.mock('src/components/PageHeader', () => () => <div data-testid="page-header">Page Header</div>);

describe('Support Page', () => {
  test('renders support page with header and FAQ section', () => {
    renderWithProviders(<Support />);

    // Check for FAQ section
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    
    // Check for contact form heading
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('support@assetanchor.com')).toBeInTheDocument();
  });
});
