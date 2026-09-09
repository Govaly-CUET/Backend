const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/authController');

// POST route for registering a user
router.post('/register', registerUser);

module.exports = router;