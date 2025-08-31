// __mocks__/services/index.js
// Re-export all service mocks from the shared mocks folder
// This allows jest.mock('../../services') to automatically use these mocks

const {
  // Maintenance service mocks
  fetchRequestsMock,
  createRequestMock,
  updateRequestMock,
  deleteRequestMock,
  
  // Property service mocks
  fetchPropertiesMock,
  createPropertyMock,
  updatePropertyMock,
  deletePropertyMock,
  fetchPropertyByIdMock,
  
  // Tenant service mocks
  fetchTenantsMock,
  getTenantMock,
  updateTenantMock,
  deleteTenantMock,
  createTenantMock,
  
  // Payment service mocks
  fetchPaymentsMock,
  createPaymentMock,
  processRefundMock,
  
  // Message service mocks
  fetchMessagesMock,
  getMessageMock,
  createMessageMock,
  deleteMessageMock
} = require('../../src/test/mocks/services');

// Export the mocks without the "Mock" suffix for automatic mocking
module.exports = {
  // Maintenance service exports
  fetchRequests: fetchRequestsMock,
  createRequest: createRequestMock,
  updateRequest: updateRequestMock,
  deleteRequest: deleteRequestMock,
  
  // Property service exports
  fetchProperties: fetchPropertiesMock,
  createProperty: createPropertyMock,
  updateProperty: updatePropertyMock,
  deleteProperty: deletePropertyMock,
  fetchPropertyById: fetchPropertyByIdMock,
  
  // Tenant service exports
  fetchTenants: fetchTenantsMock,
  getTenant: getTenantMock,
  updateTenant: updateTenantMock,
  deleteTenant: deleteTenantMock,
  createTenant: createTenantMock,
  
  // Payment service exports
  fetchPayments: fetchPaymentsMock,
  createPayment: createPaymentMock,
  processRefund: processRefundMock,
  
  // Message service exports
  fetchMessages: fetchMessagesMock,
  getMessage: getMessageMock,
  createMessage: createMessageMock,
  deleteMessage: deleteMessageMock
};
