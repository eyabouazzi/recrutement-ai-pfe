const nodemailer = require('nodemailer');

async function sendEmail(options) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        const mailOptions = {
            from: process.env.FROM_NAME + ' <' + process.env.SMTP_USER + '>',
            // service recrutement <mail@gmail.com>
            to: options.email,
            subject: options.subject,
            text: options.content
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return info;
    } catch (error) {
        console.log(error.message);


    }
}

module.exports = sendEmail;