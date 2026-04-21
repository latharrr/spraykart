import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const { searchParams } = new URL(request.url);
  const safePeriod = parseInt(searchParams.get('period') || '30') || 30;

  try {
    const [revenue, orders, topProducts, recentOrders, userCount, dailyRevenue] = await Promise.all([
      db.query(`SELECT
        COALESCE(SUM(final_price),0) as total,
        COALESCE(SUM(CASE WHEN created_at >= NOW()-INTERVAL '7 days' THEN final_price END),0) as last_7d,
        COALESCE(SUM(CASE WHEN created_at >= NOW()-INTERVAL '30 days' THEN final_price END),0) as last_30d
        FROM orders WHERE status != 'cancelled'`),
      db.query(`SELECT COUNT(*) as total,
        SUM(CASE WHEN status='pending'   THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status='shipped'   THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM orders`),
      db.query(`SELECT p.name, p.slug,
        SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status != 'cancelled' AND o.created_at >= NOW() - INTERVAL '${safePeriod} days'
        GROUP BY p.id, p.name, p.slug ORDER BY revenue DESC LIMIT 5`),
      db.query(`SELECT o.id, o.final_price, o.status, o.created_at, u.name as customer
        FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 10`),
      db.query(`SELECT COUNT(*) as total FROM users WHERE role='customer'`),
      db.query(`SELECT DATE(created_at) as date, COALESCE(SUM(final_price),0) as revenue
        FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY date ASC`),
    ]);

    return NextResponse.json({
      revenue: revenue.rows[0],
      orders: orders.rows[0],
      top_products: topProducts.rows,
      recent_orders: recentOrders.rows,
      users: userCount.rows[0],
      daily_revenue: dailyRevenue.rows,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
