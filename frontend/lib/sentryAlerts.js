function getSentryIngest(dsnValue) {
  if (!dsnValue) return null;

  try {
    const dsn = new URL(dsnValue);
    const parts = dsn.pathname.split('/').filter(Boolean);
    const projectId = parts.pop();
    const basePath = parts.length ? `/${parts.join('/')}` : '';

    if (!dsn.username || !projectId) return null;

    return {
      endpoint: `${dsn.protocol}//${dsn.host}${basePath}/api/${projectId}/store/`,
      publicKey: dsn.username,
    };
  } catch {
    return null;
  }
}

export async function capturePaymentSignatureFailure({ provider, paymentEventType, failureType, error }) {
  const ingest = getSentryIngest(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!ingest) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    await fetch(ingest.endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-sentry-auth': [
          'Sentry sentry_version=7',
          'sentry_client=spraykart/1.0',
          `sentry_key=${ingest.publicKey}`,
        ].join(', '),
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        platform: 'javascript',
        level: 'fatal',
        environment: process.env.NODE_ENV || 'development',
        message: error?.message || 'Payment webhook signature failure',
        exception: {
          values: [{
            type: error?.name || 'Error',
            value: error?.message || 'Payment webhook signature failure',
          }],
        },
        tags: {
          alert_type: 'payment_webhook_signature_failure',
          provider,
          payment_event_type: paymentEventType || 'unknown',
          failure_type: failureType || 'signature.invalid',
        },
      }),
    });
  } catch {
    // Alert capture must never block webhook acknowledgement or DLQ recording.
  } finally {
    clearTimeout(timeout);
  }
}
