const express = require('express');
const { createUser, updateUser, getUser, deleteUser } = require('../controllers/user.controller');

const router = express.Router();

router.get('/:id', getUser);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;