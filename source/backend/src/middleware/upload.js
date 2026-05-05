const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Use Cloudinary
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'qlda_assets',
      allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Nén tự động
      categorization: 'google_tagging',
      auto_tagging: 0.6, // Chỉ lấy tag có độ chính xác > 60%
    },
  });
  console.log('Upload middleware is configured to use Cloudinary.');
} else {
  // Fallback to local disk storage
  const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'photos');

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
  console.log('Upload middleware is configured to use Local Disk Storage.');
}

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận ảnh định dạng JPEG, PNG hoặc WebP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
});

module.exports = upload;
