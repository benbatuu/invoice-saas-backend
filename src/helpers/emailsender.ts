const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

import { env } from 'bun';

export default function sendEmail(token: string) {
  token = jwt.sign(token, env.JWT_SECRET);
  const html = `
        <h1>Hi there</h1>
        <p>https://calisantakip.ankahaber.net/auth/resetpassword?token=${token} </p>
    `;

  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: { user: 'info@yakamozferforje.com', pass: '34Yakamozferforje52.' },
  });

  const info = transporter.sendMail({
    from: 'Batuhan Küçük <info@yakamozferforje.com>',
    to: 'bennbatuu@gmail.com',
    subject: 'Reset Password Magic Link',
    html: html,
  });
  console.log('Message id ' + info.response);
}
