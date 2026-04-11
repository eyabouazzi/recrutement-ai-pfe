const nodemailer = require('nodemailer');

function getSmtpConfig() {
    const host = String(process.env.SMTP_HOST || '').trim();
    const user = String(process.env.SMTP_USER || '').trim();
    const pass = String(process.env.SMTP_PASS || '').trim();
    const fromName = String(process.env.FROM_NAME || 'RecruitAI').trim();
    const port = Number.parseInt(String(process.env.SMTP_PORT || '587').trim(), 10);

    return {
        host,
        port: Number.isFinite(port) ? port : 587,
        secure: Number.isFinite(port) ? port === 465 : false,
        user,
        pass,
        fromName,
    };
}

function assertSmtpConfig(config) {
    const missing = ['host', 'user', 'pass'].filter((key) => !config[key]);
    if (missing.length) {
        throw new Error(`SMTP configuration incomplete: missing ${missing.join(', ')}`);
    }
}

async function sendEmail(options) {
    const config = getSmtpConfig();
    assertSmtpConfig(config);

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    const mailOptions = {
        from: `${config.fromName} <${config.user}>`,
        to: options.email,
        subject: options.subject,
        text: options.content,
        ...(options.html ? { html: options.html } : {}),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`);
        return info;
    } catch (error) {
        const message = error?.message || 'Unknown email delivery error';
        throw new Error(`SMTP send failed: ${message}`);
    }
}

module.exports = sendEmail;
module.exports.getSmtpConfig = getSmtpConfig;
