import fs from 'fs-extra';
import path from 'path';
import type { Config, Manifest } from '../types.js';

const XOCKET_DIR = '.xocket';
const CONFIG_FILE = 'config.json';

/**
 * Build the initial manifest object from a completed config.
 */
export function createManifest(config: Config): Manifest {
  return {
    version: '2.0.0',
    createdAt: new Date().toISOString(),
    projectName: config.projectName,
    packageManager: config.packageManager,
    apps: {
      web: {
        path: 'apps/web',
        framework: config.framework,
        backend: config.backend,
        serverState: config.serverState,
        stateManagement: config.stateManagement,
        sentry: true,
      },
    },
    packages: ['typescript-config', 'eslint-config', 'prettier-config'],
    modules: [],
  };
}

/**
 * Write (or overwrite) the .xocket/config.json manifest in rootDir.
 */
export async function writeManifest(rootDir: string, manifest: Manifest): Promise<void> {
  const dir = path.join(rootDir, XOCKET_DIR);
  await fs.ensureDir(dir);
  await fs.writeJson(path.join(dir, CONFIG_FILE), manifest, { spaces: 2 });
}

/**
 * Walk up from searchFrom to find the nearest .xocket/config.json.
 * Returns { rootDir, manifest } or null.
 */
export async function readManifest(searchFrom = process.cwd()): Promise<{ rootDir: string; manifest: Manifest } | null> {
  let dir = path.resolve(searchFrom);
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, XOCKET_DIR, CONFIG_FILE);
    if (await fs.pathExists(candidate)) {
      return { rootDir: dir, manifest: (await fs.readJson(candidate)) as Manifest };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }
  return null;
}

/**
 * Apply an updater function to the manifest and persist it.
 */
export async function updateManifest(rootDir: string, updater: (manifest: Manifest) => Manifest): Promise<void> {
  const filePath = path.join(rootDir, XOCKET_DIR, CONFIG_FILE);
  const current = (await fs.readJson(filePath)) as Manifest;
  const updated = updater(current);
  await fs.writeJson(filePath, updated, { spaces: 2 });
}
