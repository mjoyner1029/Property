module.exports = {
  // This should merge with any existing config in package.json
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js'],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@heroicons/react/(.*)$": "<rootDir>/src/test-utils/heroicons-stub.js",
    "^../context$": "<rootDir>/src/context/index.js",
    "^@context$": "<rootDir>/src/context/index.js",
    "\\.(css|less|scss|sass)$": "<rootDir>/src/test/styleMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/src/test/fileMock.js"
  },
  // Automatically mock these modules in tests
  automock: false,
  // Reset mocks before each test
  resetMocks: false,
  // Make sure modules with __mocks__ folders are properly mocked
  restoreMocks: false,
};
