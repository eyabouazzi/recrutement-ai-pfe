function uploadFile(req, res) {
    if (!req.file) {
        return res.status(400).json({
            status: false,
            message: "No file uploaded"
        });
    }

    res.status(201).json({
        status: true,
        message: "file uploaded successfully",
        file: {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path
        }
    });
}

module.exports = { uploadFile }
