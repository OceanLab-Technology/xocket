import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';

/**
 * Generates <rootDir>/turbo.json with the standard task pipeline.
 */
export async function generateTurbo(config: Config) {
  const turboConfig = {
    $schema: 'https://turbo.build/schema.json',
    tasks: {
      build: {
        dependsOn: ['^build'],
        outputs: ['.next/**', '!.next/cache/**', 'dist/**'],
      },
      dev: {
        cache: false,
        persistent: true,
      },
      lint: {},
      'type-check': {},
      'format:check': {},
    },
  };

  await writeFile(
    path.join(config.rootDir, 'turbo.json'),
    JSON.stringify(turboConfig, null, 2) + '\n',
  );
}
