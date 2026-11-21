// Menjalankan beberapa query dalam SATU transaksi: semua berhasil (commit) atau semua dibatalkan (rollback).

const { sql, getPool } = require('../config/db');

async function withTransaction(work) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // transaksi sudah dibatalkan oleh server
    }
    throw err;
  }
}

module.exports = withTransaction;