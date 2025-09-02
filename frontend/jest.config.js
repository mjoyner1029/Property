module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest.setup.js'],
  roots: ['<rootDir>/src'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }] },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test/mocks/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/src/test/mocks/fileMock.js',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/__tests__/components/__mocks__/',
    '/__tests__/maintenance/mock',
    '/src/mocks/',
    '/__tests__/__mocks__/',
    '/__mocks__/'
  ],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 15000,
  maxWorkers: '50%',
  watchPathIgnorePatterns: ['<rootDir>/.cache/'],
};
