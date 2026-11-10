const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { getAuditLogs, createAuditLog } = require('../controllers/auditLogs.controller');

router.get('/', asyncHandler(getAuditLogs));
router.post('/', asyncHandler(createAuditLog));

module.exports = router;
