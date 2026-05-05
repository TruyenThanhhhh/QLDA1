# Workflow lam viec

File nay dinh nghia workflow lam viec chuan cho repo QLDA. Muc tieu la giup qua trinh tu y tuong den code dien ra on dinh, de kiem soat va de review.

## Nguyen tac tong quat

- `prod` la noi chua y tuong, yeu cau, ke hoach, quy trinh va tieu chuan.
- `source` la noi chua ma nguon chuong trinh.
- Moi thay doi code phai bat dau tu mot nhu cau ro rang trong `prod/docs`.
- Khong code theo nho, doan hoac cam tinh khi chua doi chieu tai lieu.

## Workflow chuan 6 buoc

### Buoc 1: Chon task

Chon mot task nho, ro rang, nam trong pham vi MVP.

Nguon de chon task:

- [09-mvp-chot.md](D:\QLDA\prod\docs\09-mvp-chot.md)
- [03-yeu-cau-chuc-nang.md](D:\QLDA\prod\docs\03-yeu-cau-chuc-nang.md)
- [05-lo-trinh-thuc-hien.md](D:\QLDA\prod\docs\05-lo-trinh-thuc-hien.md)

Task tot nen co:

- Mot muc tieu cu the.
- Pham vi nho.
- Co tieu chi xong ro rang.
- Co the kiem tra doc lap.

Vi du:

- Tao API lay danh sach tai san.
- Tao schema `Asset`.
- Hien thi layer tai san tren ban do.

### Buoc 2: Chot dac ta truoc khi code

Truoc khi code, doi chieu voi cac tai lieu lien quan:

- Nghiep vu: [02-pham-vi-va-yeu-cau-nghiep-vu.md](D:\QLDA\prod\docs\02-pham-vi-va-yeu-cau-nghiep-vu.md)
- MVP: [09-mvp-chot.md](D:\QLDA\prod\docs\09-mvp-chot.md)
- Schema: [10-data-schema-draft.md](D:\QLDA\prod\docs\10-data-schema-draft.md)
- API: [11-api-contract-draft.md](D:\QLDA\prod\docs\11-api-contract-draft.md)

Moi task truoc khi code nen duoc viet gon lai theo mau:

- Muc tieu:
- Dau vao:
- Dau ra:
- File/module anh huong:
- Cach test:

Neu chua tra loi duoc 5 muc tren, chua nen bat dau code.

### Buoc 3: Implement trong `source`

Chi code trong `source`, khong tron code voi tai lieu.

Nguyen tac implementation:

- Lam theo lat cat nho.
- Uu tien backend schema va API truoc, roi moi noi frontend.
- Moi commit hoac moi thay doi nen giai quyet mot van de ro rang.
- Neu thay doi schema hoac API, cap nhat lai tai lieu trong `prod/docs`.

Thu tu implementation khuyen nghi:

1. Auth.
2. Asset schema va asset API.
3. Map view va layer asset.
4. Asset form/detail.
5. Maintenance records.
6. Dashboard.

### Buoc 4: Tu kiem tra chat luong

Sau khi code xong, bat buoc tu kiem tra theo:

- [06-quy-trinh-kiem-tra-chat-luong.md](D:\QLDA\prod\docs\06-quy-trinh-kiem-tra-chat-luong.md)
- [07-luat-chat-luong-code.md](D:\QLDA\prod\docs\07-luat-chat-luong-code.md)
- [08-checklist-definition-of-done.md](D:\QLDA\prod\docs\08-checklist-definition-of-done.md)

Can tra loi duoc:

- Da dung yeu cau chua.
- Da test luong chinh chua.
- Da kiem tra truong hop loi chua.
- Co de lai rac ky thuat khong.
- Co anh huong schema, API, permission hoac data khong.

### Buoc 5: Review va chot ket qua

Truoc khi xem task la xong, can co ghi chu ngan:

- Da lam gi.
- Anh huong den file/module nao.
- Da test gi.
- Con gioi han nao chua xu ly.

Neu co review chéo, nguoi review uu tien xem:

- Rui ro nghiep vu.
- Rui ro mat du lieu.
- Sai phan quyen.
- API/schema co lech tai lieu khong.
- UI/UX co kho dung khong.

### Buoc 6: Cap nhat tai lieu neu can

Phai cap nhat `prod/docs` neu thay doi lien quan:

- MVP.
- Schema.
- API.
- Quy trinh.
- Cac quy uoc chat luong.

Nguyen tac:

- Tai lieu la nguon su that cho team.
- Neu code va tai lieu mau thuan, phai sua mot trong hai ngay.

## Workflow cho mot task nho

Ap dung cho nhung viec co the lam trong 1 phien:

1. Chon 1 task.
2. Viet mo ta task 5 dong.
3. Code.
4. Tu test.
5. Doi chieu checklist Done.
6. Ghi ket qua va dong task.

## Workflow cho mot feature lon

Ap dung cho cac feature gom nhieu phan nhu `asset management` hoac `maintenance module`.

1. Tach feature thanh cac task nho.
2. Chot schema va API truoc.
3. Lam backend truoc neu frontend phu thuoc data.
4. Lam frontend sau khi contract on dinh.
5. Test tung task roi moi test end-to-end.
6. Cap nhat tai lieu tong hop sau cung.

## Quy tac uu tien khi lam viec

- Uu tien chuc nang MVP truoc.
- Uu tien luong chinh truoc edge case.
- Uu tien dung schema va API truoc toi uu giao dien.
- Uu tien code dung va de bao tri truoc code nhanh.

## Mau task de dung hang ngay

```text
Task:
- Muc tieu:
- Dau vao:
- Dau ra:
- File/module anh huong:
- Cach test:
```

## Mau bao cao sau khi xong task

```text
Ket qua:
- Da lam:
- Da test:
- Anh huong:
- Gioi han con lai:
```

## Ket luan

Neu lam dung workflow nay, repo se co mot vong lap ro rang:

`Tai lieu -> task -> code -> kiem tra -> review -> cap nhat tai lieu`

Day la cach de giu cho du an di dung huong, giam code sai va de mo rong ve sau.
