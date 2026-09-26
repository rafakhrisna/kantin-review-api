// controllers/menuItems.controller.js
// MENU_ITEMS -> kewajiban: Full CRUD + JOIN stall

const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/menu-items  (JOIN ke STALLS untuk menampilkan nama stall)
async function getMenuItems(req, res) {
  const { stall_id } = req.query;
  const pool = await getPool();
  const request = pool.request();

  let where = '';
  if (stall_id) {
    where = 'WHERE mi.stall_id = @stall_id';
    request.input('stall_id', sql.Int, stall_id);
  }

  const result = await request.query(`
    SELECT mi.id, mi.stall_id, s.name AS stall_name, mi.name, mi.price, mi.is_available
    FROM dbo.MENU_ITEMS mi
    JOIN dbo.STALLS s ON s.id = mi.stall_id
    ${where}
    ORDER BY mi.id
  `);
  res.status(200).json({ success: true, data: result.recordset });
}

// GET /api/menu-items/:id
async function getMenuItemById(req, res) {
  const { id } = req.params;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT mi.id, mi.stall_id, s.name AS stall_name, mi.name, mi.price, mi.is_available
      FROM dbo.MENU_ITEMS mi
      JOIN dbo.STALLS s ON s.id = mi.stall_id
      WHERE mi.id = @id
    `);

  if (result.recordset.length === 0) {
    throw new ApiError(404, `Menu item dengan id ${id} tidak ditemukan`);
  }
  res.status(200).json({ success: true, data: result.recordset[0] });
}

// POST /api/menu-items
async function createMenuItem(req, res) {
  const { stall_id, name, price, is_available } = req.body;
  if (!stall_id || !name || price === undefined) {
    throw new ApiError(400, 'Field stall_id, name, dan price wajib diisi');
  }
  if (price < 0) {
    throw new ApiError(400, 'price tidak boleh negatif');
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input('stall_id', sql.Int, stall_id)
    .input('name', sql.NVarChar(100), name)
    .input('price', sql.Int, price)
    .input('is_available', sql.Bit, is_available ?? true)
    .query(`
      INSERT INTO dbo.MENU_ITEMS (stall_id, name, price, is_available)
      OUTPUT INSERTED.*
      VALUES (@stall_id, @name, @price, @is_available)
    `);

  res.status(201).json({ success: true, data: result.recordset[0] });
}

// PUT /api/menu-items/:id
async function updateMenuItem(req, res) {
  const { id } = req.params;
  const { name, price, is_available } = req.body;

  const pool = await getPool();
  const existing = await pool.request().input('id', sql.Int, id).query('SELECT id FROM dbo.MENU_ITEMS WHERE id = @id');
  if (existing.recordset.length === 0) {
    throw new ApiError(404, `Menu item dengan id ${id} tidak ditemukan`);
  }
  if (price !== undefined && price < 0) {
    throw new ApiError(400, 'price tidak boleh negatif');
  }

  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar(100), name)
    .input('price', sql.Int, price)
    .input('is_available', sql.Bit, is_available)
    .query(`
      UPDATE dbo.MENU_ITEMS
      SET name = COALESCE(@name, name),
          price = COALESCE(@price, price),
          is_available = COALESCE(@is_available, is_available)
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  res.status(200).json({ success: true, data: result.recordset[0] });
}

// DELETE /api/menu-items/:id
async function deleteMenuItem(req, res) {
  const { id } = req.params;
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query('DELETE FROM dbo.MENU_ITEMS OUTPUT DELETED.id WHERE id = @id');

  if (result.recordset.length === 0) {
    throw new ApiError(404, `Menu item dengan id ${id} tidak ditemukan`);
  }
  res.status(200).json({ success: true, message: `Menu item id ${id} berhasil dihapus` });
}

module.exports = { getMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem };
