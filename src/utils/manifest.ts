import fs from 'fs-extra';
import path from 'path';
import { manifestSchema, formatZodError, type Config, type Manifest } from '../schema.js';
import { VERSION } from '../version.js';

const XOCKET_DIR = '.xocket';
const CONFIG_FILE = 'config.json';

/** Build the initial manifest from a completed config. */
export function createManifest(config: Config): Manifest {
  return manifestSchema.parse({
    version: VERSION,
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
        seo: config.seo,
        aiSeo: config.aiSeo,
      },
    },
    services: {},
    packages: ['typescript-config', 'eslint-config', 'prettier-config'],
    modules: [...(config.seo ? ['seo'] : [])],
  });
}

export async function writeManifest(rootDir: string, manifest: Manifest): Promise<void> {
  const dir = path.join(rootDir, XOCKET_DIR);
  await fs.ensureDir(dir);
  await fs.writeJson(path.join(dir, CONFIG_FILE), manifest, { spaces: 2 });
}

/**
 * Walk up from `searchFrom` looking for .xocket/config.json.
 *
 * Stops at the filesystem root rather than after a fixed number of levels, so
 * a deeply-nested cwd still finds the project.
 */
export async function readManifest(
  searchFrom = process.cwd(),
): Promise<{ rootDir: string; manifest: Manifest } | null> {
  let dir = path.resolve(searchFrom);

  for (;;) {
    const candidate = path.join(dir, XOCKET_DIR, CONFIG_FILE);

    if (await fs.pathExists(candidate)) {
      const raw = await fs.readJson(candidate);
      const parsed = manifestSchema.safeParse(raw);

      if (!parsed.success) {
        throw new Error(
          `${candidate} is not a valid Xocket manifest:\n${formatZodError(parsed.error)}`,
        );
      }
      return { rootDir: dir, manifest: parsed.data };
    }

    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Apply an updater to the manifest, re-validate, and persist. */
export async function updateManifest(
  rootDir: string,
  updater: (manifest: Manifest) => Manifest,
): Promise<void> {
  const filePath = path.join(rootDir, XOCKET_DIR, CONFIG_FILE);
  const current = manifestSchema.parse(await fs.readJson(filePath));
  const updated = manifestSchema.parse(updater(current));
  await fs.writeJson(filePath, updated, { spaces: 2 });
}
