import pc from 'picocolors';
import type { Config } from '../types.js';
import { t, glyph, rule, gradient } from '../ui/theme.js';
import { checklist, commandBlock, keyValues } from '../ui/summary.js';

/** The feature list shown on the summary screen. */
export function buildConfiguredList(config: Config): string[] {
  const list: string[] = ['TypeScript (strict)', 'Tailwind CSS v4', 'shadcn/ui'];

  if (config.stateManagement === 'zustand') list.push('Zustand');
  if (config.stateManagement === 'context') list.push('React Context');
  if (config.stateManagement === 'redux') list.push('Redux Toolkit');

  list.push('Axios');
  if (config.serverState === 'tanstack') list.push('TanStack Query');

  if (config.backend === 'supabase') list.push('Supabase');
  if (config.backend === 'cognito') list.push('AWS Cognito');
  if (config.backend === 'custom') list.push('Custom API auth');

  if (config.seo) list.push('SEO metadata + JSON-LD');
  if (config.aiSeo) list.push('AEO — llms.txt');

  list.push('Sentry');
  list.push('ESLint · Prettier · Husky');
  list.push('pnpm + Turborepo');
  list.push('Vitest');

  return list;
}

const FRAMEWORK_LABEL: Record<string, string> = {
  react: 'React 19 (Vite 8)',
  next: 'Next.js 16 (App Router)',
};

const STATE_LABEL: Record<string, string | null> = {
  zustand: 'Zustand',
  context: 'React Context',
  redux: 'Redux Toolkit',
  none: null,
};

const BACKEND_LABEL: Record<string, string | null> = {
  supabase: 'Supabase',
  cognito: 'AWS Cognito',
  custom: 'Custom API',
  none: null,
};

/** Print the success summary. */
export function printSummary(
  config: Config,
  configured: string[],
  opts: { installed: boolean } = { installed: true },
): void {
  const rows = [
    { label: 'Project', value: t.value(config.projectName) },
    { label: 'Framework', value: FRAMEWORK_LABEL[config.framework] ?? config.framework },
    { label: 'Styling', value: 'Tailwind v4 + shadcn/ui' },
    { label: 'Monorepo', value: 'pnpm workspaces + Turborepo' },
  ];

  const state = STATE_LABEL[config.stateManagement];
  if (state) rows.push({ label: 'State', value: state });
  if (config.serverState === 'tanstack') {
    rows.push({ label: 'Server state', value: 'TanStack Query' });
  }
  const backend = BACKEND_LABEL[config.backend];
  if (backend) rows.push({ label: 'Backend', value: backend });
  if (config.seo) {
    rows.push({ label: 'SEO', value: config.aiSeo ? 'SEO + AEO (llms.txt)' : 'SEO' });
  }

  const out: string[] = [
    '',
    rule(),
    '',
    `  ${gradient(`${glyph.sparkle} Your monorepo is ready`)}`,
    '',
    keyValues(rows),
    '',
    `  ${pc.bold('Included')}`,
    checklist(configured),
    '',
    rule(),
    '',
    `  ${pc.bold('Next steps')}`,
    '',
    commandBlock([
      { cmd: `cd ${config.projectName}` },
      ...(opts.installed ? [] : [{ cmd: 'pnpm install' }]),
      { cmd: 'pnpm dev', note: 'start every app and service' },
    ]),
  ];

  if (config.seo) {
    out.push(
      '',
      `  ${t.muted('Set your real site details in')} ${t.path('apps/web/src/lib/seo.ts')}`,
    );
  }

  out.push(
    '',
    `  ${pc.bold('Grow the workspace')}`,
    '',
    commandBlock([
      { cmd: 'xocket add expo', note: 'Expo mobile app' },
      { cmd: 'xocket add backend', note: 'Go · Rust · Python · TypeScript' },
      { cmd: 'xocket add db', note: 'Drizzle or Prisma' },
      { cmd: 'xocket add auth-ui', note: 'sign-in / sign-up screens' },
      ...(config.seo ? [] : [{ cmd: 'xocket add seo', note: 'SEO + AEO' }]),
      { cmd: 'xocket doctor', note: 'health-check this project' },
    ]),
    '',
    rule(),
    '',
  );

  console.log(out.join('\n'));
}
