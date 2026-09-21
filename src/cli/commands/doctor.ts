import pc from 'picocolors';
import path from 'path';
import fs from 'fs-extra';

import { readManifest } from '../../utils/manifest.js';
import { compactBanner } from '../../ui/banner.js';
import { t, glyph, rule } from '../../ui/theme.js';
import { DEPS, NODE_ENGINE } from '../../versions.js';
import { VERSION } from '../../version.js';

type Severity = 'error' | 'warn' | 'ok';

interface Finding {
  severity: Severity;
  title: string;
  detail?: string;
  fix?: string;
}

/**
 * `xocket doctor` — check an existing project against the current generator.
 *
 * Projects created by an older Xocket carry bugs that were since fixed, and
 * there was no way to find out short of regenerating. This reports what drifted
 * and what to do about it.
 */
export async function run(): Promise<void> {
  console.log(compactBanner('doctor'));
  console.log();

  const found = await readManifest(process.cwd()).catch((err: Error) => {
    console.error(t.error(err.message));
    process.exit(1);
  });

  if (!found) {
    console.error(t.error('Not a Xocket project — no .xocket/config.json found here or above.'));
    process.exit(1);
  }

  const { rootDir, manifest } = found;
  const findings: Finding[] = [];

  await checkEnvironment(findings);
  await checkGeneratorDrift(rootDir, manifest, findings);
  await checkKnownBreakage(rootDir, manifest, findings);
  await checkHygiene(rootDir, findings);

  report(rootDir, manifest.projectName, findings);
}

// ── Checks ──────────────────────────────────────────────────────────────────

async function checkEnvironment(out: Finding[]) {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) {
    out.push({
      severity: 'error',
      title: `Node ${process.versions.node} is too old`,
      detail: `This template requires Node ${NODE_ENGINE}.`,
      fix: 'Install a newer Node (nvm install 22).',
    });
  } else {
    out.push({ severity: 'ok', title: `Node ${process.versions.node}` });
  }
}

async function checkGeneratorDrift(rootDir: string, manifest: { version: string }, out: Finding[]) {
  if (manifest.version === VERSION) {
    out.push({ severity: 'ok', title: `Created with Xocket ${manifest.version} (current)` });
    return;
  }

  const older = compareVersions(manifest.version, VERSION) < 0;
  out.push({
    severity: older ? 'warn' : 'ok',
    title: `Created with Xocket ${manifest.version}, running ${VERSION}`,
    detail: older
      ? 'Newer generators fix bugs this project may still carry — see the checks below.'
      : undefined,
  });

  // Anything generated before 3.0 predates the stack refresh.
  if (older && Number(manifest.version.split('.')[0]) < 3) {
    const webPkgPath = path.join(rootDir, 'apps/web/package.json');
    if (await fs.pathExists(webPkgPath)) {
      const pkg = await fs.readJson(webPkgPath);
      const all = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [name, wanted] of [
        ['react', DEPS.react],
        ['next', DEPS.next],
        ['tailwindcss', DEPS.tailwindcss],
      ] as const) {
        const have = all[name];
        if (!have) continue;
        if (majorOf(have) < majorOf(wanted)) {
          out.push({
            severity: 'warn',
            title: `${name} ${have} is behind ${wanted}`,
            fix: `pnpm --filter '*/web' add ${name}@latest`,
          });
        }
      }
    }
  }
}

/** Each of these is a bug that shipped in an earlier release. */
async function checkKnownBreakage(
  rootDir: string,
  manifest: { apps: Record<string, { framework: string }> },
  out: Finding[],
) {
  const web = path.join(rootDir, 'apps/web');
  const has = (p: string) => fs.pathExists(path.join(web, p));

  // Shared tsconfig owning include/paths made tsc report TS18003.
  const sharedWeb = path.join(rootDir, 'packages/typescript-config/web.json');
  if (await fs.pathExists(sharedWeb)) {
    const cfg = await fs.readJson(sharedWeb);
    if (cfg.include || cfg.compilerOptions?.baseUrl || cfg.compilerOptions?.paths) {
      out.push({
        severity: 'error',
        title: 'Shared tsconfig declares include/baseUrl/paths',
        detail:
          'TypeScript resolves those against packages/typescript-config, not your app, so `tsc` finds no files (TS18003).',
        fix: 'Move include/exclude/paths into apps/*/tsconfig.json and drop baseUrl.',
      });
    }
  }

  // exports map missing the .js specifier apps actually import.
  const eslintPkg = path.join(rootDir, 'packages/eslint-config/package.json');
  if (await fs.pathExists(eslintPkg)) {
    const pkg = await fs.readJson(eslintPkg);
    const exportsMap = pkg.exports ?? {};
    if (exportsMap['./react'] && !exportsMap['./react.js']) {
      out.push({
        severity: 'error',
        title: "eslint-config exports './react' but not './react.js'",
        detail: 'Apps import the .js specifier, so lint fails with ERR_PACKAGE_PATH_NOT_EXPORTED.',
        fix: 'Add "./react.js": "./react.js" to the exports map.',
      });
    }
  }

  // prettier-config shipping ESM without type: module.
  const prettierPkg = path.join(rootDir, 'packages/prettier-config/package.json');
  if (await fs.pathExists(prettierPkg)) {
    const pkg = await fs.readJson(prettierPkg);
    const index = path.join(rootDir, 'packages/prettier-config/index.js');
    if (pkg.type !== 'module' && (await fs.pathExists(index))) {
      const body = await fs.readFile(index, 'utf-8');
      if (body.includes('export default')) {
        out.push({
          severity: 'error',
          title: 'prettier-config uses ESM syntax without "type": "module"',
          fix: 'Add "type": "module" to packages/prettier-config/package.json.',
        });
      }
    }
  }

  // Tailwind v3 config containing a top-level await.
  for (const f of ['tailwind.config.js', 'tailwind.config.ts']) {
    if (await has(f)) {
      const body = await fs.readFile(path.join(web, f), 'utf-8');
      if (body.includes('await import')) {
        out.push({
          severity: 'error',
          title: `${f} contains a top-level await`,
          detail:
            "Tailwind's config loader transpiles to CJS and throws on it, so no CSS is produced.",
          fix: 'Use a static import, or migrate to Tailwind v4 (no config file).',
        });
      }
    }
  }

  // Both next configs present — Next reads only one.
  if (
    manifest.apps.web?.framework === 'next' &&
    (await has('next.config.js')) &&
    (await has('next.config.ts'))
  ) {
    out.push({
      severity: 'error',
      title: 'Both next.config.js and next.config.ts exist',
      detail:
        'Next loads one and silently ignores the other, which usually means Sentry never gets applied.',
      fix: 'Delete apps/web/next.config.js.',
    });
  }

  // --ext was removed in ESLint 9.
  const webPkgPath = path.join(web, 'package.json');
  if (await fs.pathExists(webPkgPath)) {
    const pkg = await fs.readJson(webPkgPath);
    const lint = pkg.scripts?.lint ?? '';
    const eslintVersion = pkg.devDependencies?.eslint ?? '';
    if (lint.includes('--ext') && majorOf(eslintVersion) >= 9) {
      out.push({
        severity: 'error',
        title: 'lint script uses --ext on ESLint 9+',
        detail: '--ext was removed in ESLint 9; flat config discovers files itself.',
        fix: `Change the lint script to "eslint .".`,
      });
    }
  }

  // Root scripts and hooks invoking tools the root does not depend on.
  const rootPkgPath = path.join(rootDir, 'package.json');
  if (await fs.pathExists(rootPkgPath)) {
    const pkg = await fs.readJson(rootPkgPath);
    const dev = { ...pkg.devDependencies, ...pkg.dependencies };
    const hook = path.join(rootDir, '.husky/pre-commit');
    const lintStaged = JSON.stringify(pkg['lint-staged'] ?? {});

    if ((await fs.pathExists(hook)) && lintStaged.includes('eslint') && !dev.eslint) {
      out.push({
        severity: 'error',
        title: 'pre-commit runs eslint but the root does not depend on it',
        detail: 'pnpm does not hoist an app dependency to the root, so every commit fails.',
        fix: `pnpm add -w -D eslint@${DEPS.eslint}`,
      });
    }

    const prettierrc = path.join(rootDir, '.prettierrc');
    const usesShared =
      pkg.prettier === '@xocket/prettier-config' ||
      ((await fs.pathExists(prettierrc)) &&
        (await fs.readFile(prettierrc, 'utf-8')).includes('@xocket/prettier-config'));
    if (usesShared && !dev['@xocket/prettier-config']) {
      out.push({
        severity: 'error',
        title: 'Root Prettier config references @xocket/prettier-config without depending on it',
        fix: "pnpm add -w -D '@xocket/prettier-config@workspace:*'",
      });
    }
  }

  // Expo inheriting web env conventions.
  const expoAxios = path.join(rootDir, 'apps/expo/src/api/axios.ts');
  if (await fs.pathExists(expoAxios)) {
    const body = await fs.readFile(expoAxios, 'utf-8');
    if (body.includes('import.meta.env') || body.includes('NEXT_PUBLIC_')) {
      out.push({
        severity: 'error',
        title: 'Expo app reads web-only environment variables',
        detail:
          'Neither import.meta.env nor NEXT_PUBLIC_* exists under Metro, so the value is undefined at runtime.',
        fix: 'Use EXPO_PUBLIC_* via process.env.',
      });
    }
  }
}

async function checkHygiene(rootDir: string, out: Finding[]) {
  // Committed env files.
  const gitignore = path.join(rootDir, '.gitignore');
  if (await fs.pathExists(gitignore)) {
    const body = await fs.readFile(gitignore, 'utf-8');
    if (!body.includes('.env')) {
      out.push({
        severity: 'error',
        title: '.gitignore does not exclude .env files',
        fix: 'Add .env, .env.development, .env.staging and .env.production.',
      });
    }
  }

  // Two lockfiles means two sources of truth.
  const locks = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'].filter((f) =>
    fs.existsSync(path.join(rootDir, f)),
  );
  if (locks.length > 1) {
    out.push({
      severity: 'warn',
      title: `Multiple lockfiles present: ${locks.join(', ')}`,
      fix: 'Keep pnpm-lock.yaml and delete the others.',
    });
  }

  if (!(await fs.pathExists(path.join(rootDir, '.github/workflows')))) {
    out.push({
      severity: 'warn',
      title: 'No CI workflow',
      detail: 'Nothing verifies that lint, type-check and build still pass.',
      fix: 'Add .github/workflows/ci.yml — see the Xocket README.',
    });
  }
}

// ── Reporting ───────────────────────────────────────────────────────────────

function report(rootDir: string, projectName: string, findings: Finding[]) {
  const errors = findings.filter((f) => f.severity === 'error');
  const warns = findings.filter((f) => f.severity === 'warn');
  const oks = findings.filter((f) => f.severity === 'ok');

  console.log(`  ${pc.bold('Project')}  ${t.value(projectName)}`);
  console.log(`  ${pc.bold('Path')}     ${t.muted(rootDir)}`);
  console.log();

  for (const f of oks) {
    console.log(`  ${t.success(glyph.tick)} ${t.muted(f.title)}`);
  }

  for (const f of [...errors, ...warns]) {
    const badge =
      f.severity === 'error' ? t.error(`${glyph.cross} error`) : t.warn(`${glyph.warn} warn `);
    console.log();
    console.log(`  ${badge}  ${pc.bold(f.title)}`);
    if (f.detail) console.log(`          ${t.muted(f.detail)}`);
    if (f.fix) console.log(`          ${t.muted('fix:')} ${t.code(f.fix)}`);
  }

  console.log();
  console.log(rule());

  if (errors.length === 0 && warns.length === 0) {
    console.log(`\n  ${t.success(`${glyph.tick} Everything looks healthy.`)}\n`);
    return;
  }

  const parts = [
    errors.length ? t.error(`${errors.length} error${errors.length === 1 ? '' : 's'}`) : null,
    warns.length ? t.warn(`${warns.length} warning${warns.length === 1 ? '' : 's'}`) : null,
  ].filter(Boolean);

  console.log(`\n  ${parts.join(t.muted(' · '))}\n`);

  // Errors mean the project is actually broken, so fail the process for CI.
  if (errors.length > 0) process.exitCode = 1;
}

// ── Version helpers ─────────────────────────────────────────────────────────

function majorOf(range: string): number {
  const m = /(\d+)/.exec(range.replace(/^[^\d]*/, ''));
  return m ? Number(m[1]) : 0;
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
