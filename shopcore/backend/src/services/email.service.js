/**
 * email.service.js — Powered by Resend (resend.com)
 * Falls back gracefully if RESEND_API_KEY is not set (logs a warning).
 * 
 * Setup: npm install resend
 * Env:   RESEND_API_KEY=re_xxxxxxxxxxxx
 *        EMAIL_FROM=Spraykart <orders@spraykart.in>
 *        ADMIN_EMAIL=admin@spraykart.in
 *        FRONTEND_URL=https://spraykart.vercel.app
 */
const { Resend } = require('resend');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Spraykart <onboarding@resend.dev>';

const send = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not set — skipping email');
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    logger.info(`Email sent → ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email failed → ${to}: ${err.message}`);
  }
};

// ─── Shared HTML shell ────────────────────────────────────────────────────────
const shell = (body) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Inter',Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #e8e8e8">
    <div style="background:#0c0c0c;padding:24px 32px;display:flex;align-items:center">
      <span style="font-family:Georgia,serif;font-size:22px;color:#fff;font-weight:400;letter-spacing:-0.02em">
        Spray<em style="font-style:italic;font-weight:300">kart</em>
      </span>
    </div>
    <div style="padding:36px 32px">${body}</div>
    <div style="background:#f9f9f7;padding:20px 32px;border-top:1px solid #e8e8e8;text-align:center">
      <p style="margin:0;font-size:11px;color:#a0a0a0;letter-spacing:0.05em">
        © ${new Date().getFullYear()} Spraykart · 100% Authentic Luxury Fragrances · India
      </p>
      <p style="margin:6px 0 0;font-size:11px;color:#c0c0c0">
        MCA Registered · GST Invoiced · Pan-India Delivery
      </p>
    </div>
  </div>
</body>
</html>`;

const btn = (href, text) =>
  `<a href="${href}" style="display:inline-block;margin-top:24px;background:#0c0c0c;color:#fff;padding:12px 28px;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">${text}</a>`;

// ─── 1. Order Confirmation ─────────────────────────────────────────────────────
exports.sendOrderConfirmation = async ({ to, name, orderId, items, total, discount }) => {
  const rows = (items || []).map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#737373;text-align:center">×${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:600;text-align:right">₹${(parseFloat(i.price) * i.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('');

  await send({
    to,
    subject: `Order Confirmed 🎉 — #${orderId.slice(0,8).toUpperCase()} | Spraykart`,
    html: shell(`
      <h2 style="margin:0 0 4px;font-size:24px;font-weight:400;font-family:Georgia,serif;color:#0c0c0c">Order Confirmed!</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#737373">Hi ${name}, thank you for your order. We're preparing it now.</p>
      <div style="background:#f9f9f7;padding:12px 16px;border-left:3px solid #0c0c0c;margin-bottom:24px">
        <span style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#a0a0a0">Order ID</span><br>
        <span style="font-size:14px;font-weight:600;color:#0c0c0c;font-family:monospace">#${orderId.slice(0,8).toUpperCase()}</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:2px solid #0c0c0c">
            <th style="padding:8px 0;text-align:left;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#737373">Item</th>
            <th style="padding:8px 0;text-align:center;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#737373">Qty</th>
            <th style="padding:8px 0;text-align:right;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#737373">Price</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${discount > 0 ? `<p style="text-align:right;margin:8px 0 4px;font-size:13px;color:#16a34a">Discount: −₹${parseFloat(discount).toLocaleString('en-IN')}</p>` : ''}
      <div style="text-align:right;margin-top:16px;padding-top:16px;border-top:2px solid #0c0c0c">
        <span style="font-size:18px;font-weight:700;color:#0c0c0c">Total: ₹${parseFloat(total).toLocaleString('en-IN')}</span>
      </div>
      <p style="font-size:13px;color:#737373;margin-top:24px">Estimated delivery: <strong>3–7 business days</strong></p>
      ${btn(`${process.env.FRONTEND_URL}/orders`, 'Track Your Order')}
    `),
  });
};

// ─── 2. Admin — New Order Alert ───────────────────────────────────────────────
exports.sendAdminNewOrder = async ({ orderId, customerName, customerEmail, total, itemCount }) => {
  if (!process.env.ADMIN_EMAIL) return;
  await send({
    to: process.env.ADMIN_EMAIL,
    subject: `🛒 New Order ₹${parseFloat(total).toLocaleString('en-IN')} — ${customerName} | Spraykart`,
    html: shell(`
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#0c0c0c">New Order Received</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><td style="padding:8px 0;color:#737373;width:120px">Order ID</td><td style="font-weight:600;font-family:monospace">#${orderId.slice(0,8).toUpperCase()}</td></tr>
        <tr><td style="padding:8px 0;color:#737373">Customer</td><td style="font-weight:600">${customerName}</td></tr>
        <tr><td style="padding:8px 0;color:#737373">Email</td><td>${customerEmail}</td></tr>
        <tr><td style="padding:8px 0;color:#737373">Items</td><td>${itemCount}</td></tr>
        <tr><td style="padding:8px 0;color:#737373">Total</td><td style="font-weight:700;font-size:16px;color:#0c0c0c">₹${parseFloat(total).toLocaleString('en-IN')}</td></tr>
      </table>
      ${btn(`${process.env.FRONTEND_URL}/admin/orders`, 'View in Admin Panel')}
    `),
  });
};

// ─── 3. Order Status Update ───────────────────────────────────────────────────
exports.sendOrderStatusUpdate = async ({ to, name, orderId, status }) => {
  const map = {
    confirmed: { emoji: '✅', title: 'Order Confirmed',  text: 'Your order has been confirmed and is being prepared.' },
    shipped:   { emoji: '🚚', title: 'Order Shipped',    text: 'Great news! Your order is on its way.' },
    delivered: { emoji: '📦', title: 'Order Delivered',  text: 'Your order has been delivered. We hope you love it!' },
    cancelled: { emoji: '❌', title: 'Order Cancelled',  text: 'Your order has been cancelled. Any payment will be refunded within 5–7 business days.' },
  };
  const m = map[status] || { emoji: '📋', title: 'Order Update', text: `Your order status is now: ${status}.` };

  await send({
    to,
    subject: `${m.emoji} ${m.title} — #${orderId.slice(0,8).toUpperCase()} | Spraykart`,
    html: shell(`
      <h2 style="margin:0 0 4px;font-size:22px;font-weight:400;font-family:Georgia,serif">${m.emoji} ${m.title}</h2>
      <p style="margin:0 0 20px;font-size:13px;color:#737373">Hi ${name},</p>
      <p style="font-size:14px;color:#333;line-height:1.7">${m.text}</p>
      <div style="background:#f9f9f7;padding:12px 16px;border-left:3px solid #0c0c0c;margin:20px 0">
        <span style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#a0a0a0">Order ID</span><br>
        <span style="font-size:14px;font-weight:600;font-family:monospace">#${orderId.slice(0,8).toUpperCase()}</span>
      </div>
      ${btn(`${process.env.FRONTEND_URL}/orders`, 'View Order')}
    `),
  });
};

// ─── 4. Password Reset OTP ────────────────────────────────────────────────────
exports.sendPasswordReset = async ({ to, name, otp }) => {
  await send({
    to,
    subject: `Reset your Spraykart password — OTP: ${otp}`,
    html: shell(`
      <h2 style="margin:0 0 4px;font-size:22px;font-weight:400;font-family:Georgia,serif">Reset Your Password</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#737373">Hi ${name}, use the OTP below to reset your password. It expires in 15 minutes.</p>
      <div style="text-align:center;margin:32px 0">
        <div style="display:inline-block;background:#0c0c0c;color:#fff;padding:20px 40px;letter-spacing:0.5em;font-size:32px;font-weight:700;font-family:monospace">
          ${otp}
        </div>
      </div>
      <p style="font-size:12px;color:#a0a0a0;text-align:center">If you didn't request this, ignore this email. Your password won't change.</p>
    `),
  });
};
