import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';
import { DEPS } from '../../versions.js';
import { SHADCN_THEME_CSS } from '../web/theme.js';

/**
 * Generates packages/ui — components and design tokens shared across apps.
 *
 * Previously each app installed shadcn separately and shared nothing, so the
 * web and Expo apps could drift apart. The token layer now lives here and each
 * app imports it, which means a palette change is a single edit.
 *
 * Components are shipped as source (no build step) and transpiled by whichever
 * bundler consumes them — the standard Turborepo "internal package" pattern.
 */
export async function generateUiPackage(config: Config) {
  const pkgDir = path.join(config.rootDir, 'packages', 'ui');
  await ensureDir(pkgDir);

  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/ui',
        version: '0.0.0',
        private: true,
        type: 'module',
        exports: {
          './styles.css': './src/styles.css',
          './lib/utils': './src/lib/utils.ts',
          './components/*': './src/components/*.tsx',
        },
        scripts: {
          lint: 'eslint .',
          'type-check': 'tsc --noEmit',
        },
        dependencies: {
          clsx: DEPS.clsx,
          'tailwind-merge': DEPS['tailwind-merge'],
          'class-variance-authority': DEPS['class-variance-authority'],
          'lucide-react': DEPS['lucide-react'],
        },
        devDependencies: {
          '@xocket/typescript-config': 'workspace:*',
          '@xocket/eslint-config': 'workspace:*',
          '@xocket/prettier-config': 'workspace:*',
          '@types/react': DEPS['@types/react'],
          typescript: DEPS.typescript,
          eslint: DEPS.eslint,
        },
        peerDependencies: {
          react: '>=19',
        },
        prettier: '@xocket/prettier-config',
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(pkgDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '@xocket/typescript-config/web.json',
        compilerOptions: { paths: { '@/*': ['./src/*'] } },
        include: ['src'],
        exclude: ['node_modules'],
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(pkgDir, 'eslint.config.js'),
    `import reactConfig from '@xocket/eslint-config/react.js'

export default reactConfig
`,
  );

  await ensureDir(path.join(pkgDir, 'src', 'components'));
  await ensureDir(path.join(pkgDir, 'src', 'lib'));

  // The single source of truth for design tokens.
  await writeFile(path.join(pkgDir, 'src', 'styles.css'), SHADCN_THEME_CSS);

  await writeFile(
    path.join(pkgDir, 'src', 'lib', 'utils.ts'),
    `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names without conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
  );

  // One real component, so the wiring is demonstrably correct rather than
  // an empty folder the user has to figure out.
  await writeFile(
    path.join(pkgDir, 'src', 'components', 'button.tsx'),
    `import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../lib/utils.js'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { buttonVariants }
`,
  );

  await writeFile(
    path.join(pkgDir, 'README.md'),
    `# @xocket/ui

Components and design tokens shared across every app in this monorepo.

## Using it

\`\`\`tsx
import { Button } from '@xocket/ui/components/button'
import { cn } from '@xocket/ui/lib/utils'
\`\`\`

Add the dependency to the consuming app first:

\`\`\`bash
pnpm --filter @your-app/web add '@xocket/ui@workspace:*'
\`\`\`

## Design tokens

\`src/styles.css\` holds the token layer. Each app imports it, so changing a
colour here changes it everywhere. Tailwind must also scan this package —
apps already declare that with \`@source\`.

## Adding components

Components ship as source; the consuming app's bundler transpiles them. Add a
file under \`src/components/\` and it is importable via the \`./components/*\`
export. \`shadcn add <component>\` output can be dropped in as-is.
`,
  );
}
