const nodemailer = require('nodemailer');

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user,
    pass,
  },
});

const sendOrderConfirmationEmail = (mailOptions) => {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('[MAILER] Error:', error);
    } else {
      console.log('[MAILER] Email sent:', info.response);
    }
  });
};

module.exports = { transporter, sendOrderConfirmationEmail };
