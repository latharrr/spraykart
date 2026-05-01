import { NextResponse } from 'next/server';
import { processEmailJobs } from '@/lib/emailJobs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const headerSecret = request.headers.get('x-cron-secret');
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (headerSecret !== secret && bearer !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const processed = await processEmailJobs({ limit: 10 });
  return NextResponse.json({ success: true, processed });
}
