const normalizeOptionalText = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const insertApplication = async ({ queryable, registration, passportUrl, certificateUrl, paymentReference, paymentStatus = 'Pending' }) => {
  const query = 'INSERT INTO applications (' +
    'surname, other_names, email, dob, sex, ' +
    'place_of_birth, state_of_origin, nationality, address, ' +
    'phone, course_id, nok_name, nok_phone, nok_relation, ' +
    'org_pos, education, technical, qualifications, experience, ' +
    'payment_status, passport_url, certificate_url, payment_ref' +
    ') VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id';

  const values = [
    registration.surname, registration.other_names, registration.email, registration.dob, registration.sex,
    registration.place_of_birth, registration.state_of_origin, registration.nationality, registration.address,
    registration.phone, registration.selectedCourse, registration.nok_name, registration.nok_phone, registration.nok_relation,
    normalizeOptionalText(registration.org_pos), normalizeOptionalText(registration.education),
    normalizeOptionalText(registration.technical), normalizeOptionalText(registration.qualifications),
    normalizeOptionalText(registration.experience), paymentStatus, passportUrl, certificateUrl, paymentReference,
  ];

  const result = await queryable.query(query, values);
  return result.rows[0].id;
};

module.exports = { insertApplication };
