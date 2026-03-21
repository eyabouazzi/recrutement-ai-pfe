const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
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
    }
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