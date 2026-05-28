# API contract draft

File nay la ban nhap hop dong API cho MVP. Muc tieu la de frontend va backend co cung mot ky vong ve input va output.

## Nguyen tac chung

- Prefix API: `/api`
- Dinh dang du lieu: JSON
- Xac thuc: Bearer token
- Thoi gian: ISO 8601
- Khong tra ve du lieu da `isDeleted = true` trong danh sach mac dinh

## 1. Auth

### `POST /api/auth/login`

### Request

```json
{
  "username": "admin01",
  "password": "secret"
}
```

### Response 200

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user_id",
    "username": "admin01",
    "fullName": "Admin User",
    "role": "admin"
  }
}
```

### `POST /api/auth/register`

### Request

```json
{
  "username": "citizen01",
  "password": "secret",
  "fullName": "Nguyen Van A"
}
```

### Response 201

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user_id",
    "username": "citizen01",
    "fullName": "Nguyen Van A",
    "role": "user"
  }
}
```

## 2. Assets

### `GET /api/assets`

### Query params

- `keyword`
- `assetType`
- `status`
- `managedAreaId`
- `geometryType`
- `page`
- `limit`

### Response 200

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

### `GET /api/assets/:id`

### Response 200

```json
{
  "id": "asset_id",
  "assetCode": "ROAD-001",
  "name": "Tuyen duong A",
  "assetType": "road",
  "geometryType": "LineString",
  "geometry": {},
  "status": "fair",
  "material": "asphalt",
  "dimensions": {
    "length": 1200,
    "unit": "m"
  },
  "managedAreaId": "area_id",
  "description": "Du lieu demo"
}
```

### `POST /api/assets`

### Request

*(Role: `admin`, `technician`, `user`)*

```json
{
  "assetCode": "SIGN-001",
  "name": "Bien bao 1",
  "assetType": "sign",
  "geometryType": "Point",
  "geometry": {
    "type": "Point",
    "coordinates": [106.7, 10.77]
  },
  "status": "good",
  "material": "steel",
  "dimensions": {
    "height": 2.4,
    "unit": "m"
  },
  "managedAreaId": "area_id",
  "description": "Bien bao moi",
  "captureMethod": "manual"
}
```

### Response 201

```json
{
  "id": "asset_id",
  "message": "Asset created successfully"
}
```

Ghi chu:
- `user` tao → `approvalStatus: "pending"`
- `admin` / `technician` tao → `approvalStatus: "approved"`

- Luong `user` bao cao hien truong uu tien gui `geometry.type = "Point"` do user tu danh dau tren ban do.

### `POST /api/assets/:id/photos`

Upload anh hien truong cho tai san.

### Request

*(Role: `admin`, `technician`, `user`)*

`Content-Type: multipart/form-data`

- `photos`: 1-5 files (image/jpeg, image/png, image/webp, max 10MB/file)

### Response 201

```json
{
  "id": "asset_id",
  "uploadedCount": 2,
  "photos": [
    {
      "filename": "1712345678901-123456.jpg",
      "originalName": "hien-truong.jpg",
      "path": "/uploads/photos/1712345678901-123456.jpg",
      "size": 204800,
      "uploadedAt": "2026-04-07T10:00:00.000Z"
    }
  ]
}
```

### `PATCH /api/assets/:id/approval`

Duyet hoac tu choi tai san cho duyet.

### Request

*(Role: `admin`, `technician`)*

```json
{
  "approvalStatus": "approved"
}
```

### Response 200

```json
{
  "id": "asset_id",
  "approvalStatus": "approved",
  "message": "Da duyet tai san"
}
```

### `PATCH /api/assets/:id`

### Request

*(Role: `admin`)*

Cho phep cap nhat mot phan cac truong hop le cua `Asset`.

### Response 200

```json
{
  "id": "asset_id",
  "message": "Asset updated successfully"
}
```

### `DELETE /api/assets/:id`

### Response 200

```json
{
  "id": "asset_id",
  "message": "Asset deleted successfully"
}
```

### `POST /api/assets/:id/upvote`

Upvote hoặc bỏ upvote tài sản (dùng cho công dân báo cáo).

#### Response 200
```json
{
  "id": "asset_id",
  "upvotesCount": 1,
  "hasUpvoted": true
}
```

### `POST /api/assets/:id/comment`

Thêm bình luận cộng đồng vào tài sản.

#### Request
```json
{
  "text": "Đoạn đường này bị ngập nặng"
}
```

#### Response 201
```json
{
  "id": "asset_id",
  "comments": [
    {
      "userId": "user_id",
      "fullName": "Nguyen Van A",
      "text": "Đoạn đường này bị ngập nặng",
      "createdAt": "2026-04-06T08:00:00.000Z"
    }
  ]
}
```

## 3. Areas

### `GET /api/areas`

### Response 200

```json
{
  "items": [
    {
      "id": "area_id",
      "code": "HC",
      "name": "Quan Hai Chau",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[108.21, 16.03], [108.23, 16.03], [108.23, 16.07], [108.21, 16.07], [108.21, 16.03]]]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 5
  }
}
```

## 4. Maintenance records

### `GET /api/assets/:id/maintenance`

### Response 200

```json
{
  "items": []
}
```

### `POST /api/assets/:id/maintenance`

### Request

```json
{
  "recordType": "incident",
  "title": "O ga xuat hien",
  "description": "Mat duong hu hong cuc bo",
  "severity": "high",
  "status": "open",
  "recordedAt": "2026-04-06T08:00:00.000Z"
}
```

### Response 201

```json
{
  "id": "record_id",
  "message": "Record created successfully"
}
```

Ghi chu nghiep vu:

- `user` duoc tao `incident` de bao cao hu hong. He thong luon ep kieu la `incident` doi voi `user`.
- `technician` va `admin` duoc tu do tao ca `incident` va `maintenance` va cap nhat tien do xu ly.

### `PATCH /api/maintenance/:id`

### Request

*(Role: `admin`, `technician`)*

Cho phep cap nhat `status`, `description`, `performedBy`, `costEstimate`, `costActual`, `resolvedAt`.

### Response 200

```json
{
  "id": "record_id",
  "message": "Record updated successfully"
}
```

## 5. Reports

### `GET /api/reports/summary`

### Response 200

```json
{
  "assetsByType": [],
  "assetsByStatus": [],
  "openIncidents": 0,
  "priorityAssets": []
}
```

### `GET /api/reports/routing/custom`

Chỉ đường tùy chọn tránh khu vực ngập lụt/hư hỏng nặng.

#### Query params
- `start`: string (kinh độ,vĩ độ ví dụ `108.200,16.050`)
- `end`: string (kinh độ,vĩ độ ví dụ `108.202,16.052`)

#### Response 200
```json
{
  "polyline": {
    "type": "LineString",
    "coordinates": [[108.200, 16.050], [108.201, 16.051], [108.202, 16.052]]
  },
  "distance": 310.2,
  "duration": 45.5,
  "warnings": [
    {
      "id": "asset_id",
      "name": "Biển báo hỏng",
      "assetCode": "SIGN-001",
      "assetType": "sign",
      "coordinates": [108.201, 16.051],
      "distanceApproxMeters": 10
    }
  ]
}
```

## 6. User Management (Admin only)

### `GET /api/users`

Lấy danh sách người dùng phân trang.

#### Query params
- `page`: number
- `limit`: number
- `role`: string
- `search`: string

#### Response 200
```json
{
  "items": [
    {
      "id": "user_id",
      "username": "user01",
      "fullName": "Nguyen Van A",
      "role": "user",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

### `POST /api/users`

Tạo người dùng mới.

#### Request
```json
{
  "username": "tech02",
  "password": "password123",
  "fullName": "Kỹ thuật viên B",
  "role": "technician",
  "isActive": true
}
```

#### Response 201
```json
{
  "id": "user_id",
  "username": "tech02",
  "message": "Đã tạo tài khoản thành công"
}
```

### `PATCH /api/users/:id`

Cập nhật thông tin tài khoản.

#### Request
```json
{
  "fullName": "Kỹ thuật viên B mới",
  "isActive": false
}
```

#### Response 200
```json
{
  "id": "user_id",
  "username": "tech02",
  "message": "Cập nhật thông tin tài khoản thành công"
}
```

### `DELETE /api/users/:id`

Xóa mềm người dùng (isDeleted = true).

#### Response 200
```json
{
  "id": "user_id",
  "message": "Xoá tài khoản thành công"
}
```

## Ma loi de xuat

- `400`: du lieu dau vao khong hop le
- `401`: chua dang nhap hoac token khong hop le
- `403`: khong du quyen
- `404`: khong tim thay du lieu
- `409`: trung ma tai san hoac du lieu unique
- `500`: loi he thong

## Cac diem can chot truoc khi code

- Co dung JWT hay session-based auth.
- Co can endpoint refresh token hay khong.
- Co can tach endpoint `incident` va `maintenance` rieng hay dung chung.
- Co can tra ve du lieu GeoJSON Feature/FeatureCollection ngay tu backend hay khong.
