# Quy trinh kiem tra chat luong

File nay mo ta quy trinh kiem tra chat luong de ap dung cho moi thay doi code trong du an QLDA.

## Muc tieu

- Giam loi nghiep vu, loi ky thuat va regression.
- Dam bao thay doi code co the duy tri va mo rong.
- Tao mot quy trinh lam viec on dinh truoc khi merge vao nhanh chinh.

## Quy trinh 5 buoc bat buoc

### Buoc 1: Kiem tra truoc khi code

Truoc khi bat dau code, nguoi thuc hien phai xac nhan:

- Yeu cau nam o dau trong tai lieu nghiep vu.
- Chuc nang thuoc MVP hay ngoai MVP.
- Dau vao, dau ra va tieu chi thanh cong cua thay doi.
- File, module va du lieu nao se bi anh huong.

Neu chua ro mot trong cac muc tren, khong duoc code ngay theo suy doan.

### Buoc 2: Tu kiem tra trong luc code

Trong qua trinh code, can kiem tra lien tuc:

- Co dung naming convention va cau truc thu muc khong.
- Co tach ro UI, business logic, data access khong.
- Co lam tang do phuc tap khong can thiet khong.
- Co thay doi API, schema, permission hay data flow khong.

Neu thay doi anh huong schema hoac hop dong API, phai cap nhat tai lieu lien quan.

### Buoc 3: Kiem tra ky thuat truoc khi gui review

Nguoi code phai tu kiem tra:

- Build hoac chay duoc trong moi truong local.
- Khong co loi syntax, import, typing, lint co ban.
- Khong de log debug, code chet, comment tam.
- Khong hard-code secret, token, URL moi truong that.

### Buoc 4: Review chuc nang va rui ro

Truoc khi xem la hoan tat, can review theo 4 goc:

- Dung nghiep vu: co giai quyet dung yeu cau khong.
- Dung ky thuat: co vo kien truc hoac tao no ky thuat lon khong.
- An toan du lieu: co nguy co xoa nham, cap nhat sai, mat quyen khong.
- Trai nghiem nguoi dung: co kho dung, kho nhap lieu, thong bao loi mo ho khong.

### Buoc 5: Xac nhan Definition of Done

Chi duoc coi la xong khi dat checklist tai file `08-checklist-definition-of-done.md`.

## Muc kiem tra theo loai thay doi

### Thay doi frontend

- Kiem tra trang thai loading, empty, error.
- Kiem tra form validation.
- Kiem tra tren kich thuoc man hinh pho bien.
- Kiem tra text hien thi ro rang, khong mo ho.

### Thay doi backend

- Kiem tra validate input.
- Kiem tra xu ly loi va ma trang thai.
- Kiem tra phan quyen va du lieu tra ve.
- Kiem tra anh huong den schema va du lieu cu.

### Thay doi ban do va du lieu khong gian

- Kiem tra geometry hop le.
- Kiem tra toa do dung thu tu va dung dinh dang.
- Kiem tra hieu nang khi hien thi nhieu doi tuong.
- Kiem tra loc theo viewport hoac khu vuc neu co.

## Nguyen tac dung quy trinh

- Loi nghiem trong phai duoc sua truoc khi merge.
- Khong hop thuc hoa viec bo qua kiem tra bang cach "se sua sau" neu khong co issue ro rang.
- Neu chua the viet test tu dong, phai co mo ta test tay cu the.
- Moi thay doi co anh huong den hanh vi he thong deu phai co bang chung da kiem tra.
