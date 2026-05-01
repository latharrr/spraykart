import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { createInvoicePdf, formatInvoiceNumber } from '@/lib/invoice';
import { getBusinessProfile } from '@/lib/business';

export const dynamic = 'force-dynamic';

const INVOICE_STATUSES = new Set(['confirmed', 'shipped', 'delivered']);

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const client = await db.pool.connect();
  let order;
  let invoice;
  let items;

  try {
    await client.query('BEGIN');
    const { rows: orderRows } = await client.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o JOIN users u ON u.id=o.user_id
       WHERE o.id=$1 AND o.user_id=$2 FOR SHARE`,
      [params.id, user.id]
    );
    if (!orderRows.length) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    order = orderRows[0];
    if (!INVOICE_STATUSES.has(order.status)) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Invoice is available only after order confirmation' }, { status: 409 });
    }

    const { rows: invoiceRows } = await client.query('SELECT * FROM invoices WHERE order_id=$1', [order.id]);
    if (invoiceRows.length) {
      invoice = invoiceRows[0];
    } else {
      const { rows: seqRows } = await client.query("SELECT nextval('invoice_seq') as seq, NOW() as generated_at");
      const generatedAt = seqRows[0].generated_at;
      const invoiceNumber = formatInvoiceNumber(seqRows[0].seq, new Date(generatedAt));
      const { rows: inserted } = await client.query(
        'INSERT INTO invoices(order_id, invoice_number, generated_at) VALUES($1,$2,$3) RETURNING *',
        [order.id, invoiceNumber, generatedAt]
      );
      invoice = inserted[0];
    }

    const { rows: itemRows } = await client.query(
      `SELECT oi.*, COALESCE(oi.hsn_code, p.hsn_code, '3303') as hsn_code,
              COALESCE(oi.gst_rate, p.gst_rate, 18) as gst_rate
       FROM order_items oi
       LEFT JOIN products p ON p.id=oi.product_id
       WHERE oi.order_id=$1
       ORDER BY oi.id`,
      [order.id]
    );
    items = itemRows;
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }

  const pdf = await createInvoicePdf({ invoice, order, items, business: getBusinessProfile() });
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number.replaceAll('/', '-')}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
