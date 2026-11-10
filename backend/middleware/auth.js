const { verifyToken } = require('../config/jwt');
const { ApiError } = require('./errorHandler');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Token tidak ditemukan. Kirim header Authorization: Bearer <token>'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: Number(payload.sub), role: payload.role }; 
    next();
  } catch (err) {
    next(new ApiError(401, 'Token tidak valid atau sudah kedaluwarsa'));
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Belum terautentikasi'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Akses ditolak: endpoint ini hanya untuk role ${roles.join(' / ')}`));
    }
    next();
  };
}

module.exports = { authenticate, authorize };