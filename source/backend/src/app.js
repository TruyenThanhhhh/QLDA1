const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const assetRoutes = require('./routes/asset.routes');
const areaRoutes = require('./routes/area.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const reportRoutes = require('./routes/report.routes');
const importRoutes = require('./routes/import.routes');
const userRoutes = require('./routes/user.routes'); // ĐÃ THÊM: Import user.routes

const app = express();

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

// 1. Cho phép tất cả các domain gọi API (Bao gồm Frontend ở port 5173)
app.use(cors());

// 2. Cấu hình bảo mật Helmet nới lỏng để cho phép tải ảnh chéo nguồn (Cross-Origin)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Mở quyền truy cập public cho thư mục uploads
const staticOptions = {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
};

// Quét thư mục uploads gốc
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), staticOptions));
// ĐÃ SỬA LỖI: Quét thêm thư mục con 'photos' (Nơi upload.js đang lưu file)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads', 'photos'), staticOptions));

// ==========================================
// ROUTES DEFINITION
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/users', userRoutes); // ĐÃ THÊM: Đăng ký route /api/users

// ==========================================
// HEALTH CHECK & ERROR HANDLING
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (Phải luôn nằm cuối cùng)
app.use(errorHandler);

module.exports = app;