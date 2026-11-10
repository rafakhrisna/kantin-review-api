const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { getUsers, createUser } = require('../controllers/users.controller');

router.get('/', asyncHandler(getUsers));
router.post('/', asyncHandler(createUser));

module.exports = router;
