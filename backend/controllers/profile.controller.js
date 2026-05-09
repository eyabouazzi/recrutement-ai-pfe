const userModel = require('../models/user.model');
const { applyProfilePayload, applyHrCompanyPayload, buildProfilePreviewAnalysis } = require('../utils/profileMutations');

const COMPANY_PROFILE_SELECT = 'name status sector city website approvalNote rejectionReason approvedAt description phone logo linkedin socialLinks address applicationEmail bookingLink';

async function updateMyProfile(req, res) {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        await applyProfilePayload({
            user,
            body: req.body,
            files: req.files,
        });
        await applyHrCompanyPayload({
            user,
            body: req.body,
            files: req.files,
        });

        await user.save();

        const freshUser = await userModel
            .findById(user._id)
            .populate('companyId', COMPANY_PROFILE_SELECT);

        return res.status(200).json({
            status: true,
            message: 'Profile updated successfully',
            user: freshUser,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
}

async function previewMyProfileAnalysis(req, res) {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        const preview = await buildProfilePreviewAnalysis({
            user,
            body: req.body,
        });

        return res.status(200).json({
            status: true,
            ...preview,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Failed to preview profile analysis',
            error: error.message,
        });
    }
}

module.exports = {
    updateMyProfile,
    previewMyProfileAnalysis,
};
