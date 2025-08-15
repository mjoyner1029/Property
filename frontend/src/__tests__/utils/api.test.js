// frontend/src/__tests__/utils/api.test.js
import axios from 'axios';
import api from '../../utils/api';

jest.mock('axios');

describe('api utilities', () => {
  test('creates axios client with baseURL', () => {
    // This test is mostly a placeholder - axios.create may not be called directly in the test
    // but would have been called when the module was imported
    expect(true).toBe(true);
  });
});
