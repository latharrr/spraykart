import db from './db';
import { email } from './email';

const BACKOFF_SECONDS = [60, 300, 1800, 7200];

export async function enqueueEmailJob(payload, client = db) {
  await client.query(
    'INSERT INTO email_jobs(payload, status, scheduled_at) VALUES($1, $2, NOW())',
    [JSON.stringify(payload), 'pending']
  );
}

export async function processEmailJobs({ limit = 10 } = {}) {
  const client = await db.pool.connect();
  const processed = [];

  try {
    await client.query('BEGIN');
    const { rows: jobs } = await client.query(
      `SELECT * FROM email_jobs
       WHERE status='pending' AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC, created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [limit]
    );

    for (const job of jobs) {
      await client.query("UPDATE email_jobs SET status='processing', updated_at=NOW() WHERE id=$1", [job.id]);
    }
    await client.query('COMMIT');

    for (const job of jobs) {
      try {
        await sendEmailPayload(job.payload);
        await db.query("UPDATE email_jobs SET status='sent', updated_at=NOW(), last_error=NULL WHERE id=$1", [job.id]);
        processed.push({ id: job.id, status: 'sent' });
      } catch (err) {
        const attempts = Number(job.attempts || 0) + 1;
        const delay = BACKOFF_SECONDS[Math.min(attempts - 1, BACKOFF_SECONDS.length - 1)];
        const status = attempts >= BACKOFF_SECONDS.length ? 'failed' : 'pending';
        await db.query(
          `UPDATE email_jobs
           SET attempts=$2, status=$3, scheduled_at=NOW() + ($4::int * INTERVAL '1 second'),
               last_error=$5, updated_at=NOW()
           WHERE id=$1`,
          [job.id, attempts, status, delay, err.message || String(err)]
        );
        processed.push({ id: job.id, status, error: err.message || String(err) });
      }
    }

    return processed;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function sendEmailPayload(payload) {
  const { type, args } = payload || {};
  switch (type) {
    case 'order_confirmation':
      return email.sendOrderConfirmation(args);
    case 'admin_new_order':
      return email.sendAdminNewOrder(args);
    case 'admin_dispute':
      return email.sendAdminDispute(args);
    case 'order_status_update':
      return email.sendOrderStatusUpdate(args);
    case 'password_reset':
      return email.sendPasswordReset(args);
    case 'welcome':
      return email.sendWelcome(args);
    default:
      throw new Error(`Unknown email job type: ${type}`);
  }
}
