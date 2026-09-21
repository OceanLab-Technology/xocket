#!/usr/bin/env node

import { Command, Option } from 'commander';
import pc from 'picocolors';
import { run as runCreate } from './cli/commands/create.js';
import { run as runAdd } from './cli/commands/add.js';
import { VERSION } from './version.js';
import {
  BACKENDS,
  BACKEND_LANGS,
  FRAMEWORKS,
  MODULES,
  SERVER_STATES,
  STATE_MANAGERS,
} from './schema.js';

const program = new Command();

program
  .name('xocket')
  .description('Xocket — Monorepo Development Platform')
  .version(VERSION, '-v, --version')
  .showHelpAfterError();

program
  .command('create', { isDefault: true })
  .argument('[name]', 'project name')
  .description('Create a new Xocket monorepo project')
  .addOption(
    new Option('-f, --framework <framework>', 'web framework').choices([...FRAMEWORKS]),
  )
  .addOption(
    new Option('-s, --state <state>', 'client state management').choices([...STATE_MANAGERS]),
  )
  .addOption(
    new Option('--server-state <mode>', 'server state management').choices([...SERVER_STATES]),
  )
  .addOption(new Option('-b, --backend <backend>', 'backend / auth').choices([...BACKENDS]))
  .option('--seo', 'include the SEO module')
  .option('--no-seo', 'skip the SEO module')
  .option('--ai-seo', 'include AI / answer-engine optimisation (implies --seo)')
  .option('--no-ai-seo', 'skip AI / answer-engine optimisation')
  .option('-y, --yes', 'accept defaults for anything not passed as a flag')
  .option('--no-install', 'skip pnpm install')
  .option('--no-git', 'skip git init and the initial commit')
  .action((name, opts) => {
    // Commander sets `seo`/`aiSeo` to true for --no-* flags unless the
    // positive form is also declared; normalise to an explicit tri-state.
    return runCreate({
      name,
      framework: opts.framework,
      state: opts.state,
      serverState: opts.serverState,
      backend: opts.backend,
      seo: opts.seo,
      aiSeo: opts.aiSeo,
      yes: opts.yes,
      install: opts.install,
      git: opts.git,
    });
  });

program
  .command('add')
  .argument('<module>', `module to add (${MODULES.join(', ')})`)
  .description('Add a module to an existing Xocket project')
  .addOption(
    new Option('-l, --lang <lang>', 'backend service language').choices([...BACKEND_LANGS]),
  )
  .option('-n, --name <name>', 'service name (backend only)')
  .option('-y, --yes', 'accept defaults for anything not passed as a flag')
  .option('--no-install', 'skip pnpm install')
  .action((module, opts) =>
    runAdd({
      module,
      lang: opts.lang,
      name: opts.name,
      yes: opts.yes,
      install: opts.install,
    }),
  );

program.addHelpText(
  'after',
  `
${pc.bold('Examples:')}
  ${pc.dim('$')} xocket create my-app
  ${pc.dim('$')} xocket create my-app --yes
  ${pc.dim('$')} xocket create my-app -f next -s zustand -b supabase --ai-seo --yes
  ${pc.dim('$')} xocket create my-app --yes --no-install --no-git   ${pc.dim('# fast, for CI')}

  ${pc.dim('$')} xocket add expo
  ${pc.dim('$')} xocket add backend --lang go --name orders-api
  ${pc.dim('$')} xocket add seo
`,
);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(pc.red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
