jest.mock('nodemailer', () => ({
    createTransport: jest.fn(),
}));

const nodemailer = require('nodemailer');
const sendEmail = require('../utils/mailer');

describe('mailer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'noreply@example.com';
        process.env.SMTP_PASS = 'secret';
        process.env.FROM_NAME = 'RecruitAI';
    });

    it('sends email with normalized SMTP config', async () => {
        const sendMail = jest.fn().mockResolvedValue({ response: '250 OK' });
        nodemailer.createTransport.mockReturnValue({ sendMail });

        const result = await sendEmail({
            email: 'user@example.com',
            subject: 'Test',
            content: 'Hello',
        });

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
                user: 'noreply@example.com',
                pass: 'secret',
            },
        });
        expect(sendMail).toHaveBeenCalledWith({
            from: 'RecruitAI <noreply@example.com>',
            to: 'user@example.com',
            subject: 'Test',
            text: 'Hello',
        });
        expect(result).toEqual({ response: '250 OK' });
    });

    it('throws when SMTP delivery fails', async () => {
        const sendMail = jest.fn().mockRejectedValue(new Error('Invalid login'));
        nodemailer.createTransport.mockReturnValue({ sendMail });

        await expect(sendEmail({
            email: 'user@example.com',
            subject: 'Test',
            content: 'Hello',
        })).rejects.toThrow('SMTP send failed: Invalid login');
    });
});
