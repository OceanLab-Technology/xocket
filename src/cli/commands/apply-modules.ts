import type { Config } from '../../types.js';
import { Steps } from '../../ui/steps.js';
import { t, glyph } from '../../ui/theme.js';
import { readManifest, updateManifest } from '../../utils/manifest.js';
import { install } from '../../utils/pm.js';
import { generateExpo } from '../../generators/expo/index.js';
import { generateBackend } from '../../generators/backend/index.js';
import { generateDb } from '../../generators/db/index.js';
import { generateAuthUi } from '../../generators/auth-ui.js';
import { generateAgent } from '../../generators/agent.js';
import { generateDocker } from '../../generators/docker.js';
import { generateSeo } from '../../generators/seo/index.js';
import {
  backendLangSchema,
  dbOrmSchema,
  deployTargetSchema,
  type DeployTarget,
} from '../../schema.js';

export interface PresetModule {
  module: string;
  lang?: string;
  orm?: string;
  name?: string;
  target?: string;
}

/**
 * Apply the modules a preset requested, in dependency order.
 *
 * Ordering matters: docker reads the manifest to decide which services to
 * containerise, so it runs last regardless of where the preset listed it.
 */
export async function applyPresetModules(
  config: Config,
  modules: PresetModule[],
  opts: { install: boolean },
): Promise<void> {
  const ordered = [...modules].sort(
    (a, b) => moduleRank(a.module) - moduleRank(b.module),
  );

  console.log();
  const steps = new Steps(ordered.length + (opts.install ? 1 : 0));

  for (const entry of ordered) {
    steps.start(`Module ${t.muted(entry.module)}`);
    try {
      await applyOne(config, entry);
    } catch (err) {
      // A failed optional module should not destroy an otherwise good project.
      steps.fail(
        `${entry.module}: ${err instanceof Error ? err.message : String(err)}`,
      );
      console.log(`  ${t.muted(`Add it manually with: xocket add ${entry.module}`)}`);
    }
  }

  if (opts.install) {
    steps.start('Installing module dependencies');
    await install(config.rootDir);
  }
  steps.succeed();
  console.log(`${t.success(glyph.tick)} ${t.muted('Preset modules applied.')}`);
}

function moduleRank(module: string): number {
  // docker inspects everything else, so it must run after them.
  return module === 'docker' ? 2 : module === 'auth-ui' ? 1 : 0;
}

async function applyOne(config: Config, entry: PresetModule): Promise<void> {
  const { rootDir } = config;

  switch (entry.module) {
    case 'expo': {
      await generateExpo(config, rootDir);
      await updateManifest(rootDir, (m) => {
        m.apps.expo = {
          path: 'apps/expo',
          framework: 'expo',
          backend: config.backend,
          serverState: config.serverState,
          stateManagement: config.stateManagement,
          sentry: true,
          seo: false,
          aiSeo: false,
        };
        m.modules = [...new Set([...m.modules, 'expo'])];
        return m;
      });
      return;
    }

    case 'backend': {
      const lang = backendLangSchema.parse(entry.lang ?? 'node');
      const name = entry.name ?? `${lang}-api`;
      await generateBackend(config, rootDir, { lang, name });
      await updateManifest(rootDir, (m) => {
        m.services[name] = { path: `services/${name}`, lang };
        m.modules = [...new Set([...m.modules, 'backend'])];
        return m;
      });
      return;
    }

    case 'db': {
      const orm = dbOrmSchema.parse(entry.orm ?? 'drizzle');
      await generateDb(config, rootDir, { orm });
      await updateManifest(rootDir, (m) => {
        m.db = { orm, path: 'packages/db' };
        m.packages = [...new Set([...m.packages, 'db'])];
        m.modules = [...new Set([...m.modules, 'db'])];
        return m;
      });
      return;
    }

    case 'auth-ui': {
      await generateAuthUi(config);
      await updateManifest(rootDir, (m) => {
        m.modules = [...new Set([...m.modules, 'auth-ui'])];
        return m;
      });
      return;
    }

    case 'agent': {
      const name = entry.name ?? 'mcp-server';
      await generateAgent(config, rootDir, { name });
      await updateManifest(rootDir, (m) => {
        m.services[name] = { path: `services/${name}`, lang: 'node' };
        m.modules = [...new Set([...m.modules, 'agent'])];
        return m;
      });
      return;
    }

    case 'seo': {
      await generateSeo({ ...config, seo: true, aiSeo: config.aiSeo });
      await updateManifest(rootDir, (m) => {
        if (m.apps.web) m.apps.web.seo = true;
        m.modules = [...new Set([...m.modules, 'seo'])];
        return m;
      });
      return;
    }

    case 'docker': {
      const target: DeployTarget = deployTargetSchema.parse(entry.target ?? 'compose');
      // Re-read so this sees every service the earlier modules added.
      const found = await readManifest(rootDir);
      if (!found) throw new Error('Manifest missing.');
      await generateDocker(config, rootDir, found.manifest, target);
      await updateManifest(rootDir, (m) => {
        m.modules = [...new Set([...m.modules, 'docker'])];
        return m;
      });
      return;
    }

    default:
      throw new Error(`Unknown module "${entry.module}".`);
  }
}
