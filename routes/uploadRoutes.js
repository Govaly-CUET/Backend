const express = require('express');
const router = express.Router();

const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');
const { protectAdmin, protectSeller } = require('../middleware/authMiddleware');

// Tries admin auth first, falls back to seller auth — either role can upload
const protectAny = async (req, res, next) => {
  protectAdmin(req, res, (err) => {
    if (!err && req.admin) return next();
    protectSeller(req, res, next);
  });
};

router.post('/', protectAny, upload.single('file'), uploadFile);

module.exports = router;