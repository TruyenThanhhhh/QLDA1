# Du lieu va kien truc de xuat

File nay tong hop mo hinh du lieu va kien truc ky thuat de dua tai lieu goc den gan hon giai doan implementation.

## Kien truc tong the

- Frontend: React + Tailwind CSS + Leaflet.
- Backend API: Node.js + Express.
- Database: MongoDB.
- Ban do nen: OpenStreetMap.
- Dong bo du lieu khong gian: Overpass API theo lo trinh batch hoac import ban dau.

## Thanh phan backend de xuat

- `auth-service`: xac thuc nguoi dung va phan quyen.
- `asset-service`: quan ly tai san ha tang.
- `maintenance-service`: quan ly su co va bao tri.
- `map-service`: xu ly import/export GeoJSON va truy van theo khu vuc.
- `report-service`: tong hop thong ke.

## Mo hinh du lieu muc cao

### 1. Asset

- `_id`
- `assetCode`
- `name`
- `assetType`
- `geometryType`
- `geometry`
- `material`
- `dimensions`
- `status`
- `managedArea`
- `source`
- `lastInspectionAt`
- `createdAt`
- `updatedAt`

Goi y:

- `geometry` nen luu theo chuan GeoJSON.
- `status` nen duoc chuan hoa thanh tap gia tri co dinh: `good`, `fair`, `damaged`.

### 2. MaintenanceRecord

- `_id`
- `assetId`
- `recordType`
- `description`
- `severity`
- `reportedBy`
- `performedBy`
- `costEstimate`
- `costActual`
- `recordedAt`
- `resolvedAt`
- `status`

### 3. User

- `_id`
- `username`
- `fullName`
- `role`
- `passwordHash`
- `isActive`

### 4. Area

- `_id`
- `code`
- `name`
- `geometry`

## API de xuat cho MVP

- `POST /api/auth/login`
- `GET /api/assets`
- `GET /api/assets/:id`
- `POST /api/assets`
- `PATCH /api/assets/:id`
- `GET /api/assets/:id/maintenance`
- `POST /api/assets/:id/maintenance`
- `GET /api/reports/summary`
- `POST /api/import/geojson`

## Nguyen tac ky thuat can uu tien

- Dung spatial index cho truong geometry neu su dung MongoDB co geospatial query.
- Tach import OSM/Overpass thanh job rieng, khong de frontend goi truc tiep lien tuc.
- Chi tra ve du lieu trong khung nhin ban do hoac theo bo loc.
- Ghi log loi API ngoai va cac thay doi quan trong.

## Giai phap giam rui ro tu tai lieu goc

- Hieu nang: phan trang du lieu, clustering marker, tai theo viewport.
- Gioi han API ngoai: cache ket qua Overpass, dong bo theo lich thay vi goi truc tiep qua nhieu.
- Sai lech toa do: validate GeoJSON va kiem tra CRS/format dau vao.
- Bao mat: RBAC, audit log, xoa mem, sao luu dinh ky.
