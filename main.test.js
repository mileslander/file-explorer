const request = require('supertest');
const server = require('./app');

afterAll(() => {
  server.close();
});

describe('File Explorer Server', () => {
  test('should return H1 with "Local File Explorer"', async () => {
    const res = await request(server).get('/');
    expect(res.text).toContain('<H1>Local File Explorer<H1>');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/html');
  });
});
