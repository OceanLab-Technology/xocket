import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';
import { nestJsx } from '../../utils/jsx.js';

/**
 * Writes apps/expo/app/_layout.tsx with the selected providers wired in.
 *
 * Provider instances (QueryClient, Amplify config) are created at module scope
 * exactly once, below the imports — the previous version interleaved statements
 * into the import list, which is invalid at the top of a module.
 */
export async function generateExpoWiring(config: Config, targetDir: string) {
  const { stateManagement, serverState, backend } = config;

  const imports = [`import '../global.css'`, '', `import { Slot } from 'expo-router'`];
  const setup: string[] = [];
  const wrappers: [string, string][] = [];

  if (stateManagement === 'redux') {
    imports.push(`import { Provider } from 'react-redux'`);
    imports.push(`import { store } from '../src/store'`);
    wrappers.push(['Provider store={store}', 'Provider']);
  }

  if (serverState === 'tanstack') {
    imports.push(`import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`);
    setup.push(`const queryClient = new QueryClient()`);
    wrappers.push(['QueryClientProvider client={queryClient}', 'QueryClientProvider']);
  }

  if (stateManagement === 'context') {
    imports.push(`import { AppProvider } from '../src/context/AppContext'`);
    wrappers.push(['AppProvider', 'AppProvider']);
  }

  if (backend === 'cognito') {
    imports.push(`import { configureAmplify } from '../src/lib/auth/cognito'`);
    setup.push(`configureAmplify()`);
  }

  const inner = nestJsx('<Slot />', wrappers, '    ');

  const content = `${imports.join('\n')}
${setup.length ? '\n' + setup.join('\n') + '\n' : ''}
export default function RootLayout() {
  return (
    ${inner}
  )
}
`;

  await writeFile(path.join(targetDir, 'app', '_layout.tsx'), content);
}
