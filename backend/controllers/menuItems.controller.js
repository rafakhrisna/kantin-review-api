// MENU_ITEMS: CRUD + audit (CREATE_MENU / UPDATE_MENU / DELETE_MENU) dalam transaksi yang sama.

const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const withTransaction = require('../utils/withTransaction');
const { writeAuditInTransaction } = require('../services/audit.service');

// GET /api/menu-items?stall_id=  (JOIN ke STALLS)
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
  const result = await pool.request().input('id', sql.Int, id).query(`
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

// POST /api/menu-items  (owner, admin)
async function createMenuItem(req, res) {
  const { stall_id, name, price, is_available } = req.body;
  if (!stall_id || !name || price === undefined) {
    throw new ApiError(400, 'Field stall_id, name, dan price wajib diisi');
  }
  if (price < 0) {
    throw new ApiError(400, 'price tidak boleh negatif');
  }

  const created = await withTransaction(async (transaction) => {
    const result = await new sql.Request(transaction)
      .input('stall_id', sql.Int, stall_id)
      .input('name', sql.NVarChar(100), name)
      .input('price', sql.Int, price)
      .input('is_available', sql.Bit, is_available ?? true)
      .query(`
        INSERT INTO dbo.MENU_ITEMS (stall_id, name, price, is_available)
        OUTPUT INSERTED.*
        VALUES (@stall_id, @name, @price, @is_available)
      `);
    const item = result.recordset[0];

    await writeAuditInTransaction(transaction, {
      userId: req.user.id,
      action: 'CREATE_MENU',
      targetTable: 'MENU_ITEMS',
      targetId: item.id,
      metadata: { stall_id: item.stall_id, name: item.name, price: item.price, is_available: item.is_available },
    });
    return item;
  });

  res.status(201).json({ success: true, data: created });
}

// PUT /api/menu-items/:id  (owner, admin)
async function updateMenuItem(req, res) {
  const { id } = req.params;
  const { name, price, is_available } = req.body;
  if (price !== undefined && price < 0) {
    throw new ApiError(400, 'price tidak boleh negatif');
  }

  const updated = await withTransaction(async (transaction) => {
    const before = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query('SELECT name, price, is_available FROM dbo.MENU_ITEMS WHERE id = @id');
    if (before.recordset.length === 0) {
      throw new ApiError(404, `Menu item dengan id ${id} tidak ditemukan`);
    }

    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar(100), name ?? null)
      .input('price', sql.Int, price ?? null)
      .input('is_available', sql.Bit, is_available ?? null)
      .query(`
        UPDATE dbo.MENU_ITEMS
        SET name = COALESCE(@name, name),
            price = COALESCE(@price, price),
            is_available = COALESCE(@is_available, is_available)
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    const item = result.recordset[0];

    await writeAuditInTransaction(transaction, {
      userId: req.user.id,
      action: 'UPDATE_MENU',
      targetTable: 'MENU_ITEMS',
      targetId: item.id,
      metadata: {
        before: before.recordset[0],
        after: { name: item.name, price: item.price, is_available: item.is_available },
      },
    });
    return item;
  });

  res.status(200).json({ success: true, data: updated });
}

// DELETE /api/menu-items/:id  (owner, admin)
async function deleteMenuItem(req, res) {
  const { id } = req.params;

  await withTransaction(async (transaction) => {
    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.MENU_ITEMS OUTPUT DELETED.* WHERE id = @id');
    if (result.recordset.length === 0) {
      throw new ApiError(404, `Menu item dengan id ${id} tidak ditemukan`);
    }
    const item = result.recordset[0];

    await writeAuditInTransaction(transaction, {
      userId: req.user.id,
      action: 'DELETE_MENU',
      targetTable: 'MENU_ITEMS',
      targetId: item.id,
      metadata: { stall_id: item.stall_id, name: item.name, price: item.price },
    });
  });

  res.status(200).json({ success: true, message: `Menu item id ${id} berhasil dihapus` });
}

module.exports = { getMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem };