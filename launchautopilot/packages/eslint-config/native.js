import globals from 'globals';
import react from './react.js';

export default [
  ...react,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node, __DEV__: 'readonly' },
    },
    rules: {
      // React Native resolves these through Metro, not the browser.
      'no-undef': 'off',
    },
  },
  {
    // Metro and Babel load their configs as CommonJS; require() is correct
    // here and banning it would make the app unbuildable.
    files: ['**/*.config.js', '**/*.config.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
];
