# MVP chot

File nay chot pham vi MVP de bat dau implementation. Bat ky tinh nang nao nam ngoai file nay deu xem la chua uu tien trong giai doan dau.

## Muc tieu MVP

Xay dung mot ung dung web GIS co the:

- Cho phep nguoi dan dang ky tai khoan va tu danh dau diem hu hong tren ban do de gui bao cao.
- Hien thi tai san ha tang tren ban do OSM.
- Quan ly tai san dang diem va dang duong.
- Ghi nhan tinh trang, su co va lich su bao tri.
- Cung cap dashboard thong ke co ban.

## Chuc nang bat buoc trong MVP

### 1. Xac thuc co ban

- Dang ky tai khoan cong khai cho `user`.
- Dang nhap bang username va password.
- Phan quyen toi thieu theo 3 vai tro:
  - `user`
  - `technician`
  - `admin`

### 2. Ban do va hien thi tai san

- Hien thi ban do nen OpenStreetMap.
- Hien thi tai san dang `Point` va `Line`.
- Mau sac tai san thay doi theo `status`.
- Bat/tat lop hien thi co ban theo loai tai san.

### 3. CRUD tai san

- `admin` hoac `technician` tao tai san moi.
- `admin` hoac `technician` sua thong tin tai san.
- Xem chi tiet tai san.
- `admin` xoa mem tai san.

### 4. Quan ly su co va bao tri

- `user` tao ban ghi su co cho tai san hoac tu danh dau mot `Point` la vi tri hu hong de nhap tay du lieu.
- `technician` tao ban ghi bao tri cho tai san.
- `technician` cap nhat trang thai xu ly ban ghi.
- `admin` theo doi va quan ly toan bo quy trinh.
- Xem lich su theo tung tai san.

### 5. Tim kiem va loc

- Tim theo ma tai san.
- Tim theo ten tai san.
- Loc theo loai tai san.
- Loc theo khu vuc.
- Loc theo tinh trang.

### 6. Dashboard co ban

- Tong so tai san theo loai.
- Tong so tai san theo tinh trang.
- So luong su co chua xu ly.
- Danh sach tai san can uu tien xu ly.

## Ngoai pham vi MVP

- Import dong bo OSM tu dong theo lich.
- Phan quyen chi tiet den tung thao tac nho.
- Toi uu hieu nang cho du lieu quy mo lon.
- Tich hop thong bao real-time.
- Mobile app rieng.

## Tieu chi nghiem thu MVP

- Dang ky va dang nhap duoc voi tai khoan `user`.
- Xem duoc tai san demo tren ban do.
- `admin` hoac `technician` them, sua, xem mot tai san thanh cong.
- `user` tao duoc it nhat mot ban ghi su co.
- `technician` tao duoc it nhat mot ban ghi bao tri va cap nhat trang thai xu ly.
- Dashboard hien thi duoc so lieu tong hop tu du lieu demo.

## Thu tu code de xuat

1. Auth.
2. Asset schema + API.
3. Map view + asset layers.
4. Asset form va detail panel.
5. Maintenance records.
6. Dashboard.
