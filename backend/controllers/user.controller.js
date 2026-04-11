
const userModel = require('../models/user.model');
const { savelog } = require('../utils/logger');
const { createUserSchema, updateUserSchema } = require('../schemas/user.schema')
async function createUser(req, res) {
    // firstName, lastName, email, password, confirmPassword, dob, role
    try {
        const validation = createUserSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                errors: validation.error.flatten()
            }
            )
        }

        const { firstName, lastName, email, password, confirmPassword, dob } = req.body;

        const existingUser = await userModel.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                status: false,

                message: "User with this email already exists"
            });
        };

        const newUser = new userModel({
            ...req.body
        });

        await newUser.save();
        await savelog({
            action: `${req.user.firstName} ${req.user.lastName} created a new user ${newUser.firstName} ${newUser.lastName}`,
            actorId: req.user._id,
        });

        res.status(201).json({
            message: `User ${newUser.firstName} ${newUser.lastName} created successfully`,
            user: newUser
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Error creating user",
            error: error.message
        });
    }
}

async function updateUser(req, res) {
    try {
        const validation = updateUserSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                errors: validation.error.flatten()
            }
            )
        }
        const id = req.params.id;
        const existingUser = await userModel.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        const updatedUser = await userModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        await savelog({
            action: `${req.user.firstName} ${req.user.lastName} updated a user ${updatedUser.firstName} ${updatedUser.lastName}`,
            actorId: req.user._id,
        });

        res.status(200).json({
            status: true,
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error updating user",
            error: error.message
        });
    }
}



async function getUser(req, res) {
    try {
        const id = req.params.id;
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "User found successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error getting user",
            error: error.message
        });
    }
};

async function listUsers(req, res) {
    try {
        console.log("current logged in user", req.user);
        const users = await userModel.find({}, '-password');
        res.status(200).json({
            status: true,
            message: "Users found successfully",
            users
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error listing users",
            error: error.message
        });
    }
};


async function deleteUser(req, res) {
    try {
        // Only admins should delete users from the dashboard.
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }
        const id = req.params.id;
        const existingUser = await userModel.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        await userModel.findByIdAndDelete(id);

        await savelog({
            action: `${req.user.firstName} ${req.user.lastName} deleted a user ${existingUser.firstName} ${existingUser.lastName}`,
            actorId: req.user._id,

        })


        res.status(204).json({
            status: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error deleting user",
            error: error.message
        });
    }
}

module.exports = { createUser, updateUser, getUser, deleteUser, listUsers }
