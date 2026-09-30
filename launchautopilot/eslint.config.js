import base from '@xocket/eslint-config/base.js';

export default [
  {
    ignores: [
      'apps/**',
      'packages/**',
      'services/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/node_modules/**',
    ],
  },
  ...base,
];
