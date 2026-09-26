// controllers/flags.controller.js
// FLAGS -> kewajiban: GET, PUT (update status)

const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/flags?status=
async function getFlags(req, res) {
  const { status } = req.query;
  const pool = await getPool();
  const request = pool.request();

  let where = '';
  if (status) {
    where = 'WHERE status = @status';
    request.input('status', sql.NVarChar(20), status);
  }

  const result = await request.query(`
    SELECT * FROM dbo.FLAGS ${where} ORDER BY created_at DESC
  `);
  res.status(200).json({ success: true, data: result.recordset });
}

// PUT /api/flags/:id  Body: { status: 'resolved' | 'dismissed' | 'pending' }
async function updateFlagStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'resolved', 'dismissed'].includes(status)) {
    throw new ApiError(400, "status harus salah satu dari: 'pending', 'resolved', 'dismissed'");
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('status', sql.NVarChar(20), status)
    .query(`
      UPDATE dbo.FLAGS
      SET status = @status
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  if (result.recordset.length === 0) {
    throw new ApiError(404, `Flag dengan id ${id} tidak ditemukan`);
  }
  res.status(200).json({ success: true, data: result.recordset[0] });
}

module.exports = { getFlags, updateFlagStatus };
