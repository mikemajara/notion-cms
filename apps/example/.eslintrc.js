module.exports = {
  extends: ["eslint:recommended"],
  rules: {
    // Disable rules that might cause issues during build
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
};
