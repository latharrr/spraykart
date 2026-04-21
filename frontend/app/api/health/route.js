import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.query('SELECT 1');
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ status: 'error', db: 'disconnected', error: err.message }, { status: 503 });
  }
}
