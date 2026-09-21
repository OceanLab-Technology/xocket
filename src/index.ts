#!/usr/bin/env node

import { Command, Option } from 'commander';
import { run as runCreate } from './cli/commands/create.js';
import { run as runAdd } from './cli/commands/add.js';
import { run as runDoctor } from './cli/commands/doctor.js';
import { VERSION } from './version.js';
import { t, glyph, gradient } from './ui/theme.js';
import {
  BACKENDS,
  BACKEND_LANGS,
  DB_ORMS,
  DEPLOY_TARGETS,
  FRAMEWORKS,
  MODULES,
  SERVER_STATES,
  STATE_MANAGERS,
} from './schema.js';

const program = new Command();

/** Colourise Commander's own help output. */
program.configureHelp({
  styleTitle: (s) => gradient(s),
  styleCommandText: (s) => t.code(s),
  styleOptionTerm: (s) => t.code(s),
  styleSubcommandTerm: (s) => t.code(s),
  styleArgumentTerm: (s) => t.value(s),
  styleDescriptionText: (s) => t.muted(s),
});

program
  .name('xocket')
  .description('Xocket — Monorepo Development Platform')
  .version(VERSION, '-v, --version')
  .showHelpAfterError()
  .showSuggestionAfterError();

program
  .command('create', { isDefault: true })
  .argument('[name]', 'project name')
  .description('Create a new Xocket monorepo project')
  .addOption(new Option('-f, --framework <framework>', 'web framework').choices([...FRAMEWORKS]))
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
  .option('-t, --template <source>', 'org preset — a local .json path or an https URL')
  .option('-y, --yes', 'accept defaults for anything not passed as a flag')
  .option('--no-install', 'skip pnpm install')
  .option('--no-git', 'skip git init and the initial commit')
  .action((name, opts) =>
    runCreate({
      name,
      framework: opts.framework,
      state: opts.state,
      serverState: opts.serverState,
      backend: opts.backend,
      seo: opts.seo,
      aiSeo: opts.aiSeo,
      template: opts.template,
      yes: opts.yes,
      install: opts.install,
      git: opts.git,
    }),
  );

program
  .command('add')
  .argument('<module>', `module to add (${MODULES.join(', ')})`)
  .description('Add a module to an existing Xocket project')
  .addOption(
    new Option('-l, --lang <lang>', 'service language (backend)').choices([...BACKEND_LANGS]),
  )
  .addOption(new Option('-o, --orm <orm>', 'ORM (db)').choices([...DB_ORMS]))
  .addOption(
    new Option('--target <target>', 'what to generate (docker)').choices([...DEPLOY_TARGETS]),
  )
  .option('-n, --name <name>', 'service name (backend, agent)')
  .option('-y, --yes', 'accept defaults for anything not passed as a flag')
  .option('--no-install', 'skip pnpm install')
  .action((module, opts) =>
    runAdd({
      module,
      lang: opts.lang,
      orm: opts.orm,
      target: opts.target,
      name: opts.name,
      yes: opts.yes,
      install: opts.install,
    }),
  );

program
  .command('doctor')
  .description('Check an existing project for known problems and version drift')
  .action(() => runDoctor());

program.addHelpText(
  'after',
  `
${gradient('Modules')}
  ${t.code('expo')}      ${t.muted('Expo 57 mobile app, mirroring the web stack')}
  ${t.code('backend')}   ${t.muted('TypeScript · Go · Rust · Python service')}
  ${t.code('db')}        ${t.muted('Drizzle or Prisma, shared across the workspace')}
  ${t.code('auth-ui')}   ${t.muted('sign-in / sign-up screens for your backend')}
  ${t.code('seo')}       ${t.muted('sitemap, robots, Open Graph, JSON-LD, llms.txt')}
  ${t.code('agent')}     ${t.muted('MCP server exposing this project to assistants')}
  ${t.code('docker')}    ${t.muted('Dockerfiles, Compose and Kubernetes manifests')}

${gradient('Examples')}
  ${t.muted('$')} ${t.code('xocket create my-app')}
  ${t.muted('$')} ${t.code('xocket create my-app --yes')}
  ${t.muted('$')} ${t.code('xocket create my-app -f next -s zustand -b supabase --ai-seo -y')}
  ${t.muted('$')} ${t.code('xocket create my-app --template ./team-preset.json -y')}
  ${t.muted('$')} ${t.code('xocket create my-app -y --no-install --no-git')}  ${t.muted('# fast, for CI')}

  ${t.muted('$')} ${t.code('xocket add expo')}
  ${t.muted('$')} ${t.code('xocket add backend --lang go --name orders-api')}
  ${t.muted('$')} ${t.code('xocket add db --orm drizzle')}
  ${t.muted('$')} ${t.code('xocket add auth-ui')}
  ${t.muted('$')} ${t.code('xocket add agent --name my-mcp')}
  ${t.muted('$')} ${t.code('xocket add docker --target both')}

  ${t.muted('$')} ${t.code('xocket doctor')}

${t.muted('Docs: https://github.com/OceanLab-Technology/xocket')}
`,
);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(`\n${t.error(glyph.cross)} ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
