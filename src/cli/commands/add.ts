import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readManifest, updateManifest } from '../../utils/manifest.js';
import { generateExpo } from '../../generators/expo/index.js';
import type { Config } from '../../types.js';

export async function run({ module }: { module?: string } = {}): Promise<void> {
  if (!module) {
    console.error('Module name required');
    process.exit(1);
  }

  p.intro(pc.bgCyan(pc.black(' ✦  Xocket  v2.0.0 ')));

  // Detect existing Xocket project by walking up from CWD
  const found = await readManifest(process.cwd());

  if (!found) {
    p.cancel(
      pc.red('Not a Xocket project.\nRun xocket create <name> to create one first.'),
    );
    process.exit(1);
  }

  const { rootDir, manifest } = found;

  p.note(
    `Project: ${pc.cyan(manifest.projectName)}\nPackage manager: ${manifest.packageManager}\nApps: ${Object.keys(manifest.apps).join(', ')}`,
    'Xocket project detected',
  );

  // Check for already-installed module or app
  if (manifest.modules && manifest.modules.includes(module)) {
    p.cancel(
      pc.yellow(`Module "${module}" is already installed in this project.`),
    );
    process.exit(0);
  }

  if (module === 'expo' && manifest.apps['expo']) {
    p.cancel(
      pc.red(`Already one expo app exists in this project.`),
    );
    process.exit(1);
  }

  switch (module) {
    case 'expo': {
      const webApp = manifest.apps['web'];
      if (!webApp) {
        p.cancel(pc.red('No web app found in manifest. Ensure this is a valid Xocket project.'));
        process.exit(1);
      }

      const confirmed = await p.confirm({
        message: `We detected you are using ${webApp.stateManagement}, ${webApp.serverState === 'tanstack' ? 'TanStack Query' : 'no server state'}, and ${webApp.backend}. We will scaffold the Expo app with the same stack to keep your monorepo consistent. Proceed?`,
        initialValue: true,
      });

      if (!confirmed) {
        p.cancel(pc.yellow('Operation cancelled.'));
        process.exit(0);
      }

      const config: Config = {
        projectName: manifest.projectName,
        rootDir: rootDir,
        webDir: '', // Will not be used directly here
        packageManager: manifest.packageManager,
        projectType: 'web',
        framework: webApp.framework,
        language: 'ts',
        stateManagement: webApp.stateManagement,
        serverState: webApp.serverState,
        backend: webApp.backend,
        isNext: webApp.framework === 'next',
        isReact: webApp.framework === 'react',
      };

      const s = p.spinner();
      s.start('Scaffolding Expo application…');
      try {
        await generateExpo(config, rootDir);
        await updateManifest(rootDir, (m) => {
          m.apps['expo'] = {
            path: 'apps/expo',
            framework: 'expo',
            backend: config.backend,
            serverState: config.serverState,
            stateManagement: config.stateManagement,
            sentry: webApp.sentry,
          };
          m.modules = [...(m.modules || []), 'expo'];
          return m;
        });
        s.stop(pc.green('✓ Expo app generated successfully.'));
        
        p.note(`  cd apps/expo\n  pnpm install\n  pnpm start`, 'Next Steps');
      } catch (err) {
        s.stop(pc.red('✗ Scaffolding Expo app failed.'));
        console.error(err);
        process.exit(1);
      }
      break;
    }

    case 'sentry':
      p.cancel(pc.yellow('xocket add sentry — coming in a future release.'));
      process.exit(0);
      break;

    case 'supabase':
      p.cancel(pc.yellow('xocket add supabase — coming in a future release.'));
      process.exit(0);
      break;

    default:
      p.cancel(
        pc.red(
          `Unknown module: "${module}".\n\nAvailable (coming soon): expo, sentry, supabase`,
        ),
      );
      process.exit(1);
  }
}
