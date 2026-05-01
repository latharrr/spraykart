export async function capturePaymentSignatureFailure({ provider, paymentEventType, failureType, error }) {
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.withScope((scope) => {
      scope.setLevel('fatal');
      scope.setTag('alert_type', 'payment_webhook_signature_failure');
      scope.setTag('provider', provider);
      scope.setTag('payment_event_type', paymentEventType || 'unknown');
      scope.setTag('failure_type', failureType || 'signature.invalid');
      Sentry.captureException(error);
    });
  } catch {
    // Alert capture must never block webhook acknowledgement or DLQ recording.
  }
}
