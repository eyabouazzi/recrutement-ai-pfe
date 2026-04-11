const userModel = require('../models/user.model');
const Company = require('../models/company.model');
const { applyProfilePayload } = require('../utils/profileMutations');

async function completeOnboarding(req, res) {
    try {
        const {
            bio,
            skills,
            education,
            city,
            country,
            experienceYears,
            phone,
            preferredJobType,
            preferredSector,
            preferredLocation,
            companyName,
            companySector,
            companySize,
            companyWebsite,
            companyCity,
            companyPhone,
            companyDescription,
        } = req.body;

        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: false, message: 'Utilisateur introuvable.' });
        }

        await applyProfilePayload({
            user,
            body: req.body,
            files: req.files,
        });

        if (user.role === 'HR') {
            const hasCompanyPayload = [
                companyName,
                companySector,
                companySize,
                companyWebsite,
                companyCity,
                companyPhone,
                companyDescription,
            ].some((value) => String(value || '').trim());

            if (hasCompanyPayload) {
                let company = null;
                if (user.companyId) company = await Company.findById(user.companyId);
                if (!company) company = await Company.findOne({ email: user.email.toLowerCase().trim() });

                if (!company) {
                    company = new Company({
                        email: user.email.toLowerCase().trim(),
                        name: companyName || 'Entreprise RH',
                        status: 'pending',
                    });
                }

                if (companyName !== undefined) company.name = companyName;
                if (companySector !== undefined) company.sector = companySector;
                if (companySize !== undefined) company.size = companySize;
                if (companyWebsite !== undefined) company.website = companyWebsite;
                if (companyCity !== undefined) company.city = companyCity;
                if (companyPhone !== undefined) company.phone = companyPhone;
                if (companyDescription !== undefined) company.description = companyDescription;

                if (company.status !== 'approved') {
                    company.status = 'pending';
                    company.approvalNote = undefined;
                    company.rejectionReason = undefined;
                    company.approvedBy = undefined;
                    company.approvedAt = undefined;
                }

                const hrUsers = new Set((company.hrUsers || []).map((id) => String(id)));
                hrUsers.add(String(user._id));
                company.hrUsers = Array.from(hrUsers);
                await company.save();
                user.companyId = company._id;
            }
        }

        user.onboardingDone = true;
        await user.save();

        const updated = await userModel
            .findById(user._id)
            .populate('companyId', 'name status sector city website approvalNote rejectionReason approvedAt');
        return res.status(200).json({ status: true, message: 'Profil complete avec succes.', user: updated });
    } catch (error) {
        console.error('completeOnboarding error:', error);
        return res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = { completeOnboarding };
