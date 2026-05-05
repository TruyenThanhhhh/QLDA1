require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Area = require('../models/Area');
const Asset = require('../models/Asset');
const MaintenanceRecord = require('../models/MaintenanceRecord');

describe('Business Logic Flow (Sprint 1)', () => {
  let adminToken;
  let userToken;
  let testAreaId;
  let testAssetId;

  beforeAll(async () => {
    // Connect if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qlda_test');
    }
    
    // Clean up
    await User.deleteMany({});
    await Area.deleteMany({});
    await Asset.deleteMany({});
    await MaintenanceRecord.deleteMany({});

    // Create Admin
    const admin = new User({
      username: 'admin_test',
      passwordHash: 'admin123',
      fullName: 'Admin Test',
      role: 'admin'
    });
    await admin.save();

    // Create Area
    const area = new Area({
      code: 'TEST-AREA',
      name: 'Test Area',
      geometry: {
        type: 'Polygon',
        coordinates: [[[108, 16], [109, 16], [109, 17], [108, 17], [108, 16]]]
      }
    });
    const savedArea = await area.save();
    testAreaId = savedArea._id.toString();

    // Login Admin to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_test', password: 'admin123' });
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('SP1-06: User Registration and Login', () => {
    test('Should register a new citizen user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'citizen_test',
          password: 'password123',
          fullName: 'Nguyen Citizen'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.username).toBe('citizen_test');
      userToken = res.body.token;
    });

    test('Should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'citizen_test',
          password: 'password123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('SP1-07: Asset CRUD (Admin/Technician)', () => {
    test('Admin should create a new point asset', async () => {
      const res = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assetCode: 'SIGN-TEST-001',
          name: 'Bien bao Test',
          assetType: 'sign',
          geometry: {
            type: 'Point',
            coordinates: [108.2, 16.05]
          },
          status: 'good',
          managedAreaId: testAreaId,
          dimensions: { height: 2.5, unit: 'm' }
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      testAssetId = res.body.id;
    });

    test('Should get asset details with correct fields', async () => {
      const res = await request(app)
        .get(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.assetCode).toBe('SIGN-TEST-001');
      expect(res.body.managedAreaId).toBeDefined();
      expect(res.body.dimensions.height).toBe(2.5);
    });
  });

  describe('SP1-08: Maintenance and Incidents', () => {
    let incidentId;

    test('User should report an incident', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/maintenance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recordType: 'incident',
          title: 'Bien bao bi do',
          description: 'Bien bao bi nghieng do gio bao',
          severity: 'high',
          status: 'open'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      incidentId = res.body.id;
    });

    test('Admin should resolve the incident', async () => {
      const res = await request(app)
        .patch(`/api/maintenance/${incidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          description: 'Da dung lai bien bao chac chan',
          resolvedAt: new Date()
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('successfully');
    });
  });
});
