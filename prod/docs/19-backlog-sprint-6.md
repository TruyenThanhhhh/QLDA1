# Backlog Sprint 6: AI Nâng cao & Phân tích Dữ liệu

**Mục tiêu Sprint:** Triển khai các hệ thống AI nâng cao như Chatbot, Dự đoán bảo trì, đồng thời nâng cấp kiến trúc lõi của bản đồ để xử lý dữ liệu lớn.

## Danh sách User Stories

### 1. Trợ lý Ảo (Chatbot) Hỗ trợ Người dân
- **As a** user,
- **I want** có một chatbot trò chuyện bằng ngôn ngữ tự nhiên trên web,
- **So that** tôi có thể dễ dàng hỏi cách sử dụng hệ thống hoặc tra cứu tình trạng sự cố mà tôi đã báo cáo mà không cần tìm kiếm thủ công.
- **Tasks:**
  - [ ] Tích hợp OpenAI API (ChatGPT) hoặc mô hình LLM tương tự vào backend.
  - [ ] Xây dựng luồng RAG (Retrieval-Augmented Generation) cơ bản: Indexing dữ liệu hướng dẫn sử dụng và dữ liệu báo cáo công khai vào Vector DB (như Pinecone hoặc sử dụng pgvector nếu dùng PostgreSQL).
  - [ ] Tạo API endpoint cho phép chat, nhận diện ý định (Intent Recognition) từ tin nhắn của người dùng để quyết định nên trả lời kiến thức chung hay query Database.
  - [ ] Thiết kế UI widget Chatbot dạng bong bóng ở góc phải màn hình frontend.

### 2. Mô hình Dự đoán Bảo trì (Predictive Maintenance)
- **As an** admin,
- **I want** hệ thống có khả năng dự đoán những tài sản nào sắp cần được bảo trì,
- **So that** tôi có thể lên kế hoạch sửa chữa chủ động trước khi tài sản đó thực sự hỏng.
- **Tasks:**
  - [ ] Export dữ liệu lịch sử bảo trì hiện có thành định dạng phù hợp cho phân tích.
  - [ ] Xây dựng script Python (hoặc sử dụng dịch vụ Cloud ML) để train một mô hình đơn giản (VD: Random Forest hoặc Logistic Regression) sử dụng các thông số như `yearInstalled`, `lastMaintenanceDate`, `maintenanceCount`, `assetType`.
  - [ ] Thiết lập một cronjob chạy ngầm (ví dụ: mỗi đêm) để đánh giá toàn bộ tài sản và gán flag `needsMaintenance = true` (kèm theo điểm rủi ro `riskScore`) cho các tài sản cần thiết.
  - [ ] Thêm widget "Tài sản cần bảo trì dự đoán" lên Dashboard của Admin.

### 3. Nâng cấp Hiệu năng Bản đồ (Vector Tiles)
- **As an** admin/technician,
- **I want** bản đồ vẫn tải mượt mà ngay cả khi hiển thị hàng chục nghìn điểm tài sản,
- **So that** quá trình xem xét tổng quan khu vực không bị giật lag trên trình duyệt.
- **Tasks:**
  - [ ] Đánh giá và thay thế thư viện `Leaflet` hiện tại bằng `MapLibre GL JS`.
  - [ ] Cấu hình backend server để stream dữ liệu dưới dạng Vector Tiles (MVT) thay vì gửi một cục GeoJSON khổng lồ.
  - [ ] Chuyển đổi các logic styling, lọc (filter) trên frontend sang hệ thống expression của MapLibre.
  - [ ] Đảm bảo tính năng clustering vẫn hoạt động tối ưu trên nền tảng mới.
