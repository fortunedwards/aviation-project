const express = require('express');
const router = express.Router();

const {
  getCalendarEvents,
  getPublicCalendarEvents,
  createCalendarEvent,
  getCalendarCategories,
} = require('../controllers/calendarController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/public/events', getPublicCalendarEvents);

router.use(protect);

router.get('/events', getCalendarEvents);
router.get('/categories', getCalendarCategories);
router.post('/events', authorize('Admin', 'Manager'), createCalendarEvent);

module.exports = router;
