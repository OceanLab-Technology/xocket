// eslint-config-next 16 ships native flat configs, so no FlatCompat shim.
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import nextConfig from '@xocket/eslint-config/next.js';

const config = [
  { ignores: ['.next/**', 'next-env.d.ts'] },
  ...nextConfig,
  ...coreWebVitals,
  ...nextTypescript,
];

export default config;
