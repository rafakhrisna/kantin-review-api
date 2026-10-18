const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

async function getStalls(req, res) {
  const { search, category, page, limit } = req.validated.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const bind = (request) => {
    if (category) request.input('category', sql.NVarChar(50), category);
    if (search) request.input('search', sql.NVarChar(150), `%${search}%`);
    return request;
  };
  if (category) conditions.push('category = @category');
  if (search) conditions.push('name LIKE @search');
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const pool = await getPool();

  const dataResult = await bind(pool.request())
    .input('limit', sql.Int, limit)
    .input('offset', sql.Int, offset)
    .query(`
      SELECT id, owner_id, name, category, location, description, avg_rating, review_count, created_at
      FROM dbo.STALLS
      ${whereClause}
      ORDER BY id
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

  const countResult = await bind(pool.request()).query(
    `SELECT COUNT(*) AS total FROM dbo.STALLS ${whereClause}`
  );
  const total = countResult.recordset[0].total;

  res.status(200).json({
    success: true,
    data: dataResult.recordset,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function getStallById(req, res) {
  const { id } = req.validated.params;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM dbo.STALLS WHERE id = @id');

  if (result.recordset.length === 0) {
    throw new ApiError(404, `Stall dengan id ${id} tidak ditemukan`);
  }
  res.status(200).json({ success: true, data: result.recordset[0] });
}

async function createStall(req, res) {
  const { name, category, location, description } = req.validated.body;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('owner_id', sql.Int, req.user.id)
    .input('name', sql.NVarChar(100), name)
    .input('category', sql.NVarChar(50), category ?? null)
    .input('location', sql.NVarChar(100), location ?? null)
    .input('description', sql.NVarChar(sql.MAX), description ?? null)
    .query(`
      INSERT INTO dbo.STALLS (owner_id, name, category, location, description)
      OUTPUT INSERTED.*
      VALUES (@owner_id, @name, @category, @location, @description)
    `);

  res.status(201).json({ success: true, data: result.recordset[0] });
}

async function updateStall(req, res) {
  const { id } = req.validated.params;
  const body = req.validated.body;
  const pool = await getPool();

  const existing = await pool
    .request()
    .input('id', sql.Int, id)
    .query('SELECT id, owner_id FROM dbo.STALLS WHERE id = @id');
  if (existing.recordset.length === 0) {
    throw new ApiError(404, `Stall dengan id ${id} tidak ditemukan`);
  }

  if (req.user.role === 'owner' && existing.recordset[0].owner_id !== req.user.id) {
    throw new ApiError(403, 'Anda hanya boleh mengubah warung milik sendiri');
  }

  const columns = {
    name: sql.NVarChar(100),
    category: sql.NVarChar(50),
    location: sql.NVarChar(100),
    description: sql.NVarChar(sql.MAX),
  };
  const request = pool.request().input('id', sql.Int, id);
  const sets = [];
  for (const [column, type] of Object.entries(columns)) {
    if (body[column] !== undefined) {
      sets.push(`${column} = @${column}`);
      request.input(column, type, body[column]);
    }
  }

  const result = await request.query(`
    UPDATE dbo.STALLS SET ${sets.join(', ')}
    OUTPUT INSERTED.*
    WHERE id = @id
  `);
  res.status(200).json({ success: true, data: result.recordset[0] });
}

async function deleteStall(req, res) {
  const { id } = req.validated.params;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query('DELETE FROM dbo.STALLS OUTPUT DELETED.id WHERE id = @id');

  if (result.recordset.length === 0) {
    throw new ApiError(404, `Stall dengan id ${id} tidak ditemukan`);
  }
  res.status(200).json({ success: true, message: `Stall id ${id} berhasil dihapus` });
}

module.exports = { getStalls, getStallById, createStall, updateStall, deleteStall };