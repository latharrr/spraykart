import * as Sentry from '@sentry/nextjs';
import { redactForLogging } from './lib/logger';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  debug: false,
  beforeSend: (event) => redactForLogging(event),
});
