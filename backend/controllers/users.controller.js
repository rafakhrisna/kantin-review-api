const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

async function getUsers(req, res) {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT id, name, email, role, created_at
    FROM dbo.USERS
    ORDER BY id
  `);
  res.status(200).json({ success: true, data: result.recordset });
}

async function createUser(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, 'Field name, email, password, dan role wajib diisi');
  }
  if (!['admin', 'owner', 'customer'].includes(role)) {
    throw new ApiError(400, "role harus salah satu dari: 'admin', 'owner', 'customer'");
  }

  const password_hash = await bcrypt.hash(password, 10);

  const pool = await getPool();
  const result = await pool
    .request()
    .input('name', sql.NVarChar(100), name)
    .input('email', sql.NVarChar(150), email)
    .input('password_hash', sql.NVarChar(255), password_hash)
    .input('role', sql.NVarChar(20), role)
    .query(`
      INSERT INTO dbo.USERS (name, email, password_hash, role)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.created_at
      VALUES (@name, @email, @password_hash, @role)
    `);

  res.status(201).json({ success: true, data: result.recordset[0] });
}

module.exports = { getUsers, createUser };
