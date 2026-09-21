/**
 * Guidance for the one thing the SEO module cannot fix on its own.
 *
 * A Vite SPA renders in the browser, so metadata applied at runtime is
 * invisible to any crawler that does not execute JavaScript — which is most
 * answer-engine crawlers. Rather than ship an `--seo` flag that quietly
 * under-delivers on SPAs, the generated project says so and lists the real
 * options.
 */
export const SPA_SEO_DOC = `# SEO for this app

This is a Vite single-page app. The HTML the server sends is an empty shell;
\`src/lib/use-seo.ts\` fills in titles, descriptions and JSON-LD once React has
mounted.

Googlebot renders JavaScript and will usually see that. **Most answer-engine
crawlers do not** — GPTBot, ClaudeBot, PerplexityBot and the social preview
bots generally read the first HTML response and nothing more. So link previews
and AI citations show whatever is hard-coded in \`index.html\`, not your
per-route metadata.

If organic search or AI discovery matters here, pick one of these.

## 1. Move to Next.js

Metadata renders server-side, so every crawler sees the real thing. Fewest
ongoing moving parts.

\`\`\`bash
xocket create my-app --framework next --ai-seo
\`\`\`

## 2. Prerender at build time

Works when the routes are known ahead of time — \`vike\`, or a post-build crawl
that writes one HTML file per route.

Trade-off: the build must enumerate every route, so it does not help with
user-generated or highly dynamic pages.

## 3. Prerender at the edge

A service in front of the domain detects crawlers and serves them fully
rendered HTML, while humans keep getting the SPA. No application changes.

[LuminaSEO](https://github.com/OceanLab-Technology/LuminaSEO) does this: it
sits in front of the domain via DNS, detects search engines, social bots and
LLM crawlers, and serves them rendered HTML.

Trade-off: another service in the request path, and a cache to reason about.

---

Whichever you pick, keep \`src/lib/seo.ts\` as the single source of truth — all
three read from it.
`;
