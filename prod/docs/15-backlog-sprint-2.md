# Backlog sprint 2

Sprint 2 tap trung vao viec hoan thien cac luong nghiep vu chinh cua MVP va xac nhan he thong co the demo duoc.

## Muc tieu sprint

- Hoan thien maintenance flow.
- Kiem tra dashboard bang du lieu that.
- Chot bo du lieu demo va script seed.
- Test luong nghiep vu xuyen suot.

## Definition of Done cho sprint

- Co the demo luong map -> asset -> maintenance -> dashboard.
- Dashboard doc dung du lieu demo.
- Bo seed tao du du lieu de demo.
- Khong con loi nghiem trong trong luong MVP.

## Backlog uu tien P1

### SP2-01: Hoan thien asset detail va maintenance history

- Muc tieu: Xem duoc lich su maintenance theo tung asset tren UI.
- Anh huong du kien:
  - `frontend/src/components/assets/AssetDetail.jsx`
  - `frontend/src/components/maintenance/MaintenanceHistory.jsx`
  - backend maintenance endpoints neu can
- Cach test:
  - Chon 1 asset va xem duoc lich su ban ghi.

### SP2-02: Hoan thien maintenance form va update status

- Muc tieu: Tao/sua ban ghi maintenance hoan chinh hon.
- Cach test:
  - Tao incident.
  - Tao maintenance.
  - Cap nhat status ban ghi.

### SP2-03: Ra soat logic dashboard

- Muc tieu: Dam bao so lieu dashboard khop du lieu trong DB.
- Anh huong du kien:
  - `backend/src/services/report.service.js`
  - `frontend/src/pages/DashboardPage.jsx`
- Cach test:
  - So sanh tay voi du lieu seed.
  - Kiem tra `summary`, `priority`, `incidents by area`.

### SP2-04: Chuan hoa seed du lieu demo

- Muc tieu: Tao bo seed on dinh phuc vu demo va test.
- Anh huong du kien:
  - `backend/src/seed.js`
  - du lieu `Area`, `Asset`, `MaintenanceRecord`, `User`
- Cach test:
  - Chay seed thanh cong.
  - He thong len dung du lieu demo.

## Backlog uu tien P2

### SP2-05: Toi uu map loading theo viewport

- Muc tieu: Tan dung filter `bbox` neu can de giam tai du lieu.
- Cach test:
  - Map van dung.
  - Khong nap du lieu thua khi pham vi lon.

### SP2-06: Chuan hoa filter tim kiem tren map

- Muc tieu: Dam bao tim kiem va loc khop API.
- Cach test:
  - Loc theo `assetType`, `status`, `search`.
  - Ket qua map va sidebar nhat quan.

### SP2-07: Bo sung test dashboard va maintenance

- Muc tieu: Them test cho reports va maintenance flow.
- Cach test:
  - Summary tra ve dung shape.
  - Priority list tra ve dung.
  - Maintenance co duoc luu va lay ra.

## Thu tu thuc hien de xuat

1. SP2-04
2. SP2-01
3. SP2-02
4. SP2-03
5. SP2-06
6. SP2-07
7. SP2-05
