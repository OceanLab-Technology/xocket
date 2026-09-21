import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { writeFile, ensureDir } from '../utils/file.js';
import { nestJsx } from '../utils/jsx.js';

/**
 * Generates the web app's root entry file with every selected provider wired in.
 *
 *   React → apps/web/src/main.tsx
 *   Next  → apps/web/src/app/layout.tsx (+ components/Providers.tsx when needed)
 */
export async function generateRootFile(config: Config) {
  if (config.framework === 'react') {
    await generateReactMain(config);
  } else {
    await generateNextLayout(config);
  }
}

interface Wiring {
  imports: string[];
  setup: string[];
  wrappers: [open: string, close: string][];
}

/**
 * Work out which providers this config needs, as import lines, module-scope
 * setup statements, and JSX wrappers (outermost first).
 */
function collectWiring(config: Config, prefix: string): Wiring {
  const { stateManagement, serverState, backend } = config;
  const imports: string[] = [];
  const setup: string[] = [];
  const wrappers: [string, string][] = [];

  if (stateManagement === 'redux') {
    imports.push(`import { Provider } from 'react-redux'`);
    imports.push(`import { store } from '${prefix}store'`);
    wrappers.push(['Provider store={store}', 'Provider']);
  }

  if (serverState === 'tanstack') {
    imports.push(`import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`);
    setup.push(`const queryClient = new QueryClient()`);
    wrappers.push(['QueryClientProvider client={queryClient}', 'QueryClientProvider']);
  }

  if (stateManagement === 'context') {
    imports.push(`import { AppProvider } from '${prefix}context/AppContext'`);
    wrappers.push(['AppProvider', 'AppProvider']);
  }

  if (backend === 'cognito') {
    imports.push(`import { configureAmplify } from '${prefix}lib/auth/cognito'`);
    setup.push(`configureAmplify()`);
  }

  return { imports, setup, wrappers };
}

// ─── React / Vite ─────────────────────────────────────────────────────────────

async function generateReactMain(config: Config) {
  const { webDir } = config;
  const { imports, setup, wrappers } = collectWiring(config, './');

  // React 19 no longer needs the React import for JSX.
  const head = [
    `import { StrictMode } from 'react'`,
    `import { createRoot } from 'react-dom/client'`,
    // Sentry initialises on import, before anything renders.
    `import './lib/sentry'`,
    `import App from './App'`,
    `import './index.css'`,
    ...imports,
  ];

  const tree = nestJsx('<App />', wrappers, '    ');

  const content = `${head.join('\n')}
${setup.length ? '\n' + setup.join('\n') + '\n' : ''}
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    ${tree}
  </StrictMode>,
)
`;

  await writeFile(path.join(webDir, 'src', 'main.tsx'), content);
}

// ─── Next.js App Router ───────────────────────────────────────────────────────

async function generateNextLayout(config: Config) {
  const { webDir, projectName } = config;
  const { imports, setup, wrappers } = collectWiring(config, '@/');

  const needsProviders = wrappers.length > 0 || setup.length > 0;

  if (needsProviders) {
    await ensureDir(path.join(webDir, 'src', 'components'));

    const tree = nestJsx('{children}', wrappers, '    ');
    const content = `'use client'

import type { ReactNode } from 'react'
${imports.join('\n')}
${setup.length ? '\n' + setup.join('\n') + '\n' : ''}
export function Providers({ children }: { children: ReactNode }) {
  return (
    ${tree}
  )
}
`;
    await writeFile(path.join(webDir, 'src', 'components', 'Providers.tsx'), content);
  }

  const body = needsProviders ? `        <Providers>{children}</Providers>` : `        {children}`;

  // With the SEO module on, metadata and JSON-LD come from src/lib/seo.ts.
  const metadataBlock = config.seo
    ? `import { siteMetadata, siteViewport, organizationJsonLd, websiteJsonLd } from '@/lib/seo'

export const metadata: Metadata = siteMetadata
export const viewport: Viewport = siteViewport`
    : `export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Generated with Xocket',
}`;

  const jsonLd = config.seo
    ? `        <script
          type="application/ld+json"
          // JSON-LD is trusted, locally-generated content.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd(), websiteJsonLd()]),
          }}
        />
`
    : '';

  const typeImport = config.seo
    ? `import type { Metadata, Viewport } from 'next'`
    : `import type { Metadata } from 'next'`;

  const content = `${typeImport}
import type { ReactNode } from 'react'
import './globals.css'
${needsProviders ? `import { Providers } from '@/components/Providers'\n` : ''}
${metadataBlock}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
${jsonLd}      </head>
      <body>
${body}
      </body>
    </html>
  )
}
`;

  await writeFile(path.join(webDir, 'src', 'app', 'layout.tsx'), content);

  // Drop any .jsx placeholder an older template left behind.
  const legacy = path.join(webDir, 'src', 'app', 'layout.jsx');
  if (await fs.pathExists(legacy)) await fs.remove(legacy);
}
