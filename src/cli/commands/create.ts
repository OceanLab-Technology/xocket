import * as p from '@clack/prompts';
import pc from 'picocolors';
import ora from 'ora';
import fs from 'fs-extra';

import { collectCreateAnswers } from '../prompts/create.prompts.js';
import { buildConfig } from '../config.js';
import { createFlagsSchema, formatZodError, type CreateFlags } from '../../schema.js';
import { BANNER } from '../../version.js';
import { preflight, hasGit } from '../../utils/preflight.js';

// Monorepo generators
import { generateWorkspace } from '../../generators/monorepo/workspace.js';
import { generateTurbo } from '../../generators/monorepo/turbo.js';
import { generateRootGitignore } from '../../generators/monorepo/gitignore.js';
import { generateReadme } from '../../generators/monorepo/readme.js';
import { generateRootEslint } from '../../generators/monorepo/root-eslint.js';

// Shared package generators
import { generateTypescriptConfig } from '../../generators/packages/typescript-config.js';
import { generateEslintConfig } from '../../generators/packages/eslint-config.js';
import { generatePrettierConfig } from '../../generators/packages/prettier-config.js';

// Web app generators
import { generateProject } from '../../generators/project.js';
import { generateTypescript } from '../../generators/typescript.js';
import { generateStyling } from '../../generators/styling.js';
import { generateShadcn } from '../../generators/web/shadcn.js';
import { generateState } from '../../generators/state.js';
import { generateApi } from '../../generators/api.js';
import { generateQuery } from '../../generators/query.js';
import { generateEnvironment } from '../../generators/environment.js';
import { generateAuthentication } from '../../generators/authentication.js';
import { generateSentry } from '../../generators/sentry.js';
import { generateSeo } from '../../generators/seo/index.js';
import { generateRootFile } from '../../generators/wiring.js';

// Root / shared generators
import { generateEslint } from '../../generators/eslint.js';
import { generatePrettier } from '../../generators/prettier.js';
import { generateHusky } from '../../generators/husky.js';
import { gitInit, gitCommit } from '../../generators/git.js';

// Utilities
import { writeManifest, createManifest } from '../../utils/manifest.js';
import { install, formatProject } from '../../utils/pm.js';
import { printSummary, buildConfiguredList } from '../../utils/log.js';

export async function run(rawFlags: CreateFlags & { name?: string } = {}) {
  p.intro(pc.bgCyan(pc.black(BANNER)));

  const flagCheck = createFlagsSchema.safeParse(rawFlags);
  if (!flagCheck.success) {
    p.cancel(pc.red(`Invalid options:\n${formatZodError(flagCheck.error)}`));
    process.exit(1);
  }
  const flags = flagCheck.data;

  const wantsInstall = flags.install !== false;
  const wantsGit = flags.git !== false;

  // Fail before touching the filesystem, not halfway through generation.
  const checks = await preflight({ needsInstall: wantsInstall, needsGit: wantsGit });
  for (const warning of checks.warnings) p.log.warn(pc.yellow(warning));
  if (!checks.ok) {
    p.cancel(pc.red(checks.errors.join('\n\n')));
    process.exit(1);
  }

  const answers = await collectCreateAnswers(flags);
  const config = buildConfig(answers);

  if (fs.existsSync(config.rootDir)) {
    p.cancel(
      pc.red(`Directory '${config.projectName}' already exists. Choose a different name.`),
    );
    process.exit(1);
  }

  const gitAvailable = wantsGit && (await hasGit());
  const s = p.spinner();
  s.start('Scaffolding monorepo…');

  try {
    // ── Monorepo root ─────────────────────────────────────────────────────
    await generateWorkspace(config);
    await generateTurbo(config);
    await generateRootGitignore(config);
    await generateReadme(config);

    // ── Shared packages ───────────────────────────────────────────────────
    await generateTypescriptConfig(config);
    await generateEslintConfig(config);
    await generatePrettierConfig(config);

    // ── Web app (apps/web) ────────────────────────────────────────────────
    await generateProject(config);
    await generateTypescript(config);
    await generateStyling(config);
    await generateShadcn(config);
    await generateState(config, config.webDir);
    await generateApi(config, config.webDir);
    await generateQuery(config, config.webDir);
    await generateEnvironment(config);
    await generateAuthentication(config, config.webDir);
    await generateSentry(config);
    // SEO writes src/lib/seo.ts, which wiring imports — must run first.
    await generateSeo(config);
    await generateRootFile(config);

    // ── Root-level quality tooling ────────────────────────────────────────
    await generateEslint(config);
    await generateRootEslint(config);
    await generatePrettier(config);
    await generateHusky(config);

    await writeManifest(config.rootDir, createManifest(config));

    s.stop(pc.green('✓ Project files generated.'));

    // git init runs before install so husky's prepare script has a repo.
    if (gitAvailable) {
      const spinner = ora('Initialising git repository…').start();
      await gitInit(config);
      spinner.succeed(pc.green('Git repository initialised.'));
    }

    if (wantsInstall) {
      const spinner = ora('Installing dependencies via pnpm… (this may take a minute)').start();
      await install(config.rootDir);
      spinner.succeed(pc.green('Dependencies installed.'));
    }

    // Formatting needs the installed Prettier, and must precede the commit so
    // the pre-commit hook has nothing to reformat later.
    if (wantsInstall) {
      const spinner = ora('Formatting…').start();
      const ok = await formatProject(config.rootDir);
      if (ok) spinner.succeed(pc.green('Formatted.'));
      else spinner.warn(pc.yellow('Could not format — run `pnpm format` yourself.'));
    }

    if (gitAvailable) {
      const spinner = ora('Creating initial commit…').start();
      await gitCommit(config);
      spinner.succeed(pc.green('Initial commit created.'));
    }

    printSummary(config, buildConfiguredList(config), {
      installed: wantsInstall,
    });
  } catch (err) {
    s.stop(pc.red('✗ Scaffolding failed.'));
    console.error(err);

    // Only ever remove a directory this run created — the existsSync guard
    // above guarantees it did not exist beforehand.
    if (fs.existsSync(config.rootDir)) {
      await fs.remove(config.rootDir);
      console.error(pc.dim(`Cleaned up: ${config.projectName}/`));
    }
    process.exit(1);
  }
}
