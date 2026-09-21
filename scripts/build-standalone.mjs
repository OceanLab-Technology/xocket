#!/usr/bin/env node
/**
 * Build the standalone tarball that `get.xocket.sh` installs.
 *
 * This is the same JavaScript as the npm package, bundled into one file with
 * its dependencies inlined so the install script does not need a package
 * manager. It is deliberately NOT a compiled binary: embedding a runtime costs
 * ~60 MB per platform, needs Apple notarization to avoid Gatekeeper, and would
 * force the templates to become build-time assets instead of plain files.
 * Node is required to run the project Xocket generates anyway.
 *
 * Layout inside the tarball:
 *
 *   xocket/
 *   ├── bin/xocket        shim on PATH
 *   ├── lib/xocket.mjs    bundle
 *   ├── package.json      read at runtime for the version
 *   ├── templates/        copied verbatim, still editable
 *   ├── LICENSE
 *   └── NOTICE
 */
import { build } from 'esbuild';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = await fs.readJson(path.join(root, 'package.json'));
const outDir = path.join(root, 'build');
const stage = path.join(outDir, 'xocket');

await fs.remove(outDir);
await fs.ensureDir(path.join(stage, 'bin'));
await fs.ensureDir(path.join(stage, 'lib'));

// ── Bundle ───────────────────────────────────────────────────────────────────

const result = await build({
  entryPoints: [path.join(root, 'src/index.ts')],
  outfile: path.join(stage, 'lib/xocket.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  minify: false, // Keep stack traces readable; 1.5 MB either way.
  sourcemap: false,
  // `import.meta.url` must resolve to lib/, which is what the template and
  // version lookups walk up from.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
  metafile: true,
});

const bundleBytes = Object.values(result.metafile.outputs)[0].bytes;

// ── Stage the rest ───────────────────────────────────────────────────────────

await fs.copy(path.join(root, 'templates'), path.join(stage, 'templates'), {
  filter: (src) => !src.includes('node_modules') && !src.endsWith('.DS_Store'),
});

for (const file of ['LICENSE', 'NOTICE', 'README.md']) {
  await fs.copy(path.join(root, file), path.join(stage, file));
}

// A minimal manifest: the runtime only reads `name` and `version`, and shipping
// the full one would advertise dependencies that are already bundled.
await fs.writeJson(
  path.join(stage, 'package.json'),
  {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: 'module',
    license: pkg.license,
    author: pkg.author,
    homepage: pkg.homepage,
  },
  { spaces: 2 },
);

const shim = `#!/usr/bin/env node
// Shim installed on PATH. Keeps the bundle out of the user's way.
import '../lib/xocket.mjs';
`;
await fs.writeFile(path.join(stage, 'bin/xocket'), shim, { mode: 0o755 });

// ── Pack ─────────────────────────────────────────────────────────────────────

const tarball = path.join(outDir, `xocket-${pkg.version}.tar.gz`);
await execa('tar', ['-czf', tarball, '-C', outDir, 'xocket']);

const digest = createHash('sha256')
  .update(await fs.readFile(tarball))
  .digest('hex');
await fs.writeFile(`${tarball}.sha256`, `${digest}  xocket-${pkg.version}.tar.gz\n`);

const size = (await fs.stat(tarball)).size;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

console.log(`bundle     ${mb(bundleBytes)}`);
console.log(`tarball    ${mb(size)}  ${path.relative(root, tarball)}`);
console.log(`sha256     ${digest}`);
