const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
    title: { type: String, trim: true, default: '' },
    tags: [{ type: String, trim: true }],
    type: {
        type: String,
        enum: ['QCM', 'TEXT', 'SHORT_ANSWER', 'PROBLEM'],
        required: true,
    },
    prompt: { type: String, required: true },
    options: [String],
    correctAnswer: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
}, { timestamps: true });

questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ createdBy: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
