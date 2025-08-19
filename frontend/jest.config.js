module.exports = {
  // This should merge with any existing config in package.json
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@heroicons/react/(.*)$": "<rootDir>/src/test-utils/heroicons-stub.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  }
};
