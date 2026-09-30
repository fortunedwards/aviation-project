const express = require('express');
const router = express.Router();
const { startEnrollmentPayment, prepareRegistrationPayment, completeRegistrationPayment, verifyPayment, handleSquadWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');
const { registerSchema } = require('../utils/validation');

router.post('/initialize', protect, startEnrollmentPayment);
router.post('/registration/prepare', upload.fields([
  { name: 'passport', maxCount: 1 },
  { name: 'certificates', maxCount: 1 },
]), validate(registerSchema), prepareRegistrationPayment);
router.post('/registration/complete/:reference', completeRegistrationPayment);
router.get('/verify/:reference', verifyPayment);
router.post('/webhook', handleSquadWebhook);

module.exports = router;
