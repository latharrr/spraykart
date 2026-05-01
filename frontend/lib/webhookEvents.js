import crypto from 'crypto';
import db from './db';

export function stableEventId(provider, eventType, preferredId, payload) {
  if (preferredId) return String(preferredId);
  const hash = crypto.createHash('sha256').update(typeof payload === 'string' ? payload : JSON.stringify(payload || {})).digest('hex');
  return `${provider}:${eventType || 'unknown'}:${hash}`;
}

function normalizePayload(payload) {
  return typeof payload === 'string' ? payload : JSON.stringify(payload || {});
}

export async function insertWebhookEvent({ provider, eventId, eventType, payload }) {
  const eventKey = `${provider}:${eventId}`;
  const { rows } = await db.query(
    `INSERT INTO webhook_events(provider,event_id,event_type,payload,status,event_key)
     VALUES($1,$2,$3,$4,'processing',$5)
     ON CONFLICT (provider,event_id) DO NOTHING
     RETURNING id`,
    [provider, eventId, eventType || null, normalizePayload(payload), eventKey]
  );
  return { inserted: rows.length > 0, id: rows[0]?.id };
}

export async function recordFailedWebhook({ provider, eventId, eventType, payload, error }) {
  const eventKey = `${provider}:${eventId}`;
  const { rows } = await db.query(
    `INSERT INTO webhook_events(provider,event_id,event_type,payload,status,event_key,last_error,processed_at)
     VALUES($1,$2,$3,$4,'failed',$5,$6,NOW())
     ON CONFLICT (provider,event_id) DO UPDATE SET
       payload=EXCLUDED.payload,
       status='failed',
       last_error=EXCLUDED.last_error,
       processed_at=NOW()
     RETURNING id`,
    [provider, eventId, eventType || null, normalizePayload(payload), eventKey, error?.message || String(error)]
  );
  return rows[0];
}

export async function markWebhookProcessed(id) {
  if (!id) return;
  await db.query("UPDATE webhook_events SET status='processed', processed_at=NOW(), last_error=NULL WHERE id=$1", [id]);
}

export async function markWebhookFailed(id, error) {
  if (!id) return;
  await db.query(
    "UPDATE webhook_events SET status='failed', last_error=$2, processed_at=NOW() WHERE id=$1",
    [id, error?.message || String(error)]
  );
}

export async function prepareWebhookRetry(id) {
  const { rows } = await db.query(
    `UPDATE webhook_events
     SET status='processing', retry_count=retry_count + 1, last_error=NULL
     WHERE id=$1 AND status='failed'
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
}
