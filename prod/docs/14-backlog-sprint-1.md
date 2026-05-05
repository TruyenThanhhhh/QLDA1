# Backlog sprint 1

Sprint 1 tap trung vao viec chuan hoa nen tang MVP de dua he thong ve dung nghiep vu va san sang cho cac sprint sau.

## Muc tieu sprint

- Bo cac lech nghiep vu lon.
- Dong bo schema, API va role.
- Sua cac van de text/encoding.
- Tao bo test backend toi thieu cho luong chinh.

## Definition of Done cho sprint

- Luong dang ky cong khai cho `user` hoat dong dung nghiep vu.
- Role backend va frontend dong bo voi tai lieu.
- Test backend cho auth, assets, maintenance chay xanh.
- Cac text hien thi chinh khong con loi encoding ro rang.

## Backlog uu tien P1

### SP1-01: Chot luong dang ky cong khai cho user

- Muc tieu: Giu va chuan hoa `register` cho `user` la nguoi dan bao cao hu hong.
- Dau vao: [09-mvp-chot.md](D:\QLDA\prod\docs\09-mvp-chot.md), [13-huong-phat-trien-tiep-theo.md](D:\QLDA\prod\docs\13-huong-phat-trien-tiep-theo.md)
- Anh huong du kien:
  - `backend/src/routes/auth.routes.js`
  - `backend/src/controllers/auth.controller.js`
  - `frontend/src/App.jsx`
  - `frontend/src/pages/RegisterPage.jsx`
- Cach test:
  - `user` dang ky thanh cong tren UI.
  - API dang ky cong khai hoat dong dung.
  - Tai khoan dang ky moi co role `user`.

### SP1-02: Chot role chinh thuc

- Muc tieu: Dong bo role thanh `admin`, `technician`, `user`.
- Anh huong du kien:
  - `backend/src/models/User.js`
  - `backend/src/services/auth.service.js`
  - `frontend/src/contexts/AuthContext.jsx`
  - docs lien quan
- Cach test:
  - Dang nhap va phan quyen dung theo role.
  - Khong con role `manager` neu khong can.

### SP1-03: Dong bo schema `MaintenanceRecord`

- Muc tieu: Ra soat va chot lai `performedBy`, `status`, relation va field bat buoc.
- Anh huong du kien:
  - `backend/src/models/MaintenanceRecord.js`
  - `backend/src/services/maintenance.service.js`
  - `frontend/src/components/maintenance/MaintenanceForm.jsx`
  - [10-data-schema-draft.md](D:\QLDA\prod\docs\10-data-schema-draft.md)
- Cach test:
  - Tao ban ghi maintenance thanh cong.
  - Data luu dung kieu va dung enum.

### SP1-04: Dong bo API contract voi code that

- Muc tieu: Ra soat response shape va field input/output cua auth, assets, maintenance.
- Anh huong du kien:
  - backend controllers/services/routes
  - frontend api usage
  - [11-api-contract-draft.md](D:\QLDA\prod\docs\11-api-contract-draft.md)
- Cach test:
  - Frontend goi API khong bi lech field.
  - Tai lieu API phan anh dung code.

### SP1-05: Sua loi encoding tieng Viet

- Muc tieu: Chuan hoa cac chuoi tieng Viet dang bi vo encoding.
- Anh huong du kien:
  - `backend/src/controllers/*.js`
  - `backend/src/services/*.js`
  - `frontend/src/**/*.jsx`
- Cach test:
  - Kiem tra man hinh login, dashboard, map detail.
  - Kiem tra message loi backend/frontend.

## Backlog test

### SP1-06: Test register va login hop le

- Muc tieu: Them test cho luong register/login.
- Anh huong du kien:
  - `backend/src/tests/api.test.js`
  - co the tach them test file rieng
- Cach test:
  - Register dung tra ve token va role `user`.
  - Login dung tra ve token.
  - Login sai tra ve `401`.

### SP1-07: Test CRUD asset co ban

- Muc tieu: Co test cho tao, sua, lay chi tiet asset.
- Cach test:
  - Tao asset hop le thanh cong.
  - Geometry sai bi chan.
  - Sua asset cap nhat dung du lieu.

### SP1-08: Test tao maintenance record

- Muc tieu: Co test cho maintenance/incident.
- Cach test:
  - `user` tao incident thanh cong.
  - `technician` cap nhat maintenance thanh cong.
  - Incident high/critical cap nhat asset status neu day la rule chinh thuc.

## Backlog tai lieu

### SP1-09: Cap nhat tai lieu sau khi chot auth/schema/API

- Muc tieu: Bao dam docs va code khop nhau.
- File lien quan:
  - [09-mvp-chot.md](D:\QLDA\prod\docs\09-mvp-chot.md)
  - [10-data-schema-draft.md](D:\QLDA\prod\docs\10-data-schema-draft.md)
  - [11-api-contract-draft.md](D:\QLDA\prod\docs\11-api-contract-draft.md)

## Thu tu thuc hien de xuat

1. SP1-01
2. SP1-02
3. SP1-03
4. SP1-04
5. SP1-05
6. SP1-06
7. SP1-07
8. SP1-08
9. SP1-09
