// Satu-satunya tempat yang menulis ke AUDIT_LOGS. Dipanggil oleh backend, tidak pernah oleh client.

const { sql, getPool } = require('../config/db');

// Pengaman: kunci yang berbau rahasia dibuang dari metadata (password, token, cookie, dst.)
const SENSITIVE_KEY = /password|token|secret|cookie|authorization/i;

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (!SENSITIVE_KEY.test(key)) clean[key] = sanitize(val);
    }
    return clean;
  }
  return value;
}

async function insertAudit(request, { userId, action, targetTable, targetId, metadata }) {
  await request
    .input('user_id', sql.Int, userId)
    .input('action', sql.NVarChar(50), action)
    .input('target_table', sql.NVarChar(50), targetTable)
    .input('target_id', sql.Int, targetId)
    .input('metadata', sql.NVarChar(sql.MAX), metadata ? JSON.stringify(sanitize(metadata)) : null)
    .query(`
      INSERT INTO dbo.AUDIT_LOGS (user_id, action, target_table, target_id, metadata)
      VALUES (@user_id, @action, @target_table, @target_id, @metadata)
    `);
}

// Untuk MUTASI DATA: ikut transaksi yang sama dengan perubahan datanya.
// Kalau audit gagal, transaksi dibatalkan, jadi tidak ada perubahan tanpa jejak audit.
async function writeAuditInTransaction(transaction, entry) {
  await insertAudit(new sql.Request(transaction), entry);
}

// Untuk LOGIN / LOGOUT: best-effort. Kegagalan audit hanya dicatat di log server
// dan TIDAK menggagalkan autentikasi.
async function writeAuditBestEffort(entry) {
  try {
    const pool = await getPool();
    await insertAudit(pool.request(), entry);
  } catch (err) {
    console.error('[audit] gagal menulis audit log:', err.message);
  }
}

module.exports = { writeAuditInTransaction, writeAuditBestEffort };