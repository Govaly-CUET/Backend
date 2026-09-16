const express = require('express');

const router = express.Router();

const {
  getHomePage,
  listCategories,
  addCategoryTocarousal,
  removeCategoryFromcarousal,
  uploadHeaderMedia,
  removeHeaderMedia,
} = require('../controllers/adminPagesController');

const upload = require('../middleware/uploadMiddleware');

router.get('/home', getHomePage);

router.get('/categories', listCategories);

router.post('/categories/:id/carousal', addCategoryTocarousal);

router.delete('/categories/:id/carousal', removeCategoryFromcarousal);

router.post('/media', upload.single('image'), uploadHeaderMedia);

router.delete('/media/:id', removeHeaderMedia);

module.exports = router;

