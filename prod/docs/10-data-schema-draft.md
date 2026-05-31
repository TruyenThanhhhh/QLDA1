# Data schema draft

File nay la ban nhap schema du lieu de frontend va backend co the bat dau thong nhat implementation.

## 1. User

### Muc dich

Quan ly tai khoan dang nhap va vai tro su dung he thong.

### Truong du lieu

- `_id`: ObjectId
- `username`: string, unique, required
- `passwordHash`: string, required
- `fullName`: string, required
- `role`: enum `admin | technician | user`
- `isActive`: boolean, default `true`
- `createdAt`: datetime
- `updatedAt`: datetime

## 2. Area

### Muc dich

Quan ly khu vuc hoac don vi hanh chinh de gan tai san.

### Truong du lieu

- `_id`: ObjectId
- `code`: string, unique
- `name`: string, required
- `geometry`: GeoJSON Polygon hoac MultiPolygon
- `createdAt`: datetime
- `updatedAt`: datetime

## 3. Asset

### Muc dich

Luu thong tin tai san ha tang duong bo.

### Truong du lieu

- `_id`: ObjectId
- `assetCode`: string, unique, required
- `name`: string, required
- `assetType`: enum `road | sign | traffic_light | manhole | lamp_post | sidewalk`
- `geometryType`: enum `Point | LineString | Polygon`
- `geometry`: GeoJSON object, required
- `status`: enum `good | fair | damaged`
- `material`: string
- `dimensions`: object
- `managedAreaId`: ObjectId, ref `Area`
- `source`: enum `manual | imported_osm | demo`
- `description`: string
- `lastInspectionAt`: datetime, nullable
- `photos`: array of photo objects
  - `filename`: string
  - `originalName`: string
  - `path`: string (URL tương đối)
  - `size`: number (bytes)
  - `uploadedAt`: datetime
- `capturedAt`: datetime, default hiện tại
- `captureMethod`: enum `manual | gps | imported_osm | demo`, default `manual`
- `approvalStatus`: enum `pending | approved | rejected`, default `approved`
- `isDeleted`: boolean, default `false`
- `createdBy`: ObjectId, ref `User`
- `updatedBy`: ObjectId, ref `User`
- `createdAt`: datetime
- `updatedAt`: datetime

### Goi y dimensions

- `length`: number, dung cho duong
- `width`: number
- `height`: number
- `unit`: string, vi du `m`

## 4. MaintenanceRecord

### Muc dich

Luu thong tin su co va bao tri gan voi mot tai san.

### Truong du lieu

- `_id`: ObjectId
- `assetId`: ObjectId, ref `Asset`, required
- `recordType`: enum `incident | maintenance`
- `title`: string, required
- `description`: string
- `severity`: enum `low | medium | high | critical`
- `status`: enum `open | in_progress | pending_approval | resolved | cancelled`
- `notes`: string (Ghi chú/Mô tả kết quả hoặc lý do phản hồi)
- `photos`: array of photo objects (Hình ảnh hiện trường sau khi sửa chữa)
  - `path`: string
  - `filename`: string
  - `uploadedAt`: datetime
- `reportedBy`: ObjectId, ref `User`
- `performedBy`: ObjectId, ref `User`, nullable, role `technician`
- `costEstimate`: number, nullable
- `costActual`: number, nullable
- `recordedAt`: datetime, required
- `resolvedAt`: datetime, nullable
- `createdAt`: datetime
- `updatedAt`: datetime

## 5. AuditLog

### Muc dich

Luu dau vet thay doi quan trong de phuc vu kiem tra va bao mat.

### Truong du lieu

- `_id`: ObjectId
- `action`: string
- `entityType`: string
- `entityId`: ObjectId hoac string
- `performedBy`: ObjectId, ref `User`
- `before`: object, nullable
- `after`: object, nullable
- `createdAt`: datetime

## Quan he giua cac bang

- Mot `Area` co nhieu `Asset`.
- Mot `Asset` co nhieu `MaintenanceRecord`.
- Mot `User` co the tao nhieu `Asset` va `MaintenanceRecord`.
- Cac thao tac quan trong tao them `AuditLog`.

## Rang buoc ky thuat de xuat

- Tao unique index cho `username`, `assetCode`, `area.code`.
- Tao geospatial index cho `Asset.geometry` va `Area.geometry`.
- Khong xoa cung du lieu MVP, uu tien `isDeleted`.
- Validate dung `geometryType` voi noi dung `geometry`.
- Trong luong `user` bao cao hien truong, `geometry` uu tien `Point` do user danh dau tren ban do.
