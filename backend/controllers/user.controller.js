
const userModel = require('../models/user.model');

async function createUser(req, res) {
    // firstName, lastName, email, password, confirmPassword, dob
    const {firstName, lastName, email, password, confirmPassword, dob} = req.body;
    const user = new userModel({
        email,
        firstName,
        lastName,
        password,
        confirmPassword,
        dob
    });

    // save to database
    const savedUser = await user.save();

    res.status(201).json({
        message: "User created successfully",
        user: savedUser
    });
}

async function updateUser(req, res) {
    const id = req.params.id;
    const existingUser = await userModel.findById(id);
    if (!existingUser){
        return res.status(404).json({
            message: "User not found"
        });
    }
    const updatedUser = await userModel.findByIdAndUpdate(id, req.body, {new: true, runValidators: true});
    res.status(200).json({
        message: "User updated successfully",
        user: updatedUser
    });
}           

async function getUser(req, res) {
    const id = req.params.id;
    const user = await userModel.findById(id);
    if (!user){
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.status(200).json({
        user
    });
};

async function listUsers(req, res) {
    const users = await userModel.find({}, '-password');
    res.status(200).json({
        users
    });
};


async function deleteUser(req, res) {
    const id = req.params.id;
    const existingUser = await userModel.findById(id);
    if (!existingUser) {
        return res.status(404).json({
            message: "User not found"
        });
    }
    await userModel.findByIdAndDelete(id);
    
    res.status(204).json({
        message: "User deleted successfully"
    });
}
    
module.exports = {createUser, updateUser, getUser, deleteUser, listUsers}
