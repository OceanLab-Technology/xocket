import { describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = fs.readJsonSync(path.join(root, 'package.json'));

/** Every .ts file under src/, recursively. */
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.isFile() && entry.name.endsWith('.ts') ? [full] : [];
  });
}

/**
 * Remove every template-literal span from a source file.
 *
 * Generators embed the *generated* project's code inside backticks, and those
 * import lines start at column 0 just like real ones — so scanning the raw text
 * would report `next`, `react` and every other emitted dependency as missing.
 */
function stripTemplateLiterals(source: string): string {
  let out = '';
  let inLiteral = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!;

    if (ch === '\\') {
      // Skip the escaped character so an escaped backtick does not flip state.
      if (!inLiteral) out += ch + (source[i + 1] ?? '');
      i++;
      continue;
    }

    if (ch === '`') {
      inLiteral = !inLiteral;
      continue;
    }

    if (!inLiteral) out += ch;
  }

  return out;
}

/** Bare specifiers this package imports at runtime. */
function runtimeImports(): Set<string> {
  const found = new Set<string>();
  const pattern = /^\s*import\s[^\n]*?from\s+'([^']+)'/gm;

  for (const file of sourceFiles(path.join(root, 'src'))) {
    const body = stripTemplateLiterals(fs.readFileSync(file, 'utf-8'));

    for (const match of body.matchAll(pattern)) {
      const spec = match[1]!;
      // Relative imports and Node builtins need no declaration. Builtins are
      // matched with or without the `node:` prefix.
      if (spec.startsWith('.') || isBuiltin(spec)) continue;
      // Scoped packages keep two segments; others keep one.
      const name = spec.startsWith('@')
        ? spec.split('/').slice(0, 2).join('/')
        : spec.split('/')[0]!;
      found.add(name);
    }
  }
  return found;
}

describe('package.json', () => {
  const deps = Object.keys(pkg.dependencies ?? {});
  const devDeps = Object.keys(pkg.devDependencies ?? {});

  it('declares every package src/ imports as a runtime dependency', () => {
    // `pnpm add -D` on an existing runtime dependency silently moves it to
    // devDependencies. The published CLI then crashes on first run with
    // ERR_MODULE_NOT_FOUND, which no unit test would catch.
    const missing = [...runtimeImports()].filter((name) => !deps.includes(name));
    expect(missing, `not in "dependencies": ${missing.join(', ')}`).toEqual([]);
  });

  it('keeps no package in both dependencies and devDependencies', () => {
    // npm resolves a duplicate to devDependencies, so it is absent from an
    // end user's install.
    const both = deps.filter((d) => devDeps.includes(d));
    expect(both, `declared twice: ${both.join(', ')}`).toEqual([]);
  });

  it('ships dist and templates, and nothing else', () => {
    expect(pkg.files).toContain('dist/');
    expect(pkg.files).toContain('templates/');
  });

  it('points bin at the built entry point', () => {
    expect(pkg.bin).toHaveProperty('xocket');
    expect(pkg.bin.xocket).toBe('./dist/index.js');
  });

  it('keeps the CLI version as the single source of truth', () => {
    // src/version.ts reads this at runtime; nothing else should hardcode it.
    const hardcoded = sourceFiles(path.join(root, 'src'))
      .filter((f) => !f.endsWith('version.ts'))
      .filter((f) => fs.readFileSync(f, 'utf-8').includes(`'${pkg.version}'`));
    expect(hardcoded.map((f) => path.relative(root, f))).toEqual([]);
  });
});
