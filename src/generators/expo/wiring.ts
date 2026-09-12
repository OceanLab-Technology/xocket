import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';

export async function generateWiring(config: Config, targetDir: string) {
  const { stateManagement, serverState, backend } = config;

  const imports = [
    `import '../global.css';`,
    `import { Slot } from 'expo-router';`
  ];
  const wrappers: [string, string][] = [];

  if (stateManagement === 'redux') {
    imports.push(`import { Provider } from 'react-redux';`);
    imports.push(`import { store } from '../src/store/index';`);
    wrappers.push(['Provider store={store}', 'Provider']);
  }

  if (serverState === 'tanstack') {
    imports.push(`import { QueryClient, QueryClientProvider } from '@tanstack/react-query';`);
    imports.push(`const queryClient = new QueryClient();`);
    wrappers.push(['QueryClientProvider client={queryClient}', 'QueryClientProvider']);
  }

  if (stateManagement === 'context') {
    imports.push(`import { AppProvider } from '../src/context/AppContext';`);
    wrappers.push(['AppProvider', 'AppProvider']);
  }

  // Not doing Amplify configuration directly here since react-native amplify differs slightly, 
  // but for the sake of mirroring the web structure:
  if (backend === 'cognito') {
    imports.push(`import { configureAmplify } from '../src/lib/auth/cognito';`);
    imports.push(`configureAmplify();`);
  }

  let inner = `<Slot />`;
  for (const [open, close] of [...wrappers].reverse()) {
    inner = `<${open}>\n      ${inner}\n    </${close}>`;
  }

  const content = `${imports.join('\n')}

export default function RootLayout() {
  return (
    ${inner}
  );
}
`;

  await writeFile(path.join(targetDir, 'app', '_layout.tsx'), content);
}
