// controllers/reviews.controller.js
// REVIEWS -> kewajiban: GET, POST, DELETE + JOIN user

const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/reviews?stall_id=  (JOIN ke USERS untuk menampilkan nama reviewer)
async function getReviews(req, res) {
  const { stall_id } = req.query;
  const pool = await getPool();
  const request = pool.request();

  let where = '';
  if (stall_id) {
    where = 'WHERE r.stall_id = @stall_id';
    request.input('stall_id', sql.Int, stall_id);
  }

  const result = await request.query(`
    SELECT r.id, r.stall_id, r.user_id, u.name AS user_name, r.rating,
           r.comment, r.like_count, r.created_at, r.updated_at
    FROM dbo.REVIEWS r
    JOIN dbo.USERS u ON u.id = r.user_id
    ${where}
    ORDER BY r.created_at DESC
  `);
  res.status(200).json({ success: true, data: result.recordset });
}

// POST /api/reviews
// Catatan: UQ_REVIEWS_user_stall membatasi 1 user hanya bisa 1 review per stall.
async function createReview(req, res) {
  const { stall_id, user_id, rating, comment } = req.body;
  if (!stall_id || !user_id || rating === undefined) {
    throw new ApiError(400, 'Field stall_id, user_id, dan rating wajib diisi');
  }
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, 'rating harus antara 1 dan 5');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const insertResult = await new sql.Request(transaction)
      .input('stall_id', sql.Int, stall_id)
      .input('user_id', sql.Int, user_id)
      .input('rating', sql.Int, rating)
      .input('comment', sql.NVarChar(sql.MAX), comment || null)
      .query(`
        INSERT INTO dbo.REVIEWS (stall_id, user_id, rating, comment)
        OUTPUT INSERTED.*
        VALUES (@stall_id, @user_id, @rating, @comment)
      `);

    // Update avg_rating & review_count pada STALLS agar tetap konsisten
    await new sql.Request(transaction)
      .input('stall_id', sql.Int, stall_id)
      .query(`
        UPDATE dbo.STALLS
        SET review_count = (SELECT COUNT(*) FROM dbo.REVIEWS WHERE stall_id = @stall_id),
            avg_rating = (SELECT AVG(CAST(rating AS DECIMAL(3,2))) FROM dbo.REVIEWS WHERE stall_id = @stall_id)
        WHERE id = @stall_id
      `);

    await transaction.commit();
    res.status(201).json({ success: true, data: insertResult.recordset[0] });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// DELETE /api/reviews/:id
async function deleteReview(req, res) {
  const { id } = req.params;
  const pool = await getPool();

  const existing = await pool.request().input('id', sql.Int, id).query('SELECT stall_id FROM dbo.REVIEWS WHERE id = @id');
  if (existing.recordset.length === 0) {
    throw new ApiError(404, `Review dengan id ${id} tidak ditemukan`);
  }
  const { stall_id } = existing.recordset[0];

  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    await new sql.Request(transaction).input('id', sql.Int, id).query('DELETE FROM dbo.REVIEWS WHERE id = @id');

    await new sql.Request(transaction)
      .input('stall_id', sql.Int, stall_id)
      .query(`
        UPDATE dbo.STALLS
        SET review_count = (SELECT COUNT(*) FROM dbo.REVIEWS WHERE stall_id = @stall_id),
            avg_rating = ISNULL((SELECT AVG(CAST(rating AS DECIMAL(3,2))) FROM dbo.REVIEWS WHERE stall_id = @stall_id), 0)
        WHERE id = @stall_id
      `);

    await transaction.commit();
    res.status(200).json({ success: true, message: `Review id ${id} berhasil dihapus` });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = { getReviews, createReview, deleteReview };
