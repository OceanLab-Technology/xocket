import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';

/** Generates <rootDir>/README.md. */
export async function generateReadme(config: Config) {
  const { projectName, framework, seo, aiSeo, backend } = config;
  const isNext = framework === 'next';
  const frameworkLabel = isNext ? 'Next.js 16 (App Router)' : 'React 19 (Vite)';

  const seoSection = seo
    ? `
## SEO

Site-wide facts live in one file — edit it first:

\`\`\`
apps/web/src/lib/seo.ts
\`\`\`

${
  isNext
    ? `Everything else derives from it:

| File | Produces |
|---|---|
| \`src/app/robots.ts\` | \`/robots.txt\` |
| \`src/app/sitemap.ts\` | \`/sitemap.xml\` — add a route here whenever you add a page |
| \`src/app/opengraph-image.tsx\` | \`/opengraph-image\` (1200×630, generated at build time) |
| \`src/app/layout.tsx\` | \`<head>\` metadata + Organization/WebSite JSON-LD |`
    : `| File | Purpose |
|---|---|
| \`public/robots.txt\` | crawler rules |
| \`public/sitemap.xml\` | update this when routes change |
| \`src/lib/use-seo.ts\` | per-route metadata hook |

> **This is a single-page app.** \`useSeo\` applies metadata in the browser, so
> only crawlers that execute JavaScript see it — Google usually does, most
> answer-engine crawlers do not. If organic or AI discovery matters, prerender
> the app or move to Next.js.`
}

\`src/lib/seo.ts\` also exports JSON-LD builders: \`organizationJsonLd\`,
\`websiteJsonLd\`, \`breadcrumbsJsonLd\`, \`articleJsonLd\` and \`faqJsonLd\`.
FAQ markup is the highest-leverage one for answer engines.
${
  aiSeo
    ? `
### Answer-engine optimisation

| File | Purpose |
|---|---|
| \`public/llms.txt\` | short, structured summary — write this for a model, not a crawler |
| \`public/llms-full.txt\` | long-form docs in one flat file; generate it from your real docs |
| \`public/_headers\` | content-type and cache headers (Netlify / Cloudflare Pages) |

${isNext ? '`robots.ts` explicitly allows' : '`robots.txt` explicitly allows'} GPTBot, ClaudeBot,
PerplexityBot, OAI-SearchBot, Google-Extended and others. Remove any you would
rather not be cited by.
`
    : ''
}`
    : '';

  const backendNote =
    backend === 'supabase' && isNext
      ? `
> Supabase has three clients: \`browser.ts\` for Client Components, \`server.ts\`
> for Server Components and Route Handlers, and \`admin.ts\` for service-role
> work. **Never import \`admin.ts\` from client code.**
`
      : '';

  const content = `# ${projectName}

Created with [Xocket](https://github.com/OceanLab-Technology/xocket_template).

## Stack

- **Web:** ${frameworkLabel} · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui
- **Monorepo:** pnpm workspaces + Turborepo
- **Quality:** ESLint · Prettier · Husky · lint-staged
- **Errors:** Sentry
${seo ? `- **SEO:** sitemap · robots · Open Graph · JSON-LD${aiSeo ? ' · llms.txt' : ''}` : ''}

## Getting started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Copy \`apps/web/.env.example\` to \`.env.development\` and fill in real values.

## Structure

\`\`\`
${projectName}/
├── apps/
│   └── web/                # ${frameworkLabel}
│       └── src/
│           ├── api/        # Axios client + services
│           ├── components/ # ui/ holds shadcn components
│           ├── hooks/
│           ├── lib/        # sentry, supabase, seo…
│           └── store/      # state management
├── packages/
│   ├── typescript-config/
│   ├── eslint-config/
│   └── prettier-config/
├── turbo.json
├── pnpm-workspace.yaml
└── .xocket/config.json     # Xocket manifest — do not hand-edit
\`\`\`
${backendNote}
## Scripts

Run from the root; Turborepo fans them out across every workspace.

| Command | Does |
|---|---|
| \`pnpm dev\` | start every app and service |
| \`pnpm build\` | build everything |
| \`pnpm lint\` | ESLint |
| \`pnpm type-check\` | \`tsc --noEmit\` |
| \`pnpm format\` | Prettier |

Target one workspace with \`--filter\`:

\`\`\`bash
pnpm --filter @${projectName}/web dev
\`\`\`
${seoSection}
## Adding to this project

\`\`\`bash
xocket add expo                              # Expo mobile app, mirroring this stack
xocket add backend --lang go --name orders   # Go · Rust · Python · TypeScript service
${seo ? '' : 'xocket add seo                               # SEO + AEO module\n'}\`\`\`

Services land in \`services/<name>\` with a \`package.json\` that delegates to the
native toolchain, so Turborepo builds and caches them like any other workspace.
`;

  await writeFile(path.join(config.rootDir, 'README.md'), content);
}
