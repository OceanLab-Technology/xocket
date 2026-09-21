import { z } from 'zod';

/**
 * Every user-facing choice is defined once, here, as a zod schema.
 *
 * The same schemas validate three different entry points — interactive prompt
 * answers, `--flag` values, and the on-disk `.xocket/config.json` manifest — so
 * a bad value is rejected with the same message wherever it came from.
 */

export const FRAMEWORKS = ['react', 'next'] as const;
export const STATE_MANAGERS = ['zustand', 'context', 'redux', 'none'] as const;
export const SERVER_STATES = ['tanstack', 'none'] as const;
export const BACKENDS = ['supabase', 'cognito', 'custom', 'none'] as const;
export const BACKEND_LANGS = ['node', 'go', 'rust', 'python'] as const;
export const MODULES = ['expo', 'backend', 'seo', 'db', 'auth-ui', 'agent', 'docker'] as const;
export const DB_ORMS = ['drizzle', 'prisma'] as const;
export const DEPLOY_TARGETS = ['compose', 'k8s', 'both'] as const;

export const frameworkSchema = z.enum(FRAMEWORKS);
export const stateSchema = z.enum(STATE_MANAGERS);
export const serverStateSchema = z.enum(SERVER_STATES);
export const backendSchema = z.enum(BACKENDS);
export const backendLangSchema = z.enum(BACKEND_LANGS);
export const moduleSchema = z.enum(MODULES);
export const dbOrmSchema = z.enum(DB_ORMS);
export const deployTargetSchema = z.enum(DEPLOY_TARGETS);

export type DbOrm = z.infer<typeof dbOrmSchema>;
export type DeployTarget = z.infer<typeof deployTargetSchema>;

/**
 * Project names become both a directory and an npm scope (`@<name>/web`), so
 * they are held to npm's package-name rules rather than just "no slashes".
 */
export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Project name is required.')
  .max(214, 'Project name must be 214 characters or fewer.')
  .regex(
    /^[a-z0-9][a-z0-9._-]*$/,
    'Use lowercase letters, numbers, dots, hyphens or underscores, starting with a letter or number.',
  )
  .refine((v) => !['node_modules', 'favicon.ico', '.', '..'].includes(v), {
    message: 'That name is reserved by npm.',
  });

/** Answers collected from prompts or flags, before any derivation. */
export const answersSchema = z.object({
  projectName: projectNameSchema,
  framework: frameworkSchema,
  stateManagement: stateSchema,
  serverState: serverStateSchema,
  backend: backendSchema,
  seo: z.boolean(),
  aiSeo: z.boolean(),
});

export type Answers = z.infer<typeof answersSchema>;

/** The fully derived config every generator receives. */
export const configSchema = answersSchema.extend({
  rootDir: z.string(),
  webDir: z.string(),
  packageManager: z.literal('pnpm'),
  projectType: z.literal('web'),
  language: z.literal('ts'),
  isNext: z.boolean(),
  isReact: z.boolean(),
  /** Which app directory the current generator is writing into. */
  target: z.enum(['web', 'expo']).default('web'),
});

export type Config = z.infer<typeof configSchema>;

/** Raw `--flag` values, all optional — resolved against prompts in create.ts. */
export const createFlagsSchema = z.object({
  name: projectNameSchema.optional(),
  framework: frameworkSchema.optional(),
  state: stateSchema.optional(),
  serverState: serverStateSchema.optional(),
  backend: backendSchema.optional(),
  seo: z.boolean().optional(),
  aiSeo: z.boolean().optional(),
  yes: z.boolean().optional(),
  install: z.boolean().optional(),
  git: z.boolean().optional(),
  /** A preset file or URL supplying default answers — see utils/preset.ts. */
  template: z.string().optional(),
});

export type CreateFlags = z.infer<typeof createFlagsSchema>;

export const addFlagsSchema = z.object({
  lang: backendLangSchema.optional(),
  orm: dbOrmSchema.optional(),
  target: deployTargetSchema.optional(),
  name: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Service name must be lowercase alphanumeric with hyphens.')
    .optional(),
  yes: z.boolean().optional(),
  install: z.boolean().optional(),
});

export type AddFlags = z.infer<typeof addFlagsSchema>;

/**
 * An org preset. Every field is optional so a preset can pin only the choices
 * an organisation actually cares about and leave the rest to prompts.
 */
export const presetSchema = z.object({
  $schema: z.string().optional(),
  name: z.string().optional(),
  framework: frameworkSchema.optional(),
  stateManagement: stateSchema.optional(),
  serverState: serverStateSchema.optional(),
  backend: backendSchema.optional(),
  seo: z.boolean().optional(),
  aiSeo: z.boolean().optional(),
  /** Modules to add automatically after the project is created. */
  modules: z
    .array(
      z.union([
        moduleSchema,
        z.object({
          module: moduleSchema,
          lang: backendLangSchema.optional(),
          orm: dbOrmSchema.optional(),
          name: z.string().optional(),
          target: deployTargetSchema.optional(),
        }),
      ]),
    )
    .default([]),
});

export type Preset = z.infer<typeof presetSchema>;

// ── Manifest ────────────────────────────────────────────────────────────────

export const manifestAppSchema = z.object({
  path: z.string(),
  framework: z.string(),
  backend: backendSchema,
  serverState: serverStateSchema,
  stateManagement: stateSchema,
  sentry: z.boolean(),
  seo: z.boolean().default(false),
  aiSeo: z.boolean().default(false),
});

export const manifestServiceSchema = z.object({
  path: z.string(),
  lang: backendLangSchema,
});

export const manifestDbSchema = z.object({
  orm: dbOrmSchema,
  path: z.string(),
});

export const manifestSchema = z.object({
  version: z.string(),
  createdAt: z.string(),
  projectName: z.string(),
  packageManager: z.string(),
  apps: z.record(z.string(), manifestAppSchema),
  services: z.record(z.string(), manifestServiceSchema).default({}),
  packages: z.array(z.string()),
  modules: z.array(z.string()).default([]),
  db: manifestDbSchema.nullish(),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestApp = z.infer<typeof manifestAppSchema>;
export type ManifestService = z.infer<typeof manifestServiceSchema>;

/**
 * Turn a ZodError into the kind of message a CLI user can act on, e.g.
 *   framework: Invalid option: expected one of "react"|"next"
 */
export function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => {
      const at = i.path.length ? `${i.path.join('.')}: ` : '';
      return `${at}${i.message}`;
    })
    .join('\n');
}
