import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { processEmailJobs } from '@/lib/emailJobs';

export const dynamic = 'force-dynamic';

function secretsEqual(a, b) {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const headerSecret = request.headers.get('x-cron-secret') || '';
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secretsEqual(headerSecret, secret) && !secretsEqual(bearer, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const processed = await processEmailJobs({ limit: 10 });
  return NextResponse.json({ success: true, processed });
}
