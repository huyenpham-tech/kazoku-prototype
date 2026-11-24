# Kazoku – Prototype đánh giá chuyên môn (UC-06)

Bản HTML sơ khai dựng từ thiết kế canvas "Kazoku – Phiếu đánh giá chuyên môn (form hệ thống)".

## Mở prototype
Mở `index.html` bằng trình duyệt (bấm đúp là được). Nếu trình duyệt chặn lưu trạng thái giữa các trang `file://`, chạy:

```
python -m http.server 8765
```
rồi mở http://localhost:8765

## Cấu trúc
| File | Màn |
|---|---|
| `index.html` | Mục lục, chọn 3 đối tượng minh hoạ, đặt lại dữ liệu |
| `DanhSach.html` | Danh sách người cao tuổi (y tá); `?role=bs` = góc nhìn bác sĩ |
| `Main.html` / `YTaBanTru.html` / `YTaTaiNha.html` | Tab Y tá – Lưu trú / Bán trú / Tại nhà |
| `HoSoYTe.html` | Tab Hồ sơ y tế |
| `BacSi.html` | Tab Bác sĩ – Khám |
| `ChiDinh.html` | Tab Chỉ định |
| `KetLuan.html` | Tab Kết luận; `?locked=1` = phiếu đã khoá, chỉ xem |
| `KetLuanCho.html` | Tab Kết luận khi Chờ kết quả |
| `LeTan.html` | MH-01 Lễ tân – Check-in (độc lập, không nối) |
| `assets/proto.js` | Dữ liệu người cao tuổi, nối màn, thông báo, hộp xác nhận |
| `assets/proto.css` | Kiểu cho toast, hộp thoại, thanh prototype |

Người cao tuổi đang mở đi theo tham số `?p=` (an, binh, phuc, cuong, em, hung, khoa).
