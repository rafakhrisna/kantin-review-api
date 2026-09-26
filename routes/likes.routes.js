const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { createLike, deleteLike } = require('../controllers/likes.controller');

router.post('/', asyncHandler(createLike));
router.delete('/:id', asyncHandler(deleteLike));

module.exports = router;
