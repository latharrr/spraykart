import { NextResponse } from 'next/server';
import { checkDatabase, checkRedis } from '@/lib/healthChecks';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    db: await checkDatabase(),
    redis: await checkRedis(),
  };
  const healthy = checks.db.ok && checks.redis.ok;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
