# Gamification UX: nhiệm vụ, phần thưởng, chuỗi ngày

Nghiên cứu, đánh giá hiện trạng và kế hoạch nâng cấp hệ nhiệm vụ / phần thưởng của Meow 2D.

- Cập nhật: 2026-10-26, nhánh `feat/offline-progress`
- Liên quan: [FEATURE_LIST.md](FEATURE_LIST.md) (ECO), [FUNCTION_LIST.md](FUNCTION_LIST.md) (FN-GS, FN-APP), [CAT_ANIMATION.md](CAT_ANIMATION.md)

## 1. Nghiên cứu

### 1.1 Động lực người chơi: Thuyết Tự quyết (Self-Determination Theory)

Nghiên cứu gamification hiện nay chủ yếu nhìn qua ba nhu cầu của SDT: **năng lực** (thấy mình làm được, tiến bộ), **tự chủ** (được lựa chọn), **gắn kết** (quan hệ với người/vật khác). Điểm quan trọng nhất cho thiết kế:

- Phần thưởng **có thể tăng hoặc giảm** động lực nội tại, tuỳ việc nó hỗ trợ hay cản trở cảm giác tự chủ và năng lực. Phần thưởng mang cảm giác "bị điều khiển" dễ gây hiệu ứng *overjustification* (người chơi làm vì thưởng chứ không vì thích, bỏ thưởng là bỏ luôn).
- Điểm/huy hiệu gắn với **thành tích thật** hỗ trợ năng lực; cho **chọn cách kiếm** hỗ trợ tự chủ; mục tiêu chung hỗ trợ gắn kết.
- Kết quả phụ thuộc bối cảnh, không có công thức chung; nên giữ thưởng ở vai trò **ghi nhận** chứ không phải **mồi nhử**.

### 1.2 Nhiệm vụ hằng ngày

- Thưởng **theo từng mốc** sau mỗi lần hoàn thành giúp tăng động lực; người chơi thiên về tự chủ nên được **chọn nhiệm vụ** (Daily Quest Design for Mobile Arcade Games, 2019). Đổi nhiệm vụ (reroll) là một dạng lựa chọn nhẹ.
- Nhiệm vụ tốt: hướng dẫn rõ, mục tiêu làm được, đa dạng loại, **có thanh tiến độ** (khoá học UX gamification của Uxcel).
- Đặt **trần thưởng mỗi ngày** đủ cao để thấy tiến bộ nhưng đủ thấp để người chơi muốn quay lại hôm sau (hướng dẫn daily rewards của Unity).

### 1.3 Chuỗi ngày (streak)

- Chuỗi ngày dựa vào **sợ mất** (loss aversion) nên rất mạnh, nhưng dễ biến thành áp lực: người chơi giữ chuỗi vì sợ chứ không vì vui (bài phân tích đạo đức gamification trên UX Collective).
- Biện pháp giảm hại phổ biến: **vé đóng băng** cho phép lỡ một ngày, **reset mềm**, ân hạn. Finch (ứng dụng chăm sóc bản thân có thú cưng ảo) cho **tạm dừng chuỗi**.
- Không tìm thấy số liệu đáng tin về mức tăng giữ chân của streak; các con số "20–40%" hay "43% người dùng lo lắng" lan truyền trên blog đều không có nguồn gốc kiểm chứng được, nên tài liệu này không dùng.

### 1.4 Game / ứng dụng thú cưng tham khảo

| Sản phẩm | Cơ chế đáng học | Rủi ro cần tránh |
|---|---|---|
| **Finch** | Mục tiêu nhỏ mỗi ngày gắn với thú cưng (hoàn thành mục tiêu = thú có năng lượng đi phiêu lưu), tiền tệ mua đồ trang trí, chuỗi có thể tạm dừng | Mục tiêu quá dễ mãi mãi thì không còn thấy tiến bộ |
| **Neko Atsume** | Quà khi quay lại, sưu tập, không phạt | (đã áp dụng ở cơ chế quà offline) |
| **Tamagotchi** | Trách nhiệm chăm sóc, hành vi thú cưng là phần thưởng cảm xúc | Phạt nặng (chết) gây bỏ game |
| **Duolingo** | Chuỗi ngày rõ ràng, vé đóng băng | Chuỗi thành nỗi lo "phải giữ" |

### 1.5 Nguyên tắc rút ra cho Meow 2D

1. **Phần thưởng là ghi nhận, mèo là trung tâm.** Mỗi lần nhận thưởng mèo phản ứng vui; nhiệm vụ là những việc chăm mèo người chơi vốn đã thích làm.
2. **Rõ ràng và thấy tiến bộ.** Mỗi nhiệm vụ có số đếm và thanh tiến độ, hiện sẵn phần thưởng.
3. **Có lựa chọn.** Mỗi ngày được đổi 1 nhiệm vụ không thích.
4. **Nhận thưởng chủ động.** Bấm "Nhận" để có khoảnh khắc thành tựu (thay vì cộng ngầm), có hiệu ứng xu bay về ví.
5. **Thưởng có giới hạn, có chút bất ngờ.** Hộp quà ngày khi xong cả 3 nhiệm vụ: lượng xu dao động trong khoảng hẹp, thỉnh thoảng có món ăn hoặc đồ hiếm. Không quay số trả tiền, không có gì mua bằng tiền thật.
6. **Chuỗi ngày nhân hậu.** Chỉ cần nhận 1 nhiệm vụ/ngày là giữ chuỗi; có vé đóng băng tự dùng khi lỡ ngày; mất chuỗi không mất gì khác, kỷ lục vẫn giữ; không thông báo gây áp lực.
7. **Không phạt con mèo vì người chơi vắng.** (Đã nhất quán với cơ chế offline: chỉ số giảm có sàn.)

## 2. Đánh giá hiện trạng

| Vấn đề | Chi tiết | Hệ quả UX |
|---|---|---|
| Nhiệm vụ không bao giờ reset | 4 nhiệm vụ cố định, làm xong là xong vĩnh viễn | Sau ngày đầu bảng nhiệm vụ "chết", không còn lý do quay lại |
| Dữ liệu mặc định có tiến độ dở | `feed_cat` 1/2, `play_cat` 2/3, `pet_cat` 8/15 | Người chơi mới thấy nhiệm vụ đã làm một phần mà không hiểu vì sao |
| Không thấy tiến độ | Chỉ có ô tích, không có số đếm hay thanh | Không biết còn bao nhiêu |
| Không thấy phần thưởng | Nhãn "REWARD" chung chung | Không có kỳ vọng, không có động lực |
| Thưởng cộng ngầm | Hoàn thành là tự cộng xu + toast | Mất khoảnh khắc thành tựu |
| Không có lựa chọn | Luôn đúng 4 việc | Lặp lại, không tự chủ |
| Không có chuỗi ngày, không có mốc cuối ngày | | Không có nhịp quay lại |
| "Vuốt ve 15 lần" quá dễ | Rê chuột 4 giây là xong | Không cảm thấy là thành tựu |

## 3. Thiết kế

### 3.1 Nhiệm vụ hằng ngày

- Mỗi ngày (theo giờ máy, đổi lúc 0:00) bốc **3 nhiệm vụ** từ kho: 1 dễ, 1 vừa, 1 ngẫu nhiên (50% khó); không trùng loại.
- Mỗi nhiệm vụ: icon, mô tả, **thanh tiến độ x/y**, **chip thưởng** (🪙 xu, ⭐ EXP).
- Hoàn thành → nút **"Nhận"** sáng lên; bấm nhận: xu bay về ví, toast, mèo chào vui.
- **Đổi nhiệm vụ**: 1 lần/ngày cho nhiệm vụ chưa xong (nút 🔄).
- Bộ đếm "Làm mới sau X giờ Y phút".

Kho nhiệm vụ (sự kiện đã có sẵn trong game):

| Loại | Mô tả | Mức | Mục tiêu | Sự kiện |
|---|---|---|---|---|
| `feed` | Cho mèo ăn N lần | Dễ | 2–3 | `feed()` thành công |
| `pet` | Vuốt ve N lần | Dễ | 20–30 | `pet()` trả `ok` |
| `slow_blink` | Nháy mắt với mèo N lần | Dễ | 2–3 | `slowBlinkAtCat()` thành công |
| `yarn` | Đá bóng len N lần | Dễ | 3–5 | Bấm vào bóng len |
| `dress` | Thay một bộ đồ cho mèo | Dễ | 1 | `equipCostume()` |
| `room` | Đổi không gian phòng | Dễ | 1 | Chọn chủ đề phòng |
| `play` | Chơi với mèo N lần | Vừa | 2–3 | `playWithToy()` thành công |
| `feed_variety` | Cho ăn N món khác nhau | Vừa | 2–3 | Số món khác nhau đã cho ăn trong ngày |
| `sleep_full` | Để mèo ngủ đủ giấc | Vừa | 1 | Năng lượng đầy khi ngủ |
| `full_belly` | Cho mèo ăn no căng | Khó | 1 | Ăn tới mức `FULL` |

Thưởng theo mức: dễ 20 xu + 15 EXP, vừa 35 xu + 25 EXP, khó 50 xu + 40 EXP.

### 3.2 Hộp quà ngày

- Hiện ở chân bảng nhiệm vụ, tiến độ ●●○.
- Nhận đủ 3 nhiệm vụ → mở hộp: **40–80 xu** + 20 EXP; 35% kèm 1 món ăn (cá hồi, pate hoặc snack cỏ mèo); 10% kèm 1 trang phục chưa có (nếu đã có đủ thì đổi thành +60 xu).
- Hiện bằng hộp thoại phần thưởng chung (dùng lại kiểu thẻ quà offline).

### 3.3 Chuỗi ngày chăm mèo 🔥

- Ngày được tính khi **nhận ít nhất 1 nhiệm vụ**.
- Lỡ ngày: tự dùng **vé đóng băng ❄️** (tối đa 2, nhận 1 vé mỗi 7 ngày liên tiếp). Hết vé thì chuỗi về 1 khi chơi lại, **kỷ lục vẫn giữ**.
- Mốc 3 / 7 / 14 / 30 ngày: thưởng xu + EXP tăng dần (50/120/250/500 xu).
- Hiển thị trên đầu bảng: "🔥 5 ngày" (xám nếu hôm nay chưa giữ chuỗi), số vé ❄️.

### 3.4 Phản hồi và cảm giác

| Khoảnh khắc | Phản hồi |
|---|---|
| Tiến độ tăng | Thanh tiến độ chạy, số đếm đổi |
| Hoàn thành | Hàng nhiệm vụ sáng lên, nút "Nhận" nhún nhẹ |
| Nhận thưởng | 🪙 bay từ nút về ví, âm thanh xu, toast, mèo `GREETING` |
| Mở hộp ngày | Hộp thoại phần thưởng, mèo `KNEADING` |
| Mốc chuỗi | Toast mốc + thưởng, ký hiệu 🔥 |

## 4. Kế hoạch

### Giai đoạn 1 ✅ (đã làm 2026-10-26)

| Bước | Nội dung | File |
|---|---|---|
| 1 | Kho nhiệm vụ `QUEST_POOL`, thưởng theo mức `QUEST_TIERS`, sinh 3 nhiệm vụ/ngày, reset theo ngày máy | `game-state.js` |
| 2 | `trackQuest(type, amount)` thay `completeQuestProgress`; gắn sự kiện từ cho ăn, vuốt, nháy mắt, chơi, ngủ đủ, no căng, thay đồ, đổi phòng, đá bóng len | `game-state.js`, `app.js`, `cat-renderer.js` (qua Cat Lab) |
| 3 | `claimQuest`, `rerollQuest`, `claimDailyChest`; chuỗi ngày + vé đóng băng + mốc | `game-state.js` |
| 4 | Di chuyển save cũ: bỏ `dailyQuests`, tạo `quests`, `streak` | `game-state.js` |
| 5 | Bảng nhiệm vụ mới: chuỗi, đếm ngược, thanh tiến độ, chip thưởng, Nhận/Đổi, hộp quà ngày; hộp thoại phần thưởng chung; xu bay về ví | `index.html`, `app.js`, `style.css` |
| 6 | Kiểm tra trong game (giả lập qua ngày, lỡ ngày, vé đóng băng), cập nhật docs | — |
| 7 | (Phát sinh) Hộp thoại chúc mừng xếp hàng: mở hộp quà làm lên cấp thì phần thưởng hiện trước, lên cấp sau | `app.js` |

### Giai đoạn 2 (đề xuất)

- **Thành tựu nhiều bậc** có thanh tiến độ (đồng/bạc/vàng), sửa `laser_chaser` không mở được.
- **Sổ sưu tập biểu cảm**: ghi lại 24 biểu cảm mèo đã từng thể hiện, kèm hình chụp nhỏ; một mục tiêu sưu tập tự nhiên (giống Catbook của Neko Atsume).
- **Mức thân thiết** (bond) tăng theo chăm sóc đều đặn, mở khoá hành vi/biểu cảm mới.
- **Mục tiêu tuần** nhẹ (ví dụ 15 nhiệm vụ trong tuần) với phần thưởng trang phục.

### Giai đoạn 3 (đề xuất, cần server)

- **Mục tiêu chung cả văn phòng** (gắn kết): tổng số lần cho mèo ăn của mọi máy trong ngày, đủ mốc thì mọi người nhận quà.
- Sự kiện theo mùa (Tết, Trung thu) với nhiệm vụ và trang phục riêng.

### Không làm (có chủ đích)

- Không mua bằng tiền thật, không quay số trả phí.
- Không thông báo đẩy kiểu "chuỗi của bạn sắp mất!".
- Không phạt mèo (ốm, chết) vì người chơi vắng mặt.

## Nguồn

- [Botte et al., CHI 2022: SDT workshop](https://webspace.science.uu.nl/~veltk101/publications/art/chi2022-sdtws.pdf)
- [Dahlstrøm, NTNU: gamification và động lực nội tại](https://www.ntnu.edu/documents/139799/1279149990/04+Article+Final_camildah_fors%C3%B8k_2017-12-06-13-53-55_TPD4505.Camilla.Dahlstr%C3%B8m.pdf/9e48c5f5-0d17-4276-a23e-434abfe65491)
- [Durham: lựa chọn nội tại để giảm overjustification](https://durham-repository.worktribe.com/OutputFile/1145164)
- [University of Arizona: gamification và SDT](https://journals.librarypublishing.arizona.edu/itlt/article/4872/galley/5057/download)
- [IceNet: gamification qua lăng kính SDT](https://icenet.blog/2025/06/17/align-the-game-to-your-aim-considering-gamification-through-the-lens-of-self-determination-theory/)
- [DiGRA 2026: phần thưởng gamification theo SDT](https://dl.digra.org/index.php/dl/article/view/2773)
- [Daily Quest Design for Mobile Arcade Games (2019)](https://www.koreascience.or.kr/article/JAKO201924064455372.page)
- [Unity: daily rewards best practices](https://docs.unity.com/en-us/grow/offerwall/user-acquisition/best-practices/daily-rewards-offer-best-practices)
- [Uxcel: quests trong gamification](https://app.uxcel.com/courses/gamification-in-design-context/gamification-mechanics-elements-558/challenge-users-to-participate-in-quests-7139)
- [Game Developer: thiết kế phiên chơi AFK Arena](https://www.gamedeveloper.com/design/flexible-time-session-design-in-afk-arena)
- [UX Collective: beyond streaks and nudges](https://uxdesign.cc/beyond-streaks-and-nudges-ethical-gamification-ai-design-1c4f6e8ef2cc)
- [Finch: phân tích thiết kế (Screens Design)](https://screensdesign.com/showcase/finch-self-care-pet)
- [Finch: đánh giá của WhistleOut](https://www.whistleout.com/CellPhones/Apps/finch-self-care-app-review)
- [Finch: Yoga Journal](https://www.yogajournal.com/lifestyle/finch-self-care-app/?scope=anon)
