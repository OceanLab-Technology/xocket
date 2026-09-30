import type { NextConfig } from 'next';
// v10 moved this to the /config subpath; the bare import stops working in v11.
import { withSentryConfig } from '@sentry/nextjs/config';

const nextConfig: NextConfig = {
  // Your Next.js config here.
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source-map uploads need an auth token; set it as a CI secret, never in git.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Skip source-map upload entirely when there is no token (local dev, CI smoke).
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
