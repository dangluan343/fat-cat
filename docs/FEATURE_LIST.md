# Feature List — Meow 2D (fat-cat)

Danh sách tính năng theo chuẩn tài liệu phát triển game: phân rã theo **Module → Feature**, có mã định danh, độ ưu tiên (MoSCoW), trạng thái và liên kết sang [Function List](FUNCTION_LIST.md).

- Phiên bản đối chiếu: `main` @ `cb63006` + nhánh `feat/offline-progress` (chưa merge)
- Cập nhật: 2026-10-26
- Nguồn: đọc trực tiếp mã nguồn, không phải từ tài liệu thiết kế gốc (repo chưa có GDD)

## Chú giải

**Ưu tiên (MoSCoW)**: `M` Must — cốt lõi; `S` Should — nên có; `C` Could — có thì tốt; `W` Won't (lần này) — để sau.

**Trạng thái**:

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ Done | Hoạt động đầy đủ trong code |
| 🟡 Partial | Có một phần, thiếu hoặc lỗi ở điểm ghi chú |
| 🚧 Branch | Đã làm xong trên nhánh, chưa merge vào `main` |
| ⬜ Planned | Chưa làm (backlog đề xuất) |

## Tổng quan theo module

| Mã | Module | Số feature | Done | Partial | Branch | Planned |
|---|---|---|---|---|---|---|
| CORE | Lõi game (vòng lặp, lưu/nạp, state) | 5 | 5 | 0 | 0 | 0 |
| PET | Thú cưng (chỉ số, hành vi, AI) | 18 | 18 | 0 | 0 | 0 |
| ACT | Tương tác người chơi | 11 | 10 | 1 | 0 | 0 |
| ECO | Kinh tế & tiến trình | 12 | 11 | 1 | 0 | 0 |
| OFF | Tiến trình offline & quà | 4 | 0 | 0 | 4 | 0 |
| CUS | Tuỳ biến (lông, phụ kiện, phòng) | 5 | 5 | 0 | 0 | 0 |
| REN | Đồ hoạ Canvas 2D | 13 | 12 | 1 | 0 | 0 |
| AUD | Âm thanh | 5 | 5 | 0 | 0 | 0 |
| UI | Giao diện người dùng | 10 | 10 | 0 | 0 | 0 |
| NET | Nhiều người trong văn phòng | 9 | 8 | 1 | 0 | 0 |
| NFR | Phi chức năng | 6 | 2 | 4 | 0 | 0 |
| BKL | Backlog đề xuất | 10 | 2 | 0 | 0 | 8 |

---

## 1. CORE — Lõi game

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| CORE-01 | Vòng lặp game | `requestAnimationFrame`, delta kẹp 0.1 giây; mỗi khung: cập nhật chỉ số → cập nhật renderer → vẽ | M | ✅ Done | FN-APP-30, FN-GS-11 | Tab ẩn thì rAF dừng, không tích lũy thời gian |
| CORE-02 | Quản lý trạng thái tập trung | `CatGameState` giữ toàn bộ dữ liệu; listener nhận thông báo mỗi lần thay đổi | M | ✅ Done | FN-GS-01..03 | Một instance toàn cục `window.gameState` |
| CORE-03 | Lưu / nạp tự động | Ghi `localStorage` mỗi lần `notify()`; nạp khi khởi động, trộn nông với giá trị mặc định | M | ✅ Done | FN-GS-04, FN-GS-05 | Khoá `meow_2d_save_data_v1` |
| CORE-04 | Đặt lại dữ liệu | Nút trong Cài đặt, xoá save rồi tải lại trang | S | ✅ Done | FN-GS-06, FN-APP-27 | Có hộp xác nhận |
| CORE-05 | Cấu hình tập trung | `config.js` dùng chung cho Node và trình duyệt | S | ✅ Done | — | IP/port/thời gian thông báo |

## 2. PET — Thú cưng

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| PET-01 | Bốn chỉ số sống | Đói (hunger), Vui vẻ, Sức khoẻ, Năng lượng, thang 0–100 | M | ✅ Done | FN-GS-11 | |
| PET-02 | Suy giảm chỉ số theo thời gian | Hunger −0.1/giây; đói <25 làm tụt vui và sức khoẻ (có sàn); sức khoẻ tự hồi khi no | M | ✅ Done | FN-GS-11 | Mèo không chết (hình phạt nhẹ có chủ đích) |
| PET-03 | Máy trạng thái hành vi | 25 trạng thái: IDLE, PETTING, SLEEPING, YAWNING, LICKING_PAW, ROLLING, BEGGING, EATING, PLAYING, ZOOMIES, SULKING, SLOW_BLINK, CURIOUS, SURPRISED, ANNOYED, KNEADING, BLEP, GREETING, GROOMING, SICK, EXHAUSTED, STARVING, FULL, HISS, WALKING | M | ✅ Done | FN-GS-13, FN-GS-14 | Danh sách và ý nghĩa: [CAT_ANIMATION.md](CAT_ANIMATION.md) mục 4 |
| PET-04 | AI hành vi tự trị | Mỗi 8–16 giây tự chọn: xin ăn khi đói, ngủ khi mệt, Zoomies khi sung, hoặc hành động ngẫu nhiên | S | ✅ Done | FN-GS-14 | |
| PET-05 | Ngủ và hồi năng lượng | Ngủ hồi 1.5 năng lượng/giây; đầy thì tự thức và tính nhiệm vụ ngủ | S | ✅ Done | FN-GS-11, FN-GS-19 | |
| PET-06 | Banner "Hành động hiện tại" | Mỗi hành vi có tiêu đề + mô tả hiển thị trong thẻ góc dưới phải | S | ✅ Done | FN-GS-12, FN-GS-13 | |
| PET-07 | Rig biểu cảm tham số | Mỗi trạng thái khai báo đích cho mắt, mí, đồng tử, miệng, má, râu, tai, đầu, đuôi, thân; renderer nội suy mượt giữa các trạng thái | M | ✅ Done | FN-REN-23, FN-REN-24 | Bảng tham số: CAT_ANIMATION.md mục 3.2 |
| PET-08 | Tâm trạng nền theo chỉ số | Lúc rảnh, vui thấp/đói/mệt/rất vui hiện ra mặt và đuôi | S | ✅ Done | FN-REN-23 | |
| PET-09 | Cáu khi bị vuốt quá lâu | ≥ 32 lần vuốt trong 10 giây → `ANNOYED` 3.5 giây, −3 vui, vuốt không được thưởng. Mặt cáu: mày chau chữ V, mí xếch, đồng tử khe, miệng gằn lộ nanh, dấu gân 💢 đập trên trán, tai máy bay, đuôi quất; không có tim/vòng rù rù | S | ✅ Done | FN-GS-15, FN-REN-39 | Dựa trên hiện tượng kích thích quá mức khi được vuốt ở mèo thật; ngưỡng ở `PET_OVERLOAD` |
| PET-10 | Phản ứng khi đang ngủ | Rê chuột vuốt nhẹ thì mèo ngủ tiếp (rù rù khẽ); bấm vào thì giật mình `SURPRISED` | S | ✅ Done | FN-GS-15, FN-REN-04 | |
| PET-11 | Ký hiệu cảm xúc | ❓ ❗ 💢 💗 💛 💧 🎵 bay lên khi vào trạng thái | C | ✅ Done | FN-REN-25 | |
| PET-12 | Mèo chờ đồ ăn khi đang kéo | Đồ ăn kéo tới: mắt mở to, đồng tử giãn, tai và râu chĩa trước; kề mèo thì há miệng chờ. Không phản ứng khi đang ngủ hoặc cáu | S | ✅ Done | FN-REN-24, FN-REN-22 | |
| PET-13 | Ốm (`SICK`) | Sức khoẻ < 30 thì 60% mỗi lượt AI: mí sụp, mày lo, quầng thâm, vạch u ám trên trán, miệng run, người run lẩy bẩy, đuôi sát sàn | S | ✅ Done | FN-GS-14 | Ngưỡng `VITAL_MOODS.SICK_HEALTH` |
| PET-14 | Kiệt sức (`EXHAUSTED`) | Năng lượng < 15: từ chối chơi (không thưởng) và gật gù (mí sụp dần, đầu gục, giật mình ngẩng lên); AI cũng có 50% gật gù trước khi ngủ | S | ✅ Done | FN-GS-14, FN-GS-17 | `VITAL_MOODS.EXHAUSTED_ENERGY` |
| PET-15 | Đói lả (`STARVING`) | Đói < 10 thay cho xin ăn: nằm bẹp, mắt to ướt có nước mắt, kêu yếu từng hồi, đuôi sát sàn | S | ✅ Done | FN-GS-14 | `VITAL_MOODS.STARVING_HUNGER` |
| PET-16 | No căng (`FULL`) | Ăn tới đói ≥ 95 thì ăn xong chuyển sang no căng (mắt cười, liếm mép, bụng phình); đã no mà vẫn thả đồ ăn thì mèo từ chối, không trừ món | S | ✅ Done | FN-GS-16, FN-GS-29, FN-APP-34 | `VITAL_MOODS.FULL_HUNGER`; dùng `nextBehavior` để nối trạng thái |
| PET-17 | Rít (`HISS`) | Vẫn bị vuốt 6 lần trong lúc cáu: há miệng lộ 4 nanh, nhăn mũi, đồng tử giãn, tai ép sát, đuôi xù tua tủa, tiếng rít; −5 vui, 2.5 giây không nhận vuốt | S | ✅ Done | FN-GS-15, FN-AUD-17 | `VITAL_MOODS.HISS_AFTER_PETS` |
| PET-18 | Đi dạo trên thảm (`WALKING`) | Mèo đứng dậy bốn chân, đi chậm qua lại giữa hai nửa thảm, quay mặt theo hướng đi; có tương tác (vuốt, cho ăn, chơi, cáu...) thì dừng ngay chỗ đó, xong việc thì đi tiếp; đang kéo đồ ăn tới thì đứng lại chờ; hết lượt thì nằm lại chỗ dừng | S | ✅ Done | FN-GS-39, FN-REN-07, FN-REN-42 | Không tự đi tiếp sau ngủ, mệt, ốm, đói, dỗi, xin ăn (`WALK_CONFIG`) |

## 3. ACT — Tương tác người chơi

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| ACT-01 | Vuốt ve | Rê chuột/cảm ứng lên mèo (≥260 ms/lần) hoặc bấm giữ; tăng vui, EXP, thi thoảng rơi xu | M | ✅ Done | FN-REN-04, FN-GS-15 | Có nút "Vuốt ve" nhanh; xem PET-09, PET-10 |
| ACT-02 | Cho ăn bằng kéo thả | Nhấn giữ một món trong dock, kéo tới mèo (vùng nét đứt sáng vàng khi trúng) rồi thả: trừ kho, tăng chỉ số, đĩa ăn hiện cạnh mèo. Bấm mà không kéo chỉ hiện hướng dẫn; thả trượt không mất món | M | ✅ Done | FN-GS-16, FN-REN-06, FN-REN-37, FN-REN-38, FN-APP-08, FN-APP-34 | Nút nhanh "Cho ăn" đã bỏ (2026-10-26) |
| ACT-03 | Chơi với đồ chơi | Bật/tắt đồ chơi; tăng vui, giảm năng lượng, +EXP, +xu | M | ✅ Done | FN-GS-17, FN-GS-18 | |
| ACT-04 | Đồ chơi: Đèn laser | Chấm đỏ theo con trỏ | S | ✅ Done | FN-REN-16 | |
| ACT-05 | Đồ chơi: Cần câu lông | Lông vũ đuổi theo con trỏ | S | ✅ Done | FN-REN-16 | |
| ACT-06 | Đồ chơi: Bóng len | Luôn hiện trên sàn; bấm để đá, có vật lý nảy | C | ✅ Done | FN-REN-03, FN-REN-08 | Không đi qua `activeToy` |
| ACT-07 | Đồ chơi: Chuột cót, Cá bông Catnip | Bán trong shop, chọn được trong kho nhưng không có hình vẽ riêng | S | 🟡 Partial | FN-REN-16 | Chỉ có hiệu ứng chơi chung chung, chưa vẽ vật phẩm |
| ACT-08 | Ngủ / Thức | Nút bật tắt ngủ (30 giây hoặc đến khi đầy năng lượng) | S | ✅ Done | FN-GS-19 | |
| ACT-09 | Lăn lộn, Vươn vai | Hai hành động tạo hoạt ảnh thuần cảm xúc | C | ✅ Done | FN-GS-13 | |
| ACT-10 | Nháy mắt chậm với mèo | Nút "Nháy mắt": mèo nháy chậm đáp lại, +4 vui, +3 EXP, hồi chiêu 8 giây; không có tác dụng khi mèo ngủ/cáu | S | ✅ Done | FN-GS-28, FN-APP-33 | Dựa trên nghiên cứu Humphrey et al. 2020 |
| ACT-11 | Tò mò khi đá bóng len | Mèo đang rảnh sẽ nghiêng đầu nhìn khi bóng len bị đá | C | ✅ Done | FN-REN-03 | |

## 4. ECO — Kinh tế & tiến trình

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| ECO-01 | Tiền tệ (xu) | Kiếm từ vuốt ve, chơi, Zoomies, nhiệm vụ, lên cấp, thành tựu | M | ✅ Done | FN-GS-20 | |
| ECO-02 | EXP và lên cấp | EXP cần = `level × 100 × 1.15`; thưởng `level × 50` xu và hộp thoại chúc mừng | M | ✅ Done | FN-GS-21, FN-GS-22, FN-APP-04 | |
| ECO-03 | Cửa hàng | Mua đồ ăn, đồ chơi, trang phục bằng xu | M | ✅ Done | FN-GS-26, FN-APP-20 | 15 mặt hàng |
| ECO-04 | Kho đồ | Số lượng đồ ăn, danh sách đồ chơi và trang phục đã sở hữu | M | ✅ Done | FN-APP-08 | |
| ECO-05 | Nhiệm vụ hằng ngày | Mỗi ngày (đổi lúc 0:00 giờ máy) bốc 3 nhiệm vụ từ kho 10 loại: 1 dễ, 1 vừa, 1 ngẫu nhiên (50% khó). Thanh tiến độ x/y, chip thưởng 🪙⭐, bấm "Nhận" để lấy thưởng (xu bay về ví, mèo chào), đồng hồ "Làm mới sau" | M | ✅ Done | FN-GS-30..36, FN-APP-35, FN-APP-36 | Làm lại 2026-10-26, xem [GAMIFICATION.md](GAMIFICATION.md) |
| ECO-06 | Thành tựu | 5 danh hiệu, mỗi cái +50 xu +40 EXP | S | 🟡 Partial | FN-GS-25, FN-APP-22 | `laser_chaser` không có đường nào mở khoá |
| ECO-07 | Sổ sưu tập | Modal liệt kê thành tựu, đã/chưa đạt | C | ✅ Done | FN-APP-22 | `foodsDiscovered`, `toysUsed` được ghi nhưng chưa hiển thị |
| ECO-08 | Vật phẩm đặc biệt | Snack Cỏ Mèo (gây Zoomies), Nước Tăng Lực (hồi đầy 3 chỉ số) | C | ✅ Done | FN-APP-08 | Nước Tăng Lực miễn phí, vô hạn (xem BKL-06) |
| ECO-09 | Đổi nhiệm vụ | 1 lượt/ngày đổi một nhiệm vụ chưa xong, ưu tiên cùng mức khó | S | ✅ Done | FN-GS-34 | Hỗ trợ tự chủ (SDT) |
| ECO-10 | Hộp quà ngày | Nhận đủ 3 nhiệm vụ → mở hộp: 40–80 xu + 20 EXP, 35% kèm món ăn, 10% kèm trang phục chưa có (đủ rồi thì +60 xu) | S | ✅ Done | FN-GS-35, FN-GS-36, FN-APP-36 | Thưởng có trần, có chút bất ngờ |
| ECO-11 | Chuỗi ngày chăm mèo 🔥 | Ngày được tính khi nhận ≥ 1 nhiệm vụ; lỡ ngày tự dùng vé đóng băng ❄️ (tối đa 2, nhận 1 vé mỗi 7 ngày); hết vé thì về 1, giữ kỷ lục; mốc 3/7/14/30 ngày thưởng 50/120/250/500 xu | S | ✅ Done | FN-GS-37, FN-GS-38 | Chuỗi "nhân hậu", không phạt mèo |
| ECO-12 | Hộp thoại chúc mừng xếp hàng | Quà offline, lên cấp, phần thưởng không mở chồng nhau; phần thưởng hiện trước, lên cấp sau | S | ✅ Done | FN-APP-37, FN-APP-24 | |

## 5. OFF — Tiến trình offline & quà (nhánh `feat/offline-progress`)

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| OFF-01 | Ghi nhận thời điểm rời đi | `lastSeen` lưu cùng save; `markAway()` khi tab ẩn / `pagehide` | M | 🚧 Branch | FN-GS-07, FN-APP-26 | Cập nhật mỗi 15 giây khi tab hiển thị |
| OFF-02 | Suy giảm có trần khi vắng | Tối đa 8 giờ tính; hunger/vui giảm chậm có trần và sàn; năng lượng tăng | M | 🚧 Branch | FN-GS-08 | Hằng số ở `OFFLINE_CONFIG` |
| OFF-03 | Quà mèo để lại | 1 quà / 30 phút vắng, tối đa 6; xu hoặc đồ ăn, tỉ lệ 60/30/10 | S | 🚧 Branch | FN-GS-09 | |
| OFF-04 | Hộp thoại nhận quà | Hiện khi quay lại, không đóng khi bấm nền; nhận → cộng xu/kho/EXP; quà chưa nhận được giữ qua lần tải | S | 🚧 Branch | FN-GS-10, FN-APP-05, FN-APP-25 | Tối đa 12 quà tồn |

## 6. CUS — Tuỳ biến

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| CUS-01 | Màu lông | 5 loại: cam gốc, tam thể, tuxedo, đen, xiêm | S | ✅ Done | FN-GS-27, FN-REN-09 | |
| CUS-02 | Mũ | Sinh nhật, đầu bếp, phù thủy | C | ✅ Done | FN-REN-15 | |
| CUS-03 | Kính | Kính râm, kính tròn | C | ✅ Done | FN-REN-15 | |
| CUS-04 | Phụ kiện cổ | Nơ đỏ, chuông vàng | C | ✅ Done | FN-REN-15 | |
| CUS-05 | Chủ đề phòng | Nắng ban mai, hoàng hôn, đêm sao; đổi bằng class CSS | C | ✅ Done | FN-APP-09 | |

## 7. REN — Đồ hoạ Canvas 2D

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| REN-01 | Mèo "loaf" 3/4 vẽ thủ tục | Toàn bộ vẽ bằng lệnh canvas, không sprite; vẽ theo lớp: đuôi → thân → chân dưới → đầu (tai, mặt, mũ/kính) → phụ kiện cổ → chân giơ lên | M | ✅ Done | FN-REN-12, FN-REN-18..22 | |
| REN-02 | Hoạt ảnh theo trạng thái | Thở, chớp mắt, giật tai, nhồi bột, nhai, lắc mông, Zoomies chạy ngang | M | ✅ Done | FN-REN-07 | |
| REN-03 | Mắt mèo | 5 kiểu: mở (mống mắt phủ kín, đồng tử khe/tròn, mí trên theo rig, bám con trỏ), cười `^ ^`, nhắm `︶`, nhắm chặt `> <`, mắt to long lanh | S | ✅ Done | FN-REN-30, FN-REN-31, FN-REN-14 | |
| REN-04 | Hệ hạt hiệu ứng | Tim, sao, vụn thức ăn, bụi, Z ngủ | S | ✅ Done | FN-REN-05, FN-REN-17 | Hạt là emoji |
| REN-05 | Mèo nằm giữa thảm, co giãn theo màn hình | Vị trí mặc định là chính giữa tấm thảm của ảnh nền (`ROOM_BG`, nền `cover` căn đáy); `scale` theo tỉ lệ ảnh nền; đĩa ăn đặt cạnh chỗ mèo đang nằm; đi dạo và Zoomies trong phạm vi thảm | S | ✅ Done | FN-REN-02, FN-REN-41 | Màn thấp thì túi đồ che một phần mèo: thu gọn túi đồ (UI-09) |
| REN-06 | Bong bóng thoại bám theo mèo | Chữ đổi theo trạng thái và chỉ số | C | ✅ Done | FN-REN-07, FN-APP-07 | |
| REN-07 | Hiển thị vật phẩm đặc thù | Chuột cót, cá bông chưa có hình | S | 🟡 Partial | FN-REN-16 | Trùng ACT-07 |
| REN-08 | Mặt chi tiết | Mũi bo tròn, nhân trung, đệm râu, 10 kiểu miệng, râu đổi hướng theo cảm xúc (sáng màu trên lông tối), giọt mồ hôi khi dỗi | S | ✅ Done | FN-REN-22, FN-REN-32, FN-REN-33 | |
| REN-09 | Tai theo cảm xúc | Xoay ngang (tai máy bay), ép sát, chụm trước; đầu tai bo, lông tơ trong tai | S | ✅ Done | FN-REN-29 | |
| REN-10 | Chân và thân | Cẳng chân trước, bàn chân có ngón, đệm thịt; đùi sau và chân sau; 8 tư thế chân (gập, nhồi bột, duỗi, ngửa, xin ăn, liếm, rửa mặt, vồ) | S | ✅ Done | FN-REN-19, FN-REN-20, FN-REN-26..28 | |
| REN-11 | Đuôi tham số | Dựng/hạ, xù, vẫy/quất theo rig; sọc theo đường cong; cuộn quanh người khi ngủ | S | ✅ Done | FN-REN-18 | |
| REN-12 | Biến đổi thân | Nhảy lên, kéo dài, hạ thấp rình mồi, lắc lư; chu kỳ rình → vồ khi chơi | S | ✅ Done | FN-REN-12, FN-REN-23 | |
| REN-13 | Cat Lab (thử animation trước khi áp dụng) | `tools/cat-lab.html`: bản nháp / bản chính / so sánh song song; 24 trạng thái dạng lưới hoặc phóng to; nút tương tác nhanh và phím tắt; dừng, từng khung, tốc độ; chỉnh rig bằng thanh trượt và xuất `rig: {...}`. `node tools/lab-sync.js draft/status/apply` quản lý bản nháp | S | ✅ Done | FN-SRV-03 | `tools/` không commit (chỉ có trên máy chạy server); chia sẻ trong LAN qua `http://<IP LAN>:3333/tools/cat-lab.html`. Quy trình trong CLAUDE.md |

## 8. AUD — Âm thanh

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| AUD-01 | Tiếng meow tổng hợp | 4 biến thể: normal, happy, hungry, purr-chirp | S | ✅ Done | FN-AUD-04 | Không dùng file âm thanh |
| AUD-02 | Tiếng rù rù | Vòng lặp nhiễu lọc, bật khi vuốt ve, tắt khi ngừng vuốt | C | ✅ Done | FN-AUD-05, FN-AUD-06, FN-REN-07 | Trước đây không bao giờ tắt; đã sửa |
| AUD-03 | Hiệu ứng hành động | Nhai, uống, ngáp, kêu chít, xu, lên cấp | C | ✅ Done | FN-AUD-07..13 | `pop()` có định nghĩa nhưng không nơi nào gọi |
| AUD-04 | Nhạc nền | Bật/tắt trong Cài đặt | C | ✅ Done | FN-AUD-14..16 | |
| AUD-05 | Tắt tiếng + mở khoá autoplay | Nút tắt tiếng; `AudioContext` chỉ khởi tạo sau thao tác đầu tiên | S | ✅ Done | FN-AUD-03, FN-APP-02 | |

## 9. UI — Giao diện

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| UI-01 | HUD hồ sơ | Tên mèo (đổi được), cấp, thanh EXP, số xu | M | ✅ Done | FN-APP-07, FN-GS-23 | |
| UI-02 | Thanh chỉ số | 4 thanh + số liệu | M | ✅ Done | FN-APP-07 | |
| UI-03 | Dock kho đồ 5 tab | Đồ ăn, Đồ chơi, Trang phục, Đồ dùng, Đặc biệt | M | ✅ Done | FN-APP-08 | |
| UI-04 | Menu hành động nhanh | 6 nút: Vuốt ve, Chơi đùa, Cho ngủ, Lăn lộn, Vươn vai, Nháy mắt (nút "Cho ăn" đã thay bằng kéo thả) | S | ✅ Done | FN-APP-11..15, FN-APP-33 | |
| UI-05 | Điều hướng trên phải | Phòng, Trang phục, Bộ sưu tập, Cài đặt | S | ✅ Done | FN-APP-16..19 | |
| UI-06 | Hệ modal | Cửa hàng, Tủ đồ, Sưu tập, Cài đặt, Lên cấp, Quà | M | ✅ Done | FN-APP-20..24 | |
| UI-07 | Toast | Thông báo ngắn trên đầu, tự tắt sau 2.8 giây | S | ✅ Done | FN-APP-03 | |
| UI-08 | Bảng nhiệm vụ | Nằm trong cột trái ngay dưới bảng chỉ số (trước đây đặt cố định `top: 260px` nên bị che); chuỗi 🔥 + vé ❄️, đồng hồ làm mới, 3 nhiệm vụ có thanh tiến độ và chip thưởng, nút Nhận, nút đổi 🔄, hộp quà ngày ●●○ | C | ✅ Done | FN-APP-35 | |
| UI-09 | Thu gọn các bảng UI | Nút –/+ trên bảng chỉ số, nhiệm vụ, menu hành động, túi đồ, thẻ hành động; nút "Thu gọn" trên thanh điều hướng và phím H để thu gọn / mở tất cả; lưu theo trình duyệt; khi thu gọn bảng chỉ số hiện một dòng tóm tắt, bảng nhiệm vụ hiện "x/3 🎁"; bấm tab túi đồ khi đang thu gọn thì mở ra. Lần đầu (chưa chọn) trên màn cao < 900px tự thu bảng chỉ số | S | ✅ Done | FN-APP-38 | Khoá localStorage `meow_ui_collapsed` |
| UI-10 | Giao diện gọn | Các bảng nổi thu theo biến `--ui-scale` (CSS `zoom`, thu cả vùng bấm): 0.85 mặc định, 0.78 khi màn cao ≤ 820px, 0.9 trên màn ≥ 1700×1000; lề sát mép hơn (12–14px), ô túi đồ nhỏ hơn. Ở mức 0.78 ô đồ ăn ~64px, nút ~47px | S | ✅ Done | — | Chỉ CSS (style.css, mục "KÍCH THƯỚC UI GỌN") |

## 10. NET — Nhiều người trong văn phòng

Lưu ý kiến trúc: mỗi trình duyệt có **mèo riêng**; chỉ **luồng thông báo hành động** là chung (xem BKL-07 nếu muốn mèo dùng chung).

| ID | Feature | Mô tả | Ưu tiên | Trạng thái | Function liên quan | Ghi chú |
|---|---|---|---|---|---|---|
| NET-01 | Máy chủ file tĩnh | HTTP phục vụ toàn bộ frontend, `no-cache` | M | 🟡 Partial | FN-SRV-03 | Phục vụ cả `.git/` và `server.js` (xem NFR-03) |
| NET-02 | WebSocket cùng cổng | Kết nối, chào mừng, đếm online | M | ✅ Done | FN-SRV-04, FN-NET-03 | |
| NET-03 | Nhận diện máy (IP + hostname) | Reverse DNS có timeout 1.5 giây và cache | S | ✅ Done | FN-SRV-01, FN-SRV-02 | Bật/tắt qua `ENABLE_REVERSE_DNS` |
| NET-04 | Biệt danh | Đặt tên hiển thị, lưu cục bộ, gửi lại khi kết nối | S | ✅ Done | FN-NET-06, FN-NET-07 | Tối đa 30 ký tự |
| NET-05 | Phát hành động | Vuốt, ăn, chơi, ngủ, đổi trang phục/phòng/tên... broadcast cho mọi máy | S | ✅ Done | FN-NET-09, FN-SRV-05 | Vuốt ve có throttle 1200 ms |
| NET-06 | Thẻ thông báo nổi từ dưới lên | Tối đa 5 thẻ, 4.5 giây/thẻ, màu viền theo hành động | S | ✅ Done | FN-NET-10 | |
| NET-07 | Thanh trạng thái mạng | Chấm online/offline, số máy, tên của mình | S | ✅ Done | FN-NET-02, FN-NET-04, FN-NET-06 | |
| NET-08 | Tự kết nối lại | Thử lại sau 3 giây khi mất kết nối | S | ✅ Done | FN-NET-03 | |
| NET-09 | Thông báo hệ thống khi có người vào/ra | `system_broadcast`, `user_left` | C | ✅ Done | FN-SRV-04, FN-NET-11 | Client có xử lý `user_joined` nhưng server không gửi |

## 11. NFR — Phi chức năng

| ID | Yêu cầu | Mô tả | Ưu tiên | Trạng thái | Ghi chú |
|---|---|---|---|---|---|
| NFR-01 | Không cần build | Vanilla JS, chạy bằng `npm start` | S | ✅ Done | Phụ thuộc duy nhất: `ws` |
| NFR-02 | Không phụ thuộc tài nguyên ngoài | Âm thanh tổng hợp, mèo vẽ bằng code | C | ✅ Done | Chỉ có `room_bg.jpg` (710 KB) |
| NFR-03 | An toàn dữ liệu hiển thị (chống XSS) | Dữ liệu do máy khác gửi phải được escape | M | 🟡 Partial | `detail` của thông báo hành động chưa escape (BKL-02) |
| NFR-04 | Giới hạn file được phục vụ | Chỉ phục vụ file frontend cần thiết | M | 🟡 Partial | `/.git/config` và `server.js` đang truy cập được (BKL-03) |
| NFR-05 | Kiểm thử tự động | Có test cho logic game | S | 🟡 Partial | Chưa có test nào (BKL-09) |
| NFR-06 | Hiệu năng UI | Tránh dựng lại DOM không cần thiết | C | 🟡 Partial | `updateHUD` dựng lại nhiệm vụ và dock ở mỗi `notify()` (BKL-10) |

## 12. BKL — Backlog đề xuất

Các hạng mục rút ra từ phân tích mã nguồn và nghiên cứu game thú cưng; chưa bắt đầu.

| ID | Hạng mục | Mô tả | Ưu tiên | Trạng thái | Liên quan |
|---|---|---|---|---|---|
| BKL-01 | Reset nhiệm vụ theo ngày | Lưu ngày hiện tại, sang ngày mới thì đặt lại tiến độ nhiệm vụ; bỏ tiến độ dở dang trong dữ liệu mặc định | M | ✅ Done (2026-10-26) | ECO-05 |
| BKL-02 | Sửa XSS ở thông báo hành động | Escape `detail` (hoặc server chỉ nhận mã hành động rồi tự dựng câu); escape tên mèo/biệt danh trong toast | M | ⬜ Planned | NFR-03, NET-06 |
| BKL-03 | Danh sách cho phép file tĩnh | Chỉ phục vụ `index.html`, `*.css`, `*.js` frontend và `assets/`; chặn `.git`, `server.js`, `package*.json` | M | ⬜ Planned | NFR-04, NET-01 |
| BKL-04 | Kích hoạt `SULKING` | Mèo dỗi khi bị bỏ rơi lâu hoặc đói kéo dài (liên hệ với quà offline) | C | ✅ Done (2026-10-26) | PET-03 |
| BKL-05 | Mở khoá thành tựu `laser_chaser` + hiển thị bộ sưu tập thức ăn/đồ chơi | Đếm lần "bắt hụt" laser; dùng `foodsDiscovered`/`toysUsed` | C | ⬜ Planned | ECO-06, ECO-07 |
| BKL-06 | Giới hạn Nước Tăng Lực | Có giá, có số lượng trong kho, hoặc hồi chiêu | S | ⬜ Planned | ECO-08 |
| BKL-07 | Mèo dùng chung cả văn phòng | Server giữ trạng thái mèo duy nhất, mọi máy cùng nuôi (cần quyết định thiết kế) | W | ⬜ Planned | NET |
| BKL-08 | Hoàn thiện đồ chơi chuột cót & cá bông | Vẽ và hoạt ảnh cho 2 đồ chơi đã bán | S | ⬜ Planned | ACT-07, REN-07 |
| BKL-09 | Bộ test cho logic thuần | Tách logic offline/quà/chỉ số ra để test bằng `node --test` | S | ⬜ Planned | NFR-05 |
| BKL-10 | Tối ưu dựng HUD | Chỉ cập nhật phần đổi; không dựng lại nhiệm vụ/dock khi không cần | C | ⬜ Planned | NFR-06 |
