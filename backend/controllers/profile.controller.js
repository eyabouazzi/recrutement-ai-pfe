const userModel = require('../models/user.model');
const { applyProfilePayload } = require('../utils/profileMutations');

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

        await user.save();

        const freshUser = await userModel
            .findById(user._id)
            .populate('companyId', 'name status sector city website approvalNote rejectionReason approvedAt');

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

module.exports = {
    updateMyProfile,
};
