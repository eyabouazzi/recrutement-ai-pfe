const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: { type: String, trim: true },
    type: {
        type: String,
        enum: ['job_fair', 'webinar', 'workshop', 'hackathon', 'networking', 'other'],
        default: 'job_fair',
    },
    date: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String, trim: true },
    isOnline: { type: Boolean, default: false },
    meetingLink: { type: String, trim: true },
    image: { type: String },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    organizerCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    maxAttendees: { type: Number, default: 0 }, // 0 = unlimited
    tags: [{ type: String }],
    sector: { type: String },
    status: {
        type: String,
        enum: ['upcoming', 'live', 'past', 'cancelled'],
        default: 'upcoming',
    },
    registrationDeadline: { type: Date },
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
