import type { Config } from '../../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps } from '../../utils/pkg.js';
import { writeFile, ensureDir } from '../../utils/file.js';
import { deps } from '../../versions.js';

/**
 * Configures shadcn/ui for the web app.
 *
 * Tailwind v4 form: `tailwind.config` is an empty string in components.json
 * (there is no config file any more) and the design tokens live in the app's
 * CSS entry point — see generators/web/theme.ts.
 */
export async function generateShadcn(config: Config) {
  const { framework, webDir } = config;

  let pkg = await readPkg(webDir);
  pkg = addDeps(
    pkg,
    deps('clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react'),
  );
  await writePkg(webDir, pkg);

  const isNext = framework === 'next';

  await writeFile(
    path.join(webDir, 'components.json'),
    JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema.json',
        style: 'new-york',
        rsc: isNext,
        tsx: true,
        tailwind: {
          // Tailwind v4 has no config file; shadcn expects an empty string.
          config: '',
          css: isNext ? 'src/app/globals.css' : 'src/index.css',
          baseColor: 'neutral',
          cssVariables: true,
          prefix: '',
        },
        iconLibrary: 'lucide',
        aliases: {
          components: '@/components',
          utils: '@/lib/utils',
          ui: '@/components/ui',
          lib: '@/lib',
          hooks: '@/hooks',
        },
      },
      null,
      2,
    ) + '\n',
  );

  await ensureDir(path.join(webDir, 'src', 'lib'));
  await writeFile(
    path.join(webDir, 'src', 'lib', 'utils.ts'),
    `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names without conflicts.
 * Required by every shadcn/ui component.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
  );

  await ensureDir(path.join(webDir, 'src', 'components', 'ui'));
}
