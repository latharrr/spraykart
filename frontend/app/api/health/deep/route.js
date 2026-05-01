import { NextResponse } from 'next/server';
import {
  checkCloudinary,
  checkDatabase,
  checkRazorpay,
  checkRedis,
  skippedResendCheck,
} from '@/lib/healthChecks';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerSecret = request.headers.get('x-cron-secret');
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return headerSecret === secret || bearer === secret;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks = {
    db: await checkDatabase(),
    redis: await checkRedis(),
    razorpay: await checkRazorpay(),
    resend: skippedResendCheck(),
    cloudinary: await checkCloudinary(),
  };
  const healthy = Object.values(checks).every((check) => check.ok);

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
