import react from './react.js';

/**
 * Next.js apps compose this with eslint-config-next in their own
 * eslint.config.js, so that plugin stays a dependency of the app rather than
 * of this shared package.
 */
export default [
  ...react,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Server Components legitimately read process.env at module scope.
      'no-process-env': 'off',
    },
  },
];
