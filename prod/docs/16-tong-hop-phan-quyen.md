# Tổng hợp Phân quyền Hệ thống (Role-based Access Control)

Tài liệu này tổng hợp cấu trúc phân quyền mới nhất của hệ thống QLDA, được áp dụng trên cả API (Backend) và Giao diện (Frontend). Hệ thống hiện tại vận hành qua 3 vai trò (role) chuyên biệt.

## 1. Công dân (`user`)
Vai trò đại diện cho người dân trong khu vực, tham gia giám sát và báo cáo chất lượng hạ tầng.

**Quyền hạn & Giới hạn:**
- **Bản đồ:** Được xem bản đồ nền và hệ thống tài sản công.
- **Tài sản:** 
  - Xem chi tiết từng tài sản (loại, vật liệu, kích thước...).
  - **KHÔNG THỂ** tạo mới, chỉnh sửa hoặc xóa bất kỳ tài sản nào (chặn cả ở UI và API).
- **Sự cố & Bảo trì:**
  - Có quyền báo cáo `incident` (sự cố) trên một tài sản (nhập tiêu đề, mô tả, mức độ lỗi).
  - Có quyền xem toàn bộ lịch sử sự cố và bảo trì của bất kỳ tài sản nào (đảm bảo tính minh bạch).
  - Hệ thống tự động ép kiểu bản ghi thành sự cố, ẩn các mục thuộc chuyên môn kỹ thuật (người thực hiện, chi phí). Không thể chuyển trạng thái xử lý sự cố.
- **Quản trị:** **KHÔNG THỂ** vào Dashboard thống kê, **KHÔNG THỂ** quản lý người dùng.

## 2. Nhân viên Kỹ thuật (`technician`)
Vai trò đại diện cho đơn vị xử lý sự cố thực địa hoặc công ty bảo trì hạ tầng.

**Quyền hạn & Giới hạn:**
- **Tài sản:** 
  - Giống với User, kỹ thuật viên **KHÔNG THỂ** tự do tạo/sửa/xóa tài sản nền tảng.
- **Sự cố & Bảo trì:**
  - Tiếp nhận sự cố từ người dân, có quyền cập nhật trạng thái bảo trì hoặc trạng thái giải quyết (`status`).
  - Có quyền tạo mới lịch sử `maintenance` (bảo trì định kỳ).
  - Được nhập đầy đủ thông tin chuyên môn (Người thực hiện, Chi phí thực tế/ước tính).
- **Quản trị:** **KHÔNG THỂ** vào Dashboard thống kê tổng quan.

## 3. Quản trị viên (`admin`)
Vai trò đại diện cho cơ quan quản lý nhà nước hoặc bộ phận tổ chức điều phối quy hoạch.

**Quyền hạn & Giới hạn:**
- **Toàn quyền hệ thống:** Truy cập mọi màn hình, mọi thao tác.
- **Tài sản:** Có quyền duy nhất tạo mới (`POST /api/assets`), chỉnh sửa (`PATCH /api/assets`) và gỡ bỏ, xóa tài sản (`DELETE /api/assets`).
- **Quản trị User:** Xem, đổi quyền, khóa các tài khoản.
- **Dashboard:** Truy cập màn hình biểu đồ tổng quan, số lượng sự cố cần ưu tiên xử lý trong toàn thành phố.

---

## Danh sách Tệp tin cốt lõi đã Sửa đổi

### Backend (Routing & Services)
1. `src/routes/asset.routes.js`: Thu hồi quyền POST/PATCH/DELETE khỏi `technician`.
2. `src/routes/report.routes.js`: Bảo mật nhóm API dashboard bằng `rbac('admin')`.
3. `src/routes/auth.routes.js`: Bảo mật API User list.
4. `src/services/maintenance.service.js`: Chặn `user` tạo `maintenance`, tự ép đổi thành `incident`.

### Frontend (UI & Authentication)
1. `src/components/layout/MainLayout.jsx`: Xóa menu *Dashboard* khỏi sidebar của user/technician.
2. `src/App.jsx`: Chặn cứng truy cập đường dẫn `/dashboard` trên React Router nếu không phải admin.
3. `src/components/assets/AssetSidebar.jsx`: Ẩn nút *+ Thêm mới*.
4. `src/components/assets/AssetDetail.jsx`: Thu hồi nút *Sửa* và *Xóa* nếu không là admin.
5. `src/components/maintenance/MaintenanceForm.jsx`: Trình chiều UI có điều kiện, khóa input chi phí, chuyên môn nếu là người dân.

### Documentation (Tài liệu chuẩn)
1. `prod/docs/03-yeu-cau-chuc-nang.md`
2. `prod/docs/11-api-contract-draft.md`
