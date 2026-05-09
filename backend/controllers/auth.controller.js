const userModel = require('../models/user.model');
const Submission = require('../models/submission.model');
const TestDraft = require('../models/testDraft.model');
const sendEmail = require('../utils/mailer');
const { smtpConfigured } = require('../utils/emailNotifications');
const { signUpSchema, loginSchema, changePasswordSchema } = require('../schemas/auth.schema');
const { generateToken } = require('../utils/jwt');
const crypto = require('crypto');

const COMPANY_PROFILE_SELECT = 'name status sector city website approvalNote rejectionReason approvedAt description phone logo linkedin socialLinks address applicationEmail bookingLink';

function escapeRegex(value = '') {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findUserByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return userModel.findOne({
        email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i'),
    });
}

function normalizeRoleInput(role) {
    const raw = String(role || '').trim().toLowerCase();
    if (!raw) return 'candidat';
    if (['candidat', 'candidate', 'user', 'admin'].includes(raw)) return 'candidat';
    if (['rh', 'hr', 'recruiter'].includes(raw)) return 'HR';
    return 'candidat';
}

async function signUp(req, res) {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                status: false,
                message: 'Request body is missing. Send JSON, form-data, or x-www-form-urlencoded with required fields.'
            });
        }
        const validation = signUpSchema.safeParse(req.body);

        if (!validation.success) {
            console.error('Signup validation failed:', JSON.stringify(validation.error.flatten(), null, 2));
            console.error('Request body received:', JSON.stringify(req.body, null, 2));
            return res.status(400).json({
                status: false,
                message: 'Validation failed',
                errors: validation.error.flatten()
            });
        }
        const { firstName, lastName, email, password, confirmPassword, dob, role } = validation.data;

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                status: false,
                message: "User with this email already exists"
            });
        };

        const userData = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: password,
            confirmPassword: confirmPassword,
            dob: dob,
            role: normalizeRoleInput(role),
            emailVerified: true,
        };

        if (req.file) {
            userData.avatar = `/uploads/${req.file.filename}`;
        }

        const user = new userModel(userData);

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            status: true,
            message: "User created successfully",
            token,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });

    }
    catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

async function login(req, res) {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                status: false,
                message: 'Request body is missing. Send JSON or x-www-form-urlencoded with email and password.'
            });
        }
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                errors: validation.error.flatten()
            })
        }

        //password and email from req body
        const { email, password } = validation.data;
        // find user by email
        const user = await findUserByEmail(email).select('+password');
        // cas1: user not found _>return erreur 404
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "Invalid email or password"
            });
        }
        // cas2: password is found
        const matchPassword = await user.comparePassword(password);
        // cas2.1 : password not match -> return erreur 401
        if (!matchPassword) {
            return res.status(401).json({
                status: false,
                message: "Invalid email or password"
            });
        }
        if (user.role !== 'HR' && user.role !== 'candidat') {
            return res.status(403).json({
                status: false,
                message: "Ce role n'est plus supporte. Contactez votre administrateur systeme."
            });
        }
        // cas2.2 : password match -> generate authentification token ( pasport , jwt)
        const token = generateToken(user._id);
        res.status(200).json({
            status: true,
            message: "Login successful",
            token: token,
            user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
        });


    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

async function getMe(req, res) {
    try {
        const user = await userModel.findById(req.user.id)
            .populate('companyId', COMPANY_PROFILE_SELECT);
        res.status(200).json({
            status: true,
            message: "User found successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message || "Error getting user"
        })
    }
}
async function changePassword(req, res) {
    try {
        const validation = changePasswordSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                errors: validation.error.flatten()
            })
        }
        const { oldPassword, newPassword, confirmPassword } = req.body;

        const user = await userModel.findById(req.user.id).select('+password');
        const passwordMatch = await user.comparePassword(oldPassword);
        if (!passwordMatch) {
            return res.status(401).json({
                status: false,
                message: "Invalid current password"
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "Passwords do not match"
            });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({
            status: true,
            message: "Password changed successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message || "Error getting user"
        })
    }
}
async function forgetPassword(req, res) {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        
        // Validate email format
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                status: false,
                message: "Please provide a valid email address"
            });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({
                status: true,
                message: "If an account exists with this email, you will receive password reset instructions"
            });
        }

        // Generate one-time reset token (stored hashed in DB, expires in 30 minutes)
        const resetTokenRaw = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetTokenRaw).digest('hex');
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetTokenRaw)}`;

        // Send reset email (do not fail the request if mail is misconfigured)
        const options = {
            email: user.email,
            subject: 'Réinitialisation du mot de passe',
            content: `Bonjour ${user.firstName || ''},\n\n` +
                `Nous avons reçu une demande de réinitialisation de mot de passe.\n\n` +
                `Cliquez ici pour réinitialiser : ${resetLink}\n\n` +
                `Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.\n\n` +
                `Cordialement,\n` +
                `L'équipe RecruitAI`,
        };

        try {
            await sendEmail(options);
        } catch (mailErr) {
            // Keep a generic message for security; still log for debugging.
            console.error('forgetPassword email error:', mailErr?.message || mailErr);
        }

        return res.status(200).json({
            status: true,
            message: "If an account exists with this email, you will receive password reset instructions"
        });
    } catch (error) {
        console.error('Forget password error:', error);
        res.status(500).json({
            status: false,
            error: error.message || "Error processing password reset request"
        });
    }
}

async function resetPassword(req, res) {
    try {
        const { token: resetToken, newPassword, confirmPassword } = req.body;
        
        // Validate inputs
        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "Token, new password, and confirmation are required"
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "Passwords do not match"
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                status: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const resetTokenHash = crypto.createHash('sha256').update(String(resetToken)).digest('hex');
        const user = await userModel.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: new Date() },
        }).select('+resetPasswordToken +resetPasswordExpires');
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "Invalid reset link"
            });
        }

        // Update password (user pre-save hook hashes it)
        user.password = newPassword;
        user.confirmPassword = undefined;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({
            status: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: false,
            error: error.message || "Error resetting password"
        });
    }
}

async function exportMyData(req, res) {
    try {
        if (req.user.role !== 'candidat') {
            return res.status(403).json({ status: false, message: 'Export réservé aux comptes candidat.' });
        }
        const user = await userModel.findById(req.user.id).select('-password');
        const submissions = await Submission.find({ candidateId: req.user._id })
            .populate('testId', 'title jobRole description')
            .sort('-createdAt')
            .lean();
        res.status(200).json({
            status: true,
            exportedAt: new Date().toISOString(),
            profile: user,
            submissions,
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function deleteMyAccountData(req, res) {
    try {
        if (req.user.role !== 'candidat') {
            return res.status(403).json({ status: false, message: 'Réservé aux comptes candidat.' });
        }
        if (req.body?.confirm !== 'SUPPRIMER_MON_COMPTE') {
            return res.status(400).json({
                status: false,
                message: 'Envoyez { "confirm": "SUPPRIMER_MON_COMPTE" } pour confirmer la suppression définitive.',
            });
        }
        const uid = req.user.id;
        await Submission.deleteMany({ candidateId: uid });
        await TestDraft.deleteMany({ candidateId: uid });
        await userModel.findByIdAndDelete(uid);
        res.status(200).json({ status: true, message: 'Compte et données de candidature supprimés.' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function patchPreferences(req, res) {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) return res.status(404).json({ status: false, message: 'User not found' });

        const { notificationPrefs, accessibilityMode } = req.body;
        if (notificationPrefs && typeof notificationPrefs === 'object') {
            const currentPrefs = user.notificationPrefs || {};
            user.notificationPrefs = {
                emailScoreReady: notificationPrefs.emailScoreReady !== undefined
                    ? Boolean(notificationPrefs.emailScoreReady)
                    : currentPrefs.emailScoreReady ?? true,
                emailHrNewSubmission: notificationPrefs.emailHrNewSubmission !== undefined
                    ? Boolean(notificationPrefs.emailHrNewSubmission)
                    : currentPrefs.emailHrNewSubmission ?? true,
                emailNewJob: notificationPrefs.emailNewJob !== undefined
                    ? Boolean(notificationPrefs.emailNewJob)
                    : currentPrefs.emailNewJob ?? true,
                emailEvents: notificationPrefs.emailEvents !== undefined
                    ? Boolean(notificationPrefs.emailEvents)
                    : currentPrefs.emailEvents ?? true,
                emailApplicationStatus: notificationPrefs.emailApplicationStatus !== undefined
                    ? Boolean(notificationPrefs.emailApplicationStatus)
                    : currentPrefs.emailApplicationStatus ?? true,
                emailInterviewUpdates: notificationPrefs.emailInterviewUpdates !== undefined
                    ? Boolean(notificationPrefs.emailInterviewUpdates)
                    : currentPrefs.emailInterviewUpdates ?? true,
                emailRecommendedJobs: notificationPrefs.emailRecommendedJobs !== undefined
                    ? Boolean(notificationPrefs.emailRecommendedJobs)
                    : currentPrefs.emailRecommendedJobs ?? true,
            };
        }
        if (typeof accessibilityMode === 'boolean') {
            user.accessibilityMode = accessibilityMode;
        }
        await user.save();
        const fresh = await userModel.findById(user._id).select('-password');
        res.status(200).json({ status: true, user: fresh });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getSmtpStatus(req, res) {
    try {
        return res.status(200).json({ status: true, connected: smtpConfigured() });
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
}

async function sendSmtpTestEmail(req, res) {
    try {
        if (!smtpConfigured()) {
            return res.status(400).json({ status: false, message: 'SMTP n’est pas configuré sur le serveur.' });
        }

        const user = await userModel.findById(req.user.id).select('email firstName');
        if (!user) return res.status(404).json({ status: false, message: 'User not found' });

        const options = {
            email: user.email,
            subject: 'Test email SMTP - RecruitAI',
            content:
                `Bonjour ${user.firstName || ''},\n\n` +
                `Ceci est un e-mail de test envoyé via votre configuration SMTP/Gmail côté serveur.\n\n` +
                `Si vous recevez cet e-mail, les notifications et invitations email sont opérationnelles.\n\n` +
                `Cordialement,\nL'équipe RecruitAI`,
        };

        await sendEmail(options);
        return res.status(200).json({ status: true, message: 'E-mail de test envoyé' });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Failed to send test email' });
    }
}

module.exports = {
    signUp,
    login,
    getMe,
    changePassword,
    forgetPassword,
    resetPassword,
    patchPreferences,
    exportMyData,
    deleteMyAccountData,
    getSmtpStatus,
    sendSmtpTestEmail,
};
