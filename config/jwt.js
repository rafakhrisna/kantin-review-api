require('dotenv').config();
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET belum diisi di file .env');
}

function signToken(user) {
  return jwt.sign({ role: user.role }, secret, {
    subject: String(user.id), 
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

function verifyToken(token) {
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };