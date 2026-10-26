import { NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { listProducts, readListingParams } from '@/lib/catalog';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = readListingParams(searchParams);
  if (!searchParams.get('limit')) query.limit = 12;

  try {
    const result = await listProducts(query);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
    });
  } catch (err) {
    logger.error('Products list error:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
