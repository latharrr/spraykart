import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

// ONE-TIME USE — delete this file after admin login works
export async function GET() {
  const secret = process.env.SETUP_SECRET;
  if (!secret || secret !== 'spraykart-setup-2024') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const hash = await bcrypt.hash('Admin@123', 12);
    await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ('Admin', 'admin@spraykart.in', $1, 'admin')
       ON CONFLICT (email) DO UPDATE SET password = $1, role = 'admin'`,
      [hash]
    );
    return NextResponse.json({ success: true, message: 'Admin password set to Admin@123' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
