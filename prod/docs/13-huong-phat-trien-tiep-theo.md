# Huong phat trien tiep theo

File nay tong hop huong phat trien tiep theo cho chuong trinh QLDA, dua tren trang thai code hien tai va muc tieu cua de tai.

## Danh gia nhanh hien trang

He thong hien da co nen tang kha tot:

- Co backend voi auth, assets, maintenance, reports.
- Co frontend voi login, map, asset form, dashboard.
- Backend test chay duoc.
- Frontend build duoc.

Tuy nhien, he thong chua duoc xem la hoan tat theo de tai vi van con lech nghiep vu, thieu test nghiep vu va chua dong cac khoang trong cua MVP.

## Muc tieu giai doan tiep theo

Muc tieu cua giai doan tiep theo la dua he thong tu trang thai "co khung chuc nang" len trang thai "MVP on dinh va dung de tai".

Can dat duoc:

- Dung nghiep vu cau noi giua nguoi dan va chinh quyen.
- Dung schema va API da chot trong tai lieu.
- Day du cac luong chinh cua MVP.
- Co test nghiep vu cho cac luong cot loi.
- Giam cac rui ro chat luong truoc khi mo rong them tinh nang.

## Cac khoang trong can xu ly

### 1. Chot lai nghiep vu auth va user

Van de hien tai:

- He thong can giu luong dang ky cong khai cho nguoi dan.
- Can doi chinh nghiep vu role thanh `user`, `technician`, `admin`.

Huong xu ly:

- Giu `register` cho nguoi dan.
- `user` la nguoi dan bao cao hu hong.
- `technician` la nguoi di xu ly va cap nhat ket qua.
- `admin` quan ly toan bo he thong.
- Dong bo backend + frontend + docs theo mo hinh nay.

## 2. Dong bo schema voi tai lieu

Van de hien tai:

- Mot so truong du lieu chua khop hoan toan voi schema draft.
- `performedBy` trong maintenance chua nhat quan.
- Gia tri enum o mot vai model chua dong bo.

Huong xu ly:

- Ra soat `User`, `Asset`, `MaintenanceRecord`, `Area`.
- Dong bo enum, field name, relation va kieu du lieu.
- Neu can thay doi, cap nhat lai `10-data-schema-draft.md`.

## 3. Kiem tra va chot API contract that su dung

Van de hien tai:

- API hien co kha day du nhung chua chac khop hoan toan voi ban draft.
- Response shape can duoc chot de frontend va backend khong lech nhau.

Huong xu ly:

- Doi chieu tung endpoint hien co voi `11-api-contract-draft.md`.
- Chot format response chung.
- Chot ma loi, validation va field bat buoc.

## 4. Bo sung test nghiep vu cot loi

Van de hien tai:

- Test hien tai moi dung o muc health check va unauthorized access.
- Chua co test cho luong nghiep vu that.

Huong xu ly:

- Them test cho register va login hop le.
- Them test cho tao tai san.
- Them test cho cap nhat tai san.
- Them test cho tao maintenance record.
- Them test cho dashboard summary.

## 5. Chinh sua chat luong UI va text hien thi

Van de hien tai:

- Co dau hieu loi encoding tieng Viet tren giao dien va message backend.
- Dieu nay lam giam chat luong san pham va trai nghiem demo.

Huong xu ly:

- Chuan hoa encoding UTF-8 cho source file.
- Ra soat lai text frontend/backend.
- Sua cac chuoi hien thi bi vo encoding.

## 6. Chot du lieu demo va kich ban demo

Van de hien tai:

- De tai can du lieu demo de the hien ban do, tai san, su co, bao tri.
- Chua co xac nhan ro bo du lieu demo da phu hop cho demo chua.

Huong xu ly:

- Tao bo du lieu demo on dinh.
- Dam bao co du `Point`, `Line`, nhieu status va maintenance records.
- Chot kich ban demo: register/login -> gui bao cao -> technician xu ly -> xem dashboard.

## Thu tu uu tien thuc hien

### P1 - Bat buoc lam truoc

1. Chot auth cong khai cho `user` va role.
2. Dong bo schema va API.
3. Sua cac loi encoding.
4. Bo sung test backend cho luong chinh.

### P2 - Nen lam ngay sau do

1. Hoan thien maintenance flow.
2. Hoan thien dashboard theo du lieu that.
3. Toi uu map loading neu can.
4. Chuan hoa du lieu demo va seed script.

### P3 - Lam sau khi MVP on dinh

1. Import GeoJSON/OSM nang cao.
2. Upload anh hien truong.
3. Bao cao nang cao.
4. Toi uu hieu nang cho tap du lieu lon.

## Ke hoach de xuat cho sprint tiep theo

### Sprint 1: Chuan hoa nen tang MVP

- Giu dang ky cong khai cho `user`.
- Chot role va phan quyen theo mo hinh moi.
- Dong bo schema.
- Dong bo API.
- Sua text/encoding.
- Them test cho auth va assets.

### Sprint 2: Hoan thien luong nghiep vu

- Hoan thien maintenance module.
- Kiem tra dashboard summary.
- Chot seed demo.
- Test luong register/login -> report -> maintenance -> dashboard.

### Sprint 3: On dinh va demo

- Fix bug.
- Tinh chinh UI.
- Viet tai lieu huong dan demo.
- Chot checklist Definition of Done cho MVP.

## Dau ra mong muon sau giai doan tiep theo

Sau khi hoan thanh giai doan nay, he thong nen dat:

- Khong con lech lon voi de tai.
- MVP co the demo mot cach on dinh.
- Tai lieu, schema, API va code khop nhau.
- Co bo test toi thieu cho luong nghiep vu chinh.

## De xuat buoc tiep theo ngay bay gio

Buoc hop ly nhat de bat dau la:

1. Giu va chot luong dang ky cong khai cho `user`.
2. Chot role va schema user.
3. Viet bo test backend cho `auth`, `assets`, `maintenance`.

Day la 3 viec co tac dong lon nhat den do dung nghiep vu va chat luong MVP.
