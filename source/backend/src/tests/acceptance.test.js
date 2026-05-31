require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Asset = require('../models/Asset');
const MaintenanceRecord = require('../models/MaintenanceRecord');

describe('Maintenance Acceptance (Nghiem Thu) Integration Tests', () => {
  let leaderToken;
  let techToken;
  let testAsset;
  let testRecord;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qlda_test');
    }

    await User.deleteMany({});
    await Asset.deleteMany({});
    await MaintenanceRecord.deleteMany({});

    // 1. Create Leader
    const leader = new User({
      username: 'leader_accept_test',
      passwordHash: 'leader123',
      fullName: 'Leader Accept Test',
      role: 'leader'
    });
    await leader.save();

    // 2. Create Technician
    const technician = new User({
      username: 'tech_accept_test',
      passwordHash: 'tech123',
      fullName: 'Tech Accept Test',
      role: 'technician'
    });
    await technician.save();

    // Login Leader
    const leaderLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'leader_accept_test', password: 'leader123' });
    leaderToken = leaderLogin.body.token;

    // Login Technician
    const techLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'tech_accept_test', password: 'tech123' });
    techToken = techLogin.body.token;

    // 3. Create damaged Asset
    const asset = new Asset({
      assetCode: 'ASSET-MNT-999',
      name: 'Hong Cau Rong',
      assetType: 'road',
      geometryType: 'Point',
      geometry: { type: 'Point', coordinates: [108.22, 16.05] },
      status: 'damaged',
      approvalStatus: 'approved'
    });
    testAsset = await asset.save();

    // 4. Create maintenance record
    const record = new MaintenanceRecord({
      assetId: testAsset._id,
      recordType: 'incident',
      title: 'Fix Cau Rong pothole',
      description: 'Big pothole on bridge',
      severity: 'high',
      status: 'open',
      reportedBy: leader._id,
      performedBy: technician._id
    });
    testRecord = await record.save();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Technician should submit task for approval', async () => {
    // Technician calls PATCH /api/maintenance/:id to set status to pending_approval
    const res = await request(app)
      .patch(`/api/maintenance/${testRecord._id}`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        status: 'pending_approval',
        notes: 'Da va xon xong mat cau. Yeu cau nghiem thu.'
      });

    expect(res.status).toBe(200);
    
    // Check in database
    const dbRecord = await MaintenanceRecord.findById(testRecord._id);
    expect(dbRecord.status).toBe('pending_approval');
    expect(dbRecord.notes).toBe('Da va xon xong mat cau. Yeu cau nghiem thu.');
  });

  test('Non-leader should NOT be allowed to accept/reject maintenance task', async () => {
    const res = await request(app)
      .patch(`/api/maintenance/${testRecord._id}/acceptance`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        approvalStatus: 'approved',
        notes: 'Khong the tu duyet'
      });

    expect(res.status).toBe(403);
  });

  test('Leader should reject maintenance task and send back to in_progress', async () => {
    const res = await request(app)
      .patch(`/api/maintenance/${testRecord._id}/acceptance`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        approvalStatus: 'rejected',
        notes: 'Sua chua chua ghim gach deu'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');

    const dbRecord = await MaintenanceRecord.findById(testRecord._id);
    expect(dbRecord.status).toBe('in_progress');
    expect(dbRecord.notes).toContain('chua ghim gach deu');
  });

  test('Leader should accept maintenance task and auto-restore asset status to good', async () => {
    // Set status to pending_approval again
    await MaintenanceRecord.findByIdAndUpdate(testRecord._id, { status: 'pending_approval' });

    const res = await request(app)
      .patch(`/api/maintenance/${testRecord._id}/acceptance`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        approvalStatus: 'approved',
        notes: 'Nghiem thu tot, son rat min'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');

    // Assert MaintenanceRecord resolved
    const dbRecord = await MaintenanceRecord.findById(testRecord._id);
    expect(dbRecord.status).toBe('resolved');
    expect(dbRecord.resolvedAt).toBeDefined();

    // Assert Asset status automatically restored to 'good' and ready to display on map!
    const dbAsset = await Asset.findById(testAsset._id);
    expect(dbAsset.status).toBe('good');
    expect(dbAsset.needsMaintenance).toBe(false);
    expect(dbAsset.riskScore).toBe(0);
  });
});
