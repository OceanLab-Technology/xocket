import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { writeFile, ensureDir } from '../utils/file.js';

/**
 * Generates the root entry file for the web app:
 *   React → apps/web/src/main.tsx
 *   Next.js → apps/web/src/app/layout.tsx  + Providers.tsx (if needed)
 *
 * Always TypeScript (tsx). Wires all selected providers together.
 * For React: also initialises Sentry before render.
 */
export async function generateRootFile(config: Config) {
  const { framework } = config;

  if (framework === 'react') {
    await generateReactMain(config);
  } else {
    await generateNextLayout(config);
  }
}

// ─── React / Vite ─────────────────────────────────────────────────────────────

async function generateReactMain(config: Config) {
  const { stateManagement, serverState, backend, webDir } = config;

  const imports = [
    `import React from 'react'`,
    `import ReactDOM from 'react-dom/client'`,
    // Sentry must be initialised before the app renders
    `import './lib/sentry'`,
    `import App from './App.tsx'`,
    `import './index.css'`,
  ];

  const preRender = [];
  const wrappers = []; // [openTag, closeTag] — outermost first

  if (stateManagement === 'redux') {
    imports.push(`import { Provider } from 'react-redux'`);
    imports.push(`import { store } from './store/index'`);
    wrappers.push(['Provider store={store}', 'Provider']);
  }

  if (serverState === 'tanstack') {
    imports.push(
      `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`,
    );
    preRender.push(`const queryClient = new QueryClient()`);
    wrappers.push(['QueryClientProvider client={queryClient}', 'QueryClientProvider']);
  }

  if (stateManagement === 'context') {
    imports.push(`import { AppProvider } from './context/AppContext'`);
    wrappers.push(['AppProvider', 'AppProvider']);
  }

  if (backend === 'cognito') {
    imports.push(`import { configureAmplify } from './lib/auth/cognito'`);
    preRender.push(`configureAmplify()`);
  }

  // Build nested JSX (innermost = App, wrap outward)
  let inner = `<App />`;
  for (const [open, close] of [...wrappers].reverse()) {
    inner = `<${open}>\n        ${inner}\n      </${close}>`;
  }

  const content = `${imports.join('\n')}
${preRender.length ? '\n' + preRender.join('\n') : ''}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    ${inner}
  </React.StrictMode>,
)
`;

  await writeFile(path.join(webDir, 'src', 'main.tsx'), content);

  // Update index.html to point to main.tsx
  const { replaceInFile } = await import('../utils/file.js');
  await replaceInFile(
    path.join(webDir, 'index.html'),
    '/src/main.jsx',
    '/src/main.tsx',
  );
}

// ─── Next.js App Router ───────────────────────────────────────────────────────

async function generateNextLayout(config: Config) {
  const { stateManagement, serverState, backend, webDir } = config;

  const needsClientProvider =
    stateManagement === 'redux' ||
    stateManagement === 'context' ||
    serverState === 'tanstack' ||
    backend === 'cognito';

  if (needsClientProvider) {
    await generateProvidersComponent(config);
  }

  const providersImport = needsClientProvider
    ? `import { Providers } from '../components/Providers'\n`
    : '';

  const body = needsClientProvider
    ? `        <Providers>{children}</Providers>`
    : `        {children}`;

  const content = `import React from 'react'
import './globals.css'
${providersImport}
export const metadata = {
  title: 'App',
  description: 'Generated with Xocket',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
${body}
      </body>
    </html>
  )
}
`;

  await writeFile(path.join(webDir, 'src', 'app', 'layout.tsx'), content);

  // Remove the .jsx placeholder from the template (we just wrote .tsx)
  const oldJsx = path.join(webDir, 'src', 'app', 'layout.jsx');
  if (await fs.pathExists(oldJsx)) await fs.remove(oldJsx);
}

async function generateProvidersComponent(config: Config) {
  const { stateManagement, serverState, backend, webDir } = config;
  const componentsDir = path.join(webDir, 'src', 'components');
  await ensureDir(componentsDir);

  const lines = [`'use client'`, ''];
  const preRender = [];
  const wrappers = [];

  if (stateManagement === 'redux') {
    lines.push(`import { Provider } from 'react-redux'`);
    lines.push(`import { store } from '../store/index'`);
    wrappers.push(['Provider store={store}', 'Provider']);
  }

  if (serverState === 'tanstack') {
    lines.push(
      `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`,
    );
    preRender.push(`const queryClient = new QueryClient()`);
    wrappers.push(['QueryClientProvider client={queryClient}', 'QueryClientProvider']);
  }

  if (stateManagement === 'context') {
    lines.push(`import { AppProvider } from '../context/AppContext'`);
    wrappers.push(['AppProvider', 'AppProvider']);
  }

  if (backend === 'cognito') {
    lines.push(`import { configureAmplify } from '../lib/auth/cognito'`);
    preRender.push(`configureAmplify()`);
  }

  lines.push(`import React from 'react'`);
  lines.push('');

  let inner = `{children}`;
  for (const [open, close] of [...wrappers].reverse()) {
    inner = `<${open}>\n        ${inner}\n      </${close}>`;
  }

  const content = `${lines.join('\n')}
${preRender.length ? preRender.join('\n') + '\n\n' : ''}export function Providers({ children }: { children: React.ReactNode }) {
  return (
    ${inner}
  )
}
`;

  await writeFile(path.join(componentsDir, 'Providers.tsx'), content);
}
