import type { Config } from '../../types.js';
import path from 'path';

import { generateProject } from './project.js';
import { generateMetroConfig } from './metro.js';
import { generateStyling } from './styling.js';
import { generateWiring } from './wiring.js';

import { generateState } from '../state.js';
import { generateApi } from '../api.js';
import { generateQuery } from '../query.js';
import { generateAuthentication } from '../authentication.js';

export async function generateExpo(config: Config, rootDir: string) {
  const targetDir = path.join(rootDir, 'apps', 'expo');

  // 1. Scaffold project files and dependencies
  await generateProject(config, targetDir);

  // 2. Metro workspace configuration
  await generateMetroConfig(targetDir);

  // 3. Styling (NativeWind)
  await generateStyling(targetDir);

  // 4. State Management (Zustand, Redux, Context)
  await generateState(config, targetDir);

  // 5. API layer (Axios)
  await generateApi(config, targetDir);

  // 6. Server State (TanStack Query)
  await generateQuery(config, targetDir);

  // 7. Authentication
  // Note: This relies on the generators being environment-agnostic. 
  // We use the 'react' framework path since Expo runs React.
  const proxyConfig = { ...config, framework: 'react' };
  await generateAuthentication(proxyConfig, targetDir);

  // 8. Wire Providers
  await generateWiring(config, targetDir);
}
