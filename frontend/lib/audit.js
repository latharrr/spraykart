import db from './db';

export async function logAdminAction({ adminId, action, targetType, targetId, before = null, after = null, request, client = db }) {
  const ip = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request?.headers?.get('x-real-ip')
    || null;

  await client.query(
    `INSERT INTO admin_audit_log(admin_id, action, target_type, target_id, before, after, ip)
     VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [
      adminId || null,
      action,
      targetType,
      targetId || null,
      before == null ? null : JSON.stringify(before),
      after == null ? null : JSON.stringify(after),
      ip,
    ]
  );
}
