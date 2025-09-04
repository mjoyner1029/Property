module.exports = {
  root: true,
  extends: [
    "react-app"
  ],
  rules: {
    "no-unused-vars": ["warn", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_" 
    }]
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.{js,jsx}", "**/*.{test,spec}.{js,jsx}"],
      extends: [
        "plugin:testing-library/react",
        "plugin:jest-dom/recommended"
      ],
      rules: {
        "no-unused-vars": ["warn", { 
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_" 
        }]
      }
    }
  ]
}
