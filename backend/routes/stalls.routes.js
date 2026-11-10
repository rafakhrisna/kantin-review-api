const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { idParam } = require('../validators/common');
const { listStallsQuery, createStallBody, updateStallBody } = require('../validators/stall');
const { createReviewBody } = require('../validators/review');
const {
  getStalls, getStallById, createStall, updateStall, deleteStall,
} = require('../controllers/stalls.controller');
const { createStallReview } = require('../controllers/reviews.controller');

router.get('/', validate({ query: listStallsQuery }), asyncHandler(getStalls));
router.get('/:id', validate({ params: idParam }), asyncHandler(getStallById));
router.post('/', authenticate, authorize('owner', 'admin'), validate({ body: createStallBody }), asyncHandler(createStall));
router.put('/:id', authenticate, authorize('owner', 'admin'), validate({ params: idParam, body: updateStallBody }), asyncHandler(updateStall));
router.delete('/:id', authenticate, authorize('admin'), validate({ params: idParam }), asyncHandler(deleteStall));
router.post('/:id/reviews', authenticate, validate({ params: idParam, body: createReviewBody }), asyncHandler(createStallReview));

module.exports = router;