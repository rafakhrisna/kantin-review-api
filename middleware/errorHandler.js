// middleware/errorHandler.js
// Error handler terpusat: semua error dari controller (lewat next(err)) berakhir di sini,
// jadi format response error konsisten di seluruh API.

function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  // Unique constraint violation (SQL Server error number 2627 / 2601)
  if (err.number === 2627 || err.number === 2601) {
    return res.status(409).json({
      success: false,
      message: 'Data duplikat: melanggar unique constraint',
    });
  }

  // Foreign key violation
  if (err.number === 547) {
    return res.status(409).json({
      success: false,
      message: 'Operasi melanggar foreign key constraint (data terkait tidak ditemukan atau masih direferensikan)',
    });
  }

  // Check constraint violation
  if (err.number === 547 && /CK_/.test(err.message)) {
    return res.status(400).json({
      success: false,
      message: 'Data tidak valid: melanggar check constraint',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server',
  });
}

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { notFound, errorHandler, ApiError };
