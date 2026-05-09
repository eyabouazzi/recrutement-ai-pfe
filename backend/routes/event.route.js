const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../utils/upload');
const {
    getEvents, getEventById, createEvent, updateEvent, deleteEvent, registerToEvent,
} = require('../controllers/event.controller');

// Public — anyone can view events
router.get('/', getEvents);
router.get('/:id', getEventById);

// Authenticated users can register to events
router.post('/:id/register', protect, registerToEvent);

// HR can create, update, delete events
router.post('/', protect, restrictTo('HR'), upload.single('image'), createEvent);
router.put('/:id', protect, restrictTo('HR'), upload.single('image'), updateEvent);
router.delete('/:id', protect, restrictTo('HR'), deleteEvent);

module.exports = router;
