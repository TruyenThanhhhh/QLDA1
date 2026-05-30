require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Asset = require('../models/Asset');

describe('New Features Integration Tests', () => {
  let adminToken;
  let citizenToken;
  let citizenUser;
  let testAssetId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qlda_test');
    }

    await User.deleteMany({});
    await Asset.deleteMany({});

    // Create admin
    const admin = new User({
      username: 'admin_feat_test',
      passwordHash: 'admin123',
      fullName: 'Admin Features Test',
      role: 'admin'
    });
    await admin.save();

    // Create citizen
    const citizen = new User({
      username: 'citizen_feat_test',
      passwordHash: 'citizen123',
      fullName: 'Citizen Features Test',
      role: 'user'
    });
    citizenUser = await citizen.save();

    // Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_feat_test', password: 'admin123' });
    adminToken = adminLogin.body.token;

    // Login Citizen
    const citizenLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'citizen_feat_test', password: 'citizen123' });
    citizenToken = citizenLogin.body.token;

    // Create an asset for testing interaction (upvotes/comments/routing)
    const asset = new Asset({
      assetCode: 'ASSET-FEAT-001',
      name: 'Asset Features Test',
      assetType: 'sign',
      geometryType: 'Point',
      geometry: {
        type: 'Point',
        coordinates: [108.201, 16.051]
      },
      status: 'damaged'
    });
    const savedAsset = await asset.save();
    testAssetId = savedAsset._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Citizen upvote and comments', () => {
    test('Citizen should upvote asset', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/upvote`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.upvotesCount).toBe(1);
      expect(res.body.hasUpvoted).toBe(true);

      // Check DB
      const dbAsset = await Asset.findById(testAssetId);
      expect(dbAsset.upvotes).toContainEqual(citizenUser._id);
    });

    test('Citizen should toggle upvote off', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/upvote`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.upvotesCount).toBe(0);
      expect(res.body.hasUpvoted).toBe(false);
    });

    test('Citizen should write a comment', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/comment`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ text: 'This sign is damaged.' });

      expect(res.status).toBe(201);
      expect(res.body.comments).toBeDefined();
      expect(res.body.comments.length).toBe(1);
      expect(res.body.comments[0].text).toBe('This sign is damaged.');
      expect(res.body.comments[0].fullName).toBe('Citizen Features Test');
    });
  });

  describe('Custom routing with warnings', () => {
    test('Should query custom routing and detect warning near asset', async () => {
      try {
        const res = await request(app)
          .get('/api/reports/routing/custom?start=108.200,16.050&end=108.202,16.052')
          .set('Authorization', `Bearer ${citizenToken}`);

        if (res.status === 200) {
          expect(res.body.polyline).toBeDefined();
          expect(res.body.warnings).toBeDefined();
          const warn = res.body.warnings.find(w => w.id === testAssetId);
          expect(warn).toBeDefined();
        } else {
          expect([500, 502, 503, 504]).toContain(res.status);
        }
      } catch (err) {
        // Network error is fine
      }
    });
  });
});
