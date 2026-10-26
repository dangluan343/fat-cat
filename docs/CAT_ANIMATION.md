# Model mèo: biểu cảm, hành động và kế hoạch code

Tài liệu cho phần vẽ và hoạt ảnh con mèo trong `cat-renderer.js`: phân tích model cũ, nghiên cứu hành vi mèo thật, cách chuyển thành tham số trong game, danh sách hành động/biểu cảm và kế hoạch triển khai.

- Cập nhật: 2026-10-26, nhánh `feat/offline-progress`
- Liên quan: [FEATURE_LIST.md](FEATURE_LIST.md) (PET, REN), [FUNCTION_LIST.md](FUNCTION_LIST.md) (FN-REN, FN-GS)
- Xem trực quan và thử trước khi áp dụng: Cat Lab tại `http://localhost:3333/tools/cat-lab.html` (bản nháp), `?src=main` (bản chính), `?compare=1` (so sánh). Quy trình nháp → lab → áp dụng: CLAUDE.md, mục "Quy trình animation".

## 1. Phân tích model trước khi sửa

Model là con mèo nằm dáng "loaf" góc 3/4, vẽ hoàn toàn bằng lệnh Canvas 2D (không sprite). Các vấn đề:

| Bộ phận | Hiện trạng | Vấn đề |
|---|---|---|
| Mắt | 4 kiểu cố định: tròng trắng + mống xanh bám chuột, `^ ^` khi vuốt, `⌒` khi ngủ/chớp, mắt anime khi xin ăn | Mắt có lòng trắng lớn, không giống mắt mèo (mống mắt mèo phủ gần hết mắt). Không có mí mắt nên không diễn được buồn ngủ, buồn, cau có. Con ngươi luôn tròn, không có khe dọc. Ngủ và vui dùng hình gần giống nhau |
| Miệng | `:3`, há (ngáp), nhai | Thiếu kêu meo, thè lưỡi, bĩu môi, há hốc, mím |
| Mũi, mõm | Tam giác nhọn, không có đệm râu | Mặt phẳng, thiếu "ω" đặc trưng của mõm mèo |
| Râu | 3 sợi mỗi bên, chỉ rung nhẹ | Không đổi hướng theo cảm xúc (tò mò chĩa trước, sợ cụp sau) |
| Tai | Chỉ nghiêng 0.14 rad khi vuốt + giật tai ngẫu nhiên | Tai là kênh cảm xúc quan trọng nhất của mèo nhưng không diễn gì |
| Đầu | Viền má là đa giác răng cưa; đầu và mặt vẽ ở hai phép dịch riêng | Không nghiêng, không cúi được; má gai góc |
| Thân | Một khối bánh mì + 3 sọc | Không có đùi sau, không có chân sau, không rình/vồ/nhảy được |
| Chân trước | Hai elip + 2 vạch ngón | Không có cẳng chân; chân giơ lên (xin ăn) bị đầu che khuất; liếm chân không đưa chân lên miệng |
| Đuôi | Hình cố định dựng lên, lắc nhẹ; khi ngủ cuộn | Không hạ, không xù, không quất (đuôi là kênh cảm xúc thứ hai) |
| Trạng thái | 11 trạng thái nhưng `SULKING` không có hình riêng và không bao giờ được kích hoạt | Ít đa dạng, các trạng thái chuyển giật cục (đổi hình tức thời) |
| Âm thanh | Tiếng rù rù bật khi vuốt nhưng không bao giờ tắt | Lỗi: rù rù kéo dài vô hạn sau lần vuốt đầu tiên |

## 2. Nghiên cứu: mèo thật biểu lộ cảm xúc thế nào

Mèo giao tiếp chủ yếu bằng **tai, mắt, râu, đuôi và tư thế thân**; các nguồn hành vi đều khuyên đọc tổng hợp các tín hiệu chứ không đọc riêng lẻ.

| Kênh | Tín hiệu | Ý nghĩa |
|---|---|---|
| Tai | Dựng, hơi chĩa về trước | Thư giãn, hài lòng |
| | Chĩa hẳn về trước, xoay theo tiếng động | Tò mò, chú ý, săn mồi |
| | Xoay ngang ra hai bên ("tai máy bay") | Khó chịu, lo lắng |
| | Ép sát ra sau | Sợ hãi hoặc gây hấn |
| Mắt | Nháy chậm (vài lần khép hờ rồi nhắm lâu) | Tin tưởng, thân thiện. Nghiên cứu Humphrey và cộng sự (2020): mèo nháy chậm đáp lại khi chủ nháy chậm với chúng, và dễ lại gần người lạ hơn sau khi được nháy chậm |
| | Mí nặng, khép hờ | Thư giãn, buồn ngủ |
| | Nhìn chằm chằm không chớp | Cảnh giác, đe doạ |
| | Đồng tử giãn to | Hứng thú khi chơi, giật mình, sợ |
| | Đồng tử co thành khe | Bình tĩnh trong ánh sáng mạnh, hoặc cáu giận |
| Râu | Thả lỏng sang hai bên | Bình tĩnh, trìu mến |
| | Chĩa ra trước | Tò mò, hứng thú, đang săn |
| | Cụp sát má ra sau | Sợ, phòng thủ |
| Đuôi | Dựng thẳng, chóp hơi cong | Thân thiện, chào đón |
| | Quất qua lại mạnh | Bực bội |
| | Chóp đuôi giật giật | Tập trung rình mồi |
| | Xù to | Giật mình, sợ |
| | Hạ thấp / kẹp | Lo lắng, buồn, phục tùng |
| | Quấn quanh người | Nghỉ ngơi, ấm áp |
| Thân | Nằm loaf, gập chân | Thư giãn nhưng sẵn sàng |
| | Lăn ngửa bụng | Tin tưởng, muốn chơi |
| | Hạ thấp, lắc mông | Chuẩn bị vồ |
| | Nhồi bột (nhào chân) | Mãn nguyện (hành vi từ lúc bú mẹ) |
| | Vươn vai, ngáp | Vừa thức, thoải mái |
| | Liếm chân rồi xoa mặt | Chải chuốt, tự trấn an |
| | Thè lưỡi quên thụt ("blep") | Thư giãn đến mức quên |
| Tương tác | Bị vuốt quá lâu thì đột ngột cáu | Kích thích quá mức khi được vuốt (petting-induced aggression), thường báo trước bằng tai xoay ngang, đuôi quất |

## 3. Chuyển hoá thành model trong game

### 3.1 Nguyên tắc

1. **Tách lớp** (giống cách làm trong animation nhân vật: mỗi vùng mặt chỉ thuộc một hệ để các lớp không đánh nhau): lớp **tư thế** (thân, chân), lớp **biểu cảm** (mắt, mí, miệng, má), lớp **chuyển động phụ** (tai, râu, đuôi, thở, chớp mắt).
2. **Rig tham số liên tục thay cho hình cố định.** Mỗi kênh cảm xúc ở mục 2 thành một con số. Mỗi trạng thái hành vi chỉ khai báo **đích** cho các số đó; mỗi khung hình renderer nội suy giá trị hiện tại về đích, nên chuyển trạng thái mượt mà và kết hợp được.
3. **Kiểu rời rạc** chỉ dùng cho thứ không nội suy được: kiểu mắt (mở, cười `^ ^`, nhắm, nhắm chặt, mắt to long lanh), kiểu miệng, tư thế chân, kiểu đuôi.
4. **Hoạt ảnh có kịch bản theo thời gian** cho các hành động có nhịp (nháy chậm, vồ mồi, giật mình nhảy lên) dựa vào thời gian đã ở trong trạng thái.
5. **Tâm trạng nền** từ chỉ số: lúc rảnh, mèo đói/buồn/mệt sẽ hiện ra mặt (mí cụp, đuôi thấp, mắt lim dim) mà không cần trạng thái riêng.
6. Áp dụng nguyên tắc hoạt hình cổ điển: chuẩn bị (hạ người trước khi vồ), co giãn (nhún khi vuốt), chuyển động theo đà (đuôi, tai), phóng đại vừa phải.

### 3.2 Bảng tham số rig (`RIG_DEFAULTS` trong `cat-renderer.js`)

| Tham số | Khoảng | Ý nghĩa | Kênh hành vi |
|---|---|---|---|
| `eyeOpen` | 0 → 1 → 1.35 | Nhắm → mở → mở to | Mí mắt |
| `pupil` | 0.15 → 0.9 | Khe dọc → giãn tròn | Đồng tử |
| `lidTilt` | −1 → +1 | Mí xếch vào trong (cau có) → đuôi mí cụp (buồn, nài nỉ) | Mí mắt |
| `mouthOpen` | 0 → 1 | Khép → há | Miệng |
| `blush` | 0 → 1 | Độ hồng má | Cảm xúc dễ thương |
| `whisker` | −1 → +1 | Cụp sau → chĩa trước | Râu |
| `earRot` | −0.2 → 0.6 | Chụm trước → xoay ngang (tai máy bay) | Tai |
| `earFlat` | 0 → 1 | Dựng → ép sát | Tai |
| `headTilt`, `headDX`, `headDY` | rad, px | Nghiêng / dịch đầu | Đầu |
| `tailRaise` | 0 → 1 | Sát sàn → dựng thẳng | Đuôi |
| `tailPuff` | 0 → 1 | Bình thường → xù | Đuôi |
| `tailSwayAmp`, `tailSwaySpeed` | px, rad/s | Biên độ, tốc độ vẫy (nhanh = quất) | Đuôi |
| `bodyLift` | px | Nhảy lên (âm) | Thân |
| `bodyStretch` | 0 → 0.15 | Kéo dài (vươn, vồ) | Thân |
| `crouch` | 0 → 1 | Hạ thấp rình | Thân |
| `bodyRock` | 0 → 1 | Lắc lư (lăn lộn) | Thân |

## 4. Danh sách hành động và biểu cảm

Cột "Trạng thái" là tên `behaviorState`. ✅ = đã làm trong lần này.

### 4.1 Hành động có sẵn, làm lại bằng rig

| Trạng thái | Biểu cảm | Tư thế / chuyển động | Kích hoạt | Trạng thái |
|---|---|---|---|---|
| `IDLE` | Mắt mở bám chuột; tâm trạng nền theo chỉ số | Loaf, đuôi dựng vẫy nhẹ | Mặc định | ✅ |
| `PETTING` | Mắt cười `^ ^`, má hồng đậm, đầu nghiêng | Nhồi bột nhẹ, đuôi dựng vẫy chậm | Vuốt ve | ✅ |
| `SLEEPING` | Mắt nhắm `︶`, tai hơi xoay | Đầu cúi, đuôi cuộn quanh người | Năng lượng thấp, nút Cho ngủ | ✅ |
| `YAWNING` | Mắt nhắm chặt `> <`, miệng há có răng nanh | Duỗi chân trước, thân kéo dài, ngửa đầu | Ngẫu nhiên, nút Vươn vai | ✅ |
| `LICKING_PAW` | Mắt nhắm, lưỡi thè | **Giơ chân lên miệng** (có cẳng chân) | Ngẫu nhiên | ✅ |
| `ROLLING` | Mắt cười, miệng há vui | Lắc lư thân, chân ngửa khoe đệm thịt, đuôi hạ quẫy | Ngẫu nhiên, nút Lăn lộn | ✅ |
| `BEGGING` | Mắt to long lanh, mí nài nỉ, miệng kêu meo theo nhịp | **Chắp hai chân trước ngực** (trước kia bị đầu che) | Đói < 35 | ✅ |
| `EATING` | Mắt cười, miệng nhai | Cúi đầu về phía bát | Cho ăn | ✅ |
| `PLAYING` | Đồng tử giãn, tai chĩa trước, râu chĩa trước | **Chu kỳ rình → lắc mông → vồ (thân bay lên, chân vả) → tiếp đất**; chóp đuôi giật | Chơi đồ chơi | ✅ |
| `ZOOMIES` | Mắt mở to, đồng tử giãn, tai bị gió thổi ra sau | Chạy ngang, đuôi hơi xù | Năng lượng cao, cỏ mèo | ✅ |
| `SULKING` | Mí cụp buồn, nhìn đi chỗ khác, bĩu môi, giọt mồ hôi | Tai ép, đuôi sát sàn, đầu quay đi | **Mới kích hoạt**: vui < 30 | ✅ |

### 4.2 Hành động và biểu cảm mới

| Trạng thái | Biểu cảm | Tư thế / chuyển động | Kích hoạt | Ý nghĩa gameplay | Trạng thái |
|---|---|---|---|---|---|
| `SLOW_BLINK` | Khép hờ → nhắm lâu → mở dần, má hồng, 💗 | Đầu nghiêng nhẹ | Ngẫu nhiên khi vui > 65; **nút mới "Nháy mắt"** (người chơi nháy với mèo, mèo nháy lại) | +4 vui, +3 EXP, hồi chiêu 8 giây | ✅ |
| `CURIOUS` | Mắt mở to, tai chụm trước, râu chĩa trước, ❓ | Nghiêng đầu rõ | Ngẫu nhiên; đá bóng len khi mèo đang rảnh | Thuần cảm xúc | ✅ |
| `SURPRISED` | Mắt mở to, đồng tử giãn, miệng "o", ❗ | Nhảy dựng lên, đuôi xù | Bấm vào mèo khi đang ngủ | Đánh thức đột ngột | ✅ |
| `ANNOYED` | **Mày chau chữ V**, mí xếch mạnh (`lidTilt` −0.9), đồng tử khe, **miệng gằn lộ một nanh**, râu cụp, **dấu gân 💢 đập trên trán**; không hiện tim hay vòng rù rù | Tai máy bay ép xuống, đầu hơi cúi, đuôi quất nhanh | Vuốt liên tục quá lâu (≥ 32 lần trong 10 giây) | Trong 3.5 giây vuốt không được thưởng, −3 vui | ✅ (làm lại 2026-10-26: bản đầu trông "chán" hơn là cáu) |
| (lớp phản ứng) Chờ đồ ăn | Mắt mở to, đồng tử giãn, mày phẳng; kề mèo thì há miệng kêu chờ | Tai và râu chĩa trước, đầu nghiêng | Người chơi đang kéo món ăn (không áp dụng khi ngủ/cáu) | Đi cùng cho ăn kéo thả, vùng thả nét đứt quanh mèo | ✅ |
| `KNEADING` | Mắt cười, má hồng, 🎵 | Nhồi bột rõ hai chân, vòng rù rù | Ngẫu nhiên khi vui > 65 | Thuần cảm xúc | ✅ |
| `BLEP` | Mắt mở bình thường, lưỡi thè ra giữa | Đứng yên | Ngẫu nhiên | Thuần cảm xúc, dễ thương | ✅ |
| `GREETING` | Mắt cười rồi mở, miệng kêu "rừ" ngắn, 💛 | Đuôi dựng thẳng | Quay lại sau khi vắng (thay cho ngáp) | Gắn với quà offline | ✅ |
| `GROOMING` | Mắt nhắm | **Chân xoa vòng tròn trên má** | Ngẫu nhiên | Thuần cảm xúc | ✅ |

### 4.2b Nhóm P1: biểu cảm gắn với chỉ số (làm 2026-10-26)

| Trạng thái | Biểu cảm | Tư thế / chuyển động | Kích hoạt | Ý nghĩa gameplay | Trạng thái |
|---|---|---|---|---|---|
| `SICK` | Mí sụp, mày nhướn lo, quầng thâm, vạch u ám trên trán, má tái, miệng run, 🤒 | Run lẩy bẩy, đầu cúi, đuôi sát sàn | Sức khoẻ < 30 (60% mỗi lượt AI) | Báo hiệu cần cho ăn đầy đủ (sức khoẻ chỉ tụt khi đói lâu) | ✅ |
| `EXHAUSTED` | Mí sụp dần rồi giật mình mở, quầng thâm, 😪 | Gật gù: đầu gục dần rồi ngẩng lên, người hạ thấp | Năng lượng < 15: bấm chơi thì từ chối; AI có 50% gật gù trước khi ngủ | Chơi không được thưởng, nhắc cho ngủ | ✅ |
| `STARVING` | Mắt to ướt có giọt nước mắt, mày lo, kêu yếu từng hồi, 😿 | Nằm bẹp sát sàn, đầu gục, đuôi sát sàn | Đói < 10 (thay cho xin ăn) | Mức khẩn hơn xin ăn | ✅ |
| `FULL` | Mắt cười, má hồng, liếm mép (lưỡi quét qua lại), 😋 | Bụng phình, nằm ườn | Ăn tới đói ≥ 95 thì nối sau khi ăn; đã no mà vẫn thả đồ ăn thì từ chối | Món ăn không bị trừ khi mèo từ chối | ✅ |
| `HISS` | Há rộng lộ 4 nanh, nhăn mũi, mày chau, đồng tử giãn, dấu gân, 😾 + tiếng rít | Lao tới rồi lùi lại, tai ép sát, đuôi xù tua tủa | Vẫn bị vuốt 6 lần khi đang cáu | −5 vui, 2.5 giây không nhận vuốt | ✅ |

Chi tiết vẽ thêm: cờ `shiver`, `eyeBags`, `sickTint`, `tear`, `bellyPuff`, `noseWrinkle` trong `CAT_EXPRESSIONS`; miệng `wobble`, `licklips`, `hiss`; đuôi xù có viền lông tua tủa và chóp không phình quá to; `HOSTILE_STATES` gom cáu + rít. Ngưỡng ở `VITAL_MOODS` (game-state.js).

### 4.2c Đi dạo (làm 2026-10-26)

| Trạng thái | Biểu cảm | Tư thế / chuyển động | Kích hoạt | Trạng thái |
|---|---|---|---|---|
| `WALKING` | Mắt nhìn về phía trước, đuôi dựng | Đứng dậy bốn chân (`rig.stand`, chân mọc dần), bước theo cặp chéo, đầu nhấp nhô, đi chậm qua lại giữa hai nửa thảm, quay mặt theo hướng đi | AI chọn ngẫu nhiên (trọng số gấp đôi); bị tương tác chen ngang thì dừng tại chỗ, xong việc đi tiếp; đang kéo đồ ăn tới thì đứng chờ | ✅ |

Vị trí mặc định của mèo là **chính giữa tấm thảm**; đi dạo xong thì nằm lại chỗ dừng (resize cửa sổ thì về giữa thảm). Hướng mặt được giữ sau khi dừng; mắt bám con trỏ đã tính cả hướng mặt.

### 4.3 Chi tiết model được sửa

| Bộ phận | Sửa | Trạng thái |
|---|---|---|
| Mắt | Mắt hạnh nhân, mống mắt phủ kín (bỏ lòng trắng), đồng tử elip dọc co giãn theo `pupil`, **mí trên** che theo `eyeOpen` và nghiêng theo `lidTilt`, 2 đốm sáng | ✅ |
| Kiểu mắt nhắm | Tách 3 kiểu: cười `^ ^`, ngủ `︶`, nhắm chặt `> <` | ✅ |
| Mũi, mõm | Mũi bo tròn có đốm sáng, nhân trung, **hai đệm râu** có chân râu | ✅ |
| Miệng | 11 kiểu: `:3`, há vui, meo, ngáp có nanh, nhai, liếm, blep, "o", bĩu môi, mím, gằn lộ nanh (`grumble`) | ✅ |
| Lông mày | Mày hoạt hình hiện theo `lidTilt`: chau chữ V khi cáu, nhướn lo lắng khi dỗi/nài nỉ/đói | ✅ |
| Vị trí nằm | Mèo nằm trên tấm thảm của ảnh nền (tính theo `ROOM_BG`), né các khối UI, co giãn theo ảnh nền; trước đây đặt theo % màn hình nên lơ lửng khi cửa sổ hẹp | ✅ |
| Râu | Mọc từ đệm râu, góc và độ xoè theo `whisker` | ✅ |
| Tai | Xoay ngang và ép theo rig, đầu tai bo tròn, lông tơ trong tai | ✅ |
| Đầu | Viền má xù mềm bằng đường cong thay cho răng cưa; đầu, mặt, mũ, kính nằm chung một phép biến đổi nên nghiêng/cúi cùng nhau | ✅ |
| Thân | Thêm đùi sau và bàn chân sau thò ra, lông ngực xù | ✅ |
| Chân trước | Có cẳng chân; bàn chân có ngón; đệm thịt hồng khi ngửa; chân giơ lên vẽ **trên** mặt | ✅ |
| Đuôi | Vẽ theo đường cong tham số: hạ/dựng, xù, vẫy/quất, sọc theo đường cong | ✅ |
| Âm thanh | Tắt rù rù khi hết được vuốt | ✅ |

### 4.4 Biểu cảm và hành động chưa có (backlog)

Nhóm P1 (ốm, kiệt sức, đói lả, no căng, rít) đã làm, xem mục 4.2b. Ưu tiên: **P1** gắn với chỉ số/cơ chế đang có, **P2** tăng sống động, **P3** cần cơ chế hoặc tư thế mới. "Chi phí": S = chỉ thêm dữ liệu `CAT_EXPRESSIONS` (+ điều kiện kích hoạt), M = thêm kiểu vẽ mới (mắt/miệng/chân), L = vẽ lại silhouette thân.

**Biểu cảm gắn với chỉ số**

| Mã đề xuất | Biểu cảm | Hành vi mèo thật | Kích hoạt trong game | Ưu tiên | Chi phí |
|---|---|---|---|---|---|
| `DISAPPOINTED` | Thất vọng: tai cụp nhẹ, nhìn bát trống | Chờ ăn mà không được | Kéo đồ ăn tới rồi thả ra ngoài / hết món | P2 | S |
| `SATISFIED_LICK` | Liếm mép sau khi ăn | Hành vi rất phổ biến sau bữa ăn | Ngay sau `EATING` | P2 | M (lưỡi liếm ngang mép) |

**Phản ứng cảm xúc**

| Mã đề xuất | Biểu cảm | Hành vi mèo thật | Kích hoạt trong game | Ưu tiên | Chi phí |
|---|---|---|---|---|---|
| `SCARED` | Sợ: đồng tử giãn hết, tai ép, râu cụp, đuôi kẹp hoặc xù, co rúm | Phản ứng với tiếng động lạ | Âm thanh lớn, đá bóng len trúng mèo, sấm khi đổi phòng "đêm" | P2 | M |
| `EMBARRASSED` | Ngượng: quay đi liếm chân như không có gì | "Displacement grooming" sau khi vồ hụt | Vồ hụt khi chơi (sau cú vồ của `PLAYING`) | P2 | S |
| `PROUD` | Tự hào: ngẩng cằm, mắt khép hờ, đuôi dựng | Mang "chiến lợi phẩm" về | Lên cấp, hoàn thành nhiệm vụ, nhận quà offline | P2 | S |
| `JEALOUS` / đòi chú ý | Dụi đầu, kêu, đứng chắn | Head bunting, đòi chơi | Lâu không tương tác khi tab đang mở | P2 | M (dụi đầu) |
| `BORED` | Chán: mặt dài, mí nặng, đuôi đập nhẹ xuống sàn | Thiếu kích thích | Rảnh lâu, vui trung bình | P3 | S |
| `LOVE` (mắt tim) | Mắt hình trái tim, má đỏ rực | (hoạt hình, không có ở mèo thật) | Vuốt đúng chỗ thích nhiều lần mà chưa cáu | P3 | M |

**Hành động tự phát**

| Mã đề xuất | Hành động | Hành vi mèo thật | Kích hoạt | Ưu tiên | Chi phí |
|---|---|---|---|---|---|
| `CHATTER` | Rung hàm, nhìn chằm chằm cửa sổ | Thấy chim, "kêu lách cách" | Ngẫu nhiên khi rảnh; phòng "nắng ban mai" | P2 | M (miệng rung) |
| `SNIFF` | Hít hít, mũi động, ngửi đồ ăn | Ngửi trước khi ăn | Kéo món ăn lần đầu tới gần (`foodsDiscovered`) | P2 | S–M |
| `FLEHMEN` | Hé miệng, môi trên nhếch, mặt "đơ" | Phản xạ ngửi mùi lạ | Sau `SNIFF` với món mới | P3 | M |
| `SNEEZE` / `HICCUP` | Hắt hơi, nấc cụt | Dễ thương ngẫu nhiên | Ngẫu nhiên hiếm | P3 | S–M |
| `DREAMING` | Ngủ mơ: râu giật, chân quơ nhẹ, miệng nhóp nhép | REM sleep | Trong `SLEEPING` lâu | P2 | S |
| `TAIL_CHASE` | Đuổi theo đuôi mình | Chơi một mình | Năng lượng cao, không có đồ chơi | P3 | L |

**Tư thế thân mới (cần vẽ lại silhouette)**

| Tư thế | Dùng cho | Ưu tiên | Chi phí |
|---|---|---|---|
| Ngồi thẳng (sit) | Chào đón, xin ăn, tự hào, nhìn cửa sổ | P2 | L |
| Nằm nghiêng duỗi dài | Ngủ say, no căng, nắng ấm | P2 | L |
| Cuộn tròn kiểu "bánh donut" | Ngủ khi lạnh/đêm | P3 | L |
| Lưng cong chữ U, xù lông | Sợ, rít | P2 | L |
| Sploot (nằm sấp duỗi chân sau) | Thư giãn, dễ thương | P3 | L |

**Khác**

| Hạng mục | Lý do để sau |
|---|---|
| Hoạt ảnh cho chuột cót, cá bông | Thuộc BKL-08 (đồ chơi) |
| Âm thanh riêng cho cáu, rít, rừ chào | Cần thêm hàm trong `audio-synth.js` |
| Dock che thảm trên màn nhỏ | Thu gọn được dock, hoặc dời thảm/nền; hiện mèo tự né sang mép thảm |

## 5. Kế hoạch code

### 5.1 Kiến trúc

```
gameState.behaviorState ──► CAT_EXPRESSIONS[state]  (kiểu mắt/miệng/chân/đuôi + đích rig)
                                   │
          getRigTarget(state) ◄────┤  + kịch bản theo stateTime (nháy chậm, vồ, giật mình)
                                   │  + tâm trạng nền từ vitals (chỉ khi IDLE)
                                   ▼
          updateRig(delta): rig += (đích − rig) × (1 − e^(−9·delta))
                                   ▼
render3DCatLoaf ─► bóng đổ ─► biến đổi thân (lift/stretch/crouch/rock)
                 ─► đuôi ─► thân ─► chân lớp dưới
                 ─► [biến đổi đầu] tai, đầu, mặt (mắt, mũi, mõm, miệng, râu, má), mũ/kính
                 ─► phụ kiện cổ ─► chân lớp trên (chân giơ lên)
```

### 5.2 Các bước

| Bước | Nội dung | File | Trạng thái |
|---|---|---|---|
| 1 | Thêm `RIG_DEFAULTS`, `CAT_EXPRESSIONS`, `STATE_MARKERS`; `this.rig`, `stateTime`; `getRigTarget`, `updateRig`, `onStateEnter` | `cat-renderer.js` | ✅ |
| 2 | Viết lại `render3DCatLoaf` (thứ tự lớp + biến đổi thân), `render3DTail` tham số | `cat-renderer.js` | ✅ |
| 3 | Thân: đùi sau, chân sau, lông ngực; chân trước 2 lớp, `drawPaw`, `drawForeleg`, `getPawPose` | `cat-renderer.js` | ✅ |
| 4 | Đầu và mặt: `render3DHead` (tai rig, viền mềm), `render3DFace`, `renderCatEye`, `renderEyeArc`, `renderMouth`, `renderWhiskers` | `cat-renderer.js` | ✅ |
| 5 | Tách phụ kiện: `renderHeadCostumes` (theo đầu), `renderNeckCostume` | `cat-renderer.js` | ✅ |
| 6 | State: 8 trạng thái mới trong `setBehavior`, AI chọn ngẫu nhiên có trọng số theo tâm trạng, `SULKING` khi buồn, danh sách trạng thái không bị AI ngắt | `game-state.js` | ✅ |
| 7 | `pet(isClick)` trả kết quả: vuốt nhẹ khi ngủ không đánh thức, bấm thì giật mình, vuốt quá lâu thì cáu; `slowBlinkAtCat()` | `game-state.js` | ✅ |
| 8 | Lời chào khi quay lại dùng `GREETING` | `game-state.js` | ✅ |
| 9 | Bong bóng thoại cho trạng thái mới, nút "Nháy mắt" | `app.js`, `index.html` | ✅ |
| 10 | Cat Lab `tools/cat-lab.html`: chạy trên bản nháp hoặc bản chính, so sánh song song; nút tương tác nhanh (vuốt với kết quả chọn được, bấm, cho ăn, đá bóng, chớp mắt, đồ chơi), dừng/từng khung/tốc độ/phát lại, phím tắt, chỉnh rig bằng thanh trượt và xuất đoạn `rig: {...}`; `node tools/lab-sync.js draft/status/apply`. **Chỉ local**: `tools/` không commit, server chặn `tools/` với máy khác | `tools/` (local), `server.js`, `.gitignore` | ✅ |
| 11 | Cập nhật Feature List, Function List, CLAUDE.md | `docs/` | ✅ |

### 5.3 Kiểm tra

- `node --check` cho các file JS đã sửa.
- Mở `tools/cat-lab.html`, chụp từng trạng thái với cả 5 màu lông, soát mắt/miệng/chân/đuôi.
- Trong game: vuốt liên tục ~10 giây phải ra `ANNOYED`; bấm khi mèo ngủ ra `SURPRISED`; nút "Nháy mắt" ra `SLOW_BLINK` và có hồi chiêu; console không lỗi.

## Nguồn

- [International Cat Care: đuôi mèo](https://icatcare.org/?p=1069)
- [Petplan: hiểu ngôn ngữ cơ thể mèo](https://www.petplan.co.uk/petplan-together/cat/understanding-cat-body-language.asp)
- [Hawaiian Humane Society: Feline Body Language (PDF)](https://hawaiianhumane.org/wp-content/uploads/2020/07/Feline-Behavior-Resources-Feline-Body-Language.pdf)
- [Cats.com: hướng dẫn ngôn ngữ cơ thể mèo](https://cats.com/?p=93238)
- [Humphrey et al. 2020, Scientific Reports: nháy mắt chậm](https://pmc.ncbi.nlm.nih.gov/articles/PMC7536207/)
- [Perlin: Layered compositing of facial expression (SIGGRAPH)](https://history.siggraph.org/learning/layered-compositing-of-facial-expression-by-perlin)
- [Animancer: lớp biểu cảm khuôn mặt](https://kybernetik.com.au/animancer/docs/samples/layers/face)
- [Hoạt ảnh khuôn mặt: mỗi vùng thuộc một hệ](https://www.abratabia.com/ai-talking-characters/facial-animation.php)
