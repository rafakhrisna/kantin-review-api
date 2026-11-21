// REVIEWS: mutasi menulis audit (CREATE_REVIEW / DELETE_REVIEW) dalam transaksi yang sama.
const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const withTransaction = require('../utils/withTransaction');
const { writeAuditInTransaction } = require('../services/audit.service');

// Menghitung ulang rata-rata & jumlah review pada STALLS
async function refreshStallStats(transaction, stallId) {
  await new sql.Request(transaction)
    .input('stall_id', sql.Int, stallId)
    .query(`
      UPDATE dbo.STALLS
      SET review_count = (SELECT COUNT(*) FROM dbo.REVIEWS WHERE stall_id = @stall_id),
          avg_rating = ISNULL((SELECT AVG(CAST(rating AS DECIMAL(3,2))) FROM dbo.REVIEWS WHERE stall_id = @stall_id), 0)
      WHERE id = @stall_id
    `);
}

// GET /reviews?stall_id=  (JOIN ke USERS)
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

// POST /stalls/:id/reviews   (semua role yang login). stall_id dari URL, user_id dari TOKEN
async function createStallReview(req, res) {
  const { id: stallId } = req.validated.params;
  const { rating, comment } = req.validated.body;
  const userId = req.user.id;

  const pool = await getPool();
  const stall = await pool
    .request()
    .input('id', sql.Int, stallId)
    .query('SELECT id FROM dbo.STALLS WHERE id = @id');
  if (stall.recordset.length === 0) {
    throw new ApiError(404, `Stall dengan id ${stallId} tidak ditemukan`);
  }

  let review;
  try {
    review = await withTransaction(async (transaction) => {
      const insertResult = await new sql.Request(transaction)
        .input('stall_id', sql.Int, stallId)
        .input('user_id', sql.Int, userId)
        .input('rating', sql.Int, rating)
        .input('comment', sql.NVarChar(sql.MAX), comment ?? null)
        .query(`
          INSERT INTO dbo.REVIEWS (stall_id, user_id, rating, comment)
          OUTPUT INSERTED.*
          VALUES (@stall_id, @user_id, @rating, @comment)
        `);
      const created = insertResult.recordset[0];

      await refreshStallStats(transaction, stallId);

      await writeAuditInTransaction(transaction, {
        userId,
        action: 'CREATE_REVIEW',
        targetTable: 'REVIEWS',
        targetId: created.id,
        metadata: { stall_id: stallId, rating },
      });
      return created;
    });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      throw new ApiError(409, 'Anda sudah pernah mereview warung ini');
    }
    throw err;
  }

  res.status(201).json({ success: true, data: review });
}

// DELETE /reviews/:id   (admin)
async function deleteReview(req, res) {
  const { id } = req.params;

  await withTransaction(async (transaction) => {
    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.REVIEWS OUTPUT DELETED.* WHERE id = @id');
    if (result.recordset.length === 0) {
      throw new ApiError(404, `Review dengan id ${id} tidak ditemukan`);
    }
    const review = result.recordset[0];

    await refreshStallStats(transaction, review.stall_id);

    await writeAuditInTransaction(transaction, {
      userId: req.user.id,
      action: 'DELETE_REVIEW',
      targetTable: 'REVIEWS',
      targetId: review.id,
      metadata: { stall_id: review.stall_id, review_user_id: review.user_id, rating: review.rating },
    });
  });

  res.status(200).json({ success: true, message: `Review id ${id} berhasil dihapus` });
}

module.exports = { getReviews, createStallReview, deleteReview };