const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const {
  getStalls, getStallById, createStall, updateStall, deleteStall,
} = require('../controllers/stalls.controller');

router.get('/', asyncHandler(getStalls));          // + filtering (?category=&location=&search=) + pagination (?page=&limit=)
router.get('/:id', asyncHandler(getStallById));
router.post('/', asyncHandler(createStall));
router.put('/:id', asyncHandler(updateStall));
router.delete('/:id', asyncHandler(deleteStall));

module.exports = router;
