const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../config/db');

const PASSWORD = 'password123';
const accounts = [
  { name: 'Admin Utama',  email: 'admin@kantin.test', role: 'admin' },
  { name: 'Budi Santoso', email: 'budi@kantin.test',  role: 'owner' },
  { name: 'Siti Aminah',  email: 'siti@kantin.test',  role: 'owner' },
  { name: 'Rafa Khrisna', email: 'rafa@kantin.test',  role: 'customer' },
];

(async () => {
  const pool = await getPool();
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const a of accounts) {
    await pool
      .request()
      .input('name', sql.NVarChar(100), a.name)
      .input('email', sql.NVarChar(150), a.email)
      .input('hash', sql.NVarChar(255), hash)
      .input('role', sql.NVarChar(20), a.role)
      .query(`
        MERGE dbo.USERS AS t
        USING (SELECT @email AS email) AS s ON t.email = s.email
        WHEN MATCHED THEN
          UPDATE SET name = @name, password_hash = @hash, role = @role
        WHEN NOT MATCHED THEN
          INSERT (name, email, password_hash, role) VALUES (@name, @email, @hash, @role);
      `);
    console.log(`${a.role.padEnd(8)} ${a.email}`);
  }

  console.log(`\nSelesai. Password semua akun uji: ${PASSWORD}`);
  await pool.close();
  process.exit(0);
})().catch((err) => {
  console.error('Gagal:', err.message);
  process.exit(1);
});