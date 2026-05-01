import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  insertWebhookEvent,
  markWebhookFailed,
  recordFailedWebhook,
  stableEventId,
} from '@/lib/webhookEvents';
import { processRazorpayWebhookEvent } from '@/lib/webhookProcessors';
import logger from '@/lib/logger';
import { capturePaymentSignatureFailure } from '@/lib/sentryAlerts';

export const dynamic = 'force-dynamic';

function hashPayload(rawBody) {
  return crypto.createHash('sha256').update(rawBody || '').digest('hex');
}

function getEventType(rawBody) {
  try {
    return JSON.parse(rawBody)?.event;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const signature = request.headers.get('x-razorpay-signature');
  let rawBody = '';
  let eventRecord = null;

  try {
    rawBody = await request.text();
    if (!signature) {
      const error = new Error('Missing Razorpay webhook signature');
      await recordFailedWebhook({
        provider: 'razorpay',
        eventId: `missing_signature:${hashPayload(rawBody)}`,
        eventType: 'signature.missing',
        payload: rawBody || '{}',
        error,
      });
      await capturePaymentSignatureFailure({
        provider: 'razorpay',
        paymentEventType: getEventType(rawBody),
        failureType: 'signature.missing',
        error,
      });
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) {
      const error = new Error('Invalid Razorpay webhook signature');
      await recordFailedWebhook({
        provider: 'razorpay',
        eventId: `invalid_signature:${hashPayload(rawBody)}`,
        eventType: 'signature.invalid',
        payload: rawBody || '{}',
        error,
      });
      await capturePaymentSignatureFailure({
        provider: 'razorpay',
        paymentEventType: getEventType(rawBody),
        failureType: 'signature.invalid',
        error,
      });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      await recordFailedWebhook({
        provider: 'razorpay',
        eventId: `invalid_json:${hashPayload(rawBody)}`,
        eventType: 'payload.invalid_json',
        payload: '{}',
        error: err,
      });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const payment = event?.payload?.payment?.entity;
    const eventId = stableEventId('razorpay', event.event, event?.id || payment?.id, rawBody);
    eventRecord = await insertWebhookEvent({ provider: 'razorpay', eventId, eventType: event.event, payload: rawBody });
    if (!eventRecord.inserted) return NextResponse.json({ received: true });

    await processRazorpayWebhookEvent(event, eventRecord.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    if (eventRecord?.id) {
      await markWebhookFailed(eventRecord.id, err);
    } else if (rawBody) {
      await recordFailedWebhook({
        provider: 'razorpay',
        eventId: `handler_error:${hashPayload(rawBody)}`,
        eventType: 'handler.error',
        payload: rawBody,
        error: err,
      });
    }
    logger.error('Razorpay webhook failed:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
