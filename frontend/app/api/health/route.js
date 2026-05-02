import { NextResponse } from 'next/server';
import { checkDatabase, checkRedis } from '@/lib/healthChecks';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    db: await checkDatabase(),
    redis: await checkRedis(),
  };
  // Redis is optional — treat 'not_configured' as healthy so uptime monitors
  // don't alert when Redis is intentionally omitted.
  const redisOk = checks.redis.ok || checks.redis.status === 'not_configured';
  const healthy = checks.db.ok && redisOk;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
