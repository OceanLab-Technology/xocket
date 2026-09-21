import type { Config } from '../../types.js';
import path from 'path';
import fs from 'fs-extra';
import { writeFile, ensureDir } from '../../utils/file.js';
import { envConvention } from '../../utils/env.js';
import { AI_CRAWLERS, DISALLOWED_PATHS } from './constants.js';
import { seoLibSource } from './lib.js';

/**
 * The SEO module.
 *
 * `config.seo`   — canonical URLs, Open Graph, sitemap, robots, JSON-LD.
 * `config.aiSeo` — adds answer-engine optimisation on top: an AI crawler
 *                  allowlist, llms.txt / llms-full.txt, and cache headers.
 *
 * Next.js gets the full treatment via the App Router metadata APIs. A Vite SPA
 * can only do so much without server rendering, so it gets static files plus a
 * runtime JSON-LD helper, and the README says so plainly.
 */
export async function generateSeo(config: Config, targetDir: string = config.webDir) {
  if (!config.seo) return;

  if (config.framework === 'next') {
    await generateNextSeo(config, targetDir);
  } else {
    await generateReactSeo(config, targetDir);
  }

  if (config.aiSeo) {
    await generateAeo(config, targetDir);
  }
}

// ─── Shared ───────────────────────────────────────────────────────────────────

async function writeSeoLib(config: Config, targetDir: string) {
  await ensureDir(path.join(targetDir, 'src', 'lib'));
  await writeFile(
    path.join(targetDir, 'src', 'lib', 'seo.ts'),
    seoLibSource(config.projectName, config.framework === 'next'),
  );
}

/** Add SITE_URL to every .env file so canonical URLs are configurable per env. */
async function addSiteUrlEnv(config: Config, targetDir: string) {
  const { prefix } = envConvention(config);
  const key = `${prefix}SITE_URL`;

  for (const name of ['.env.example', '.env.development', '.env.staging', '.env.production']) {
    const file = path.join(targetDir, name);
    if (!(await fs.pathExists(file))) continue;

    const body = await fs.readFile(file, 'utf-8');
    if (body.includes(key)) continue;

    const value = name === '.env.production' ? 'https://example.com' : 'http://localhost:5173';
    await fs.writeFile(
      file,
      body.replace(
        /^(# Public.*\n)/m,
        `$1${key}=${value}\n`,
      ),
      'utf-8',
    );
  }
}

// ─── Next.js ──────────────────────────────────────────────────────────────────

async function generateNextSeo(config: Config, targetDir: string) {
  await writeSeoLib(config, targetDir);
  await addSiteUrlEnv(config, targetDir);

  const appDir = path.join(targetDir, 'src', 'app');
  await ensureDir(appDir);

  const aiRules = config.aiSeo
    ? `\n      // Explicitly welcome answer-engine crawlers (AEO).\n` +
      AI_CRAWLERS.map((ua) => `      { userAgent: '${ua}', allow: '/' },`).join('\n') +
      '\n'
    : '';

  await writeFile(
    path.join(appDir, 'robots.ts'),
    `import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Emitted at build time rather than per-request.
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [${DISALLOWED_PATHS.map((p) => `'${p}'`).join(', ')}],
      },${aiRules}    ],
    sitemap: \`\${SITE_URL}/sitemap.xml\`,
    host: SITE_URL,
  }
}
`,
  );

  await writeFile(
    path.join(appDir, 'sitemap.ts'),
    `import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'

/**
 * Add a route here whenever you add a page.
 *
 * For dynamic routes, map over your data source — e.g.
 *   ...posts.map((p) => ({ url: \`\${SITE_URL}/blog/\${p.slug}\`, lastModified: p.updatedAt }))
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
`,
  );

  // Generated OG image — no static asset to keep in sync.
  await writeFile(
    path.join(appDir, 'opengraph-image.tsx'),
    `import { ImageResponse } from 'next/og'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

export const dynamic = 'force-static'
export const alt = \`\${SITE_NAME} — \${SITE_TAGLINE}\`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fafafa',
          padding: 80,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: '-0.03em' }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 32, color: '#a1a1aa', marginTop: 16 }}>{SITE_TAGLINE}</div>
      </div>
    ),
    size,
  )
}
`,
  );
}

// ─── React / Vite SPA ─────────────────────────────────────────────────────────

async function generateReactSeo(config: Config, targetDir: string) {
  await writeSeoLib(config, targetDir);
  await addSiteUrlEnv(config, targetDir);

  const publicDir = path.join(targetDir, 'public');
  await ensureDir(publicDir);

  const aiRules = config.aiSeo
    ? '\n' + AI_CRAWLERS.map((ua) => `User-agent: ${ua}\nAllow: /\n`).join('\n')
    : '';

  await writeFile(
    path.join(publicDir, 'robots.txt'),
    `User-agent: *
Allow: /
${DISALLOWED_PATHS.map((p) => `Disallow: ${p}`).join('\n')}
${aiRules}
Sitemap: https://example.com/sitemap.xml
`,
  );

  await writeFile(
    path.join(publicDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!-- Regenerate this whenever routes change; see scripts/generate-sitemap.ts -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
  );

  // A SPA has no server render, so metadata is applied at runtime.
  await writeFile(
    path.join(targetDir, 'src', 'lib', 'use-seo.ts'),
    `import { useEffect } from 'react'
import { canonical, SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from './seo'

interface SeoInput {
  title: string
  description: string
  path: string
  image?: string
  jsonLd?: object | object[]
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Apply per-route metadata in a Vite SPA.
 *
 * Note: this runs in the browser, so only crawlers that execute JavaScript will
 * see it. Google generally does; most answer-engine crawlers do NOT. If organic
 * or AI discovery matters, prerender or move to Next.js.
 */
export function useSeo({ title, description, path, image, jsonLd }: SeoInput) {
  useEffect(() => {
    document.title = \`\${title} | \${SITE_NAME}\`

    upsertMeta('meta[name="description"]', 'name', 'description', description)
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title)
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical(path))
    upsertMeta(
      'meta[property="og:image"]',
      'property',
      'og:image',
      absoluteUrl(image ?? DEFAULT_OG_IMAGE),
    )
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical(path)

    if (!jsonLd) return

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [title, description, path, image, jsonLd])
}
`,
  );

  // Baseline tags in index.html so a non-JS crawler still gets something.
  const indexHtml = path.join(targetDir, 'index.html');
  if (await fs.pathExists(indexHtml)) {
    const html = await fs.readFile(indexHtml, 'utf-8');
    if (!html.includes('name="description"')) {
      await fs.writeFile(
        indexHtml,
        html.replace(
          '    <title>App</title>',
          `    <title>${config.projectName}</title>
    <meta name="description" content="Change me in index.html and src/lib/seo.ts" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${config.projectName}" />
    <meta property="og:description" content="Change me in index.html and src/lib/seo.ts" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="https://example.com/" />`,
        ),
        'utf-8',
      );
    }
  }
}

// ─── Answer-engine optimisation ───────────────────────────────────────────────

async function generateAeo(config: Config, targetDir: string) {
  const publicDir = path.join(targetDir, 'public');
  await ensureDir(publicDir);

  const name = config.projectName;

  await writeFile(
    path.join(publicDir, 'llms.txt'),
    `# ${name}

> One-paragraph summary of what this product does and who it is for. Answer
> engines quote this almost verbatim, so make it accurate and specific.

## What this is

Describe the product in two or three sentences. Prefer concrete nouns over
marketing language — "a CLI that scaffolds TypeScript monorepos" beats
"a next-generation developer velocity platform".

## Key pages

- [Home](/): what a visitor sees first
- [Docs](/docs): reference material
- [Pricing](/pricing): plans and limits

## When to use ${name}

- The specific situation this solves
- Another one

## When not to use ${name}

- Being explicit about non-fits measurably improves citation accuracy.

## Contact

- Email: hello@example.com
`,
  );

  await writeFile(
    path.join(publicDir, 'llms-full.txt'),
    `# ${name} — full reference

This file carries the long-form version of llms.txt: complete documentation in
one flat Markdown file, so a crawler can ingest the whole product in a single
fetch rather than following links.

Generate it from your real docs as part of the build rather than hand-editing.

## Overview

...

## Concepts

...

## API reference

...
`,
  );

  // Cache headers for hosts that read a _headers file (Netlify, Cloudflare Pages).
  await writeFile(
    path.join(publicDir, '_headers'),
    `/llms.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=3600

/llms-full.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=3600
`,
  );
}
