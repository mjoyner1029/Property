// frontend/src/test-utils/mockLocalStorage.js

/**
 * Creates a functional localStorage mock for testing
 * @returns {Object} Mock localStorage implementation with store() accessor for tests
 */
export function withLocalStorage() {
  const store = {};
  
  const ls = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
    // Helper for tests to inspect storage content
    _getStore: () => ({ ...store })
  };
  
  Object.defineProperty(window, 'localStorage', { 
    value: ls, 
    configurable: true
  });
  
  return ls;
}
