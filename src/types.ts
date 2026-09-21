/**
 * Runtime-validated types live in schema.ts; this module re-exports them so
 * existing `import type { Config } from '../types.js'` call sites keep working.
 */
export type {
  Answers,
  Config,
  CreateFlags,
  AddFlags,
  Manifest,
  ManifestApp,
  ManifestService,
} from './schema.js';
