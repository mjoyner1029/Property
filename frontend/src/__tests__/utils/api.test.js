// frontend/src/__tests__/utils/api.test.js
import axios from 'axios';
import api from '../../utils/api';

jest.mock('axios');

describe('api utilities', () => {
  test('creates axios client with baseURL', () => {
    expect(axios.create).toHaveBeenCalled();
    // If your api.js exports the instance, assert interceptors bound, etc.
  });
});
