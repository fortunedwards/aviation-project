const squadco = require('../utils/squadco');
const db = require('../config/db');
const upload = require('../middleware/uploadMiddleware');
const { logAction } = require('../utils/logger');
const { insertApplication } = require('../services/registrationService');

const isSuccessful = (payment) => ['success', 'successful'].includes(String(payment?.transaction_status || payment?.status || '').toLowerCase());
const amountInKobo = (amount) => Math.round(Number(amount || 0) * 100);
const paymentError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const getIntent = async (reference, queryable = db) => (await queryable.query('SELECT * FROM registration_payment_intents WHERE reference = $1', [reference])).rows[0] || null;

const beginPayment = async ({ id, type }) => {
  const reference = squadco.createReference(id, type);
  await db.query('UPDATE applications SET payment_ref = $1, payment_status = $2 WHERE id = $3', [reference, 'Pending', id]);
  return { reference };
};

const finalizeRegistrationIntent = async ({ reference, req }) => {
  const payment = await squadco.verifyPayment(reference);
  if (!isSuccessful(payment)) throw paymentError('Payment has not been confirmed by SquadCo yet.');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const intent = (await client.query('SELECT * FROM registration_payment_intents WHERE reference = $1 FOR UPDATE', [reference])).rows[0];
    if (!intent) throw paymentError('Payment reference not found.', 404);
    if (intent.status === 'completed' && intent.application_id) {
      await client.query('COMMIT');
      return { applicationId: intent.application_id, alreadyCompleted: true };
    }
    if (Number(payment.amount) !== amountInKobo(intent.amount)) throw paymentError('Payment amount does not match the course registration fee.');
    const duplicate = await client.query('SELECT id FROM applications WHERE LOWER(email) = LOWER($1)', [intent.email]);
    if (duplicate.rows.length) throw paymentError('An application with this email already exists.', 409);
    const applicationId = await insertApplication({
      queryable: client,
      registration: intent.registration_data,
      passportUrl: intent.passport_url,
      certificateUrl: intent.certificate_url,
      paymentReference: reference,
      paymentStatus: 'Paid',
    });
    await client.query('UPDATE registration_payment_intents SET status = $2, application_id = $3, completed_at = CURRENT_TIMESTAMP WHERE reference = $1', [reference, 'completed', applicationId]);
    await client.query('COMMIT');
    await logAction({
      req, action: 'PAYMENT_VERIFIED',
      description: 'SquadCo registration payment ' + reference + ' verified for application ' + applicationId + '.',
      actorType: 'system',
      metadata: { reference, application_id: applicationId, provider_status: payment.transaction_status || payment.status },
      targetType: 'payment', targetId: applicationId, statusCode: 201,
    });
    return { applicationId, alreadyCompleted: false };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

exports.prepareRegistrationPayment = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const selectedCourse = String(req.body.selectedCourse || '').trim();
    if ((await db.query('SELECT id FROM applications WHERE LOWER(email) = LOWER($1)', [email])).rows.length) {
      return res.status(409).json({ error: 'An application with this email already exists.' });
    }
    const course = (await db.query('SELECT id, title, form_fee FROM courses WHERE id::text = $1', [selectedCourse])).rows[0];
    if (!course) return res.status(404).json({ error: 'The selected course could not be found. Please select it again.' });
    if (Number(course.form_fee || 0) <= 0) return res.status(400).json({ error: 'This course has no registration fee and should be submitted without payment.' });
    const savedFiles = await upload.uploadApplicationFiles(req.files || {});
    if (!savedFiles.passport) return res.status(400).json({ error: 'A passport photograph is required.' });
    const reference = squadco.createReference(String(Date.now()) + Math.random().toString(36).slice(2, 10), 'REG');
    const registrationData = { ...req.body, email };
    delete registrationData.payment_ref;
    await db.query(
      'INSERT INTO registration_payment_intents (reference, email, course_id, registration_data, passport_url, certificate_url, amount) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)',
      [reference, email, String(course.id), JSON.stringify(registrationData), savedFiles.passport, savedFiles.certificates || null, Number(course.form_fee)]
    );
    res.status(201).json({ success: true, reference, amount: Number(course.form_fee), courseTitle: course.title });
  } catch (error) {
    console.error('Registration payment preparation error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not prepare the registration payment.' });
  }
};

exports.completeRegistrationPayment = async (req, res) => {
  try {
    const result = await finalizeRegistrationIntent({ reference: req.params.reference, req });
    res.status(result.alreadyCompleted ? 200 : 201).json({ success: true, applicationId: result.applicationId });
  } catch (error) {
    console.error('Registration payment completion error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not confirm the registration payment.' });
  }
};

exports.startEnrollmentPayment = async (req, res) => {
  try {
    const application = (await db.query('SELECT a.id, a.course_fee FROM student_users s JOIN applications a ON s.application_id = a.id WHERE s.id = $1', [req.user.id])).rows[0];
    if (!application) return res.status(404).json({ error: 'Application record not found.' });
    if (Number(application.course_fee || 0) <= 0) return res.status(400).json({ error: 'Tuition fee is not available.' });
    res.json({ success: true, reference: (await beginPayment({ id: application.id, type: 'TUI' })).reference });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not initiate payment.' });
  }
};

exports.verifyPayment = async (req, res) => {
  const { reference } = req.params;
  try {
    if (await getIntent(reference)) {
      const result = await finalizeRegistrationIntent({ reference, req });
      return res.json({ success: true, message: 'Registration payment verified.', applicationId: result.applicationId });
    }
    const application = (await db.query('SELECT a.id, c.form_fee, a.course_fee FROM applications a JOIN courses c ON c.id = a.course_id WHERE a.payment_ref = $1', [reference])).rows[0];
    if (!application) return res.status(404).json({ success: false, message: 'Payment reference not found.' });
    const payment = await squadco.verifyPayment(reference);
    const due = reference.startsWith('ATC-TUI-') ? application.course_fee : application.form_fee;
    if (!isSuccessful(payment) || Number(payment.amount) !== amountInKobo(due)) return res.status(400).json({ success: false, message: 'Payment was not successful or its amount is incorrect.' });
    await db.query('UPDATE applications SET payment_status = $1, admission_status = $2 WHERE id = $3', ['Paid', 'Enrolled', application.id]);
    res.json({ success: true, message: 'Payment verified.', data: payment });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not verify payment.' });
  }
};

exports.handleSquadWebhook = async (req, res) => {
  const payload = req.body || {};
  const reference = payload.transaction_ref || payload.reference || payload.data?.transaction_ref || payload.data?.reference;
  if (!reference) return res.sendStatus(200);
  try {
    if (await getIntent(reference)) {
      await finalizeRegistrationIntent({ reference, req });
      return res.sendStatus(200);
    }
    const application = (await db.query('SELECT a.id, c.form_fee, a.course_fee FROM applications a JOIN courses c ON c.id = a.course_id WHERE a.payment_ref = $1', [reference])).rows[0];
    if (!application) return res.sendStatus(200);
    const payment = await squadco.verifyPayment(reference);
    const due = reference.startsWith('ATC-TUI-') ? application.course_fee : application.form_fee;
    if (isSuccessful(payment) && Number(payment.amount) === amountInKobo(due)) {
      await db.query('UPDATE applications SET payment_status = $1, admission_status = $2 WHERE id = $3', ['Paid', 'Enrolled', application.id]);
    }
  } catch (error) {
    console.error('SquadCo webhook processing error:', error.message);
  }
  res.sendStatus(200);
};
