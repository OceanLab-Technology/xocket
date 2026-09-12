import pc from 'picocolors';
import type { Config } from '../types.js';

/**
 * Build the list of configured features for the summary screen.
 */
export function buildConfiguredList(config: Config): string[] {
  const list: string[] = [];

  // TypeScript is always on
  list.push('TypeScript (mandatory)');

  // Tailwind + shadcn always on
  list.push('Tailwind CSS');
  list.push('shadcn/ui');

  // State management
  if (config.stateManagement === 'zustand') list.push('Zustand');
  if (config.stateManagement === 'context') list.push('React Context');
  if (config.stateManagement === 'redux') list.push('Redux Toolkit');

  // API
  list.push('Axios');
  if (config.serverState === 'tanstack') list.push('TanStack Query');

  // Backend
  if (config.backend === 'supabase') list.push('Supabase');
  if (config.backend === 'cognito') list.push('AWS Cognito (Amplify v6)');
  if (config.backend === 'custom') list.push('Custom API Auth');

  // Always-on tooling
  list.push('Sentry (error tracking)');
  list.push('ESLint · Prettier · Husky · lint-staged');
  list.push('pnpm workspaces + Turborepo');
  list.push('Git initialised');

  return list;
}

/**
 * Print the success summary after scaffolding.
 */
export function printSummary(config: Config, configured: string[]): void {
  const line = pc.dim('━'.repeat(50));
  const frameworkLabel =
    config.framework === 'react' ? 'React (Vite)' : 'Next.js';
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
  console.log(`  ${pc.bold('Styling:')}      Tailwind CSS + shadcn/ui`);
  console.log(`  ${pc.bold('Monorepo:')}     pnpm workspaces + Turborepo`);
  if (stateLabels[config.stateManagement]) {
    console.log(`  ${pc.bold('State:')}        ${stateLabels[config.stateManagement]}`);
  }
  if (config.serverState === 'tanstack') {
    console.log(`  ${pc.bold('Server State:')} TanStack Query`);
  }
  if (backendLabels[config.backend]) {
    console.log(`  ${pc.bold('Backend:')}      ${backendLabels[config.backend]}`);
  }
  console.log(`  ${pc.bold('Environments:')} Development / Staging / Production\n`);

  console.log(`  ${pc.bold('Configured:')}`);
  for (const item of configured) {
    console.log(`  ${pc.green('✓')} ${item}`);
  }

  console.log('\n' + line);
  console.log(pc.bold('\n  Next steps:\n'));
  console.log(`  ${pc.cyan('cd')} ${config.projectName}`);
  console.log(`  ${pc.cyan('pnpm dev')}\n`);
  console.log(`  To add modules later:`);
  console.log(`  ${pc.cyan('xocket add expo')}  — add an Expo mobile app\n`);
  console.log(line + '\n');
}
