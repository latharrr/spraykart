import { NextResponse } from 'next/server';
import cache from '@/lib/cache';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    const keys = await cache.keys('rl:*');
    const lockedIps = [];
    
    for (const key of keys) {
      const val = await cache.get(key);
      if (val) {
        lockedIps.push({ key, attempts: parseInt(val, 10) });
      }
    }

    return NextResponse.json({ lockedIps });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    await cache.flushAll();
    return NextResponse.json({ success: true, message: 'Redis Cache Flushed Successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
