module.exports = {
    env: {
      node: true,
      commonjs: true,
      es2021: true,
    },
    extends: ["eslint:recommended", "prettier"],
    overrides: [],
    parserOptions: {
      ecmaVersion: "latest",
    },
    rules: {
      "prettier/prettier": ["warn"],
      "no-unused-vars": "warn",
    },
    plugins: ["prettier"],
  };
  