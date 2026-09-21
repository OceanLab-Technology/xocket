import type { BACKEND_LANGS } from '../../schema.js';

export type BackendLang = (typeof BACKEND_LANGS)[number];

/** The port each language's starter binds to, kept distinct so several can run at once. */
export const DEFAULT_PORTS: Record<BackendLang, number> = {
  node: 3001,
  go: 3002,
  rust: 3003,
  python: 3004,
};
