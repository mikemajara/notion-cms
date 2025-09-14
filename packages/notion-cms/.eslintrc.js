module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Allow any types for now since this is a library
    "@typescript-eslint/no-explicit-any": "off",
    // Allow unused vars that start with underscore, and unused imports for library exports
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    // Allow require() in specific cases
    "@typescript-eslint/no-var-requires": "off",
    // Allow empty interfaces (common in library type definitions)
    "@typescript-eslint/no-empty-interface": "off",
    // Allow empty object types (common in generics)
    "@typescript-eslint/no-empty-object-type": "off",
    // Allow ts-ignore (sometimes needed for dynamic imports)
    "@typescript-eslint/ban-ts-comment": "off",
    // Allow case declarations (common pattern)
    "no-case-declarations": "off",
    // Allow prefer-as-const for test files
    "@typescript-eslint/prefer-as-const": "off",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js", "*.mjs", "*.d.ts", "src/tests/**"],
};
