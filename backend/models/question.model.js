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
        enum: ['QCM', 'TEXT', 'SHORT_ANSWER', 'PROBLEM'],
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
    /** Marquée comme relue par le RH avant publication forte (optionnel) */
    reviewedForPublish: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
