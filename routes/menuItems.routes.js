const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const {
  getMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem,
} = require('../controllers/menuItems.controller');

router.get('/', asyncHandler(getMenuItems));        // JOIN stall, ?stall_id= filter opsional
router.get('/:id', asyncHandler(getMenuItemById));
router.post('/', asyncHandler(createMenuItem));
router.put('/:id', asyncHandler(updateMenuItem));
router.delete('/:id', asyncHandler(deleteMenuItem));

module.exports = router;
