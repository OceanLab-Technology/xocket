import * as Sentry from '@sentry/nextjs';

export async function register() {
  const common = {
    // Server-side DSN — deliberately NOT the NEXT_PUBLIC_ one.
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  };

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(common);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(common);
  }
}

export const onRequestError = Sentry.captureRequestError;
