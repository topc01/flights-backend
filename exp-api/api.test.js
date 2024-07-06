const request = require('supertest');
const app = require('./src/app');

let server;

beforeAll(() => {
  server = app.listen(3000, () => {
    // console.log('Server is running (:3000)');
  });
});

afterAll(() => {
  server.close();
});

describe('GET /', () => {
  test('responds with "Hello, World! 5"', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, World! 5');
  });
});
