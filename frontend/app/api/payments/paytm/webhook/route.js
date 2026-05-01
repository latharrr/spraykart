import { NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
import {
  insertWebhookEvent,
  markWebhookFailed,
  recordFailedWebhook,
  stableEventId,
} from '@/lib/webhookEvents';
import { processPaytmWebhookEvent } from '@/lib/webhookProcessors';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let rawBody = '';
  let json = null;
  let eventRecord = null;

  try {
    rawBody = await request.text();
    try {
      json = JSON.parse(rawBody);
    } catch (err) {
      await recordFailedWebhook({
        provider: 'paytm',
        eventId: stableEventId('paytm', 'payload.invalid_json', null, rawBody),
        eventType: 'payload.invalid_json',
        payload: '{}',
        error: err,
      });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const receivedChecksum = json?.CHECKSUMHASH || request.headers.get('x-paytm-signature');
    const merchantKey = process.env.PAYTM_MERCHANT_KEY;
    if (!merchantKey) {
      await recordFailedWebhook({
        provider: 'paytm',
        eventId: stableEventId('paytm', 'not_configured', json?.id || json?.ORDERID, json),
        eventType: 'not_configured',
        payload: json,
        error: new Error('PAYTM_MERCHANT_KEY not configured'),
      });
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    let isValid = true;
    if (receivedChecksum && json) {
      const payload = { ...json };
      delete payload.CHECKSUMHASH;
      try {
        isValid = await PaytmChecksum.verifySignature(payload, merchantKey, receivedChecksum);
      } catch {
        isValid = false;
      }
    }

    const paymentForId = json?.payload?.payment?.entity || json;
    const eventId = stableEventId('paytm', json?.event || json?.eventType, json?.id || paymentForId?.txnId || paymentForId?.id || paymentForId?.orderId || paymentForId?.ORDERID, json);

    if (!isValid) {
      await recordFailedWebhook({
        provider: 'paytm',
        eventId: `invalid_signature:${eventId}`,
        eventType: 'signature.invalid',
        payload: json,
        error: new Error('Invalid Paytm signature'),
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    eventRecord = await insertWebhookEvent({ provider: 'paytm', eventId, eventType: json?.event || json?.eventType, payload: json });
    if (!eventRecord.inserted) return NextResponse.json({ received: true });

    await processPaytmWebhookEvent(json, eventRecord.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    if (eventRecord?.id) {
      await markWebhookFailed(eventRecord.id, err);
    } else if (json || rawBody) {
      await recordFailedWebhook({
        provider: 'paytm',
        eventId: stableEventId('paytm', 'handler.error', null, json || rawBody),
        eventType: 'handler.error',
        payload: json || '{}',
        error: err,
      });
    }
    logger.error('Paytm webhook failed:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
