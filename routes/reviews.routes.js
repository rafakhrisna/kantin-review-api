const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { getReviews, createReview, deleteReview } = require('../controllers/reviews.controller');

router.get('/', asyncHandler(getReviews));          // JOIN user, ?stall_id= filter opsional
router.post('/', asyncHandler(createReview));
router.delete('/:id', asyncHandler(deleteReview));

module.exports = router;
