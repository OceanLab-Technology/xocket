import type { Config } from '../../types.js';
import type { BackendLang } from './types.js';
import path from 'path';
import fs from 'fs-extra';
import { writeFile, ensureDir } from '../../utils/file.js';
import { generateNodeService } from './node.js';
import { generateGoService } from './go.js';
import { generateRustService } from './rust.js';
import { generatePythonService } from './python.js';

/**
 * Adds a backend service under services/<name>.
 *
 * Non-JS languages join the Turborepo graph through a thin package.json whose
 * `build`/`dev` scripts shell out to the native toolchain — the same shim
 * approach as vanshpatelx/multi-lang-turborepo. Turbo then caches Go, Rust and
 * Python builds alongside the JS ones, and `pnpm dev` starts everything.
 *
 * Each service is its own pnpm workspace member, so `services/*` is part of
 * pnpm-workspace.yaml from the moment the monorepo is created.
 */
export async function generateBackend(
  config: Config,
  rootDir: string,
  opts: { lang: BackendLang; name: string },
): Promise<string> {
  const { lang, name } = opts;
  const targetDir = path.join(rootDir, 'services', name);

  if (await fs.pathExists(targetDir)) {
    throw new Error(`services/${name} already exists — choose a different service name.`);
  }

  await ensureDir(targetDir);

  switch (lang) {
    case 'node':
      await generateNodeService(config, targetDir, name);
      break;
    case 'go':
      await generateGoService(config, targetDir, name);
      break;
    case 'rust':
      await generateRustService(config, targetDir, name);
      break;
    case 'python':
      await generatePythonService(config, targetDir, name);
      break;
  }

  await writeServiceReadme(targetDir, name, lang);
  return targetDir;
}

const TOOLCHAIN: Record<BackendLang, { needs: string; install: string }> = {
  node: { needs: 'Node (already installed)', install: '—' },
  go: { needs: 'Go 1.22+', install: 'https://go.dev/dl/' },
  rust: { needs: 'Rust (stable) + Cargo', install: 'https://rustup.rs' },
  python: { needs: 'Python 3.11+ and uv', install: 'https://docs.astral.sh/uv/' },
};

async function writeServiceReadme(targetDir: string, name: string, lang: BackendLang) {
  const tc = TOOLCHAIN[lang];
  await writeFile(
    path.join(targetDir, 'README.md'),
    `# ${name}

A ${lang} service in this monorepo.

## Toolchain

Requires **${tc.needs}**.${tc.install === '—' ? '' : `\nInstall: ${tc.install}`}

The package.json in this directory exists so Turborepo can see the service; its
scripts delegate to the ${lang} toolchain. Turbo caches the build output the
same way it caches a JS package.

## Commands

Run from the monorepo root:

\`\`\`bash
pnpm dev                      # starts every app and service
pnpm --filter ${name} dev     # just this one
pnpm --filter ${name} build
\`\`\`
`,
  );
}
