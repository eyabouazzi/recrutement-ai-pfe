const express = require('express');
const { uploadFile } = require('../controllers/file.controller');
const upload = require('../utils/upload');

const router = express.Router();

router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
