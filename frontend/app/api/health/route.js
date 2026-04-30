import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = { status: 'ok', timestamp: new Date().toISOString() };
  
  // Check database
  try {
    await db.query('SELECT 1');
    health.db = 'connected';
  } catch (err) {
    health.status = 'degraded';
    health.db = `disconnected: ${err.message}`;
  }

  // Check cache (try a simple set/get)
  try {
    const testKey = `health_check_${Date.now()}`;
    await cache.set(testKey, 'test', 10);
    const val = await cache.get(testKey);
    health.cache = val === 'test' ? 'connected' : 'test_failed';
  } catch (err) {
    health.cache = `error: ${err.message}`;
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
