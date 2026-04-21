const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password)
  },
});

// Shared email sender with error handling
const sendMail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('Email not configured — skipping email send');
    return;
  }
  try {
    await transporter.sendMail({ from: `"ShopCore" <${process.env.EMAIL_USER}>`, ...options });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (err) {
    logger.error(`Failed to send email to ${options.to}: ${err.message}`);
  }
};

// ─── Templates ───────────────────────────────────────────────────────────────

exports.sendOrderConfirmation = async ({ to, name, orderId, items, total }) => {
  const itemsHtml = items
    .map((i) => `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${parseFloat(i.price * i.quantity).toLocaleString('en-IN')}</td>
    </tr>`)
    .join('');

  await sendMail({
    to,
    subject: `Order Confirmed — #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff">
        <div style="background:#000;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">ShopCore</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#111;margin-top:0">Order Confirmed! 🎉</h2>
          <p style="color:#555">Hi ${name}, your order has been confirmed and is being processed.</p>
          <p style="color:#555"><strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:8px;text-align:left;font-size:12px;color:#888;text-transform:uppercase">Item</th>
                <th style="padding:8px;text-align:center;font-size:12px;color:#888;text-transform:uppercase">Qty</th>
                <th style="padding:8px;text-align:right;font-size:12px;color:#888;text-transform:uppercase">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align:right;font-size:18px;font-weight:700;color:#111">
            Total: ₹${parseFloat(total).toLocaleString('en-IN')}
          </div>
          <div style="margin-top:32px;text-align:center">
            <a href="${process.env.FRONTEND_URL}/orders" style="background:#000;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:600">Track Your Order</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;color:#888;font-size:12px">
          © ${new Date().getFullYear()} ShopCore. All rights reserved.
        </div>
      </div>
    `,
  });
};

exports.sendAdminNewOrder = async ({ orderId, customerName, customerEmail, total, itemCount }) => {
  await sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: `New Order — ₹${parseFloat(total).toLocaleString('en-IN')} from ${customerName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px">
        <h2>New Order Received</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;color:#555">Order ID</td><td style="padding:8px;font-weight:600">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
          <tr><td style="padding:8px;color:#555">Customer</td><td style="padding:8px;font-weight:600">${customerName} (${customerEmail})</td></tr>
          <tr><td style="padding:8px;color:#555">Items</td><td style="padding:8px;font-weight:600">${itemCount}</td></tr>
          <tr><td style="padding:8px;color:#555">Total</td><td style="padding:8px;font-weight:600;color:#16a34a">₹${parseFloat(total).toLocaleString('en-IN')}</td></tr>
        </table>
        <a href="${process.env.FRONTEND_URL}/admin/orders" style="display:inline-block;margin-top:16px;background:#000;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px">View in Admin</a>
      </div>
    `,
  });
};

exports.sendOrderStatusUpdate = async ({ to, name, orderId, status }) => {
  const statusMessages = {
    confirmed: { emoji: '✅', text: 'Your order has been confirmed and is being prepared.' },
    shipped:   { emoji: '🚚', text: 'Your order is on its way!' },
    delivered: { emoji: '📦', text: 'Your order has been delivered. Enjoy!' },
    cancelled: { emoji: '❌', text: 'Your order has been cancelled. A refund (if applicable) will be processed within 5-7 business days.' },
  };

  const msg = statusMessages[status] || { emoji: '📋', text: `Your order status has been updated to: ${status}.` };

  await sendMail({
    to,
    subject: `${msg.emoji} Order Update — #${orderId.slice(0, 8).toUpperCase()} is now ${status}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto">
        <div style="background:#000;padding:20px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">ShopCore</h1>
        </div>
        <div style="padding:32px">
          <h2 style="margin-top:0">${msg.emoji} Order ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
          <p>Hi ${name},</p>
          <p>${msg.text}</p>
          <p><strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
          <a href="${process.env.FRONTEND_URL}/orders" style="display:inline-block;margin-top:16px;background:#000;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px">View Order</a>
        </div>
      </div>
    `,
  });
};
