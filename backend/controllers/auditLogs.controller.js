// AUDIT_LOGS: hanya BACA (list + detail). Penulisan hanya lewat services/audit.service.js.

const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

const SELECT_COLUMNS = `
  a.id, a.user_id, u.name AS user_name, u.email AS user_email,
  a.action, a.target_table, a.target_id, a.metadata, a.created_at`;

// userName & userEmail tidak disimpan di AUDIT_LOGS: diambil dari USERS lewat JOIN saat dibaca
const FROM_CLAUSE = 'FROM dbo.AUDIT_LOGS a JOIN dbo.USERS u ON u.id = a.user_id';

function parseMetadata(raw) {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function toAuditItem(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    action: row.action,
    targetTable: row.target_table,
    targetId: row.target_id,
    metadata: parseMetadata(row.metadata),
    createdAt: row.created_at,
  };
}

// Menyusun WHERE + parameter dari filter yang sudah divalidasi (semua digabung dengan AND)
function applyFilters(request, filters) {
  const conditions = [];

  if (filters.action) {
    conditions.push('a.action = @action');
    request.input('action', sql.NVarChar(50), filters.action);
  }
  if (filters.targetTable) {
    conditions.push('a.target_table = @targetTable');
    request.input('targetTable', sql.NVarChar(50), filters.targetTable);
  }
  if (filters.targetId !== undefined) {
    conditions.push('a.target_id = @targetId');
    request.input('targetId', sql.Int, filters.targetId);
  }
  if (filters.userId !== undefined) {
    conditions.push('a.user_id = @userId');
    request.input('userId', sql.Int, filters.userId);
  }
  if (filters.from) {
    conditions.push('CAST(a.created_at AS DATE) >= CAST(@dateFrom AS DATE)'); // awal hari, inklusif
    request.input('dateFrom', sql.VarChar(10), filters.from);
  }
  if (filters.to) {
    conditions.push('CAST(a.created_at AS DATE) <= CAST(@dateTo AS DATE)'); // akhir hari, inklusif
    request.input('dateTo', sql.VarChar(10), filters.to);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

// GET /api/audit-logs   (admin)
async function getAuditLogs(req, res) {
  const { page, pageSize, ...filters } = req.validated.query;
  const pool = await getPool();

  // total = jumlah baris yang LOLOS FILTER (bukan seluruh isi tabel)
  const countRequest = pool.request();
  const where = applyFilters(countRequest, filters);
  const countResult = await countRequest.query(`SELECT COUNT(*) AS total ${FROM_CLAUSE} ${where}`);
  const total = countResult.recordset[0].total;

  // pagination dilakukan di database (OFFSET ... FETCH)
  const dataRequest = pool.request();
  applyFilters(dataRequest, filters);
  dataRequest.input('offset', sql.Int, (page - 1) * pageSize).input('pageSize', sql.Int, pageSize);
  const dataResult = await dataRequest.query(`
    SELECT ${SELECT_COLUMNS}
    ${FROM_CLAUSE}
    ${where}
    ORDER BY a.created_at DESC, a.id DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `);

  res.status(200).json({
    status: 'success',
    data: {
      items: dataResult.recordset.map(toAuditItem),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    },
  });
}

// GET /api/audit-logs/:id   (admin)
async function getAuditLogById(req, res) {
  const { id } = req.validated.params;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT ${SELECT_COLUMNS} ${FROM_CLAUSE} WHERE a.id = @id`);

  if (result.recordset.length === 0) {
    throw new ApiError(404, `Catatan audit dengan id ${id} tidak ditemukan`);
  }
  res.status(200).json({ status: 'success', data: toAuditItem(result.recordset[0]) });
}

module.exports = { getAuditLogs, getAuditLogById };