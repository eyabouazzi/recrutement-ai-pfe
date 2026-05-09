const Event = require('../models/event.model');
const userModel = require('../models/user.model');

/**
 * GET /events — public list of events
 */
async function getEvents(req, res) {
    try {
        const { page = 1, limit = 10, type, sector, upcoming } = req.query;
        const query = {};
        if (type) query.type = type;
        if (sector) query.sector = { $regex: sector, $options: 'i' };
        if (upcoming === 'true') query.date = { $gte: new Date() };

        const skip = (Number(page) - 1) * Number(limit);
        const [events, total] = await Promise.all([
            Event.find(query)
                .populate('organizer', 'firstName lastName avatar')
                .populate('organizerCompany', 'name logo sector')
                .sort({ date: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Event.countDocuments(query),
        ]);

        res.status(200).json({
            status: true,
            events,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalItems: total,
            },
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /events/:id — event detail
 */
async function getEventById(req, res) {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'firstName lastName avatar companyId')
            .populate('organizerCompany', 'name logo sector')
            .populate('attendees', 'firstName lastName avatar')
            .lean();

        if (!event) return res.status(404).json({ status: false, message: 'Événement introuvable.' });
        res.status(200).json({ status: true, event });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * POST /events — create event (HR only)
 */
async function createEvent(req, res) {
    try {
        const {
            title, description, type, date, endDate, location,
            isOnline, meetingLink, maxAttendees, tags, sector,
            registrationDeadline, organizerCompany,
        } = req.body;

        if (!title || !date) {
            return res.status(400).json({ status: false, message: 'Titre et date requis.' });
        }

        const event = new Event({
            title, description, type, date, endDate, location,
            isOnline, meetingLink, maxAttendees, tags, sector,
            registrationDeadline, organizerCompany,
            organizer: req.user.id,
        });
        if (req.file) event.image = `/uploads/${req.file.filename}`;
        await event.save();

        res.status(201).json({ status: true, message: 'Événement créé avec succès.', event });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * POST /events/:id/register — register to event (authenticated)
 */
async function registerToEvent(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ status: false, message: 'Événement introuvable.' });

        if (event.attendees.includes(req.user.id)) {
            return res.status(400).json({ status: false, message: 'Vous êtes déjà inscrit à cet événement.' });
        }

        if (event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ status: false, message: 'Cet événement est complet.' });
        }

        event.attendees.push(req.user.id);
        await event.save();

        res.status(200).json({ status: true, message: 'Inscription confirmée.', event });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * PUT /events/:id — update event (HR only)
 */
async function updateEvent(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ status: false, message: 'Événement introuvable.' });

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ status: false, message: 'Accès refusé.' });
        }

        Object.assign(event, req.body);
        if (req.file) event.image = `/uploads/${req.file.filename}`;
        await event.save();

        res.status(200).json({ status: true, message: 'Événement mis à jour.', event });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * DELETE /events/:id — delete event (HR)
 */
async function deleteEvent(req, res) {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ status: false, message: 'Événement introuvable.' });

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ status: false, message: 'Accès refusé.' });
        }

        await event.deleteOne();
        res.status(200).json({ status: true, message: 'Événement supprimé.' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent, registerToEvent };
