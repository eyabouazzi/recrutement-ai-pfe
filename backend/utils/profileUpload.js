const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname || '')}`);
    },
});

function isAllowedDocument(file) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf']);
    const allowedMimeTypes = new Set([
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/rtf',
        'text/plain',
        'text/markdown',
    ]);

    return allowedExtensions.has(ext) || allowedMimeTypes.has(mime) || mime.startsWith('text/');
}

function fileFilter(req, file, cb) {
    if (file.fieldname === 'avatar') {
        if (String(file.mimetype || '').startsWith('image/')) {
            return cb(null, true);
        }
        return cb(new Error('Avatar uploads must be image files.'), false);
    }

    if (file.fieldname === 'cv' || file.fieldname === 'file') {
        if (String(file.mimetype || '').startsWith('image/') || isAllowedDocument(file)) {
            return cb(null, true);
        }
        return cb(new Error('Unsupported file type. Use PDF, DOC, DOCX, TXT, MD, or an image.'), false);
    }

    return cb(new Error('Unsupported upload field.'), false);
}

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 8 * 1024 * 1024,
    },
});
