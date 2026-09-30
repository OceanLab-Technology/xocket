import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  dts: true,
  // Workspace packages ship TypeScript source, so bundle them into dist.
  noExternal: ['@launchautopilot/core'],
});
