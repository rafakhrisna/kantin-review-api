class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
  }
}

function notFound(req, res) {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;
  let errors = err.errors;

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Body request bukan JSON yang valid';
  } else if (err.number === 2627 || err.number === 2601) {
    statusCode = 409;
    message = 'Data duplikat: melanggar unique constraint';
  } else if (err.number === 547) {
    statusCode = 409;
    message = 'Operasi melanggar foreign key / check constraint';
  }

  if (statusCode >= 500) {
    console.error(err);
    message = 'Terjadi kesalahan pada server';
    errors = undefined;
  }

  const body = { status: statusCode >= 500 ? 'error' : 'fail', message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}

module.exports = { ApiError, notFound, errorHandler };