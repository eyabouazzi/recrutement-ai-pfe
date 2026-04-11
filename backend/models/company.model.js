const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    logo: { type: String },
    description: { type: String, trim: true },
    website: { type: String, trim: true },
    sector: { type: String, trim: true },  // IT, Finance, Marketing...
    size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
        default: '1-10',
    },
    city: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Algérie' },
    phone: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    // Validation status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    approvedAt: { type: Date },
    approvalNote: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    // HR users linked to this company
    hrUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    // Social proof
    foundedYear: { type: Number },
    socialLinks: {
        twitter: { type: String },
        facebook: { type: String },
        instagram: { type: String },
    },
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
