import Razorpay from 'razorpay';
import cloudinary from './cloudinary';
import db from './db';
import cache from './cache';

const TIMEOUT_MS = 2000;

function withTimeout(label, promise, timeoutMs = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function ok(details = {}) {
  return { ok: true, status: 'connected', ...details };
}

function fail(error) {
  return { ok: false, status: 'failed', error: error?.message || String(error) };
}

export async function checkDatabase() {
  try {
    await withTimeout('db', db.query('SELECT 1'));
    return ok();
  } catch (err) {
    return fail(err);
  }
}

export async function checkRedis() {
  try {
    const result = await withTimeout('redis', cache.ping());
    return result.ok ? ok({ response: result.status }) : { ok: false, status: result.status };
  } catch (err) {
    return fail(err);
  }
}

export async function checkRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return { ok: false, status: 'not_configured' };

  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    await withTimeout('razorpay', razorpay.orders.all({ count: 1 }));
    return ok();
  } catch (err) {
    return fail(err);
  }
}

export async function checkCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return { ok: false, status: 'not_configured' };
  }

  try {
    await withTimeout('cloudinary', cloudinary.api.ping());
    return ok();
  } catch (err) {
    return fail(err);
  }
}

export function skippedResendCheck() {
  return { ok: true, status: 'skipped_write_only' };
}
