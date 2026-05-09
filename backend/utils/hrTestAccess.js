const mongoose = require('mongoose');
const User = require('../models/user.model');

/**
 * IDs des utilisateurs HR rattachés à la même entreprise (inclut l'utilisateur courant).
 * Sans companyId : uniquement l'utilisateur courant.
 */
async function sameCompanyHrUserIds(hrUser) {
    if (!hrUser) return [];
    if (String(hrUser.role) !== 'HR') {
        return [String(hrUser._id)];
    }
    if (!hrUser.companyId) {
        return [String(hrUser._id)];
    }
    const colleagues = await User.find({ companyId: hrUser.companyId, role: 'HR' }).select('_id').lean();
    const set = new Set([String(hrUser._id)]);
    colleagues.forEach((u) => set.add(String(u._id)));
    return [...set];
}

/** Filtre Mongo pour lister les offres/tests accessibles à ce profil RH (équipe + rattachement entreprise). */
async function buildHrTestListFilter(hrUser) {
    const ids = await sameCompanyHrUserIds(hrUser);
    const idObjs = ids.map((id) => new mongoose.Types.ObjectId(id));
    const byAuthors = idObjs.length === 1
        ? { createdBy: idObjs[0] }
        : { createdBy: { $in: idObjs } };
    if (!hrUser.companyId) {
        return byAuthors;
    }
    return {
        $or: [
            byAuthors,
            { companyId: hrUser.companyId },
        ],
    };
}

/**
 * Un RH peut gérer un test s'il en est l'auteur, ou si l'auteur est un RH de la même entreprise.
 */
async function hrCanManageTest(user, testDoc) {
    if (!testDoc || !user) return false;
    const owner = String(testDoc.createdBy);
    if (owner === String(user._id) || owner === String(user.id)) return true;
    if (String(user.role) !== 'HR' || !user.companyId) return false;
    if (testDoc.companyId && String(testDoc.companyId) === String(user.companyId)) {
        return true;
    }
    const creator = await User.findById(testDoc.createdBy).select('companyId role').lean();
    if (!creator || String(creator.role) !== 'HR' || !creator.companyId) return false;
    return String(creator.companyId) === String(user.companyId);
}

module.exports = {
    sameCompanyHrUserIds,
    buildHrTestListFilter,
    hrCanManageTest,
};
