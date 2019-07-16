// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API);

interface MailOptions {
  from?: string;
  to: string;
  subject?: string;
  html?: string;
}

export const mailOptions = (firstName, options: MailOptions) => {
  const {
    from = process.env.GMAIL_USER,
    to,
    subject = 'DishCult: Email Verification',
    html = `<p>Hi ${firstName}! Click <a href="${
      process.env.REDIRECT_URL
    }/verify?email=${to}">here</a> to verify your email</p>`,
  } = options;
  return { from, to, subject, html };
};

export const sendMail = async (data) => {
  return sgMail.send(data);
};
