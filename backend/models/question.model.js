const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['QCM', 'TEXT'],
        default: 'TEXT',
    },
    prompt: {
        type: String,
        required: true,
    },
    options: {
        type: [String], // Array of possible answers for QCM
    },
    correctAnswer: {
        type: String, // Correct answer for QCM
    },
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
