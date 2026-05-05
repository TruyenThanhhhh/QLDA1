# Yeu cau chuc nang

File nay liet ke cac yeu cau chuc nang uu tien cao cho ung dung.

## Nhom chuc nang 1: Xac thuc va phan quyen

- Dang ky tai khoan cong khai cho nguoi dan.
- Dang nhap bang tai khoan he thong.
- Phan quyen theo vai tro: `user`, `technician`, `admin`.
- Ghi log hanh dong cap nhat du lieu quan trong.

## Nhom chuc nang 2: Ban do va lop du lieu

- Hien thi ban do nen OpenStreetMap.
- Tai va hien thi cac lop du lieu GeoJSON.
- Bat/tat tung lop du lieu tren ban do.
- Zoom den khu vuc hoac doi tuong duoc chon.
- Hien thi mau sac khac nhau theo tinh trang tai san.

## Nhom chuc nang 3: Quan ly tai san

- (`admin`) Tao tai san moi dang diem.
- (`admin`) Tao tai san moi dang duong.
- (`admin`) Sua thong tin. Xay ra thay doi.
- (`admin`) Xoa mem hoac an tai san khong con su dung.
- Xem chi tiet tai san trong popup hoac panel (Tat ca role).

Thong tin can quan ly cho tai san:

- Ma tai san.
- Ten tai san.
- Loai tai san.
- Hinh hoc: point hoac line.
- Toa do hoac tap toa do.
- Khu vuc quan ly.
- Vat lieu.
- Kich thuoc.
- Tinh trang hien tai.
- Ngay cap nhat gan nhat.

## Nhom chuc nang 4: Su co va bao tri

- `user` tao ban ghi `incident` (su co) gan voi tai san hoac vi tri.
- `technician`, `admin` tao `maintenance` (bao tri).
- Luu mo ta, muc do anh huong, ngay ghi nhan, nguoi ghi nhan.
- `technician`, `admin` cap nhat trang thai xu ly.
- Tat ca role deu xem duoc lich su su co va bao tri cua tung tai san.

## Nhom chuc nang 5: Tim kiem va loc

- Tim kiem theo ma tai san, ten tai san.
- Loc theo loai tai san.
- Loc theo tinh trang.
- Loc theo khu vuc.
- Loc theo khoang thoi gian cap nhat.

## Nhom chuc nang 6: Dashboard va thong ke

*(Chi danh cho role `admin`)*
- Tong so tai san theo loai.
- Ty le tai san theo tinh trang.
- So luong su co theo khu vuc.
- Danh sach tai san can uu tien xu ly.

## Nhom chuc nang 7: Quan tri du lieu

- Nhap du lieu mau tu GeoJSON.
- Dong bo du lieu OSM/Overpass theo dot.
- Kiem tra hop le cua toa do va geometry.
- Sao luu va phuc hoi du lieu trong giai doan van hanh.

## Yeu cau phi chuc nang quan trong

- He thong phai hoat dong tot voi bo du lieu demo 50-100 tai san.
- Khong tai toan bo du lieu lon xuong client neu khong can thiet.
- Co co che phan trang hoac tai du lieu theo viewport.
- Luu log loi backend khi tuong tac voi dich vu ngoai.
- Kiem soat truy cap de tranh sua xoa du lieu trai phep.
