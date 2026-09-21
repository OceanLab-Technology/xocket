import * as p from '@clack/prompts';
import pc from 'picocolors';
import path from 'path';

import { readManifest, updateManifest } from '../../utils/manifest.js';
import { install } from '../../utils/pm.js';
import { preflight } from '../../utils/preflight.js';
import { generateExpo } from '../../generators/expo/index.js';
import { generateBackend } from '../../generators/backend/index.js';
import { generateSeo } from '../../generators/seo/index.js';
import { BANNER } from '../../version.js';
import {
  addFlagsSchema,
  backendLangSchema,
  BACKEND_LANGS,
  formatZodError,
  MODULES,
  type AddFlags,
  type Config,
  type Manifest,
} from '../../schema.js';

function cancel(message: string, code = 1): never {
  p.cancel(code === 0 ? pc.yellow(message) : pc.red(message));
  process.exit(code);
}

/** Rebuild a Config from the manifest so shared generators can be reused. */
function configFromManifest(manifest: Manifest, rootDir: string): Config {
  const web = manifest.apps.web;
  if (!web) {
    cancel('No web app found in the manifest. Is this a complete Xocket project?');
  }

  return {
    projectName: manifest.projectName,
    rootDir,
    webDir: path.join(rootDir, web.path),
    packageManager: 'pnpm',
    projectType: 'web',
    language: 'ts',
    framework: web.framework === 'next' ? 'next' : 'react',
    stateManagement: web.stateManagement,
    serverState: web.serverState,
    backend: web.backend,
    seo: web.seo,
    aiSeo: web.aiSeo,
    isNext: web.framework === 'next',
    isReact: web.framework === 'react',
    target: 'web',
  };
}

export async function run(
  { module, ...rawFlags }: AddFlags & { module?: string } = {},
): Promise<void> {
  p.intro(pc.bgCyan(pc.black(BANNER)));

  if (!module) {
    cancel(`A module name is required.\n\nAvailable: ${MODULES.join(', ')}`);
  }

  const flagCheck = addFlagsSchema.safeParse(rawFlags);
  if (!flagCheck.success) {
    cancel(`Invalid options:\n${formatZodError(flagCheck.error)}`);
  }
  const flags = flagCheck.data;
  const wantsInstall = flags.install !== false;

  const found = await readManifest(process.cwd()).catch((err: Error) => {
    cancel(err.message);
  });

  if (!found) {
    cancel('Not a Xocket project.\nRun `xocket create <name>` to create one first.');
  }

  const { rootDir, manifest } = found;
  const config = configFromManifest(manifest, rootDir);

  p.note(
    [
      `Project:         ${pc.cyan(manifest.projectName)}`,
      `Package manager: ${manifest.packageManager}`,
      `Apps:            ${Object.keys(manifest.apps).join(', ') || '—'}`,
      `Services:        ${Object.keys(manifest.services).join(', ') || '—'}`,
    ].join('\n'),
    'Xocket project detected',
  );

  switch (module) {
    case 'expo':
      await addExpo(config, rootDir, manifest, { yes: flags.yes === true, wantsInstall });
      break;
    case 'backend':
      await addBackend(config, rootDir, manifest, flags, wantsInstall);
      break;
    case 'seo':
      await addSeo(config, rootDir, manifest, wantsInstall);
      break;
    default:
      cancel(`Unknown module: "${module}".\n\nAvailable: ${MODULES.join(', ')}`);
  }
}

// ── expo ────────────────────────────────────────────────────────────────────

async function addExpo(
  config: Config,
  rootDir: string,
  manifest: Manifest,
  opts: { yes: boolean; wantsInstall: boolean },
) {
  if (manifest.apps.expo) {
    cancel('This project already has an Expo app at apps/expo.', 1);
  }

  if (!opts.yes) {
    const serverStateLabel =
      config.serverState === 'tanstack' ? 'TanStack Query' : 'no server state';
    const confirmed = await p.confirm({
      message:
        `The Expo app will mirror your web stack — ${config.stateManagement}, ` +
        `${serverStateLabel}, ${config.backend} — to keep the monorepo consistent. Proceed?`,
      initialValue: true,
    });
    if (p.isCancel(confirmed) || !confirmed) cancel('Operation cancelled.', 0);
  }

  const checks = await preflight({ needsInstall: opts.wantsInstall, needsGit: false });
  if (!checks.ok) cancel(checks.errors.join('\n\n'));

  const s = p.spinner();
  s.start('Scaffolding Expo application…');
  try {
    await generateExpo(config, rootDir);
    await updateManifest(rootDir, (m) => {
      m.apps.expo = {
        path: 'apps/expo',
        framework: 'expo',
        backend: config.backend,
        serverState: config.serverState,
        stateManagement: config.stateManagement,
        sentry: manifest.apps.web?.sentry ?? false,
        seo: false,
        aiSeo: false,
      };
      m.modules = [...new Set([...m.modules, 'expo'])];
      return m;
    });
    s.stop(pc.green('✓ Expo app generated.'));
  } catch (err) {
    s.stop(pc.red('✗ Failed to scaffold the Expo app.'));
    console.error(err);
    process.exit(1);
  }

  await runInstall(rootDir, opts.wantsInstall);

  p.note(
    ['pnpm --filter @' + config.projectName + '/expo start', '', 'Then press i (iOS) or a (Android).'].join(
      '\n',
    ),
    'Next steps',
  );
  p.outro(pc.green('Done.'));
}

// ── backend ─────────────────────────────────────────────────────────────────

async function addBackend(
  config: Config,
  rootDir: string,
  manifest: Manifest,
  flags: AddFlags,
  wantsInstall: boolean,
) {
  let lang = flags.lang;

  if (!lang) {
    if (flags.yes) {
      lang = 'node';
    } else {
      const answer = await p.select({
        message: 'Service language:',
        options: [
          { value: 'node', label: 'TypeScript (Hono)', hint: 'shares the workspace tooling' },
          { value: 'go', label: 'Go', hint: 'net/http' },
          { value: 'rust', label: 'Rust', hint: 'Axum' },
          { value: 'python', label: 'Python', hint: 'FastAPI + uv' },
        ],
        initialValue: 'node',
      });
      if (p.isCancel(answer)) cancel('Operation cancelled.', 0);
      lang = backendLangSchema.parse(answer);
    }
  }

  let name = flags.name;
  if (!name) {
    if (flags.yes) {
      name = `${lang}-api`;
    } else {
      const answer = await p.text({
        message: 'Service name:',
        placeholder: `${lang}-api`,
        initialValue: `${lang}-api`,
        validate: (v) =>
          /^[a-z0-9][a-z0-9-]*$/.test((v ?? '').trim())
            ? undefined
            : 'Lowercase letters, numbers and hyphens only.',
      });
      if (p.isCancel(answer)) cancel('Operation cancelled.', 0);
      name = answer.trim();
    }
  }

  if (manifest.services[name]) {
    cancel(`A service named "${name}" already exists.`);
  }

  const s = p.spinner();
  s.start(`Scaffolding ${lang} service…`);
  let targetDir: string;
  try {
    targetDir = await generateBackend(config, rootDir, { lang, name });
    await updateManifest(rootDir, (m) => {
      m.services[name] = { path: `services/${name}`, lang };
      m.modules = [...new Set([...m.modules, 'backend'])];
      return m;
    });
    s.stop(pc.green(`✓ ${lang} service generated at services/${name}.`));
  } catch (err) {
    s.stop(pc.red(`✗ Failed to scaffold the ${lang} service.`));
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // Only a node service adds anything to the pnpm lockfile.
  await runInstall(rootDir, wantsInstall && lang === 'node');

  const toolchain: Record<string, string> = {
    node: '',
    go: 'Requires Go 1.22+ — https://go.dev/dl/',
    rust: 'Requires Rust + Cargo — https://rustup.rs',
    python: 'Requires uv — https://docs.astral.sh/uv/',
  };

  p.note(
    [
      `pnpm --filter ${name} dev`,
      '',
      `Health check: http://localhost:${{ node: 3001, go: 3002, rust: 3003, python: 3004 }[lang]}/health`,
      toolchain[lang],
    ]
      .filter(Boolean)
      .join('\n'),
    'Next steps',
  );
  p.outro(pc.green(`Created ${path.relative(rootDir, targetDir)}.`));
}

// ── seo ─────────────────────────────────────────────────────────────────────

async function addSeo(
  config: Config,
  rootDir: string,
  manifest: Manifest,
  wantsInstall: boolean,
) {
  if (manifest.apps.web?.seo) {
    cancel('The SEO module is already installed in apps/web.', 0);
  }

  const aiAnswer = await p.confirm({
    message: 'Include AI / answer-engine optimisation?',
    active: 'Yes — llms.txt, AI crawler rules, machine-readable metadata',
    inactive: 'No',
    initialValue: true,
  });
  if (p.isCancel(aiAnswer)) cancel('Operation cancelled.', 0);

  const s = p.spinner();
  s.start('Adding the SEO module…');
  try {
    await generateSeo({ ...config, seo: true, aiSeo: aiAnswer === true });
    await updateManifest(rootDir, (m) => {
      if (m.apps.web) {
        m.apps.web.seo = true;
        m.apps.web.aiSeo = aiAnswer === true;
      }
      m.modules = [...new Set([...m.modules, 'seo'])];
      return m;
    });
    s.stop(pc.green('✓ SEO module added.'));
  } catch (err) {
    s.stop(pc.red('✗ Failed to add the SEO module.'));
    console.error(err);
    process.exit(1);
  }

  await runInstall(rootDir, wantsInstall);

  p.note(
    [
      'Edit apps/web/src/lib/seo.ts — site name, description and social handles.',
      config.framework === 'next'
        ? 'Routes: src/app/robots.ts, src/app/sitemap.ts, src/app/opengraph-image.tsx'
        : 'Static files: public/robots.txt, public/sitemap.xml',
      '',
      pc.yellow('Note: the root layout was not modified. Import siteMetadata from'),
      pc.yellow('@/lib/seo into your layout to apply it.'),
    ].join('\n'),
    'Next steps',
  );
  p.outro(pc.green('Done.'));
}

async function runInstall(rootDir: string, wanted: boolean) {
  if (!wanted) return;
  const spinner = p.spinner();
  spinner.start('Installing dependencies…');
  try {
    await install(rootDir);
    spinner.stop(pc.green('Dependencies installed.'));
  } catch (err) {
    spinner.stop(pc.yellow('Install failed — run `pnpm install` yourself.'));
    console.error(err);
  }
}

export { BACKEND_LANGS };
