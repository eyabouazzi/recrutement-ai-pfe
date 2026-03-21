const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    jobRole: {
        type: String,
        required: true,
        trim: true,
    },
    timeLimit: {
        type: Number, // Time limit in minutes
        required: true,
        default: 30,
    },
    location: {
        type: String,
        default: 'Remote',
    },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        default: 'Full-time',
    },
    status: {
        type: String,
        enum: ['PUBLISHED', 'DRAFT', 'CLOSED'],
        default: 'PUBLISHED',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
}, { timestamps: true });

const Test = mongoose.model('Test', testSchema);
module.exports = Test;
