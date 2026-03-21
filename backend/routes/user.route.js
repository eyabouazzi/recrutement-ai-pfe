const express = require('express');
const { createUser, updateUser, getUser, deleteUser, listUsers } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/', protect, listUsers);
router.get('/:id', protect, getUser);
router.post('/', protect, createUser);
router.patch('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;