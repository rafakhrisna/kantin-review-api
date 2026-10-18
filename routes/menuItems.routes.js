const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem,
} = require('../controllers/menuItems.controller');

const manage = [authenticate, authorize('owner', 'admin')];

router.get('/', asyncHandler(getMenuItems));
router.get('/:id', asyncHandler(getMenuItemById));
router.post('/', ...manage, asyncHandler(createMenuItem));
router.put('/:id', ...manage, asyncHandler(updateMenuItem));
router.delete('/:id', ...manage, asyncHandler(deleteMenuItem));

module.exports = router;