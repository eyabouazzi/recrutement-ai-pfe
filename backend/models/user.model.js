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
        select : false,
    },

    // select * from user
    confirmPassword: {
        type: String,
        required: true,
    },
    dob:{
        type: Date,
    },
    role :{
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
    },{timestamps:true});

userSchema.pre('save', async function() {
    // Compare passwords
    if (this.password !== this.confirmPassword) {
        throw new Error("Password doesn't match");
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Remove confirmPassword before saving
    this.confirmPassword = undefined;
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}


const userModel = mongoose.model('Users', userSchema);
module.exports = userModel;