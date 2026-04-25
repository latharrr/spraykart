import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const startedAt = nowMs();
  const timestamp = new Date().toISOString();

  const result = {
    status: 'ok',
    timestamp,
    region: process.env.VERCEL_REGION || 'local',
    cacheConfigured: Boolean(process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN),
    db: {
      ok: false,
      latencyMs: null,
      error: null,
    },
    cache: {
      setMs: null,
      firstGetMs: null,
      secondGetMs: null,
      firstHit: false,
      secondHit: false,
    },
    totalMs: null,
  };

  try {
    const dbStart = nowMs();
    await db.query('SELECT 1');
    result.db.ok = true;
    result.db.latencyMs = nowMs() - dbStart;

    const cacheKey = `perf:ping:${process.env.VERCEL_REGION || 'local'}`;
    const payload = { ts: timestamp };

    const setStart = nowMs();
    await cache.set(cacheKey, payload, 60);
    result.cache.setMs = nowMs() - setStart;

    const firstGetStart = nowMs();
    const first = await cache.get(cacheKey);
    result.cache.firstGetMs = nowMs() - firstGetStart;
    result.cache.firstHit = Boolean(first);

    const secondGetStart = nowMs();
    const second = await cache.get(cacheKey);
    result.cache.secondGetMs = nowMs() - secondGetStart;
    result.cache.secondHit = Boolean(second);
  } catch (err) {
    result.status = 'error';
    result.db.error = err?.message || 'Unknown error';
  }

  result.totalMs = nowMs() - startedAt;

  return NextResponse.json(result, {
    status: result.status === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}