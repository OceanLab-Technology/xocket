import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  answersSchema,
  projectNameSchema,
  formatZodError,
  type Answers,
  type CreateFlags,
} from '../../schema.js';

/** Defaults applied by `--yes` and used as the initial value of each prompt. */
export const DEFAULT_ANSWERS: Answers = {
  projectName: 'my-app',
  framework: 'react',
  stateManagement: 'zustand',
  serverState: 'tanstack',
  backend: 'supabase',
  seo: false,
  aiSeo: false,
};

function cancel(): never {
  p.cancel(pc.yellow('Operation cancelled.'));
  process.exit(0);
}

/**
 * Resolve the final answer set from flags, prompts, or both.
 *
 * Any question answered by a flag is skipped. With `--yes`, unanswered
 * questions take their default instead of prompting — which is what makes the
 * CLI usable from CI, scripts and coding agents.
 */
export async function collectCreateAnswers(flags: CreateFlags = {}): Promise<Answers> {
  const nonInteractive = flags.yes === true;

  // SEO is a sub-question of AEO: --ai-seo implies --seo.
  const seoFlag = flags.aiSeo === true ? true : flags.seo;

  const pending: Record<string, () => Promise<unknown>> = {};

  if (flags.name === undefined) {
    pending.projectName = () =>
      p.text({
        message: 'Project name:',
        placeholder: DEFAULT_ANSWERS.projectName,
        initialValue: DEFAULT_ANSWERS.projectName,
        validate: (v) => {
          const r = projectNameSchema.safeParse(v ?? '');
          return r.success ? undefined : r.error.issues[0]?.message;
        },
      }) as Promise<unknown>;
  }

  if (flags.framework === undefined) {
    pending.framework = () =>
      p.select({
        message: 'Framework:',
        options: [
          { value: 'react', label: 'React', hint: 'Vite 8 + React 19' },
          { value: 'next', label: 'Next.js', hint: 'Next 16 App Router' },
        ],
        initialValue: DEFAULT_ANSWERS.framework,
      }) as Promise<unknown>;
  }

  if (flags.state === undefined) {
    pending.stateManagement = () =>
      p.select({
        message: 'State management:',
        options: [
          { value: 'zustand', label: 'Zustand', hint: 'recommended' },
          { value: 'context', label: 'React Context' },
          { value: 'redux', label: 'Redux Toolkit' },
          { value: 'none', label: 'None' },
        ],
        initialValue: DEFAULT_ANSWERS.stateManagement,
      }) as Promise<unknown>;
  }

  if (flags.serverState === undefined) {
    pending.serverState = () =>
      p.select({
        message: 'Server state:',
        options: [
          { value: 'tanstack', label: 'TanStack Query', hint: 'recommended' },
          { value: 'none', label: 'None' },
        ],
        initialValue: DEFAULT_ANSWERS.serverState,
      }) as Promise<unknown>;
  }

  if (flags.backend === undefined) {
    pending.backend = () =>
      p.select({
        message: 'Backend / Authentication:',
        options: [
          { value: 'supabase', label: 'Supabase', hint: 'recommended' },
          { value: 'cognito', label: 'AWS Cognito', hint: 'Amplify v6' },
          { value: 'custom', label: 'Custom API', hint: 'Axios-based stubs' },
          { value: 'none', label: 'None' },
        ],
        initialValue: DEFAULT_ANSWERS.backend,
      }) as Promise<unknown>;
  }

  if (seoFlag === undefined) {
    pending.seo = () =>
      p.confirm({
        message: 'Add the SEO module?',
        active: 'Yes — sitemap, robots, canonical URLs, Open Graph, JSON-LD',
        inactive: 'No',
        initialValue: true,
      }) as Promise<unknown>;
  }

  const answered = Object.keys(pending).length
    ? nonInteractive
      ? {}
      : await p.group(pending, { onCancel: cancel })
    : {};

  // AEO is only worth asking about once SEO is in — it builds on the same files.
  const resolvedSeo = seoFlag ?? (answered as Record<string, unknown>).seo ?? DEFAULT_ANSWERS.seo;

  let resolvedAiSeo = flags.aiSeo;
  if (resolvedAiSeo === undefined) {
    if (nonInteractive || resolvedSeo !== true) {
      resolvedAiSeo = false;
    } else {
      const answer = await p.confirm({
        message: 'Also add AI / answer-engine optimisation?',
        active: 'Yes — llms.txt, AI crawler rules, machine-readable metadata',
        inactive: 'No',
        initialValue: true,
      });
      if (p.isCancel(answer)) cancel();
      resolvedAiSeo = answer === true;
    }
  }

  const merged = {
    projectName: flags.name ?? (answered as Record<string, unknown>).projectName ?? DEFAULT_ANSWERS.projectName,
    framework: flags.framework ?? (answered as Record<string, unknown>).framework ?? DEFAULT_ANSWERS.framework,
    stateManagement:
      flags.state ?? (answered as Record<string, unknown>).stateManagement ?? DEFAULT_ANSWERS.stateManagement,
    serverState:
      flags.serverState ?? (answered as Record<string, unknown>).serverState ?? DEFAULT_ANSWERS.serverState,
    backend: flags.backend ?? (answered as Record<string, unknown>).backend ?? DEFAULT_ANSWERS.backend,
    seo: resolvedSeo,
    aiSeo: resolvedAiSeo,
  };

  const parsed = answersSchema.safeParse(merged);
  if (!parsed.success) {
    p.cancel(pc.red(`Invalid options:\n${formatZodError(parsed.error)}`));
    process.exit(1);
  }

  return parsed.data;
}
