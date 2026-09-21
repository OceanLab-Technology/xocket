import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Generation tests write real trees to a temp dir; give them room.
    testTimeout: 30_000,
    environment: 'node',
  },
});
