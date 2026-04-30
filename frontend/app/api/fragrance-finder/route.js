import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const answers = body?.answers;
    const resultUrl = body?.result_url;

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return NextResponse.json({ error: 'Quiz answers are required' }, { status: 400 });
    }

    if (typeof resultUrl !== 'string' || !resultUrl.startsWith('/products')) {
      return NextResponse.json({ error: 'Result URL is required' }, { status: 400 });
    }

    const user = await getAuthUser(request);
    const { rows } = await db.query(
      `INSERT INTO fragrance_finder_submissions (user_id, answers, result_url)
       VALUES ($1, $2::jsonb, $3)
       RETURNING *`,
      [user?.id || null, JSON.stringify(answers), resultUrl]
    );

    return NextResponse.json({ submission: rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Fragrance finder submission error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}