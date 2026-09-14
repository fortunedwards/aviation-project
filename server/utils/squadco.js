const axios = require('axios');

const API_BASE_URL = (process.env.SQUAD_API_BASE_URL || 'https://api-d.squadco.com').replace(/\/$/, '');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const authHeaders = () => {
  if (!process.env.SQUAD_SECRET_KEY) throw new Error('SQUAD_SECRET_KEY is not configured.');
  return { Authorization: `Bearer ${process.env.SQUAD_SECRET_KEY}`, 'Content-Type': 'application/json' };
};

exports.createReference = (applicationId) => `ATC-${String(applicationId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}-${Date.now()}`;

exports.initializePayment = async ({ email, amount, reference, customerName, callbackUrl }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/transaction/initiate`, { email, amount: Math.round(Number(amount)), currency: 'NGN', initiate_type: 'redirect', transaction_ref: reference, callback_url: callbackUrl || `${FRONTEND_URL}/payment-success`, customer_name: customerName || undefined }, { headers: authHeaders() });
    const checkoutUrl = response.data?.data?.checkout_url || response.data?.checkout_url;
    if (!checkoutUrl) throw new Error('SquadCo did not return a checkout URL.');
    return checkoutUrl;
  } catch (error) {
    console.error('SquadCo initialization error:', error.response?.data || error.message);
    throw new Error('Could not initialize payment with SquadCo.');
  }
};

exports.verifyPayment = async (reference) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, { headers: authHeaders() });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('SquadCo verification error:', error.response?.data || error.message);
    throw new Error('Could not verify payment with SquadCo.');
  }
};
