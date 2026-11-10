const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../config/db');
const { signToken } = require('../config/jwt');
const { ApiError } = require('../middleware/errorHandler');

async function register(req, res) {
  const { name, email, password } = req.validated.body;
  const pool = await getPool();

  const exists = await pool
    .request()
    .input('email', sql.NVarChar(150), email)
    .query('SELECT id FROM dbo.USERS WHERE email = @email');
  if (exists.recordset.length > 0) {
    throw new ApiError(409, 'Email sudah terdaftar');
  }

  const passwordHash = await bcrypt.hash(password, 10); 

  const result = await pool
    .request()
    .input('name', sql.NVarChar(100), name)
    .input('email', sql.NVarChar(150), email)
    .input('password_hash', sql.NVarChar(255), passwordHash)
    .input('role', sql.NVarChar(20), 'customer')
    .query(`
      INSERT INTO dbo.USERS (name, email, password_hash, role)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.created_at
      VALUES (@name, @email, @password_hash, @role)
    `);

  res.status(201).json({ success: true, message: 'Registrasi berhasil', data: result.recordset[0] });
}

async function login(req, res) {
  const { email, password } = req.validated.body;
  const pool = await getPool();

  const result = await pool
    .request()
    .input('email', sql.NVarChar(150), email)
    .query('SELECT id, name, email, role, password_hash FROM dbo.USERS WHERE email = @email');

  const user = result.recordset[0];
  const valid = user && (await bcrypt.compare(password, user.password_hash));

  if (!valid) {
    throw new ApiError(401, 'Email atau password salah');
  }

  const token = signToken(user);
  res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
  });
}

async function me(req, res) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, req.user.id)
    .query('SELECT id, name, email, role, created_at FROM dbo.USERS WHERE id = @id');

  if (result.recordset.length === 0) {
    throw new ApiError(401, 'Akun untuk token ini sudah tidak ada');
  }
  res.status(200).json({ success: true, data: result.recordset[0] });
}

module.exports = { register, login, me };