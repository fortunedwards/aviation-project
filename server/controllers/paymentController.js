const squadco = require('../utils/squadco');
const db = require('../config/db');
const { logAction } = require('../utils/logger');

const isSuccessful = (payment) => ['success', 'successful'].includes(String(payment?.transaction_status || payment?.status || '').toLowerCase());

const beginPayment = async ({ id, type }) => {
  const reference = squadco.createReference(id, type);
  await db.query('UPDATE applications SET payment_ref = $1, payment_status = $2 WHERE id = $3', [reference, 'Pending', id]);
  return { reference };
};

exports.startEnrollmentPayment = async (req, res) => {
  try {
    const result = await db.query(`SELECT a.id, a.email, a.course_fee, a.surname, a.other_names FROM student_users s JOIN applications a ON s.application_id = a.id WHERE s.id = $1`, [req.user.id]);
    const application = result.rows[0];
    if (!application) return res.status(404).json({ error: 'Application record not found.' });
    if (Number(application.course_fee || 0) <= 0) return res.status(400).json({ error: 'Tuition fee is not available.' });
    const payment = await beginPayment({ id: application.id, type: 'TUI' });
    await logAction({ req, action: 'PAYMENT_INITIALIZED', description: `SquadCo tuition payment started for application ${application.id}.`, targetType: 'payment', targetId: application.id });
    res.json({ success: true, reference: payment.reference });
  } catch (err) { res.status(500).json({ error: err.message || 'Could not initiate payment.' }); }
};

exports.startRegistrationPayment = async (req, res) => {
  const { applicationId, email } = req.body || {};
  if (!applicationId || !email) return res.status(400).json({ error: 'Application and email are required.' });
  try {
    const result = await db.query(`SELECT a.id, a.email, a.surname, a.other_names, c.form_fee FROM applications a JOIN courses c ON c.id = a.course_id WHERE a.id = $1 AND LOWER(a.email) = LOWER($2)`, [applicationId, email]);
    const application = result.rows[0];
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (Number(application.form_fee || 0) <= 0) return res.status(400).json({ error: 'This application has no registration fee.' });
    const payment = await beginPayment({ id: application.id, type: 'REG' });
    res.json({ success: true, reference: payment.reference });
  } catch (err) { res.status(500).json({ error: err.message || 'Could not initiate payment.' }); }
};

exports.verifyPayment = async (req, res) => {
  const { reference } = req.params;
  try {
    const applicationResult = await db.query(`SELECT a.id, c.form_fee, a.course_fee FROM applications a JOIN courses c ON c.id = a.course_id WHERE a.payment_ref = $1`, [reference]);
    const application = applicationResult.rows[0];
    if (!application) return res.status(404).json({ success: false, message: 'Payment reference not found.' });
    const payment = await squadco.verifyPayment(reference);
    if (!isSuccessful(payment)) return res.status(400).json({ success: false, message: 'Payment not successful.' });
    const expectedAmount = Number(reference.startsWith('ATC-TUI-') ? application.course_fee : application.form_fee) * 100;
    if (Number(payment.amount) !== expectedAmount) return res.status(400).json({ success: false, message: 'Payment amount does not match the application fee.' });
    await db.query(`UPDATE applications SET payment_status = 'Paid', admission_status = 'Enrolled', payment_ref = $1 WHERE id = $2`, [reference, application.id]);
    await logAction({ req, action: 'PAYMENT_VERIFIED', description: `SquadCo payment ${reference} verified for application ${application.id}.`, actorType: 'system', metadata: { reference, application_id: application.id, provider_status: payment.transaction_status || payment.status }, targetType: 'payment', targetId: application.id, statusCode: 200 });
    res.json({ success: true, message: 'Payment verified.', data: payment });
  } catch (err) { res.status(500).json({ error: err.message || 'Could not verify payment.' }); }
};

// SquadCo can notify this URL even when the customer does not return to the
// browser. Provider verification remains the source of truth before any DB update.
exports.handleSquadWebhook = async (req, res) => {
  const payload = req.body || {};
  const reference = payload.transaction_ref || payload.reference || payload.data?.transaction_ref || payload.data?.reference;
  if (!reference) return res.sendStatus(200);
  try {
    const applicationResult = await db.query(`SELECT a.id, c.form_fee, a.course_fee FROM applications a JOIN courses c ON c.id = a.course_id WHERE a.payment_ref = $1`, [reference]);
    const application = applicationResult.rows[0];
    if (!application) return res.sendStatus(200);
    const payment = await squadco.verifyPayment(reference);
    const expectedAmount = Number(reference.startsWith('ATC-TUI-') ? application.course_fee : application.form_fee) * 100;
    if (!isSuccessful(payment) || Number(payment.amount) !== expectedAmount) return res.sendStatus(200);
    await db.query(`UPDATE applications SET payment_status = 'Paid', admission_status = 'Enrolled' WHERE id = $1`, [application.id]);
    await logAction({ action: 'PAYMENT_WEBHOOK_VERIFIED', description: `SquadCo webhook verified payment ${reference}.`, actorType: 'system', metadata: { reference, application_id: application.id }, targetType: 'payment', targetId: application.id, statusCode: 200 });
  } catch (err) {
    console.error('SquadCo webhook processing error:', err.message);
  }
  res.sendStatus(200);
};
