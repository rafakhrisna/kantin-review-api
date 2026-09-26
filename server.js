// server.js
// Entry point aplikasi Express.js

require('dotenv').config();
const express = require('express');
const { getPool } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const usersRoutes = require('./routes/users.routes');
const stallsRoutes = require('./routes/stalls.routes');
const menuItemsRoutes = require('./routes/menuItems.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const likesRoutes = require('./routes/likes.routes');
const flagsRoutes = require('./routes/flags.routes');
const auditLogsRoutes = require('./routes/auditLogs.routes');

const app = express();
app.use(express.json());

// Health check sederhana
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Kantin Review API sedang berjalan 🚀' });
});

// Routing per tabel
app.use('/api/users', usersRoutes);
app.use('/api/stalls', stallsRoutes);
app.use('/api/menu-items', menuItemsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/flags', flagsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

// 404 & error handler (harus di paling bawah)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Pastikan koneksi DB berhasil sebelum server mulai menerima request
getPool()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Gagal memulai server karena koneksi database gagal:', err.message);
    process.exit(1);
  });
