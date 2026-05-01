import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { prepareWebhookRetry, markWebhookFailed } from '@/lib/webhookEvents';
import { processPaytmWebhookEvent, processRazorpayWebhookEvent } from '@/lib/webhookProcessors';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const event = await prepareWebhookRetry(params.id);
  if (!event) {
    return NextResponse.json({ error: 'Failed webhook event not found' }, { status: 404 });
  }

  try {
    if (event.provider === 'razorpay') {
      await processRazorpayWebhookEvent(event.payload, event.id);
    } else if (event.provider === 'paytm') {
      await processPaytmWebhookEvent(event.payload, event.id);
    } else {
      throw new Error(`Unsupported provider: ${event.provider}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    await markWebhookFailed(event.id, err);
    logger.error('Webhook DLQ retry failed:', err);
    return NextResponse.json({ error: 'Retry failed' }, { status: 500 });
  }
}
