jest.mock('../models/user.model', () => ({
    findOne: jest.fn(),
}));
jest.mock('../models/submission.model', () => ({}));
jest.mock('../models/testDraft.model', () => ({}));
jest.mock('../utils/mailer', () => jest.fn());
jest.mock('../utils/emailNotifications', () => ({
    smtpConfigured: jest.fn(() => false),
}));
jest.mock('../utils/jwt', () => ({
    generateToken: jest.fn(() => 'mock-token'),
}));

const userModel = require('../models/user.model');
const { generateToken } = require('../utils/jwt');
const { login } = require('../controllers/auth.controller');

function createResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

describe('Auth login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('matches email case-insensitively and returns the admin dashboard payload', async () => {
        const comparePassword = jest.fn().mockResolvedValue(true);
        userModel.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: 'user-1',
                email: 'Admin@Example.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                comparePassword,
            }),
        });

        const req = {
            body: {
                email: '  ADMIN@example.com ',
                password: 'Password123',
            },
        };
        const res = createResponse();

        await login(req, res);

        expect(userModel.findOne).toHaveBeenCalledTimes(1);
        const lookup = userModel.findOne.mock.calls[0][0];
        expect(lookup.email).toBeInstanceOf(RegExp);
        expect(lookup.email.test('admin@example.com')).toBe(true);
        expect(lookup.email.test('ADMIN@example.com')).toBe(true);
        expect(comparePassword).toHaveBeenCalledWith('Password123');
        expect(generateToken).toHaveBeenCalledWith('user-1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: true,
            token: 'mock-token',
            user: expect.objectContaining({
                role: 'admin',
                email: 'Admin@Example.com',
            }),
        }));
    });
});
