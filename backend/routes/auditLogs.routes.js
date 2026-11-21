const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { listAuditLogsQuery, auditIdParam } = require('../validators/audit');
const { getAuditLogs, getAuditLogById } = require('../controllers/auditLogs.controller');

// Hanya GET. Tidak ada POST/PUT/DELETE: audit log append-only dan hanya ditulis oleh backend.
// Pembatasan admin dipasang di server.js (authenticate + authorize('admin')).
router.get('/', validate({ query: listAuditLogsQuery }), asyncHandler(getAuditLogs));
router.get('/:id', validate({ params: auditIdParam }), asyncHandler(getAuditLogById));

module.exports = router;