const request = require('supertest');
const app = require('../app');

describe('Auth guard', () => {
    it('GET /submission/my-results without token returns 401', async () => {
        const res = await request(app).get('/submission/my-results');
        expect(res.status).toBe(401);
        expect(res.body.status).toBe(false);
    });
});
