const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favorite.controller');

// All favorite routes require authentication
router.get('/', protect, getFavorites);
router.get('/check/:jobId', protect, checkFavorite);
router.post('/:jobId', protect, addFavorite);
router.delete('/:jobId', protect, removeFavorite);

module.exports = router;
