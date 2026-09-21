/**
 * Contents of the generated `src/lib/seo.ts` — the single place a project edits
 * its site-wide SEO facts.
 */
export function seoLibSource(projectName: string, isNext: boolean): string {
  const metadataExport = isNext
    ? `
import type { Metadata, Viewport } from 'next'

/**
 * Site-wide metadata, spread into the root layout.
 * Page-level metadata merges over this via the \`%s\` title template.
 */
export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: \`\${SITE_NAME} — \${SITE_TAGLINE}\`,
    template: \`%s | \${SITE_NAME}\`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: \`\${SITE_NAME} — \${SITE_TAGLINE}\`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: \`\${SITE_NAME} — \${SITE_TAGLINE}\`,
    description: SITE_DESCRIPTION,
    creator: SOCIAL.twitter,
  },
  category: 'technology',
}

export const siteViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}
`
    : '';

  return `/**
 * Site-wide SEO facts and structured-data builders.
 *
 * Edit the constants below — everything else (metadata, sitemap, robots,
 * JSON-LD, llms.txt) derives from them.
 */

export const SITE_URL =
  ${isNext ? `process.env.NEXT_PUBLIC_SITE_URL` : `import.meta.env.VITE_SITE_URL`} ?? 'https://example.com'
export const SITE_NAME = '${projectName}'
export const SITE_LEGAL_NAME = '${projectName}'
export const SITE_TAGLINE = 'Change me in src/lib/seo.ts'
export const SITE_DESCRIPTION =
  'A one- or two-sentence description of what this site does. Search engines and answer engines both read this, so write it for a human.'

export const SITE_KEYWORDS: string[] = []

export const SOCIAL = {
  twitter: '@yourhandle',
  github: '',
  linkedin: '',
}

export const DEFAULT_OG_IMAGE = '/opengraph-image'

/** Absolute URL for any site-relative path. */
export function absoluteUrl(pathname: string): string {
  if (pathname.startsWith('http')) return pathname
  return \`\${SITE_URL}\${pathname.startsWith('/') ? pathname : \`/\${pathname}\`}\`
}

/** Canonical URL for a page — always absolute, never trailing-slash-ambiguous. */
export function canonical(pathname: string): string {
  return absoluteUrl(pathname)
}
${metadataExport}
// ── Structured data (schema.org) ────────────────────────────────────────────
//
// Answer engines lean on JSON-LD far more heavily than classic search does.
// Each builder returns a plain object; serialise it into a
// <script type="application/ld+json"> tag.

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': \`\${SITE_URL}#organization\`,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/logo.svg'),
    },
    sameAs: [SOCIAL.github, SOCIAL.linkedin].filter(Boolean),
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': \`\${SITE_URL}#website\`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { '@id': \`\${SITE_URL}#organization\` },
    inLanguage: 'en',
  }
}

export function breadcrumbsJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function articleJsonLd(input: {
  title: string
  description: string
  path: string
  image?: string
  publishedAt?: string
  updatedAt?: string
}) {
  const url = absoluteUrl(input.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': \`\${url}#article\`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: input.title,
    description: input.description,
    image: absoluteUrl(input.image ?? DEFAULT_OG_IMAGE),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: { '@id': \`\${SITE_URL}#organization\` },
    publisher: { '@id': \`\${SITE_URL}#organization\` },
    inLanguage: 'en',
  }
}

/**
 * FAQPage markup. This is the single highest-leverage schema for answer
 * engines — a well-formed Q&A block is what gets quoted back verbatim.
 */
export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}
`;
}
