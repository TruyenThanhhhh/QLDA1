require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Asset = require('../models/Asset');
const MaintenanceRecord = require('../models/MaintenanceRecord');

describe('Sprint 6 Features Integration Tests', () => {
  let adminToken;
  let testAssetId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qlda_test');
    }

    await User.deleteMany({});
    await Asset.deleteMany({});
    await MaintenanceRecord.deleteMany({});

    // Create admin
    const admin = new User({
      username: 'admin_sprint6_test',
      passwordHash: 'admin123',
      fullName: 'Admin Sprint6 Test',
      role: 'admin'
    });
    await admin.save();

    // Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_sprint6_test', password: 'admin123' });
    adminToken = adminLogin.body.token;

    // Create a few assets with various status
    const asset1 = new Asset({
      assetCode: 'ASSET-P1',
      name: 'Pothole Road Section',
      assetType: 'road',
      geometryType: 'Point',
      geometry: { type: 'Point', coordinates: [108.201, 16.051] },
      status: 'damaged',
      approvalStatus: 'approved'
    });
    const saved1 = await asset1.save();
    testAssetId = saved1._id;

    const asset2 = new Asset({
      assetCode: 'ASSET-P2',
      name: 'Fair Lamp Post',
      assetType: 'lamp_post',
      geometryType: 'Point',
      geometry: { type: 'Point', coordinates: [108.202, 16.052] },
      status: 'fair',
      approvalStatus: 'approved'
    });
    await asset2.save();

    const asset3 = new Asset({
      assetCode: 'ASSET-P3',
      name: 'Good Sign',
      assetType: 'sign',
      geometryType: 'Point',
      geometry: { type: 'Point', coordinates: [108.203, 16.053] },
      status: 'good',
      approvalStatus: 'approved'
    });
    await asset3.save();

    // Create historical maintenance record for asset1 to boost risk score
    const record = new MaintenanceRecord({
      assetId: testAssetId,
      recordType: 'maintenance',
      title: 'Road crack sealing',
      description: 'Sealing multiple surface cracks',
      severity: 'medium',
      reportedBy: admin._id,
      status: 'resolved'
    });
    await record.save();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Predictive Maintenance API', () => {
    test('Should calculate and retrieve top-risk assets', async () => {
      const res = await request(app)
        .get('/api/reports/predictive-maintenance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Verify that asset1 (damaged, road, past repair) has highest score
      const first = res.body[0];
      expect(first.assetCode).toBe('ASSET-P1');
      expect(first.riskScore).toBeGreaterThanOrEqual(80);
      expect(first.needsMaintenance).toBe(true);

      // Verify that database reflects the update
      const dbAsset = await Asset.findById(testAssetId);
      expect(dbAsset.riskScore).toBeDefined();
      expect(dbAsset.needsMaintenance).toBe(true);
    });
  });

  describe('AI Chatbot API', () => {
    test('Should respond to chat query', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'Hệ thống hiện có bao nhiêu điểm hư hỏng cần duy tu?',
          history: []
        });

      // Even if API key is not active, it should return 200 with fallback message or actual model reply
      expect(res.status).toBe(200);
      expect(res.body.reply).toBeDefined();
      expect(typeof res.body.reply).toBe('string');
    });

    test('Should return error when message is empty', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: '',
          history: []
        });

      expect(res.status).toBe(400);
    });
  });
});
