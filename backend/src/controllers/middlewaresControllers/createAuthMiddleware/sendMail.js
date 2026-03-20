/** @type {any} */
const { passwordVerfication } = require('@/emailTemplate/emailVerfication');

const { Resend } = require('resend');

/** @returns {Promise<any>} */
const sendMail = async ({
  email,
  name,
  link,
  app_email,
  subject = 'Verify your email | ERP CRM',
  type = 'emailVerfication',
  emailToken,
}) => {
  const resend = new Resend(process.env.RESEND_API);

  const { data } = await resend.emails.send({
    from: app_email,
    to: email,
    subject,
    html: passwordVerfication({ name, link }),
  });

  return data;
};

module.exports = sendMail;
