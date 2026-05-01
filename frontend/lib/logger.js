const SENSITIVE_KEY_RE = /(password|otp|token|authorization|cookie|secret|signature|shipping_?address|billing_?address|address|line1|line2|pincode|phone|mobile|email|razorpay_|paytm_|payment_id|paymentid|gateway_refund_id|refund_id)/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(\+?91[-\s]?)?[6-9]\d{9}\b/g;
const PAYMENT_ID_RE = /\b(pay|order|rfnd|refund|txn)_[A-Za-z0-9_-]+\b/g;

function maskEmail(value) {
  return String(value).replace(EMAIL_RE, (email) => {
    const [name, domain] = email.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  });
}

function maskPhone(value) {
  return String(value).replace(PHONE_RE, (phone) => {
    const digits = phone.replace(/\D/g, '');
    return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  });
}

function maskString(value) {
  return maskPhone(maskEmail(String(value))).replace(PAYMENT_ID_RE, '[REDACTED_PAYMENT_ID]');
}

function redactValue(key, value, seen, depth) {
  if (value == null) return value;
  const keyName = String(key || '');

  if (SENSITIVE_KEY_RE.test(keyName)) {
    if (/email/i.test(keyName)) return maskEmail(value);
    if (/phone|mobile|tel/i.test(keyName)) return maskPhone(value);
    return '[REDACTED]';
  }

  if (typeof value === 'string') return maskString(value);
  if (typeof value !== 'object') return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: maskString(value.message),
      stack: value.stack ? maskString(value.stack) : undefined,
    };
  }
  if (depth > 8) return '[MAX_DEPTH]';
  if (seen.has(value)) return '[CIRCULAR]';

  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => redactValue('', item, seen, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      redactValue(entryKey, entryValue, seen, depth + 1),
    ])
  );
}

export function redactForLogging(value) {
  return redactValue('', value, new WeakSet(), 0);
}

export const logger = {
  error: (...args) => console.error(...args.map(redactForLogging)),
  warn: (...args) => console.warn(...args.map(redactForLogging)),
  info: (...args) => console.info(...args.map(redactForLogging)),
  debug: (...args) => console.debug(...args.map(redactForLogging)),
};

export default logger;
