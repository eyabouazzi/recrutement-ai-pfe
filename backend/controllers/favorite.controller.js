const Favorite = require('../models/favorite.model');
const Test = require('../models/test.model');

/**
 * GET /favorites — get all favorites for current user
 */
async function getFavorites(req, res) {
    try {
        const favorites = await Favorite.find({ userId: req.user.id })
            .populate({
                path: 'jobId',
                select: 'title jobRole location employmentType status createdAt description',
                populate: { path: 'createdBy', select: 'firstName lastName avatar companyId' },
            })
            .sort({ savedAt: -1 })
            .lean();

        res.status(200).json({ status: true, favorites });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * POST /favorites/:jobId — add a job to favorites
 */
async function addFavorite(req, res) {
    try {
        const { jobId } = req.params;
        const job = await Test.findById(jobId);
        if (!job) return res.status(404).json({ status: false, message: 'Offre d\'emploi introuvable.' });

        const existing = await Favorite.findOne({ userId: req.user.id, jobId });
        if (existing) {
            return res.status(400).json({ status: false, message: 'Offre déjà dans vos favoris.' });
        }

        const fav = await Favorite.create({ userId: req.user.id, jobId });
        res.status(201).json({ status: true, message: 'Offre ajoutée aux favoris.', favorite: fav });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: false, message: 'Offre déjà dans vos favoris.' });
        }
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * DELETE /favorites/:jobId — remove a job from favorites
 */
async function removeFavorite(req, res) {
    try {
        const { jobId } = req.params;
        const result = await Favorite.findOneAndDelete({ userId: req.user.id, jobId });
        if (!result) return res.status(404).json({ status: false, message: 'Favori introuvable.' });
        res.status(200).json({ status: true, message: 'Offre retirée des favoris.' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /favorites/check/:jobId — check if a job is in user's favorites
 */
async function checkFavorite(req, res) {
    try {
        const { jobId } = req.params;
        const fav = await Favorite.findOne({ userId: req.user.id, jobId });
        res.status(200).json({ status: true, isFavorite: !!fav });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
