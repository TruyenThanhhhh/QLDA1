# Backlog Sprint 5: Trí tuệ Nhân tạo - Xử lý Báo cáo

**Mục tiêu Sprint:** Tích hợp các tính năng Trí tuệ Nhân tạo đầu tiên vào hệ thống để hỗ trợ tự động hóa việc phân loại báo cáo sự cố và tối ưu hóa lộ trình làm việc.

## Danh sách User Stories

### 1. Phân loại sự cố tự động bằng Computer Vision AI
- **As an** admin,
- **I want** hệ thống tự động phân tích hình ảnh đính kèm trong báo cáo để đề xuất loại sự cố và mức độ nghiêm trọng,
- **So that** tôi không phải mở từng hình ảnh ra xem và có thể ưu tiên xử lý các sự cố khẩn cấp nhanh hơn.
- **Tasks:**
  - [ ] Đăng ký Google Cloud Vision API (hoặc dịch vụ tương đương) và lấy credentials.
  - [ ] Viết module `AIService` trên backend để gọi API phân tích hình ảnh ngay sau khi ảnh được upload lên Cloud (từ Sprint 4).
  - [ ] Xây dựng thuật toán mapping từ tags của AI trả về sang `damageType` và `severity` của hệ thống.
  - [ ] Cập nhật database: Thêm các field `aiSuggestedType`, `aiSuggestedSeverity`, `aiConfidenceScore` vào schema báo cáo sự cố.
  - [ ] Hiển thị nhãn đề xuất của AI trên giao diện duyệt báo cáo của Admin.

### 2. Tối ưu hóa lộ trình di chuyển (AI Routing)
- **As a** technician,
- **I want** hệ thống gợi ý cho tôi một lộ trình di chuyển tối ưu nhất đi qua các điểm sự cố cần sửa chữa trong ngày,
- **So that** tôi tiết kiệm được thời gian di chuyển và tiền xăng.
- **Tasks:**
  - [ ] Tích hợp dịch vụ Mapbox Directions API hoặc OSRM (Open Source Routing Machine).
  - [ ] Viết thuật toán gom nhóm (Clustering) các sự cố gần nhau trên bản đồ.
  - [ ] Áp dụng bài toán Người chào hàng (TSP - Traveling Salesperson Problem) để sắp xếp thứ tự các điểm đến dựa trên API khoảng cách.
  - [ ] Xây dựng giao diện trên Frontend hiển thị lộ trình dạng đường line trên bản đồ (Polylines) với thứ tự các điểm dừng rõ ràng 1, 2, 3...
  - [ ] Thêm nút "Tạo lộ trình làm việc hôm nay" trên trang Dashboard của Technician.
