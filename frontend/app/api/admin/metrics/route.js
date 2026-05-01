import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function money(value) {
  return Number(value || 0);
}

function aov(revenue, orders) {
  const count = Number(orders || 0);
  return count > 0 ? revenue / count : 0;
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const paidOrderWhere = "status IN ('confirmed', 'shipped', 'delivered')";

  try {
    const [summary, abandoned, failedPayments, dlq] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today_orders,
          COALESCE(SUM(final_price) FILTER (WHERE created_at >= CURRENT_DATE AND ${paidOrderWhere}), 0) AS today_revenue,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS rolling_orders,
          COALESCE(SUM(final_price) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND ${paidOrderWhere}), 0) AS rolling_revenue
        FROM orders
      `),
      db.query(`
        SELECT
          o.id,
          o.final_price,
          o.payment_gateway,
          o.created_at,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60) AS age_minutes,
          u.name AS customer_name,
          u.email AS customer_email
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.status = 'pending'
          AND o.payment_method = 'online'
          AND o.created_at < NOW() - INTERVAL '30 minutes'
        ORDER BY o.created_at ASC
        LIMIT 10
      `),
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS rolling_7d
        FROM webhook_events
        WHERE event_type ILIKE '%failed%'
           OR event_type ILIKE '%payment.failed%'
      `),
      db.query(`SELECT COUNT(*) AS count FROM webhook_events WHERE status = 'failed'`),
    ]);

    const row = summary.rows[0] || {};
    const todayRevenue = money(row.today_revenue);
    const rollingRevenue = money(row.rolling_revenue);
    const todayOrders = Number(row.today_orders || 0);
    const rollingOrders = Number(row.rolling_orders || 0);

    return NextResponse.json({
      refreshed_at: new Date().toISOString(),
      sessions_tracked: false,
      today: {
        orders_count: todayOrders,
        revenue: todayRevenue,
        aov: aov(todayRevenue, todayOrders),
        conversion_rate: null,
      },
      rolling_7d: {
        orders_count: rollingOrders,
        revenue: rollingRevenue,
        aov: aov(rollingRevenue, rollingOrders),
        conversion_rate: null,
      },
      top_abandoned: abandoned.rows,
      failed_payments: {
        today: Number(failedPayments.rows[0]?.today || 0),
        rolling_7d: Number(failedPayments.rows[0]?.rolling_7d || 0),
      },
      webhook_dlq_count: Number(dlq.rows[0]?.count || 0),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 });
  }
}
