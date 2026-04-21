import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  return NextResponse.json(user);
}
