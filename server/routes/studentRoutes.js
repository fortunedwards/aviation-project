const express = require('express');
const router = express.Router();
const { getStudentProfile } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware'); // Ensure student can access

router.get('/profile', protect, getStudentProfile);

module.exports = router;