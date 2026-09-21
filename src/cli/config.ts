import path from 'path';
import { configSchema, formatZodError, type Answers, type Config } from '../schema.js';

/**
 * Normalises validated answers into the config object every generator receives.
 *
 * rootDir — the monorepo root  (e.g. /dev/my-project)
 * webDir  — the web app dir    (e.g. /dev/my-project/apps/web)
 */
export function buildConfig(answers: Answers, cwd = process.cwd()): Config {
  const rootDir = path.resolve(cwd, answers.projectName);

  const parsed = configSchema.safeParse({
    ...answers,
    rootDir,
    webDir: path.join(rootDir, 'apps', 'web'),
    packageManager: 'pnpm',
    projectType: 'web',
    language: 'ts',
    isNext: answers.framework === 'next',
    isReact: answers.framework === 'react',
    target: 'web',
  });

  if (!parsed.success) {
    throw new Error(`Invalid project configuration:\n${formatZodError(parsed.error)}`);
  }

  return parsed.data;
}

/**
 * Derive a config for a non-web app in the same monorepo.
 *
 * `framework` and the `isNext`/`isReact` flags are recomputed together — the
 * previous spread-and-override left those flags describing the *web* app while
 * `framework` described the new one.
 */
export function deriveAppConfig(
  base: Config,
  overrides: { framework: Config['framework']; target: 'web' | 'expo' },
): Config {
  return {
    ...base,
    framework: overrides.framework,
    target: overrides.target,
    isNext: overrides.framework === 'next',
    isReact: overrides.framework === 'react',
  };
}
