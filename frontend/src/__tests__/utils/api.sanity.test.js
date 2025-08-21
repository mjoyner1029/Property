import api, { backendUrl } from '../../utils/api';

test('api exports and baseURL present', () => {
  expect(api).toBeTruthy();
  expect(backendUrl).toBeTruthy();
});
