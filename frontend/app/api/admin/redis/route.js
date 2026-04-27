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
      const ttl = await cache.ttl(key); // add this
      if (val) {
        // key format: rl:login:123.456.789.0
        const parts = key.replace('rl:', '').split(':');
        const action = parts[0];
        const ip = parts.slice(1).join(':');
        lockedIps.push({
          key,
          action,          // login / register / forgotpw / coupon
          ip,              // actual IP
          attempts: parseInt(val, 10),
          ttl,             // seconds until unban
        });
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
