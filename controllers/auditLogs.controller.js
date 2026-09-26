// controllers/auditLogs.controller.js
// AUDIT_LOGS -> kewajiban: GET, POST

const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/audit-logs
async function getAuditLogs(req, res) {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT * FROM dbo.AUDIT_LOGS ORDER BY created_at DESC
  `);
  res.status(200).json({ success: true, data: result.recordset });
}

// POST /api/audit-logs
async function createAuditLog(req, res) {
  const { user_id, action, target_table, target_id, metadata } = req.body;
  if (!user_id || !action || !target_table || !target_id) {
    throw new ApiError(400, 'Field user_id, action, target_table, dan target_id wajib diisi');
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .input('action', sql.NVarChar(50), action)
    .input('target_table', sql.NVarChar(50), target_table)
    .input('target_id', sql.Int, target_id)
    .input('metadata', sql.NVarChar(sql.MAX), metadata ? JSON.stringify(metadata) : null)
    .query(`
      INSERT INTO dbo.AUDIT_LOGS (user_id, action, target_table, target_id, metadata)
      OUTPUT INSERTED.*
      VALUES (@user_id, @action, @target_table, @target_id, @metadata)
    `);

  res.status(201).json({ success: true, data: result.recordset[0] });
}

module.exports = { getAuditLogs, createAuditLog };
