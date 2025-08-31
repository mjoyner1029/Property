// src/test/mocks/services.js

// Maintenance service mocks
const fetchRequestsMock = jest.fn();
const createRequestMock = jest.fn();
const updateRequestMock = jest.fn();
const deleteRequestMock = jest.fn();

// Property service mocks
const fetchPropertiesMock = jest.fn();
const createPropertyMock = jest.fn();
const updatePropertyMock = jest.fn();
const deletePropertyMock = jest.fn();
const fetchPropertyByIdMock = jest.fn();

// Tenant service mocks
const fetchTenantsMock = jest.fn();
const getTenantMock = jest.fn();
const updateTenantMock = jest.fn();
const deleteTenantMock = jest.fn();
const createTenantMock = jest.fn();

// Payment service mocks
const fetchPaymentsMock = jest.fn();
const createPaymentMock = jest.fn();
const processRefundMock = jest.fn();

// Message service mocks
const fetchMessagesMock = jest.fn();
const getMessageMock = jest.fn();
const createMessageMock = jest.fn();
const deleteMessageMock = jest.fn();

// CommonJS exports for use with require()
module.exports = {
  fetchRequestsMock,
  createRequestMock,
  updateRequestMock,
  deleteRequestMock,
  fetchPropertiesMock,
  createPropertyMock,
  updatePropertyMock,
  deletePropertyMock,
  fetchPropertyByIdMock,
  fetchTenantsMock,
  getTenantMock,
  updateTenantMock,
  deleteTenantMock,
  createTenantMock,
  fetchPaymentsMock,
  createPaymentMock,
  processRefundMock,
  fetchMessagesMock,
  getMessageMock,
  createMessageMock,
  deleteMessageMock
};
