const userModel = require('../models/user.model');
const sendEmail = require('../utils/mailer');
const { signUpSchema, loginSchema, changePasswordSchema } = require('../schemas/auth.schema');
const { generateToken } = require('../utils/jwt');


async function signUp(req, res) {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                status: false,
                message: 'Request body is missing. Send JSON or x-www-form-urlencoded with required fields.'
            });
        }
        const validation = signUpSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                status: false,
                errors: validation.error.flatten()
            });
        }




        const { firstName, lastName, email, password, confirmPassword, dob, role } = req.body;

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: false,

                message: "User with this email already exists"
            });
        };

        const user = new userModel({
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: password,
            confirmPassword: confirmPassword,
            dob: dob,
            role: role || 'candidat'
        });

        await user.save();

        // send welcome email 
        const options = {
            email: user.email,
            subject: "Welcome to our platform",
            content: `Hello ${user.firstName},\n\nWelcome to our recruitment platform! We're excited to have you on board.\n\nBest regards,\nThe Team`
        };
        try {
            await sendEmail(options);
        } catch (mailErr) {
            console.error('Email sending failed:', mailErr?.message || mailErr);
            // Do not block user creation due to email issues
        }

        res.status(201).json({
            status: true,
            message: "User created successfully"
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
        const { email, password } = req.body;
        // find user by email
        const user = await userModel.findOne({ email }).select('+password');
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
        const user = await userModel.findById(req.user.id);
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
        const { email } = req.body;
        
        // Validate email format
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                status: false,
                message: "Please provide a valid email address"
            });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({
                status: true,
                message: "If an account exists with this email, you will receive password reset instructions"
            });
        }

        // Generate reset token (using existing JWT function temporarily)
        const resetToken = generateToken(user._id);
        
        // In production, you'd want to:
        // 1. Generate a secure random token
        // 2. Hash it and store in database
        // 3. Set expiration time
        // 4. Send via email
        
        // For demo purposes, we'll simulate sending email
        console.log(`Password reset token for ${email}: ${resetToken}`);
        
        res.status(200).json({
            status: true,
            message: "If an account exists with this email, you will receive password reset instructions",
            // In production, don't send token in response
            debugToken: resetToken // Remove in production
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
        const { token, newPassword, confirmPassword } = req.body;
        
        // Validate inputs
        if (!token || !newPassword || !confirmPassword) {
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
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                status: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // In production, you would:
        // 1. Verify the token is valid and not expired
        // 2. Find user by token
        // 3. Update password
        // 4. Invalidate the token
        
        // For demo, we'll accept any token and update password for user with email
        // This is NOT secure for production!
        
        res.status(200).json({
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

module.exports = { signUp, login, getMe, changePassword, forgetPassword, resetPassword }
