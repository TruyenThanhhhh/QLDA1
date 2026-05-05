# Luat chat luong code

File nay duoc xem la bo luat chat luong code cua repo. Moi thay doi code moi deu phai tuan theo.

## Dieu 1: Dung yeu cau

- Khong code tinh nang ngoai pham vi yeu cau ma khong co ly do ro rang.
- Moi thay doi phai truy vet duoc ve mot nhu cau nghiep vu, bug hoac muc tieu ky thuat.

## Dieu 2: De doc va de bao tri

- Ten bien, ham, component, service phai ro nghia.
- Ham qua dai hoac qua nhieu trach nhiem phai duoc tach nho.
- Khong viet code me cung chi nguoi viet moi hieu.

## Dieu 3: Khong lap lai bat can thiet

- Logic lap lai tu 2 lan tro len phai xem xet tach thanh ham, hook, service hoac util.
- Khong copy-paste code roi sua nho tung cho.

## Dieu 4: Tach ro trach nhiem

- UI khong om business logic phuc tap.
- Controller khong chua qua nhieu truy van va tinh toan nghiep vu.
- Data access, validation va mapping phai co ranh gioi ro rang.

## Dieu 5: Xu ly loi bat buoc ro rang

- Moi thao tac co the that bai phai co xu ly loi.
- Thong bao loi cho nguoi dung phai de hieu.
- Log ky thuat phai du de debug nhung khong lo du lieu nhay cam.

## Dieu 6: Du lieu vao phai duoc kiem soat

- Khong tin du lieu tu client.
- Input phai duoc validate o bien he thong.
- Doi voi du lieu khong gian, phai kiem tra geometry va toa do hop le.

## Dieu 7: Bao mat la mac dinh

- Khong hard-code password, token, secret.
- Phan quyen phai duoc kiem tra o backend, khong chi o frontend.
- Khong tra ve du lieu nhay cam neu khong thuc su can.

## Dieu 8: Tuong thich voi kien truc chung

- Moi thay doi phai ton trong kien truc da thong nhat.
- Neu can pha vo mau hien co, phai co ly do va tai lieu hoa.

## Dieu 9: Test la mot phan cua code

- Chuc nang moi hoac bug fix phai co cach kiem chung.
- Uu tien test tu dong cho logic nghiep vu va du lieu.
- Neu chua co ha tang test, bat buoc co checklist test tay ro rang.

## Dieu 10: Khong duoc de lai rac ky thuat ro rang

- Khong de `console.log`, log debug tam, code comment bo quyen.
- Khong de function khong duoc dung, file khong duoc dung, import du thua.

## Dieu 11: Moi thay doi phai co dau vet

- Neu thay doi lien quan schema, API, env hoac luong nghiep vu, phai cap nhat tai lieu.
- Pull request hoac ghi chu ban giao phai noi ro:
  - Van de gi duoc giai quyet.
  - Anh huong toi dau.
  - Da test nhung gi.

## Dieu 12: Khong merge khi con rui ro nghiem trong

Khong duoc merge neu con mot trong cac van de sau:

- Sai nghiep vu cot loi.
- Co nguy co mat du lieu hoac ghi sai du lieu.
- Sai phan quyen.
- Khong chay duoc luong chinh.
- Chua co cach kiem chung thay doi.

## Muc do uu tien khi danh gia loi

- P0: Gay hong chuc nang chinh, mat du lieu, loi bao mat nghiem trong.
- P1: Sai nghiep vu quan trong, API sai, luong chinh bi anh huong ro.
- P2: Van de bao tri, UX, hieu nang, cau truc code chua tot.
- P3: Van de nho, tinh chinh ten goi, format, tai lieu.

## Nguyen tac ap dung

- Neu luat va tien do mau thuan nhau, uu tien luat chat luong.
- Khong hop thuc hoa viec merge "tam" vao nhanh chinh khi chua dat chat luong toi thieu.
- Moi thanh vien tham gia repo deu co quyen dung merge neu thay doi vi pham cac dieu tren.
