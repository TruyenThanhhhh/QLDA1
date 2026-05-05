# Backlog Sprint 4: Hiện đại hóa Trải nghiệm & Nền tảng

**Mục tiêu Sprint:** Nâng cấp hệ thống hiện tại bằng các công nghệ hiện đại bao gồm Progressive Web App (PWA), Cloud Storage cho media và tương tác thời gian thực (Real-time).

## Danh sách User Stories

### 1. Chuyển đổi Frontend thành Progressive Web App (PWA)
- **As a** technician hoặc user,
- **I want** cài đặt ứng dụng web lên màn hình chính điện thoại và có thể mở ứng dụng khi không có mạng (Offline Mode),
- **So that** tôi có thể xem thông tin báo cáo hoặc tạo bản nháp ngay cả khi đang ở khu vực sóng yếu.
- **Tasks:**
  - [ ] Cài đặt và cấu hình plugin `vite-plugin-pwa`.
  - [ ] Thêm file `manifest.json` với đầy đủ icon và theme color.
  - [ ] Cấu hình Service Worker để cache các assets (JS, CSS, hình ảnh tĩnh).
  - [ ] Cấu hình IndexedDB hoặc localStorage để lưu nháp (draft) các form báo cáo sự cố khi mất kết nối mạng.
  - [ ] Xây dựng cơ chế Auto-sync: tự động gửi các báo cáo lưu nháp lên server khi có mạng trở lại.

### 2. Tích hợp Cloud Storage cho Hình ảnh Hiện trường
- **As an** admin,
- **I want** hình ảnh báo cáo sự cố được tự động nén và lưu trữ trên hệ thống Cloud (Cloudinary/AWS S3),
- **So that** server backend không bị quá tải dung lượng và ảnh được tải nhanh hơn trên trình duyệt.
- **Tasks:**
  - [ ] Đăng ký dịch vụ Cloudinary/S3 và thiết lập API keys vào `.env`.
  - [ ] Viết util function trên backend (Node.js) để nhận file upload từ client và đẩy lên Cloud.
  - [ ] Áp dụng tự động nén (compress) và thay đổi kích thước (resize) ảnh trước khi upload.
  - [ ] Cập nhật database lưu đường dẫn URL của Cloud thay vì file path local.

### 3. Tương tác Thời gian thực (Real-time Notifications)
- **As an** admin và technician,
- **I want** nhận được thông báo ngay lập tức khi có một báo cáo sự cố mới được tạo,
- **So that** tôi có thể xử lý sự cố kịp thời mà không cần f5 (tải lại) trang web.
- **Tasks:**
  - [ ] Tích hợp thư viện `socket.io` vào backend Node.js.
  - [ ] Tích hợp thư viện `socket.io-client` vào frontend React.
  - [ ] Bắt sự kiện tạo báo cáo mới (trong controller) và emit event `new_report`.
  - [ ] Frontend lắng nghe event `new_report` và hiển thị toast notification hoặc cập nhật số lượng trên notification bell.
  - [ ] (Tùy chọn) Gửi thông báo cập nhật trạng thái ngược lại cho `user`.
