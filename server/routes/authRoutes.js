const express = require('express');
const router = express.Router();
const { registerStudent, login, logout } = require('../controllers/authController');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');
const { registerSchema } = require('../utils/validation');
const { protect } = require('../middleware/authMiddleware');

router.post(
    '/register-student', 
    upload.fields([
        { name: 'passport', maxCount: 1 },
        { name: 'certificates', maxCount: 1 }
    ]), 
    validate(registerSchema),
    registerStudent
);

router.post('/login', login);
router.post('/logout', protect, logout);

module.exports = router;
