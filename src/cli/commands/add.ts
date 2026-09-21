import * as p from '@clack/prompts';
import path from 'path';

import { readManifest, updateManifest } from '../../utils/manifest.js';
import { install } from '../../utils/pm.js';
import { preflight } from '../../utils/preflight.js';
import { generateExpo } from '../../generators/expo/index.js';
import { generateBackend } from '../../generators/backend/index.js';
import { generateSeo } from '../../generators/seo/index.js';
import { generateDb } from '../../generators/db/index.js';
import { generateAuthUi } from '../../generators/auth-ui.js';
import { generateAgent } from '../../generators/agent.js';
import { generateDocker } from '../../generators/docker.js';
import { compactBanner } from '../../ui/banner.js';
import { t, glyph } from '../../ui/theme.js';
import { commandBlock } from '../../ui/summary.js';
import {
  addFlagsSchema,
  backendLangSchema,
  dbOrmSchema,
  deployTargetSchema,
  BACKEND_LANGS,
  formatZodError,
  MODULES,
  type AddFlags,
  type Config,
  type Manifest,
} from '../../schema.js';

function cancel(message: string, code = 1): never {
  p.cancel(code === 0 ? t.warn(message) : t.error(message));
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
  console.log(compactBanner(module ? `add ${module}` : 'add'));
  console.log();

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
      `Project:         ${t.value(manifest.projectName)}`,
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
    case 'db':
      await addDb(config, rootDir, manifest, flags, wantsInstall);
      break;
    case 'auth-ui':
      await addAuthUi(config, rootDir, manifest, wantsInstall);
      break;
    case 'agent':
      await addAgent(config, rootDir, manifest, flags, wantsInstall);
      break;
    case 'docker':
      await addDocker(config, rootDir, manifest, flags);
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
    s.stop(t.success(`${glyph.tick} Expo app generated.`));
  } catch (err) {
    s.stop(t.error(`${glyph.cross} Failed to scaffold the Expo app.`));
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
  p.outro(t.success('Done.'));
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
    s.stop(t.success(`${glyph.tick} ${lang} service generated at services/${name}.`));
  } catch (err) {
    s.stop(t.error(`${glyph.cross} Failed to scaffold the ${lang} service.`));
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
  p.outro(t.success(`Created ${path.relative(rootDir, targetDir)}.`));
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
    s.stop(t.success(`${glyph.tick} SEO module added.`));
  } catch (err) {
    s.stop(t.error(`${glyph.cross} Failed to add the SEO module.`));
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
      t.warn('Note: the root layout was not modified. Import siteMetadata from'),
      t.warn('@/lib/seo into your layout to apply it.'),
    ].join('\n'),
    'Next steps',
  );
  p.outro(t.success('Done.'));
}

// ── db ──────────────────────────────────────────────────────────────────────

async function addDb(
  config: Config,
  rootDir: string,
  manifest: Manifest,
  flags: AddFlags,
  wantsInstall: boolean,
) {
  if (manifest.db) {
    cancel(`This project already has a ${manifest.db.orm} database package.`, 0);
  }

  let orm = flags.orm;
  if (!orm) {
    if (flags.yes) {
      orm = 'drizzle';
    } else {
      const answer = await p.select({
        message: 'ORM:',
        options: [
          { value: 'drizzle', label: 'Drizzle', hint: 'SQL-first, lightweight, great types' },
          { value: 'prisma', label: 'Prisma', hint: 'schema-first, generated client, Studio' },
        ],
        initialValue: 'drizzle',
      });
      if (p.isCancel(answer)) cancel('Operation cancelled.', 0);
      orm = dbOrmSchema.parse(answer);
    }
  }

  const s = p.spinner();
  s.start(`Scaffolding the ${orm} package…`);
  try {
    await generateDb(config, rootDir, { orm });
    await updateManifest(rootDir, (m) => {
      m.db = { orm, path: 'packages/db' };
      m.packages = [...new Set([...m.packages, 'db'])];
      m.modules = [...new Set([...m.modules, 'db'])];
      return m;
    });
    s.stop(t.success(`${glyph.tick} packages/db created (${orm}).`));
  } catch (err) {
    s.stop(t.error(`${glyph.cross} Failed to scaffold the database package.`));
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  await runInstall(rootDir, wantsInstall);

  p.note(
    [
      'Set DATABASE_URL in packages/db/.env, then:',
      '',
      commandBlock([
        { cmd: `pnpm --filter @xocket/db db:${orm === 'drizzle' ? 'generate' : 'migrate'}` },
        { cmd: 'pnpm --filter @xocket/db db:studio', note: 'browse the data' },
      ]),
      '',
      t.muted('Use it from an app:'),
      t.muted("  pnpm --filter '*/web' add '@xocket/db@workspace:*'"),
    ].join('\n'),
    'Next steps',
  );
  p.outro(t.success('Done.'));
}

// ── auth-ui ─────────────────────────────────────────────────────────────────

async function addAuthUi(
  config: Config,
  rootDir: string,
  manifest: Manifest,
  wantsInstall: boolean,
) {
  if (manifest.modules.includes('auth-ui')) {
    cancel('Auth screens are already installed in apps/web.', 0);
  }

  const s = p.spinner();
  s.start('Generating auth screens…');
  try {
    await generateAuthUi(config);
    await updateManifest(rootDir, (m) => {
      m.modules = [...new Set([...m.modules, 'auth-ui'])];
      return m;
    });
    s.stop(t.success(`${glyph.tick} Auth screens generated for ${config.backend}.`));
  } catch (err) {
    s.stop(t.error(`${glyph.cross} Failed to generate auth screens.`));
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  await runInstall(rootDir, wantsInstall);

  p.note(
    config.framework === 'next'
      ? [
          'Routes:     /sign-in and /sign-up',
          'Component:  src/components/auth/auth-form.tsx',
          'Client:     src/lib/auth/client.ts',
          'Middleware: src/middleware.ts',
          '',
          t.warn('The middleware only checks that a session cookie exists.'),
          t.warn('Verify the session server-side before trusting it.'),
        ].join('\n')
      : [
          'Screens:   src/pages/sign-in.tsx and sign-up.tsx',
          'Component: src/components/auth/auth-form.tsx',
          'Client:    src/lib/auth/client.ts',
          '',
          t.muted('This app has no router — see src/pages/README.md to wire them up.'),
        ].join('\n'),
    'Next steps',
  );
  p.outro(t.success('Done.'));
}

// ── agent (MCP) ─────────────────────────────────────────────────────────────

async function addAgent(
  config: Config,
  rootDir: string,
  manifest: Manifest,
  flags: AddFlags,
  wantsInstall: boolean,
) {
  let name = flags.name;
  if (!name) {
    if (flags.yes) {
      name = 'mcp-server';
    } else {
      const answer = await p.text({
        message: 'Server name:',
        placeholder: 'mcp-server',
        initialValue: 'mcp-server',
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
  s.start('Scaffolding the MCP server…');
  try {
    await generateAgent(config, rootDir, { name });
    await updateManifest(rootDir, (m) => {
      m.services[name] = { path: `services/${name}`, lang: 'node' };
      m.modules = [...new Set([...m.modules, 'agent'])];
      return m;
    });
    s.stop(t.success(`${glyph.tick} MCP server created at services/${name}.`));
  } catch (err) {
    s.stop(t.error(`${glyph.cross} Failed to scaffold the MCP server.`));
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  await runInstall(rootDir, wantsInstall);

  p.note(
    [
      commandBlock([
        { cmd: `pnpm --filter ${name} inspect`, note: 'open the MCP Inspector' },
        { cmd: `pnpm --filter ${name} build` },
      ]),
      '',
      t.muted('Connect it to Claude Code:'),
      t.muted(`  claude mcp add ${name} -- node "$(pwd)/services/${name}/dist/index.js"`),
    ].join('\n'),
    'Next steps',
  );
  p.outro(t.success('Done.'));
}

// ── docker ──────────────────────────────────────────────────────────────────

async function addDocker(
  config: Config,
  rootDir: string,
  manifest: Manifest,
  flags: AddFlags,
) {
  let target = flags.target;
  if (!target) {
    if (flags.yes) {
      target = 'compose';
    } else {
      const answer = await p.select({
        message: 'What should be generated?',
        options: [
          { value: 'compose', label: 'Docker Compose', hint: 'run the whole stack locally' },
          { value: 'k8s', label: 'Kubernetes manifests', hint: 'Deployment + Service per app' },
          { value: 'both', label: 'Both' },
        ],
        initialValue: 'compose',
      });
      if (p.isCancel(answer)) cancel('Operation cancelled.', 0);
      target = deployTargetSchema.parse(answer);
    }
  }

  const s = p.spinner();
  s.start('Generating container manifests…');
  try {
    await generateDocker(config, rootDir, manifest, target);
    await updateManifest(rootDir, (m) => {
      m.modules = [...new Set([...m.modules, 'docker'])];
      return m;
    });
    const count = Object.keys(manifest.services).length + 1;
    s.stop(t.success(`${glyph.tick} Dockerfiles written for ${count} workspace(s).`));
  } catch (err) {
    s.stop(t.error(`${glyph.cross} Failed to generate container manifests.`));
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const notes = [
    commandBlock([{ cmd: 'docker compose up --build', note: 'start the whole stack' }]),
  ];
  if (target !== 'compose') {
    notes.push(
      '',
      t.muted('Kubernetes manifests are in infra/k8s/ — update the image registry'),
      t.muted('and create the secrets they reference before applying.'),
    );
  }
  if (config.framework === 'next') {
    notes.push(
      '',
      t.warn("The Next Dockerfile expects output: 'standalone' in next.config.ts."),
    );
  }

  p.note(notes.join('\n'), 'Next steps');
  p.outro(t.success('Done.'));
}

async function runInstall(rootDir: string, wanted: boolean) {
  if (!wanted) return;
  const spinner = p.spinner();
  spinner.start('Installing dependencies…');
  try {
    await install(rootDir);
    spinner.stop(t.success('Dependencies installed.'));
  } catch (err) {
    spinner.stop(t.error(`${glyph.cross} Install failed.`));
    console.error(err instanceof Error ? err.message : err);
    console.error(
      t.warn('\nThe module files were written, but its dependencies are missing.'),
    );
    console.error(t.warn('Run `pnpm install` in the project root before building.'));
    process.exitCode = 1;
  }
}

export { BACKEND_LANGS };
