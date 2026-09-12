import * as p from '@clack/prompts';
import pc from 'picocolors';
import ora from 'ora';
import fs from 'fs-extra';

import { collectCreateAnswers } from '../prompts/create.prompts.js';
import { buildConfig } from '../config.js';

// Monorepo generators
import { generateWorkspace } from '../../generators/monorepo/workspace.js';
import { generateTurbo } from '../../generators/monorepo/turbo.js';
import { generateRootGitignore } from '../../generators/monorepo/gitignore.js';
import { generateReadme } from '../../generators/monorepo/readme.js';

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
import { generateRootFile } from '../../generators/wiring.js';

// Root / shared generators
import { generateEslint } from '../../generators/eslint.js';
import { generatePrettier } from '../../generators/prettier.js';
import { generateHusky } from '../../generators/husky.js';
import { gitInit, gitCommit } from '../../generators/git.js';

// Utilities
import { writeManifest, createManifest } from '../../utils/manifest.js';
import { install } from '../../utils/pm.js';
import { printSummary, buildConfiguredList } from '../../utils/log.js';

export async function run({ name }: { name?: string } = {}) {
  p.intro(pc.bgCyan(pc.black(' ✦  Xocket  v2.0.0 ')));
  p.note('Monorepo Development Platform', 'New Project');

  // ── 1. Collect answers & build config ────────────────────────────────────────
  const answers = await collectCreateAnswers({ initialName: name });
  const config = buildConfig(answers);

  if (fs.existsSync(config.rootDir)) {
    p.cancel(pc.red(`Directory '${config.projectName}' already exists. Choose a different name.`));
    process.exit(1);
  }

  const s = p.spinner();
  s.start('Scaffolding monorepo…');

  try {
    // ── Monorepo Root ─────────────────────────────────────────────────────────
    await generateWorkspace(config);       // root package.json + pnpm-workspace.yaml
    await generateTurbo(config);           // turbo.json
    await generateRootGitignore(config);   // root .gitignore
    await generateReadme(config);          // README.md

    // ── Shared Packages ───────────────────────────────────────────────────────
    await generateTypescriptConfig(config);  // packages/typescript-config/
    await generateEslintConfig(config);      // packages/eslint-config/
    await generatePrettierConfig(config);    // packages/prettier-config/

    // ── Web App (apps/web) ────────────────────────────────────────────────────
    await generateProject(config);        // copy template → apps/web
    await generateTypescript(config);     // tsconfig extending shared config
    await generateStyling(config);        // Tailwind (always on)
    await generateShadcn(config);         // shadcn/ui (always on)
    await generateState(config, config.webDir);          // Zustand / Context / Redux / none
    await generateApi(config, config.webDir);            // Axios (always on)
    await generateQuery(config, config.webDir);          // TanStack Query (optional)
    await generateEnvironment(config);    // .env.* files
    await generateAuthentication(config, config.webDir); // Supabase / Cognito / Custom / none
    await generateSentry(config);         // Sentry (always on)
    await generateRootFile(config);       // wire providers → main.tsx / layout.tsx

    // ── Root-Level Quality Tools ──────────────────────────────────────────────
    await generateEslint(config);         // app-level eslint consuming shared config
    await generatePrettier(config);       // root-level prettier
    await generateHusky(config);          // root-level husky + lint-staged

    // ── Manifest ──────────────────────────────────────────────────────────────
    await writeManifest(config.rootDir, createManifest(config));

    s.stop(pc.green('✓ Project files generated.'));

    // ── git init (before pnpm install so husky prepare runs) ─────────────────
    const gitSpinner = ora('Initialising git repository…').start();
    await gitInit(config);
    gitSpinner.succeed(pc.green('Git repository initialised.'));

    // ── pnpm install ──────────────────────────────────────────────────────────
    const installSpinner = ora('Installing dependencies via pnpm… (this may take a minute)').start();
    await install(config.rootDir);
    installSpinner.succeed(pc.green('Dependencies installed.'));

    // ── initial commit (--no-verify skips husky on scaffold commit) ──────────
    const commitSpinner = ora('Creating initial commit…').start();
    await gitCommit(config);
    commitSpinner.succeed(pc.green('Initial commit created.'));

    // ── Summary ───────────────────────────────────────────────────────────────
    const configured = buildConfiguredList(config);
    printSummary(config, configured);

  } catch (err) {
    s.stop(pc.red('✗ Scaffolding failed.'));
    console.error(err);
    if (fs.existsSync(config.rootDir)) {
      await fs.remove(config.rootDir);
      console.log(pc.dim(`Cleaned up: ${config.projectName}/`));
    }
    process.exit(1);
  }
}
