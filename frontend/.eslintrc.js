module.exports = {
  root: true,
  extends: [
    "react-app"
  ],
  overrides: [
    {
      files: ["**/__tests__/**/*.{js,jsx}", "**/*.{test,spec}.{js,jsx}"],
      extends: [
        "plugin:testing-library/react",
        "plugin:jest-dom/recommended"
      ]
    }
  ]
}
