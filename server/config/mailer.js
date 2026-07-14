const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., mail.aeroconsult.com
  port: process.env.EMAIL_PORT, // Usually 465 or 587
  secure: true,                // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  },
  tls: {
    rejectUnauthorized: false // Helps with some private domain SSL certificates
  }
});

module.exports = transporter;