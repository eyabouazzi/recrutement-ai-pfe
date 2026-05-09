const fs = require('fs/promises');
const path = require('path');

const UPLOADS_ROOT = path.resolve(path.join(__dirname, '..', 'uploads'));
const APPLICATION_CV_DIR = path.join(UPLOADS_ROOT, 'applications');

function isWithinUploads(absolutePath) {
    const normalized = path.resolve(absolutePath);
    return normalized.startsWith(UPLOADS_ROOT);
}

function uploadUrlToAbsolutePath(uploadUrl = '') {
    const normalized = String(uploadUrl || '').trim();
    if (!normalized.startsWith('/uploads/')) return null;
    const relative = normalized.replace('/uploads/', '');
    const absolutePath = path.resolve(path.join(UPLOADS_ROOT, relative));
    if (!isWithinUploads(absolutePath)) return null;
    return absolutePath;
}

function absolutePathToUploadUrl(absolutePath) {
    const rel = path.relative(UPLOADS_ROOT, absolutePath).replace(/\\/g, '/');
    return `/uploads/${rel}`;
}

async function copyProfileCvToApplicationSnapshot(profileCvUrl, originalName = '') {
    const sourcePath = uploadUrlToAbsolutePath(profileCvUrl);
    if (!sourcePath) return null;

    const ext = path.extname(String(originalName || sourcePath));
    const safeExt = ext && ext.length <= 10 ? ext : path.extname(sourcePath) || '.pdf';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    const targetPath = path.join(APPLICATION_CV_DIR, fileName);

    await fs.mkdir(APPLICATION_CV_DIR, { recursive: true });
    await fs.copyFile(sourcePath, targetPath);

    return {
        url: absolutePathToUploadUrl(targetPath),
        originalName: String(originalName || path.basename(sourcePath)).trim(),
    };
}

async function safeDeleteUploadFile(uploadUrl) {
    const filePath = uploadUrlToAbsolutePath(uploadUrl);
    if (!filePath) return false;

    try {
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        return false;
    }
}

module.exports = {
    copyProfileCvToApplicationSnapshot,
    safeDeleteUploadFile,
};

