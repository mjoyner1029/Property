import React, { createContext, useContext } from 'react';

const defaultValue = {
  properties: [],
  selectedProperty: null,
  loading: false,
  error: null,
  fetchPropertyById: jest.fn(async (id) => ({ id, name: `Mock Property ${id}` })),
  fetchProperties: jest.fn(async () => []),
  createProperty: jest.fn(async () => ({ id: 1 })),
  updateProperty: jest.fn(async () => ({ ok: true })),
  deleteProperty: jest.fn(async () => ({ ok: true })),
  uploadPropertyImage: jest.fn(async () => ({ id: 1, url: 'https://example.com/image.jpg' })),
  deletePropertyImage: jest.fn(async () => ({ ok: true })),
};

export const PropertyContext = createContext(defaultValue);

export const PropertyProvider = ({ children, value = defaultValue }) => {
  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
};

export const useProperty = () => useContext(PropertyContext);

export default {
  PropertyContext,
  PropertyProvider,
  useProperty,
  defaultValue
};
