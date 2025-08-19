import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Support from '../../pages/Support';

jest.mock('../../components/PageHeader', () => () => <div data-testid="page-header">Page Header</div>);

describe('Support Page', () => {
  test('renders support page with header and FAQ section', () => {
    render(
      <MemoryRouter>
        <Support />
      </MemoryRouter>
    );

    // Check for FAQ section
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    
    // Check for contact form heading
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('support@assetanchor.com')).toBeInTheDocument();
  });
});
