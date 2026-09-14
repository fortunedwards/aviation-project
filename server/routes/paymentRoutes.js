const express = require('express');
const router = express.Router();
const { startEnrollmentPayment, startRegistrationPayment, verifyPayment, handleSquadWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/initialize', protect, startEnrollmentPayment);
router.post('/registration/initialize', startRegistrationPayment);
router.get('/verify/:reference', verifyPayment);
router.post('/webhook', handleSquadWebhook);

module.exports = router;
