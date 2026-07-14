const express = require('express');
const router = express.Router();

const {
  getCalendarEvents,
  createCalendarEvent,
  getCalendarCategories,
} = require('../controllers/calendarController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/events', getCalendarEvents);
router.get('/categories', getCalendarCategories);
router.post('/events', authorize('Admin', 'Manager'), createCalendarEvent);

module.exports = router;
