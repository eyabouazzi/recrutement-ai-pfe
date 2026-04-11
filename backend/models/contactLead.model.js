const mongoose = require('mongoose');

const contactLeadSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['contact', 'demo', 'newsletter'],
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    name: { type: String, trim: true, maxlength: 120, default: '' },
    company: { type: String, trim: true, maxlength: 120, default: '' },
    message: { type: String, trim: true, maxlength: 5000, default: '' },
    source: { type: String, default: 'website', maxlength: 64 },
    meta: { type: String, default: '' },
  },
  { timestamps: true }
);

contactLeadSchema.index({ createdAt: -1 });
contactLeadSchema.index({ email: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('ContactLead', contactLeadSchema);
