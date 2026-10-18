require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { getPool } = require('./config/db');
const { authenticate, authorize } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const openapi = require('./docs/openapi');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const stallsRoutes = require('./routes/stalls.routes');
const menuItemsRoutes = require('./routes/menuItems.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const likesRoutes = require('./routes/likes.routes');
const flagsRoutes = require('./routes/flags.routes');
const auditLogsRoutes = require('./routes/auditLogs.routes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Kantin Review API sedang berjalan. Dokumentasi: /docs' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { persistAuthorization: true } }));

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/stalls', '/stalls'], stallsRoutes);

app.use('/api/menu-items', menuItemsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/likes', authenticate, likesRoutes);
app.use('/api/users', authenticate, authorize('admin'), usersRoutes);
app.use('/api/flags', authenticate, authorize('admin'), flagsRoutes);
app.use('/api/audit-logs', authenticate, authorize('admin'), auditLogsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

getPool()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
      console.log(`Dokumentasi API di http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error('Gagal memulai server karena koneksi database gagal:', err.message);
    process.exit(1);
  });