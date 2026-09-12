import type { Config } from '../types.js';
import path from 'path';

/**
 * Normalises raw prompt answers into a config object used by all generators.
 *
 * rootDir — the monorepo root  (e.g. /dev/my-project)
 * webDir  — the web app dir   (e.g. /dev/my-project/apps/web)
 */
export function buildConfig(answers: any): Config {
  const projectName = answers.projectName.trim();
  const rootDir = path.resolve(process.cwd(), projectName);
  const webDir = path.join(rootDir, 'apps', 'web');

  return {
    projectName,
    rootDir,
    webDir,
    packageManager: 'pnpm',
    projectType: 'web',                      // hardcoded to 'web' for now
    framework: answers.framework,            // 'react' | 'next'
    language: 'ts',                          // always TypeScript — no prompt
    stateManagement: answers.stateManagement, // 'zustand' | 'context' | 'redux' | 'none'
    serverState: answers.serverState,        // 'tanstack' | 'none'
    backend: answers.backend,               // 'supabase' | 'cognito' | 'custom' | 'none'
    // Derived convenience flags
    isNext: answers.framework === 'next',
    isReact: answers.framework === 'react',
  };
}
