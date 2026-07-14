exports.getEmailTemplate = (status, surname, course, remarks) => {
  const baseStyle = "font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;";
  
  const templates = {
    Approved: {
      subject: `ADMISSION GRANTED: ${course} - Aeroconsult`,
      html: `
        <div style="${baseStyle}">
          <h2 style="color: #16a34a;">Congratulations, ${surname}!</h2>
          <p>Your application for <b>${course}</b> has been <b>Approved</b>.</p>
          <p><b>Instructor Remarks:</b> ${remarks || 'Welcome to the academy!'}</p>
          <p>Please log in to the student portal to complete your enrollment and pay your course fees.</p>
          <a href="https://portal.aeroconsult.com/login" style="display: inline-block; background: #1e40af; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Access Student Portal</a>
        </div>`
    },
    Rejected: {
      subject: `Update regarding your application - Aeroconsult`,
      html: `
        <div style="${baseStyle}">
          <h2 style="color: #dc2626;">Application Update</h2>
          <p>Dear ${surname},</p>
          <p>Thank you for your interest in the ${course} program. After a careful review of your documents, we regret to inform you that we cannot proceed with your admission at this time.</p>
          <p><b>Reason:</b> ${remarks}</p>
          <p>You are welcome to re-apply once the requirements mentioned above are met.</p>
        </div>`
    },
    Deferred: {
      subject: `Application Deferred - Aeroconsult`,
      html: `
        <div style="${baseStyle}">
          <h2 style="color: #d97706;">Application Deferred</h2>
          <p>Dear ${surname},</p>
          <p>Your application for ${course} has been <b>Deferred</b> to our next training batch.</p>
          <p><b>Note from Admissions:</b> ${remarks}</p>
          <p>No further action is required from you at this time. We will contact you once the next session dates are finalized.</p>
        </div>`
    }
  };

  return templates[status];
};