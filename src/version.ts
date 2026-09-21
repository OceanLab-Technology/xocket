import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The CLI version, read from package.json at startup.
 *
 * Previously this string was duplicated in five places and drifted; it now has
 * exactly one source. dist/ sits one level below the package root, so `..`
 * resolves correctly for both `tsx src/` and the published build.
 */
function readVersion(): string {
  // dist/version.js -> ../package.json;  lib/xocket.mjs -> ../package.json
  for (const candidate of ['../package.json', '../../package.json']) {
    const file = path.resolve(__dirname, candidate);
    try {
      const pkg = fs.readJsonSync(file);
      if (pkg?.name === 'xocket' && typeof pkg.version === 'string') return pkg.version;
    } catch {
      // try the next candidate
    }
  }
  return '0.0.0';
}

export const VERSION = readVersion();

/** The banner shown at the top of every command. */
export const BANNER = ` ✦  Xocket  v${VERSION} `;
