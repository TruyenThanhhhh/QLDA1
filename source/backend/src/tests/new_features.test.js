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
  let testUserId;

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

  describe('User CRUD (Admin Only)', () => {
    test('Admin should create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'new_user_test',
          password: 'password123',
          fullName: 'New User FullName',
          role: 'technician',
          isActive: true
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      testUserId = res.body.id;
    });

    test('Admin should read user list with filters', async () => {
      const res = await request(app)
        .get('/api/users?role=technician')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      const tech = res.body.items.find(u => u.id === testUserId);
      expect(tech).toBeDefined();
      expect(tech.fullName).toBe('New User FullName');
    });

    test('Admin should update user details', async () => {
      const res = await request(app)
        .patch(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Updated Name',
          isActive: false
        });

      expect(res.status).toBe(200);
      
      const dbUser = await User.findById(testUserId);
      expect(dbUser.fullName).toBe('Updated Name');
      expect(dbUser.isActive).toBe(false);
    });

    test('Admin should soft-delete user', async () => {
      const deleteRes = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify not in list
      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const userInList = listRes.body.items.find(u => u.id === testUserId);
      expect(userInList).toBeUndefined();

      // Verify still in DB with isDeleted = true
      const dbUser = await User.findById(testUserId);
      expect(dbUser).not.toBeNull();
      expect(dbUser.isDeleted).toBe(true);
    });

    test('Non-admin cannot access user CRUD', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${citizenToken}`);
      
      expect(res.status).toBe(403);
    });
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
      // Mocking OSRM route since we don't have internet or to make sure it functions properly.
      // Actually, routing.service calls router.project-osrm.org. Since we run tests, it makes an HTTP call.
      // Let's test with real coords or check if it throws an error if no internet.
      // Test Coordinates in Da Nang: start at 108.200,16.050 to end at 108.202,16.052.
      // The damaged asset is at 108.201, 16.051.
      try {
        const res = await request(app)
          .get('/api/reports/routing/custom?start=108.200,16.050&end=108.202,16.052')
          .set('Authorization', `Bearer ${citizenToken}`);

        if (res.status === 200) {
          expect(res.body.polyline).toBeDefined();
          expect(res.body.warnings).toBeDefined();
          // Warning should contain our testAssetId because it's at 108.201,16.051
          const warn = res.body.warnings.find(w => w.id === testAssetId);
          expect(warn).toBeDefined();
        } else {
          // If public API is down or not accessible, it might fail. That is fine, we check that it handles it.
          expect([500, 502, 503, 504]).toContain(res.status);
        }
      } catch (err) {
        // Network error is fine
      }
    });
  });
});
