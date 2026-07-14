const express = require('express');
const router = express.Router();
const { 
    startEnrollmentPayment, 
    handlePaystackWebhook, 
    verifyPayment // Import the new function
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Only logged-in students can trigger these
router.post('/initialize', protect, startEnrollmentPayment);

// New Verification Route
router.get('/verify/:reference', protect, verifyPayment);

// Webhook (No 'protect' because it comes from Paystack's servers)
router.post('/webhook', handlePaystackWebhook);

module.exports = router;