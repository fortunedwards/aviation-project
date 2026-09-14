const axios = require('axios');

const API_BASE_URL = (process.env.SQUAD_API_BASE_URL || 'https://api.squadco.com').replace(/\/$/, '');

const authHeaders = () => {
  if (!process.env.SQUAD_SECRET_KEY) throw new Error('SQUAD_SECRET_KEY is not configured.');
  return { Authorization: `Bearer ${process.env.SQUAD_SECRET_KEY}`, 'Content-Type': 'application/json' };
};

exports.createReference = (applicationId, type) => `ATC-${type}-${String(applicationId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}-${Date.now()}`;

exports.verifyPayment = async (reference) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, { headers: authHeaders() });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('SquadCo verification error:', error.response?.data || error.message);
    throw new Error('Could not verify payment with SquadCo.');
  }
};
