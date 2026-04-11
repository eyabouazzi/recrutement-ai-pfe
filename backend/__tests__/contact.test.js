const request = require('supertest');
const app = require('../app');

describe('Contact (public)', () => {
  it('POST /contact returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/contact')
      .send({ type: 'newsletter', email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
  });

  it('POST /contact returns 400 for invalid type', async () => {
    const res = await request(app)
      .post('/contact')
      .send({ type: 'spam', email: 'ok@example.com' });
    expect(res.status).toBe(400);
  });
});
