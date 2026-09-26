const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { getFlags, updateFlagStatus } = require('../controllers/flags.controller');

router.get('/', asyncHandler(getFlags));            // ?status= filter opsional
router.put('/:id', asyncHandler(updateFlagStatus));

module.exports = router;
