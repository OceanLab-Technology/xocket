import pc from 'picocolors';
import type { Config } from '../types.js';

/** The feature list shown on the summary screen. */
export function buildConfiguredList(config: Config): string[] {
  const list: string[] = [
    'TypeScript (strict)',
    'Tailwind CSS v4',
    'shadcn/ui',
  ];

  if (config.stateManagement === 'zustand') list.push('Zustand');
  if (config.stateManagement === 'context') list.push('React Context');
  if (config.stateManagement === 'redux') list.push('Redux Toolkit');

  list.push('Axios');
  if (config.serverState === 'tanstack') list.push('TanStack Query');

  if (config.backend === 'supabase') list.push('Supabase');
  if (config.backend === 'cognito') list.push('AWS Cognito (Amplify v6)');
  if (config.backend === 'custom') list.push('Custom API auth');

  if (config.seo) list.push('SEO — sitemap, robots, Open Graph, JSON-LD');
  if (config.aiSeo) list.push('AEO — llms.txt, AI crawler allowlist');

  list.push('Sentry (error tracking)');
  list.push('ESLint · Prettier · Husky · lint-staged');
  list.push('pnpm workspaces + Turborepo');

  return list;
}

/** Print the success summary. */
export function printSummary(
  config: Config,
  configured: string[],
  opts: { installed: boolean } = { installed: true },
): void {
  const line = pc.dim('━'.repeat(56));
  const frameworkLabel = config.framework === 'react' ? 'React 19 (Vite)' : 'Next.js 16';

  const stateLabels: Record<string, string | null> = {
    zustand: 'Zustand',
    context: 'React Context',
    redux: 'Redux Toolkit',
    none: null,
  };
  const backendLabels: Record<string, string | null> = {
    supabase: 'Supabase',
    cognito: 'AWS Cognito',
    custom: 'Custom API',
    none: null,
  };

  console.log('\n' + line);
  console.log(pc.bold(pc.green('\n  ✦  Xocket project created successfully!\n')));
  console.log(`  ${pc.bold('Project:')}      ${pc.cyan(config.projectName)}`);
  console.log(`  ${pc.bold('Framework:')}    ${frameworkLabel} · TypeScript`);
  console.log(`  ${pc.bold('Styling:')}      Tailwind CSS v4 + shadcn/ui`);
  console.log(`  ${pc.bold('Monorepo:')}     pnpm workspaces + Turborepo`);

  if (stateLabels[config.stateManagement]) {
    console.log(`  ${pc.bold('State:')}        ${stateLabels[config.stateManagement]}`);
  }
  if (config.serverState === 'tanstack') {
    console.log(`  ${pc.bold('Server state:')} TanStack Query`);
  }
  if (backendLabels[config.backend]) {
    console.log(`  ${pc.bold('Backend:')}      ${backendLabels[config.backend]}`);
  }
  if (config.seo) {
    console.log(`  ${pc.bold('SEO:')}          ${config.aiSeo ? 'SEO + AEO (llms.txt)' : 'SEO'}`);
  }
  console.log(`  ${pc.bold('Environments:')} development · staging · production\n`);

  console.log(`  ${pc.bold('Configured:')}`);
  for (const item of configured) {
    console.log(`  ${pc.green('✓')} ${item}`);
  }

  console.log('\n' + line);
  console.log(pc.bold('\n  Next steps:\n'));
  console.log(`  ${pc.cyan('cd')} ${config.projectName}`);
  if (!opts.installed) console.log(`  ${pc.cyan('pnpm install')}`);
  console.log(`  ${pc.cyan('pnpm dev')}\n`);

  if (config.seo) {
    console.log(`  Set your real site details in ${pc.cyan('apps/web/src/lib/seo.ts')}\n`);
  }

  console.log(`  ${pc.bold('Add more:')}`);
  console.log(`  ${pc.cyan('xocket add expo')}                        — Expo mobile app`);
  console.log(`  ${pc.cyan('xocket add backend --lang go')}           — Go / Rust / Python / TS service`);
  if (!config.seo) {
    console.log(`  ${pc.cyan('xocket add seo')}                         — SEO + AEO module`);
  }
  console.log('\n' + line + '\n');
}
