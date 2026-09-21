import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';

/**
 * Generates <rootDir>/turbo.json.
 *
 * `outputs` covers Rust (`target/release`), Go (`bin`) and Python builds too,
 * so polyglot services added later are cached correctly. `.env*` is declared as
 * an input so a changed env file busts the build cache.
 */
export async function generateTurbo(config: Config) {
  const turboConfig = {
    $schema: 'https://turbo.build/schema.json',
    ui: 'tui',
    globalDependencies: ['**/.env.*local', 'pnpm-lock.yaml'],
    tasks: {
      build: {
        dependsOn: ['^build'],
        inputs: ['$TURBO_DEFAULT$', '.env*'],
        outputs: [
          '.next/**',
          '!.next/cache/**',
          'dist/**',
          'build/**',
          'target/release/**',
          'bin/**',
        ],
      },
      dev: {
        cache: false,
        persistent: true,
      },
      lint: { dependsOn: ['^lint'] },
      'type-check': { dependsOn: ['^type-check'] },
      test: { dependsOn: ['^build'], outputs: ['coverage/**'] },
      'format:check': {},
    },
  };

  await writeFile(
    path.join(config.rootDir, 'turbo.json'),
    JSON.stringify(turboConfig, null, 2) + '\n',
  );
}
