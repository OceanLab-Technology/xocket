#!/usr/bin/env node

import { Command } from 'commander';
import { run as runCreate } from './cli/commands/create.js';
import { run as runAdd } from './cli/commands/add.js';

const program = new Command();

program
  .name('xocket')
  .description('Xocket — Monorepo Development Platform')
  .version('2.0.0', '-v, --version');

program
  .command('create [name]')
  .description('Create a new Xocket monorepo project')
  .action((name) => runCreate({ name }));

program
  .command('add <module>')
  .description('Add a module to an existing Xocket project (expo, sentry, supabase…)')
  .action((module) => runAdd({ module }));

// Default: if called with no sub-command, launch the create wizard
if (process.argv.length <= 2) {
  runCreate();
} else {
  program.parse(process.argv);
}
