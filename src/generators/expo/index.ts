import type { Config } from '../../types.js';
import path from 'path';

import { generateExpoProject } from './project.js';
import { generateExpoStyling } from './styling.js';
import { generateExpoWiring } from './wiring.js';

import { generateState } from '../state.js';
import { generateApi } from '../api.js';
import { generateQuery } from '../query.js';
import { generateAuthentication } from '../authentication.js';
import { generateEnvironment } from '../environment.js';
import { deriveAppConfig } from '../../cli/config.js';

/**
 * Scaffolds apps/expo, mirroring whatever stack the web app already uses.
 *
 * The shared generators are driven by a config derived with `target: 'expo'`,
 * which is what routes them to EXPO_PUBLIC_ env vars and `process.env` instead
 * of the web app's Vite/Next conventions. The previous version spread the web
 * config and overrode only `framework`, leaving `isNext`/`isReact` describing
 * the wrong app.
 */
export async function generateExpo(config: Config, rootDir: string) {
  const targetDir = path.join(rootDir, 'apps', 'expo');

  // Expo runs React, never Next — but it is its own target.
  const expoConfig = deriveAppConfig(config, { framework: 'react', target: 'expo' });

  await generateExpoProject(expoConfig, targetDir);
  await generateExpoStyling(targetDir);
  await generateState(expoConfig, targetDir);
  await generateApi(expoConfig, targetDir);
  await generateQuery(expoConfig, targetDir);
  await generateAuthentication(expoConfig, targetDir);
  await generateEnvironment(expoConfig, targetDir);
  await generateExpoWiring(expoConfig, targetDir);
}
