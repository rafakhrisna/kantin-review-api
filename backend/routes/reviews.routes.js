const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const { getReviews, deleteReview } = require('../controllers/reviews.controller');

router.get('/', asyncHandler(getReviews));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(deleteReview));

module.exports = router;