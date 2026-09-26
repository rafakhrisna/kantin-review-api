// controllers/stalls.controller.js
// STALLS -> kewajiban: Full CRUD + filtering + pagination

const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/stalls?category=&location=&search=&page=1&limit=10
// Filtering by category/location, search by name, pagination with page & limit.
async function getStalls(req, res) {
  const { category, location, search } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const pool = await getPool();
  const request = pool.request();

  const conditions = [];
  if (category) {
    conditions.push('category = @category');
    request.input('category', sql.NVarChar(50), category);
  }
  if (location) {
    conditions.push('location = @location');
    request.input('location', sql.NVarChar(100), location);
  }
  if (search) {
    conditions.push('name LIKE @search');
    request.input('search', sql.NVarChar(150), `%${search}%`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  request.input('limit', sql.Int, limit);
  request.input('offset', sql.Int, offset);

  const dataResult = await request.query(`
    SELECT id, owner_id, name, category, location, description, avg_rating, review_count, created_at
    FROM dbo.STALLS
    ${whereClause}
    ORDER BY id
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  // Hitung ulang total dengan request baru (parameter sudah terpakai di atas)
  const countRequest = pool.request();
  if (category) countRequest.input('category', sql.NVarChar(50), category);
  if (location) countRequest.input('location', sql.NVarChar(100), location);
  if (search) countRequest.input('search', sql.NVarChar(150), `%${search}%`);
  const countResult = await countRequest.query(`
    SELECT COUNT(*) AS total FROM dbo.STALLS ${whereClause}
  `);
  const total = countResult.recordset[0].total;

  res.status(200).json({
    success: true,
    data: dataResult.recordset,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// GET /api/stalls/:id
async function getStallById(req, res) {
  const { id } = req.params;
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

// POST /api/stalls
async function createStall(req, res) {
  const { owner_id, name, category, location, description } = req.body;
  if (!owner_id || !name) {
    throw new ApiError(400, 'Field owner_id dan name wajib diisi');
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input('owner_id', sql.Int, owner_id)
    .input('name', sql.NVarChar(100), name)
    .input('category', sql.NVarChar(50), category || null)
    .input('location', sql.NVarChar(100), location || null)
    .input('description', sql.NVarChar(sql.MAX), description || null)
    .query(`
      INSERT INTO dbo.STALLS (owner_id, name, category, location, description)
      OUTPUT INSERTED.*
      VALUES (@owner_id, @name, @category, @location, @description)
    `);

  res.status(201).json({ success: true, data: result.recordset[0] });
}

// PUT /api/stalls/:id
async function updateStall(req, res) {
  const { id } = req.params;
  const { name, category, location, description } = req.body;

  const pool = await getPool();
  const existing = await pool.request().input('id', sql.Int, id).query('SELECT id FROM dbo.STALLS WHERE id = @id');
  if (existing.recordset.length === 0) {
    throw new ApiError(404, `Stall dengan id ${id} tidak ditemukan`);
  }

  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar(100), name)
    .input('category', sql.NVarChar(50), category || null)
    .input('location', sql.NVarChar(100), location || null)
    .input('description', sql.NVarChar(sql.MAX), description || null)
    .query(`
      UPDATE dbo.STALLS
      SET name = COALESCE(@name, name),
          category = @category,
          location = @location,
          description = @description
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  res.status(200).json({ success: true, data: result.recordset[0] });
}

// DELETE /api/stalls/:id
async function deleteStall(req, res) {
  const { id } = req.params;
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
