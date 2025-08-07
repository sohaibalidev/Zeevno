const nodemailer = require('nodemailer');
const config = require('../config/appConfig');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.MAILER_EMAIL,
        pass: config.MAILER_PASSWORD,
    },
});

async function sendEmail({ to, subject, text, html }) {
    const mailOptions = {
        from: `${config.APP_NAME} <${config.MAILER_EMAIL}>`,
        to,
        text,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw { status: 500, message: 'Failed to send email', error };
    }
}

module.exports = sendEmail;
