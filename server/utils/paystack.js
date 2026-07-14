const axios = require('axios');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

exports.initializePayment = async (email, amount, metadata) => {
    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amount * 100, // Paystack expects Kobo (Naira * 100)
                metadata,
                callback_url: `${FRONTEND_URL}/payment-success` // Where they go after paying
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Paystack Init Error:", error.response?.data || error.message);
        throw new Error("Could not initialize payment with Paystack");
    }
};
