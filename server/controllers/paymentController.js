const { initializePayment } = require('../utils/paystack');
const db = require('../config/db');
const crypto = require('crypto');
const axios = require('axios');
const { logAction } = require('../utils/logger');

exports.startEnrollmentPayment = async (req, res) => {
    try {
        // 1. Get the Student's Application Data
        // req.user.id is the student_user's ID from the auth middleware
        const studentRes = await db.query(`
            SELECT a.id, a.email, a.course_fee, c.title 
            FROM student_users s
            JOIN applications a ON s.application_id = a.id
            JOIN courses c ON a.course_id = c.id
            WHERE s.id = $1
        `, [req.user.id]);

        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: "Application record not found." });
        }

        const { id, email, course_fee, title } = studentRes.rows[0];

        // 2. Prepare Metadata (Very important for the Webhook later!)
        const metadata = {
            application_id: id,
            course_name: title,
            payment_type: 'tuition_fees'
        };

        // 3. Call Paystack Utility
        const paystackData = await initializePayment(email, course_fee, metadata);

        await logAction({
            req,
            userId: req.user.id,
            action: 'PAYMENT_INITIALIZED',
            description: `Payment initialization started for application ${id}.`,
            actorRole: req.user.role,
            metadata: {
                application_id: id,
                email,
                course_name: title,
                amount: course_fee,
            },
            targetType: 'payment',
            targetId: id,
        });

        // 4. Return the Authorization URL to the Frontend
        res.status(200).json({
            success: true,
            authorization_url: paystackData.data.authorization_url,
            reference: paystackData.data.reference
        });

    } catch (err) {
        console.error("❌ Payment Init Error:", err.message);
        res.status(500).json({ error: "Could not initiate payment. Please try again." });
    }
};

exports.handlePaystackWebhook = async (req, res) => {
    // 1. Verify the event is actually from Paystack (Security Check)
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                       .update(JSON.stringify(req.body))
                       .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).send('Unauthorized');
    }

    const event = req.body;

    // 2. Only listen for successful payments
    if (event.event === 'charge.success') {
        const { application_id } = event.data.metadata;
        const reference = event.data.reference;
        const amountPaid = event.data.amount / 100;

        try {
            await db.query(`
                UPDATE applications SET payment_status = 'Paid', admission_status = 'Enrolled', payment_ref = $1 WHERE id = $2
            `, [reference, application_id]);

            // ADD THIS LOGGING BLOCK HERE 👇
            await logAction({
                action: 'PAYMENT_RECEIVED',
                description: `Tuition payment of ₦${amountPaid.toLocaleString()} confirmed for App ID: ${application_id}`,
                actorType: 'system',
                metadata: { reference, amount: amountPaid, application_id },
                targetType: 'payment',
                targetId: application_id
            });

            console.log(`💰 Payment Verified: Application ${application_id} is now Enrolled.`);
        } catch (err) {
            console.error("❌ Webhook DB Error:", err.message);
        }
    }
    res.sendStatus(200);
};

exports.verifyPayment = async (req, res) => {
    const { reference } = req.params;

    try {
        // 1. Call Paystack API to verify the transaction
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { status, data } = response.data;

        // 2. If successful, update the database (Redundancy check for Webhook)
        if (status === true && data.status === 'success') {
            const { application_id } = data.metadata;

            await db.query(`
                UPDATE applications 
                SET payment_status = 'Paid', 
                    admission_status = 'Enrolled', 
                    payment_ref = $1 
                WHERE id = $2
            `, [reference, application_id]);

            await logAction({
                req,
                userId: req.user.id,
                action: 'PAYMENT_VERIFIED_MANUALLY',
                description: `Payment ${reference} was manually verified for application ${application_id}.`,
                actorRole: req.user.role,
                metadata: {
                    reference,
                    application_id,
                    provider_status: data.status,
                },
                targetType: 'payment',
                targetId: application_id,
            });

            return res.status(200).json({
                success: true,
                message: "Payment verified and record updated.",
                data: data
            });
        }

        await logAction({
            req,
            userId: req.user.id,
            action: 'PAYMENT_VERIFY_FAILED',
            description: `Payment verification failed for reference ${reference}.`,
            actorRole: req.user.role,
            metadata: { reference, provider_status: data.status },
            success: false,
            statusCode: 400,
            targetType: 'payment',
            targetId: reference,
        });

        res.status(400).json({ success: false, message: "Payment not successful" });

    } catch (err) {
        console.error("❌ Payment Verification Error:", err.message);
        res.status(500).json({ error: "Internal server error during verification" });
    }
};
