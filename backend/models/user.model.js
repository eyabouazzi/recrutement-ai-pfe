const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false,
    },

    // select * from user
    confirmPassword: {
        type: String,
        required: false,
    },
    dob: {
        type: Date,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'HR', 'candidat'],
        default: 'candidat'
    },
    avatar: {
        type: String,
    },
    // Email verification
    emailVerified: { type: Boolean, default: false },
    emailVerifToken: { type: String, select: false },
    emailVerifExpires: { type: Date, select: false },
    // Onboarding
    onboardingDone: { type: Boolean, default: false },
    // Profile info (collected during onboarding)
    bio: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    education: { type: String, trim: true },   // domaine de formation
    city: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Algérie' },
    experienceYears: { type: Number, min: 0, default: 0 },
    phone: { type: String, trim: true },
    // Job preferences
    preferredJobType: { type: String },  // CDI, CDD, Stage...
    preferredSector: { type: String },
    preferredLocation: { type: String },
    // CV / resume
    cvUrl: { type: String },
    cvOriginalName: { type: String, trim: true },
    cvText: { type: String, trim: true },
    cvAnalysis: {
        summary: { type: String, default: '' },
        detectedSkills: [{ type: String, trim: true }],
        experienceLevel: { type: String, default: '' },
        strengths: [{ type: String, trim: true }],
        recommendations: [{ type: String, trim: true }],
        suggestedRoles: [{ type: String, trim: true }],
        lastAnalyzedAt: { type: Date },
    },
    // Company link (for HR users)
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    // Notification preferences
    notificationPrefs: {
        emailScoreReady: { type: Boolean, default: true },
        emailHrNewSubmission: { type: Boolean, default: true },
        emailNewJob: { type: Boolean, default: true },
        emailEvents: { type: Boolean, default: true },
        emailApplicationStatus: { type: Boolean, default: true },
        emailInterviewUpdates: { type: Boolean, default: true },
        emailRecommendedJobs: { type: Boolean, default: true },
    },
    accessibilityMode: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

userSchema.pre('save', async function () {
    // Only validate password match for new users or when both fields are explicitly set
    if (this.isNew || (this.isModified('password') && this.confirmPassword !== undefined)) {
        // Compare passwords
        if (this.password !== this.confirmPassword) {
            throw new Error("Password doesn't match");
        }

        // Hash the password
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);

        // Remove confirmPassword before saving
        this.confirmPassword = undefined;
    } else if (this.isModified('password') && this.confirmPassword === undefined) {
        // For password changes without confirmPassword, just hash the password
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}


const userModel = mongoose.model('Users', userSchema);
module.exports = userModel;
