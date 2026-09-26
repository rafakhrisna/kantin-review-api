// controllers/likes.controller.js
// LIKES -> kewajiban: POST, DELETE

const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// POST /api/likes
async function createLike(req, res) {
  const { review_id, user_id } = req.body;
  if (!review_id || !user_id) {
    throw new ApiError(400, 'Field review_id dan user_id wajib diisi');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const insertResult = await new sql.Request(transaction)
      .input('review_id', sql.Int, review_id)
      .input('user_id', sql.Int, user_id)
      .query(`
        INSERT INTO dbo.LIKES (review_id, user_id)
        OUTPUT INSERTED.*
        VALUES (@review_id, @user_id)
      `);

    await new sql.Request(transaction)
      .input('review_id', sql.Int, review_id)
      .query(`
        UPDATE dbo.REVIEWS
        SET like_count = (SELECT COUNT(*) FROM dbo.LIKES WHERE review_id = @review_id)
        WHERE id = @review_id
      `);

    await transaction.commit();
    res.status(201).json({ success: true, data: insertResult.recordset[0] });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// DELETE /api/likes/:id
async function deleteLike(req, res) {
  const { id } = req.params;
  const pool = await getPool();

  const existing = await pool.request().input('id', sql.Int, id).query('SELECT review_id FROM dbo.LIKES WHERE id = @id');
  if (existing.recordset.length === 0) {
    throw new ApiError(404, `Like dengan id ${id} tidak ditemukan`);
  }
  const { review_id } = existing.recordset[0];

  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    await new sql.Request(transaction).input('id', sql.Int, id).query('DELETE FROM dbo.LIKES WHERE id = @id');

    await new sql.Request(transaction)
      .input('review_id', sql.Int, review_id)
      .query(`
        UPDATE dbo.REVIEWS
        SET like_count = (SELECT COUNT(*) FROM dbo.LIKES WHERE review_id = @review_id)
        WHERE id = @review_id
      `);

    await transaction.commit();
    res.status(200).json({ success: true, message: `Like id ${id} berhasil dihapus` });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = { createLike, deleteLike };
