require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Area = require('../models/Area');
const Asset = require('../models/Asset');

describe('Soft Delete Filter', () => {
  let adminToken;
  let testAssetId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qlda_test');
    }

    await User.deleteMany({});
    await Area.deleteMany({});
    await Asset.deleteMany({});

    const admin = new User({
      username: 'admin_sd_test',
      passwordHash: 'admin123',
      fullName: 'Admin SoftDelete Test',
      role: 'admin'
    });
    await admin.save();

    const area = new Area({
      code: 'SD-TEST',
      name: 'Soft Delete Test Area',
      geometry: {
        type: 'Polygon',
        coordinates: [[[108.2, 16.0], [108.3, 16.0], [108.3, 16.1], [108.2, 16.1], [108.2, 16.0]]]
      }
    });
    await area.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_sd_test', password: 'admin123' });
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Should create an asset', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetCode: 'SD-TEST-001',
        name: 'Test Asset For Soft Delete',
        assetType: 'sign',
        geometry: {
          type: 'Point',
          coordinates: [108.25, 16.05]
        },
        status: 'good'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    testAssetId = res.body.id;
  });

  test('getAssets should return the asset before soft delete', async () => {
    const res = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const asset = res.body.items.find(a => a.id === testAssetId);
    expect(asset).toBeDefined();
    expect(asset.name).toBe('Test Asset For Soft Delete');
  });

  test('getAssetById should return the asset before soft delete', async () => {
    const res = await request(app)
      .get(`/api/assets/${testAssetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Asset For Soft Delete');
  });

  test('Soft delete should hide asset from getAssets', async () => {
    await request(app)
      .delete(`/api/assets/${testAssetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const asset = res.body.items.find(a => a.id === testAssetId);
    expect(asset).toBeUndefined();
  });

  test('getAssetById should return 404 for soft-deleted asset', async () => {
    const res = await request(app)
      .get(`/api/assets/${testAssetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  test('Soft-deleted asset should still exist in DB with isDeleted=true', async () => {
    const asset = await Asset.findById(testAssetId);
    expect(asset).not.toBeNull();
    expect(asset.isDeleted).toBe(true);
  });
});
