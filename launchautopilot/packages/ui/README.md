# @xocket/ui

Components and design tokens shared across every app in this monorepo.

## Using it

```tsx
import { Button } from '@xocket/ui/components/button';
import { cn } from '@xocket/ui/lib/utils';
```

Add the dependency to the consuming app first:

```bash
pnpm --filter @your-app/web add '@xocket/ui@workspace:*'
```

## Design tokens

`src/styles.css` holds the token layer. Each app imports it, so changing a
colour here changes it everywhere. Tailwind must also scan this package —
apps already declare that with `@source`.

## Adding components

Components ship as source; the consuming app's bundler transpiles them. Add a
file under `src/components/` and it is importable via the `./components/*`
export. `shadcn add <component>` output can be dropped in as-is.
