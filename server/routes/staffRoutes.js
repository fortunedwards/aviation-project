const express = require('express');
const router = express.Router();
// Import the functions from the controller
const { 
    getAllStaff, 
    createStaffAccount, 
    getAuditLogs,
    deleteStaff,
    assignCourse,
    updateStaffStatus
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All staff routes are protected and restricted to Managers/Admins
router.use(protect);
router.use(authorize('Manager', 'Admin'));

router.get('/all', getAllStaff);
router.post('/create', createStaffAccount);
router.get('/audit-logs', getAuditLogs);
router.delete('/:id', protect, authorize('Manager'), deleteStaff);
router.put('/assign-course', protect, authorize('Manager'), assignCourse);
router.patch('/:id/status', protect, authorize('Manager'), updateStaffStatus);

module.exports = router;
