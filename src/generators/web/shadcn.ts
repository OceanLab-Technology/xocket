import type { Config } from '../../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps, addDevDeps } from '../../utils/pkg.js';
import { writeFile, ensureDir } from '../../utils/file.js';

/**
 * Configures shadcn/ui for the web app:
 *   - Writes components.json
 *   - Generates src/lib/utils.ts  (the cn() helper)
 *   - Installs required runtime deps: clsx, tailwind-merge, class-variance-authority, lucide-react
 *   - Installs tailwindcss-animate devDep
 */
export async function generateShadcn(config: Config) {
  const { framework, webDir } = config;

  let pkg = await readPkg(webDir);
  pkg = addDeps(pkg, {
    clsx: '^2.1.1',
    'tailwind-merge': '^2.5.2',
    'class-variance-authority': '^0.7.0',
    'lucide-react': '^0.439.0',
  });
  pkg = addDevDeps(pkg, {
    'tailwindcss-animate': '^1.0.7',
  });
  await writePkg(webDir, pkg);

  // components.json — shadcn configuration
  const isNext = framework === 'next';
  const componentsJson = {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'default',
    rsc: isNext,
    tsx: true,
    tailwind: {
      config: 'tailwind.config.js',
      css: isNext ? 'src/app/globals.css' : 'src/index.css',
      baseColor: 'slate',
      cssVariables: true,
      prefix: '',
    },
    aliases: {
      components: '@/components',
      utils: '@/lib/utils',
      ui: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
    },
  };

  await writeFile(
    path.join(webDir, 'components.json'),
    JSON.stringify(componentsJson, null, 2) + '\n',
  );

  // src/lib/utils.ts — the cn() helper required by all shadcn components
  await ensureDir(path.join(webDir, 'src', 'lib'));
  await writeFile(
    path.join(webDir, 'src', 'lib', 'utils.ts'),
    `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS class names without conflicts.
 * Used by every shadcn/ui component.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
  );

  // Create components/ui directory for shadcn components
  await ensureDir(path.join(webDir, 'src', 'components', 'ui'));
}
