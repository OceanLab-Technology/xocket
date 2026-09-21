import * as p from '@clack/prompts';
import fs from 'fs-extra';

import { collectCreateAnswers } from '../prompts/create.prompts.js';
import { buildConfig } from '../config.js';
import { createFlagsSchema, formatZodError, type CreateFlags } from '../../schema.js';
import { banner } from '../../ui/banner.js';
import { Steps } from '../../ui/steps.js';
import { t, glyph } from '../../ui/theme.js';
import { preflight, hasGit } from '../../utils/preflight.js';
import { loadPreset, presetModules } from '../../utils/preset.js';
import { applyPresetModules } from './apply-modules.js';

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
import { generateUiPackage } from '../../generators/packages/ui.js';
import { generateTesting } from '../../generators/testing.js';
import { generateCiWorkflow } from '../../generators/ci.js';

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
  console.log(banner());
  console.log();

  const flagCheck = createFlagsSchema.safeParse(rawFlags);
  if (!flagCheck.success) {
    p.cancel(t.error(`Invalid options:\n${formatZodError(flagCheck.error)}`));
    process.exit(1);
  }
  const flags = flagCheck.data;

  const wantsInstall = flags.install !== false;
  const wantsGit = flags.git !== false;

  // Fail before touching the filesystem, not halfway through generation.
  const checks = await preflight({ needsInstall: wantsInstall, needsGit: wantsGit });
  for (const warning of checks.warnings) {
    console.log(`${t.warn(glyph.warn)} ${t.muted(warning)}`);
  }
  if (!checks.ok) {
    p.cancel(t.error(checks.errors.join('\n\n')));
    process.exit(1);
  }

  // An org preset supplies defaults for anything not passed as a flag.
  let preset = undefined;
  if (flags.template) {
    try {
      preset = await loadPreset(flags.template);
      console.log(
        `${t.success(glyph.tick)} ${t.muted(`Preset loaded${preset.name ? `: ${preset.name}` : ''}`)}`,
      );
      console.log();
    } catch (err) {
      p.cancel(t.error(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  }

  const answers = await collectCreateAnswers(flags, {
    framework: preset?.framework,
    stateManagement: preset?.stateManagement,
    serverState: preset?.serverState,
    backend: preset?.backend,
    seo: preset?.seo,
    aiSeo: preset?.aiSeo,
  });
  const config = buildConfig(answers);

  if (fs.existsSync(config.rootDir)) {
    p.cancel(t.error(`Directory '${config.projectName}' already exists. Choose a different name.`));
    process.exit(1);
  }

  const gitAvailable = wantsGit && (await hasGit());

  // Phases are counted so the user can see where they are, and where a
  // failure happened — previously ~20 generators ran behind one spinner.
  const presetEntries = preset ? presetModules(preset) : [];
  const phases =
    4 + (presetEntries.length > 0 ? 1 : 0) + (gitAvailable ? 2 : 0) + (wantsInstall ? 2 : 0);
  const steps = new Steps(phases);

  try {
    steps.start('Monorepo root');
    await generateWorkspace(config);
    await generateTurbo(config);
    await generateRootGitignore(config);
    await generateReadme(config);

    steps.start('Shared packages');
    await generateTypescriptConfig(config);
    await generateEslintConfig(config);
    await generatePrettierConfig(config);
    await generateUiPackage(config);

    steps.start(`Web app ${t.muted(`(${config.framework})`)}`);
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
    await generateTesting(config, config.webDir);
    // SEO writes src/lib/seo.ts, which the layout imports — must run first.
    await generateSeo(config);
    await generateRootFile(config);

    // Modules register themselves in the manifest, so it has to exist first.
    await writeManifest(config.rootDir, createManifest(config));

    // Preset modules generate before install/format/commit so their output is
    // formatted and committed like everything else.
    if (presetEntries.length > 0) {
      steps.start(`Preset modules ${t.muted(presetEntries.map((m) => m.module).join(', '))}`);
      await applyPresetModules(config, presetEntries, steps);
    }

    steps.start('Tooling');
    await generateEslint(config);
    await generateRootEslint(config);
    await generatePrettier(config);
    await generateHusky(config);
    await generateCiWorkflow(config);

    // git init runs before install so husky's prepare script has a repo.
    if (gitAvailable) {
      steps.start('Git repository');
      await gitInit(config);
    }

    if (wantsInstall) {
      steps.start(`Installing dependencies ${t.muted('(this takes a minute)')}`);
      await install(config.rootDir);

      steps.start('Formatting');
      await formatProject(config.rootDir);
    }

    if (gitAvailable) {
      steps.start('Initial commit');
      await gitCommit(config);
    }

    steps.succeed();

    printSummary(config, buildConfiguredList(config), { installed: wantsInstall });
  } catch (err) {
    steps.fail('Scaffolding failed.');
    console.error();
    console.error(err instanceof Error ? t.error(err.message) : err);

    // Only ever remove a directory this run created — the existsSync guard
    // above guarantees it did not exist beforehand.
    if (fs.existsSync(config.rootDir)) {
      await fs.remove(config.rootDir);
      console.error(t.muted(`Cleaned up ${config.projectName}/`));
    }
    process.exit(1);
  }
}
