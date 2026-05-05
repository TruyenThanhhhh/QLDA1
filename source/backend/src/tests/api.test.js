const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

describe('API Health Check', () => {
  test('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Auth API', () => {
  test('POST /api/auth/login without credentials should return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me without token should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Assets API', () => {
  test('GET /api/assets without auth should return 401', async () => {
    const res = await request(app).get('/api/assets');
    expect(res.status).toBe(401);
  });

  test('GET /api/assets/geojson without auth should return 401', async () => {
    const res = await request(app).get('/api/assets/geojson');
    expect(res.status).toBe(401);
  });
});

describe('Reports API', () => {
  test('GET /api/reports/summary without auth should return 401', async () => {
    const res = await request(app).get('/api/reports/summary');
    expect(res.status).toBe(401);
  });

  test('GET /api/reports/priority without auth should return 401', async () => {
    const res = await request(app).get('/api/reports/priority');
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});
