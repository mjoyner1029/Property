import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PropertyDetail from '../../pages/PropertyDetail';
import axios from 'axios';
import api from '../../utils/api';

jest.mock('../../utils/api');
jest.mock('axios');

describe('PropertyDetail', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders details after fetch', async () => {
    api.get.mockResolvedValueOnce({
      data: { id: 123, name: 'Unit 123', address: '77 Ocean Ave', rent: 2450 }
    });

    render(
      <MemoryRouter initialEntries={["/properties/123"]}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Unit 123')).toBeInTheDocument();
    expect(screen.getByText('77 Ocean Ave')).toBeInTheDocument();
    expect(screen.getByText('2450')).toBeInTheDocument();
  });

  test('deletes property and navigates', async () => {
    api.get.mockResolvedValueOnce({
      data: { id: 123, name: 'Unit 123', address: '77 Ocean Ave', rent: 2450 }
    });
    api.delete.mockResolvedValueOnce({ status: 204 });

    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    render(
      <MemoryRouter initialEntries={["/properties/123"]}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetail />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByText('Delete'));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/properties/123');
      expect(mockNavigate).toHaveBeenCalledWith('/properties');
    });
  });
});
