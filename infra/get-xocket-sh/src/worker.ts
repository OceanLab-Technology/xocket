/**
 * get.xocket.sh — serves the Xocket install script.
 *
 * `curl -fsSL https://get.xocket.sh | sh` must return the script as plain
 * text. A browser hitting the same URL gets the documentation instead, since
 * a wall of shell is not what a person following a link is looking for.
 *
 * The script itself lives in the repository at scripts/install.sh; this worker
 * only proxies it, so fixing the installer means merging to main, not
 * redeploying.
 */

interface Env {
  REPO: string;
  REF: string;
}

/** Cache at the edge for five minutes so a fix propagates quickly. */
const EDGE_TTL = 300;

const SCRIPT_PATHS = new Set(['/', '/install.sh', '/install']);

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get('accept') ?? '';
  // curl and wget send */* or nothing; browsers ask for HTML explicitly.
  return accept.includes('text/html');
}

function docsRedirect(env: Env): Response {
  return Response.redirect(`https://github.com/${env.REPO}#install`, 302);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed\n', {
        status: 405,
        headers: { allow: 'GET, HEAD' },
      });
    }

    if (!SCRIPT_PATHS.has(url.pathname)) {
      return docsRedirect(env);
    }

    if (wantsHtml(request)) {
      return docsRedirect(env);
    }

    const source = `https://raw.githubusercontent.com/${env.REPO}/${env.REF}/scripts/install.sh`;

    const cache = caches.default;
    const cacheKey = new Request(source, { method: 'GET' });
    let upstream = await cache.match(cacheKey);

    if (!upstream) {
      upstream = await fetch(source, {
        cf: { cacheTtl: EDGE_TTL, cacheEverything: true },
      });

      if (!upstream.ok) {
        // Never emit a partial or error body — it would be piped into a shell.
        return new Response(
          `# Could not fetch the install script (upstream ${upstream.status}).\n` +
            `# Install with npm instead:  npm install -g xocket\n` +
            `exit 1\n`,
          { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8' } },
        );
      }

      upstream = new Response(upstream.body, upstream);
      upstream.headers.set('cache-control', `public, max-age=${EDGE_TTL}`);
      ctx.waitUntil(cache.put(cacheKey, upstream.clone()));
    }

    const body = await upstream.text();

    // A truncated script piped to sh is worse than no script at all.
    if (!body.startsWith('#!/bin/sh')) {
      return new Response(
        `# The install script failed a sanity check and was not served.\n` +
          `# Install with npm instead:  npm install -g xocket\n` +
          `exit 1\n`,
        { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8' } },
      );
    }

    return new Response(body, {
      headers: {
        'content-type': 'text/x-shellscript; charset=utf-8',
        'cache-control': `public, max-age=${EDGE_TTL}`,
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
      },
    });
  },
} satisfies ExportedHandler<Env>;
