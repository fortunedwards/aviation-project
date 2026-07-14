const express = require('express');
const router = express.Router();

const { 
    getInstructorStudents, 
    getAllApplications,
    updateApplicationStatus,
    trackApplication,
    getAuditLogs,
    getCategorizedApplications
} = require('../controllers/applicationController');

const { protect, authorize } = require('../middleware/authMiddleware');

// --- STAFF & MANAGEMENT ROUTES ---
router.get('/instructor-queue', protect, authorize('Instructor'), getInstructorStudents);
router.get('/all', protect, authorize('Admin', 'Manager'), getAllApplications);
router.get('/categorized', protect, authorize('Admin', 'Manager'), getCategorizedApplications);
router.put('/:id/status', protect, authorize('Instructor', 'Manager'), updateApplicationStatus);
router.get('/logs', protect, authorize('Manager'), getAuditLogs);

// --- PUBLIC ROUTES ---
router.get('/track/:identifier', trackApplication);

module.exports = router;