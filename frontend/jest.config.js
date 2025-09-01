module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest.setup.js'],
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }] },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test/mocks/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/src/test/mocks/fileMock.js'
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 15000,
  maxWorkers: '50%',
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/build/'],
  watchPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.cache/'],
};
