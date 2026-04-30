import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'Spraykart <onboarding@resend.dev>';
const FRONTEND_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://spraykart.vercel.app';

// Warn if critical env vars are missing
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_EMAIL) console.warn('[email] ADMIN_EMAIL not set; admin notifications will be skipped');
  if (!process.env.RESEND_API_KEY) console.warn('[email] RESEND_API_KEY not set; all email notifications will be skipped');
}

const shell = (body) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Inter',Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #e8e8e8">
    <div style="background:#0c0c0c;padding:24px 32px">
      <span style="font-family:Georgia,serif;font-size:22px;color:#fff;font-weight:400">Spray<em style="font-style:italic;font-weight:300">kart</em></span>
    </div>
    <div style="padding:36px 32px">${body}</div>
    <div style="background:#f9f9f7;padding:20px 32px;border-top:1px solid #e8e8e8;text-align:center">
      <p style="margin:0;font-size:11px;color:#a0a0a0">© ${new Date().getFullYear()} Spraykart · 100% Authentic Luxury Fragrances · India</p>
    </div>
  </div>
</body></html>`;

async function send({ to, subject, html }) {
  if (!resend) { console.warn('RESEND_API_KEY not set'); return; }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Email failed:', err.message);
  }
}

export const email = {
  sendOrderConfirmation: ({ to, name, orderId, items = [], total, discount }) => {
    const rows = items.map((i) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center">×${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:600;text-align:right">₹${(parseFloat(i.price) * i.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('');
    return send({
      to, subject: `Order Confirmed 🎉 — #${orderId.slice(0, 8).toUpperCase()} | Spraykart`,
      html: shell(`<h2 style="margin:0 0 20px;font-size:22px;font-weight:400;font-family:Georgia,serif">Order Confirmed!</h2>
        <p style="font-size:13px;color:#737373">Hi ${name}, your order is being prepared.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0"><tbody>${rows}</tbody></table>
        ${discount > 0 ? `<p style="text-align:right;color:#16a34a;font-size:13px">Discount: −₹${parseFloat(discount).toLocaleString('en-IN')}</p>` : ''}
        <p style="text-align:right;font-size:18px;font-weight:700;border-top:2px solid #0c0c0c;padding-top:12px">Total: ₹${parseFloat(total).toLocaleString('en-IN')}</p>
        <a href="${FRONTEND_URL}/orders" style="display:inline-block;margin-top:20px;background:#0c0c0c;color:#fff;padding:12px 28px;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">Track Your Order</a>`),
    });
  },

  sendAdminNewOrder: ({ orderId, customerName, customerEmail, total, itemCount }) => {
    if (!process.env.ADMIN_EMAIL) {
      console.warn('[email] ADMIN_EMAIL not set; skipping admin notification for order', orderId?.slice?.(0, 8));
      return Promise.resolve();
    }
    return send({
      to: process.env.ADMIN_EMAIL,
      subject: `🛒 New Order ₹${parseFloat(total).toLocaleString('en-IN')} — ${customerName}`,
      html: shell(`<h2 style="margin:0 0 16px;font-size:18px;font-weight:600">New Order Received</h2>
        <p><strong>Order:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
        <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
        <p><strong>Items:</strong> ${itemCount}</p>
        <p><strong>Total:</strong> ₹${parseFloat(total).toLocaleString('en-IN')}</p>
        <a href="${FRONTEND_URL}/admin/orders" style="display:inline-block;margin-top:20px;background:#0c0c0c;color:#fff;padding:12px 28px;text-decoration:none;font-size:11px;font-weight:600;text-transform:uppercase">View in Admin</a>`),
    });
  },

  sendAdminDispute: ({ orderId, expected, received, paymentId, gateway, details }) => {
    if (!process.env.ADMIN_EMAIL) return Promise.resolve();
    const idShort = String(orderId).slice(0, 8).toUpperCase();
    return send({
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ Payment Dispute — #${idShort} — ${gateway}`,
      html: shell(`<h2 style="margin:0 0 16px;font-size:18px;font-weight:600">Payment Discrepancy Detected</h2>
        <p><strong>Order:</strong> #${idShort}</p>
        <p><strong>Gateway:</strong> ${gateway}</p>
        <p><strong>Payment ID:</strong> ${paymentId || 'N/A'}</p>
        <p><strong>Expected amount:</strong> ₹${parseFloat(expected || 0).toLocaleString('en-IN')}</p>
        <p><strong>Received amount:</strong> ₹${parseFloat(received || 0).toLocaleString('en-IN')}</p>
        <pre style="background:#f6f6f6;padding:12px;border-radius:6px;overflow:auto">${typeof details === 'string' ? details : JSON.stringify(details, null, 2)}</pre>
        <a href="${FRONTEND_URL}/admin/orders" style="display:inline-block;margin-top:20px;background:#0c0c0c;color:#fff;padding:12px 28px;text-decoration:none;font-size:11px;font-weight:600;text-transform:uppercase">View Orders</a>`),
    });
  },

  sendOrderStatusUpdate: ({ to, name, orderId, status }) => {
    const map = {
      shipped: { emoji: '🚚', title: 'Order Shipped', text: 'Your order is on its way!' },
      delivered: { emoji: '📦', title: 'Order Delivered', text: 'Your order has been delivered!' },
      cancelled: { emoji: '❌', title: 'Order Cancelled', text: 'Your order has been cancelled. Refund within 5–7 business days.' },
    };
    const m = map[status] || { emoji: '📋', title: 'Order Update', text: `Status: ${status}` };
    return send({
      to, subject: `${m.emoji} ${m.title} — #${orderId.slice(0, 8).toUpperCase()} | Spraykart`,
      html: shell(`<h2 style="font-size:20px;font-weight:400;font-family:Georgia,serif">${m.emoji} ${m.title}</h2>
        <p style="color:#737373;font-size:13px">Hi ${name},</p>
        <p style="font-size:14px;color:#333">${m.text}</p>
        <a href="${FRONTEND_URL}/orders" style="display:inline-block;margin-top:20px;background:#0c0c0c;color:#fff;padding:12px 28px;text-decoration:none;font-size:11px;font-weight:600;text-transform:uppercase">View Order</a>`),
    });
  },

  sendPasswordReset: ({ to, name, otp }) => send({
    to, subject: `Reset your Spraykart password — OTP: ${otp}`,
    html: shell(`<h2 style="font-size:20px;font-weight:400;font-family:Georgia,serif">Reset Your Password</h2>
      <p style="color:#737373;font-size:13px">Hi ${name}, use the OTP below. Expires in 15 minutes.</p>
      <div style="text-align:center;margin:32px 0">
        <div style="display:inline-block;background:#0c0c0c;color:#fff;padding:20px 40px;letter-spacing:0.5em;font-size:32px;font-weight:700;font-family:monospace">${otp}</div>
      </div>`),
  }),

  sendWelcome: ({ to, name }) => send({
    to, subject: `Welcome to Spraykart, ${name}! 🎉`,
    html: shell(`<h2 style="font-size:20px;font-weight:400;font-family:Georgia,serif">Welcome to Spraykart!</h2>
      <p style="color:#737373;font-size:13px;line-height:1.6">Hi ${name},</p>
      <p style="color:#737373;font-size:13px;line-height:1.6">We're thrilled to have you here. Spraykart is India's most trusted luxury fragrance platform, offering 100% authentic perfumes, attars, and niche fragrances.</p>
      <p style="color:#737373;font-size:13px;line-height:1.6">To get started, explore our curated collections:</p>
      <a href="${FRONTEND_URL}/products" style="display:inline-block;margin-top:20px;background:#0c0c0c;color:#fff;padding:12px 28px;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">Shop Fragrances</a>`),
  }),
};

export default email;
