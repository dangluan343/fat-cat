# Function List — Meow 2D (fat-cat)

Danh sách chức năng kỹ thuật (hàm / phương thức / bộ xử lý sự kiện) theo từng module, mỗi dòng liên kết ngược về [Feature List](FEATURE_LIST.md).

- Phiên bản đối chiếu: `main` @ `cb63006` + nhánh `feat/offline-progress` (chưa merge)
- Cập nhật: 2026-10-26
- Mã: `FN-<module>-<số>`. Module: `GS` game-state, `APP` app.js, `REN` cat-renderer, `AUD` audio-synth, `NET` network-client, `SRV` server.
- Cột **Vào → Ra**: tham số chính và giá trị trả về; `—` nghĩa là không có. Cột **Phụ thuộc/Hiệu ứng phụ** nêu nơi hàm ghi trạng thái, gọi module khác hoặc chạm DOM.

---

## 1. GS — `game-state.js` (lớp `CatGameState`, toàn cục `window.gameState`)

Hằng số ngoài lớp: `OFFLINE_CONFIG` (tham số cân bằng offline), `PET_OVERLOAD` (ngưỡng vuốt quá lâu), `SLOW_BLINK_COOLDOWN_MS`, `UNINTERRUPTIBLE_STATES` (trạng thái AI không ngắt), `VITAL_MOODS` (ngưỡng ốm/kiệt sức/đói lả/no căng/rít), `GIFT_FOODS` (id → tên đồ ăn dùng cho quà).

| ID | Hàm | Mô tả | Vào → Ra | Phụ thuộc / Hiệu ứng phụ | Feature |
|---|---|---|---|---|---|
| FN-GS-01 | `constructor()` | Tạo dữ liệu mặc định, khởi tạo bộ đếm AI, gọi `load()` | — | Đặt `awayFrom = null`, `behaviorState = 'IDLE'` | CORE-02 |
| FN-GS-02 | `onChange(fn)` | Đăng ký listener nhận `data` mỗi khi thay đổi | `fn(data)` → — | Đẩy vào `listeners` | CORE-02 |
| FN-GS-03 | `notify()` | Lưu rồi gọi mọi listener | — | `save()`; kích hoạt `updateHUD` | CORE-02 |
| FN-GS-04 | `save()` | Ghi `data` vào `localStorage`; cập nhật `lastSeen` trừ khi tab đang ẩn | — | `localStorage[meow_2d_save_data_v1]`; bắt lỗi ghi | CORE-03, OFF-01 |
| FN-GS-05 | `load()` | Nạp save, trộn nông với mặc định; lấy `lastSeen` đã lưu làm `awayFrom` | — | Đọc `localStorage`; save cũ thiếu `lastSeen` thì coi như vừa thấy | CORE-03, OFF-01 |
| FN-GS-06 | `resetData()` | Xoá save rồi tải lại trang | — | `localStorage.removeItem`, `location.reload()` | CORE-04 |
| FN-GS-07 | `markAway()` | Ghi mốc rời đi (tab ẩn / `pagehide`) | — | Đặt `lastSeen`, `awayFrom`; `save()` | OFF-01 |
| FN-GS-08 | `applyOfflineProgress()` | Tính suy giảm có trần cho thời gian vắng, sinh quà, mèo chào đón | — → `{awaySeconds, gifts}` hoặc `null` | Sửa `vitals`, nối `pendingGifts`; `setBehavior('GREETING')`; trả `null` khi <120 giây, thiếu mốc hoặc đồng hồ lùi | OFF-02, OFF-03 |
| FN-GS-09 | `rollGift()` | Random một món quà | — → `{type, icon, label, amount, id?}` | `Math.random` (xu 60% / đồ ăn 30% / hiếm 10%) | OFF-03 |
| FN-GS-10 | `claimGifts()` | Nhận toàn bộ quà chờ | — → `{count, coins}` hoặc `null` | Cộng kho, `addCoins`, `addExp(5 × số quà)`, xoá `pendingGifts` | OFF-04 |
| FN-GS-11 | `updateVitals(deltaSeconds)` | Suy giảm/hồi chỉ số theo thời gian online; gọi AI | `deltaSeconds` → — | Sửa `vitals`, `stats.sleepSeconds`; có thể gọi `completeQuestProgress('sleep_cat')`, `setAction`, `setBehavior`; gọi `tickAutonomousAI` | PET-01, PET-02, PET-05, CORE-01 |
| FN-GS-12 | `setAction(title, desc, progress=100)` | Đặt nội dung thẻ "Hành động hiện tại" | → — | Ghi `data.currentAction`; `notify()` | PET-06 |
| FN-GS-13 | `setBehavior(state, duration=4)` | Đổi trạng thái hành vi (24 trạng thái), đặt đồng hồ, xoá `nextBehavior`, cập nhật banner | `state`, giây → — | Gọi `setAction`; `ZOOMIES` thì `unlockAchievement('zoomies_champ')`. Hình dạng từng trạng thái nằm ở `CAT_EXPRESSIONS` (cat-renderer.js) | PET-03, PET-06, ACT-09 |
| FN-GS-14 | `tickAutonomousAI(delta)` | Hết hạn trạng thái tạm thời (chuyển sang `nextBehavior` nếu có, không thì IDLE); mỗi 8–16 giây chọn hành động: sức khoẻ < 30 → ốm (60%), đói < 10 → đói lả, đói < 35 → xin ăn, năng lượng < 25 → ngủ (năng lượng < 15 thì 50% gật gù trước), sung → Zoomies, vui < 30 → dỗi, còn lại ngẫu nhiên | `delta` → — | Không ngắt `UNINTERRUPTIBLE_STATES`; gọi `setBehavior`, `catAudio`; Zoomies: giảm năng lượng, tăng vui, `addCoins(5)` | PET-03, PET-04, PET-13..15 |
| FN-GS-15 | `pet(isClick=false)` | Xử lý một lần vuốt, có phản ứng theo trạng thái | `isClick` → `'ok'` / `'annoyed'` / `'hiss'` / `'dozing'` / `'startled'` | Đang rít: không nhận. Đang cáu: đếm `annoyedPets`, đủ `HISS_AFTER_PETS` thì `HISS`, −5 vui, `catAudio.hiss`. Đang ngủ: rê chuột thì +0.4 vui và ngủ tiếp, bấm thì `SURPRISED`. Vuốt ≥ `PET_OVERLOAD.MAX_PETS` lần trong cửa sổ → `ANNOYED`, −3 vui. Bình thường: `+1.2` vui, `+0.3` sức khoẻ, `addExp(2)`, 15% `addCoins(1)`, nhiệm vụ `pet_cat`, mở `first_pet`, `PETTING` | ACT-01, PET-09, PET-10, PET-17 |
| FN-GS-16 | `feed(foodId)` | Cho ăn một món | `foodId` → `true` / `false` / `'full'` | Hết hàng hoặc id lạ → `false`. Đã no (`isFull`) → `FULL` 3 giây, `'full'`, không trừ kho. Bình thường: trừ kho, cộng chỉ số, `addExp`, ghi `foodsDiscovered`, mở `gourmet_cat` khi ≥4 món, nhiệm vụ `feed_cat`, âm thanh nhai/uống, `EATING`; ăn tới mức no thì nối `FULL` sau khi ăn | ACT-02, PET-16 |
| FN-GS-17 | `playWithToy(toyId)` | Bắt đầu chơi | `toyId` → `boolean` | Năng lượng < 15 → `EXHAUSTED`, trả `false`, không thưởng. Bình thường: đặt `activeToy`, `+20` vui, `−10` năng lượng (sàn 10), `addExp(18)`, `addCoins(6)`, nhiệm vụ `play_cat`, ghi `toysUsed`, `setBehavior('PLAYING', 10)` | ACT-03, PET-14 |
| FN-GS-18 | `stopPlaying()` | Cất đồ chơi | — | `activeToy = null`, về `IDLE` | ACT-03 |
| FN-GS-19 | `toggleSleep()` | Bật/tắt ngủ | — | `SLEEPING` 30 giây hoặc `YAWNING`; `catAudio.yawn` | ACT-08, PET-05 |
| FN-GS-20 | `addCoins(amount)` | Cộng xu | `amount` → — | `catAudio.coin`; `notify()` | ECO-01 |
| FN-GS-21 | `addExp(amount)` | Cộng EXP, kiểm tra lên cấp | `amount` → — | Gọi `levelUp()` khi đủ, ngược lại `notify()` | ECO-02 |
| FN-GS-22 | `levelUp()` | Tăng cấp, tính EXP kế tiếp, thưởng xu | — | `expToNext = round(level × 100 × 1.15)`; thưởng `level × 50` xu; `catAudio.levelUp`; gọi `window.showLevelUpModal` | ECO-02 |
| FN-GS-23 | `renamePet(newName)` | Đổi tên mèo (bỏ qua chuỗi rỗng) | `newName` → — | `notify()` | UI-01 |
| FN-GS-24 | `completeQuestProgress(questId, amount=1)` | Tăng tiến độ nhiệm vụ; xong thì thưởng | → — | Thưởng xu + EXP, `showToast`; bỏ qua nhiệm vụ đã xong | ECO-05 |
| FN-GS-25 | `unlockAchievement(id)` | Mở khoá thành tựu một lần | `id` → — | `+50` xu, `+40` EXP, `showToast` | ECO-06 |
| FN-GS-26 | `buyItem(category, itemId, price)` | Mua vật phẩm | `food`/`toy`/`costume` → `boolean` | Trừ xu; thêm vào kho/đồ chơi/trang phục; không đủ xu thì toast lỗi và trả `false` | ECO-03 |
| FN-GS-27 | `equipCostume(type, itemId)` | Mặc/tháo trang phục | `type`: hat/glasses/accessory/fur | Ghi `customization[type]`; mở `stylish_pet` | CUS-01..04 |
| FN-GS-28 | `slowBlinkAtCat()` | Người chơi nháy mắt chậm, mèo nháy lại | — → `boolean` | `false` khi mèo ngủ/cáu hoặc còn hồi chiêu `SLOW_BLINK_COOLDOWN_MS`; ngược lại +4 vui, `SLOW_BLINK` 2.8 giây, `addExp(3)` | ACT-10 |
| FN-GS-29 | `isFull()` | Đói ≥ `VITAL_MOODS.FULL_HUNGER` | — → `boolean` | | PET-16 |

---

## 2. APP — `app.js` (điều phối UI, bọc trong `DOMContentLoaded`)

| ID | Hàm / Bộ xử lý | Mô tả | Vào → Ra | Phụ thuộc / Hiệu ứng phụ | Feature |
|---|---|---|---|---|---|
| FN-APP-01 | Khởi tạo (callback `DOMContentLoaded`) | Tạo `CatRenderer` và gán `renderer.getBlockedRects` (khung dock, thẻ hành động, menu phải, bảng trái), gắn mọi handler, vẽ HUD đầu, chạy `resumeFromAway`, bắt đầu vòng lặp | — | Toàn bộ UI | CORE-01, REN-05 |
| FN-APP-02 | `unlockAudio()` | Khởi tạo `AudioContext` ở click/phím đầu tiên rồi tự gỡ listener | — | `audio.init()` | AUD-05 |
| FN-APP-03 | `window.showToast(msg)` | Hiện toast HTML, tự tắt sau 2.8 giây | `msg` (HTML) → — | Chèn vào `#toast-container` (dùng `innerHTML`) | UI-07 |
| FN-APP-04 | `window.showLevelUpModal(level, bonus)` | Mở hộp thoại lên cấp và bắn 20 hạt | → — | `#level-up-modal`, `renderer.spawnParticle` | ECO-02, UI-06 |
| FN-APP-05 | `showGiftModal(awaySeconds)` | Dựng danh sách quà và mở hộp thoại; không làm gì nếu hết quà | `awaySeconds` hoặc `null` → — | Đọc `pendingGifts`; `#gift-modal` | OFF-04 |
| FN-APP-06 | `formatAway(seconds)` | Định dạng "X giờ Y phút" | → `string` | — | OFF-04 |
| FN-APP-07 | `updateHUD(data)` | Vẽ lại hồ sơ, chỉ số, nhiệm vụ, thẻ hành động, bong bóng thoại (câu riêng cho 24 trạng thái), dock | `data` → — | Là listener của `onChange`; gọi `renderInventorySlots`; **dựng lại DOM mỗi lần** | UI-01, UI-02, UI-08, REN-06 |
| FN-APP-08 | `renderInventorySlots()` | Dựng dock theo tab đang chọn (food/toy/outfit/decor/special) và gắn handler từng ô; ô đồ ăn bắt đầu kéo thả khi nhấn (hết hàng thì báo) | — | Gọi `beginFoodDrag`, `playWithToy`, `stopPlaying`, `equipCostume`, `setBehavior`, `notify`; `officeNetwork.broadcastAction` | UI-03, ACT-02, ECO-04, ECO-08 |
| FN-APP-09 | `applyRoomTheme(theme)` | Gắn/gỡ class `sunset-mode`/`night-mode` | `cozy_day`/`warm_sunset`/`starry_night` | `#game-container` | CUS-05 |
| FN-APP-10 | ~~Nút Cho ăn~~ | **Đã gỡ** (2026-10-26), thay bằng kéo thả đồ ăn FN-APP-34 | | | UI-04 |
| FN-APP-11 | Nút Vuốt ve | Gọi `renderer.triggerPetFeedback(true)` | — | | UI-04, ACT-01 |
| FN-APP-12 | Nút Chơi đùa | Chuyển tab toy, bật cần câu lông; mèo kiệt sức thì báo và không chơi | — | `playWithToy('feather_wand')`; broadcast | UI-04, ACT-03 |
| FN-APP-13 | Nút Cho ngủ | Bật/tắt ngủ | — | `toggleSleep`; broadcast | UI-04, ACT-08 |
| FN-APP-14 | Nút Lăn lộn | `setBehavior('ROLLING', 5)` | — | `catAudio.meow('happy')`; broadcast | UI-04, ACT-09 |
| FN-APP-15 | Nút Vươn vai | `setBehavior('YAWNING', 4)` | — | `catAudio.yawn`; broadcast | UI-04, ACT-09 |
| FN-APP-16 | Nút điều hướng Phòng | Chuyển tab decor | — | | UI-05 |
| FN-APP-17 | Nút điều hướng Trang phục | Chuyển tab outfit, mở tủ đồ | — | `openModal('wardrobe-modal')` | UI-05 |
| FN-APP-18 | Nút điều hướng Bộ sưu tập | Mở sổ sưu tập | — | `openModal('collection-modal')` | UI-05 |
| FN-APP-19 | Nút điều hướng Cài đặt | Mở cài đặt | — | `openModal('settings-modal')` | UI-05 |
| FN-APP-20 | `renderShopItems()` | Dựng lưới cửa hàng từ danh mục (15 món); nút Mua | — | Gọi `buyItem`; dựng lại sau khi mua | ECO-03 |
| FN-APP-21 | `renderWardrobeGrid()` | Dựng lưới tủ đồ; Mặc/Tháo/Cần mở khoá | — | Gọi `equipCostume`; nhắc vào cửa hàng nếu chưa sở hữu | CUS-01..04 |
| FN-APP-22 | `renderCollectionData()` | Dựng danh sách thành tựu | — | Đọc `collection.achievements` | ECO-06, ECO-07 |
| FN-APP-23 | `openModal(id)` | Mở modal; modal có dữ liệu thì dựng trước | `id` → — | Thêm class `open` | UI-06 |
| FN-APP-24 | `closeModal(modal)` + gắn nút đóng / bấm nền | Đóng modal; riêng `gift-modal` không đóng khi bấm nền | → — | `.btn-close-modal`, `.modal-backdrop` | UI-06 |
| FN-APP-25 | Nút "Nhận quà ngay" | Gọi `claimGifts`, đóng modal, toast tổng kết | — | `#btn-claim-gifts` | OFF-04 |
| FN-APP-26 | Bộ lắng nghe rời/quay lại | `visibilitychange` (ẩn → `markAway`; hiện → `resumeFromAway`), `pagehide` → `markAway`, `setInterval` 15 giây lưu khi tab hiển thị | — | | OFF-01 |
| FN-APP-27 | Nút Đặt lại dữ liệu | Hộp xác nhận rồi `resetData()` | — | `confirm()` | CORE-04 |
| FN-APP-28 | Nút Nhạc nền / Tắt tiếng | Bật tắt BGM và SFX, cập nhật nhãn | — | `audio.toggleBGM`, `audio.toggleMute` | AUD-04, AUD-05 |
| FN-APP-29 | `resumeFromAway()` | Gọi `applyOfflineProgress()` rồi `showGiftModal` | — | Chạy lúc khởi động và khi tab hiện lại | OFF-02, OFF-04 |
| FN-APP-30 | `gameLoop(now)` | Tính delta (≤0.1 giây), cập nhật state + renderer, vẽ, lên lịch khung kế | `now` → — | `requestAnimationFrame` | CORE-01 |
| FN-APP-31 | Nút đổi tên mèo | `prompt()` rồi `renamePet`; broadcast | — | Toast chèn tên vào HTML (chưa escape) | UI-01 |
| FN-APP-32 | Huy hiệu xu | Mở cửa hàng | — | | ECO-03 |
| FN-APP-33 | Nút Nháy mắt | Gọi `slowBlinkAtCat`; toast theo kết quả (thành công / mèo ngủ / hồi chiêu); broadcast `blink` | — | `#btn-quick-blink` | ACT-10, UI-04 |
| FN-APP-34 | Kéo thả đồ ăn: `beginFoodDrag(food, e)`, `finishFoodDrag(e, cancelled)` + lắng nghe `pointermove`/`pointerup`/`pointercancel`/Escape | Bóng món ăn (HTML, nằm trên mọi lớp UI) bay theo con trỏ; di > 6px mới tính là kéo và báo vị trí cho renderer; thả trúng mèo: mèo đã no thì từ chối (`feed` trả `full`, không trừ món), không thì `dropFood` + `feed` + toast + broadcast `feed`; bấm tại chỗ thì hướng dẫn; thả trượt thì nhắc | — | `.food-drag-ghost`; dọn mọi bóng sót khi kết thúc | ACT-02, PET-16 |

---

## 3. REN — `cat-renderer.js` (lớp `CatRenderer`)

Hằng số ngoài lớp: `HOSTILE_STATES` (cáu, rít: không nhận vuốt, không rù rù, không chờ đồ ăn), `CAT_HEAD` (tâm đầu), `ROOM_BG` (kích thước ảnh nền và vị trí tấm thảm trong ảnh), `CAT_BOUNDS` (khung bao mèo), `RIG_DEFAULTS` (tham số rig mặc định), `CAT_EXPRESSIONS` (kiểu mắt/miệng/chân/đuôi + đích rig cho từng trạng thái), `STATE_MARKERS` (ký hiệu cảm xúc). Giải thích: [CAT_ANIMATION.md](CAT_ANIMATION.md).

| ID | Hàm | Mô tả | Vào → Ra | Phụ thuộc / Hiệu ứng phụ | Feature |
|---|---|---|---|---|---|
| FN-REN-01 | `constructor(canvasId)` | Khởi tạo canvas, vị trí neo, đồ vật (bóng len, đĩa ăn, cần câu, laser), mảng hạt, rig biểu cảm | `canvasId` | Gọi `initEvents`; `rig = {...RIG_DEFAULTS}` | REN-01, PET-07 |
| FN-REN-02 | `resize()` | Đo lại canvas, gọi `layoutOnRug`, đặt lại đĩa ăn và bóng len cạnh mèo | — | Không đặt lại vị trí mèo khi `ZOOMIES` | REN-05 |
| FN-REN-03 | `initEvents()` | Gắn resize, chuột/cảm ứng, mousedown (vuốt hoặc đá bóng len), mouseup | — | Vùng chạm elip quanh mèo; đá bóng: `catAudio.squeak`, mèo rảnh thì `CURIOUS` | ACT-01, ACT-06, ACT-11 |
| FN-REN-04 | `triggerPetFeedback(isClick=false)` | Xử lý một lần vuốt theo kết quả `gameState.pet()`: ok → nhún, tim, rù rù, broadcast; annoyed → 💢, không rù rù; dozing → rù rù khẽ; startled → thôi | — | `gameState.pet(isClick)`, `catAudio`, `officeNetwork.broadcastAction('pet')` | ACT-01, PET-09, PET-10 |
| FN-REN-05 | `spawnParticle(type, x, y, options)` | Thêm một hạt emoji | → — | Đẩy vào `particles` | REN-04 |
| FN-REN-06 | `dropFood(foodType)` | Đặt đĩa ăn, bắt đầu ăn, sinh vụn | `foodType` → — | `setBehavior('EATING', 6)`, `catAudio.crunch` | ACT-02 |
| FN-REN-07 | `update(delta)` | Cập nhật hoạt ảnh, đếm `stateTime` và gọi `onStateEnter` khi đổi trạng thái, `updateRig`, tắt rù rù khi hết vuốt, Zoomies, hạt, bong bóng thoại, đĩa ăn | `delta` → — | Đọc `gameState.behaviorState`; đặt `left/top` của `#cat-speech-bubble`; `catAudio.stopPurr` | REN-02, REN-06, CORE-01, AUD-02 |
| FN-REN-08 | `updateToys(delta, state)` | Vật lý bóng len (trọng lực, nảy), cần câu đuổi con trỏ | → — | | ACT-06 |
| FN-REN-09 | `getCoatPalette(furType)` | Trả bảng màu theo màu lông | `furType` → object màu | | CUS-01 |
| FN-REN-10 | `render()` | Xoá canvas rồi vẽ: sàn → mèo → đồ chơi → hạt | — | | REN-01 |
| FN-REN-11 | `renderFloorItems()` | Vẽ bóng len, dây len, đĩa ăn | — | | ACT-06, ACT-02 |
| FN-REN-12 | `render3DCatLoaf(state, customization)` | Điều phối vẽ mèo: bóng đổ, vòng rù rù, biến đổi thân theo rig (nhảy/kéo/hạ/lắc), rồi các lớp đuôi → thân → chân dưới → đầu (tai, mặt, mũ/kính trong một phép biến đổi đầu) → phụ kiện cổ → chân trên | → — | | REN-01, REN-12 |
| FN-REN-13 | ~~`renderTrackingEye`~~ | **Đã gỡ** (2026-10-26), thay bằng FN-REN-30 `renderCatEye` | | | REN-03 |
| FN-REN-14 | `renderKawaiiEye(ctx, cx, cy, eyeColor, radius)` | Mắt to long lanh (xin ăn): nền tối, mống mắt chuyển màu, đồng tử dọc, 3 đốm sáng | → — | | REN-03 |
| FN-REN-15 | ~~`renderCostumes`~~ | **Đã tách** (2026-10-26) thành FN-REN-34 `renderHeadCostumes` và FN-REN-35 `renderNeckCostume` | | | CUS-02..04 |
| FN-REN-16 | `renderActiveToys()` | Vẽ chấm laser hoặc cần câu lông theo `activeToy` | — | Không có nhánh cho chuột cót / cá bông | ACT-04, ACT-05, ACT-07 |
| FN-REN-17 | `renderParticles()` | Vẽ hạt emoji với độ mờ theo vòng đời | — | | REN-04 |
| FN-REN-18 | `render3DTail(ctx, p, expr)` | Đuôi theo đường cong Bézier nội suy giữa hạ và dựng (`tailRaise`), độ dày theo `tailPuff`, vẫy theo `tailSwayAmp/Speed`, sọc vuông góc đường cong, chóp trắng; kiểu `curl` quấn quanh người khi ngủ | → — | | REN-11 |
| FN-REN-19 | `render3DBody(ctx, p, state)` | Thân bánh mì, sọc lưng, đường đùi sau, bàn chân sau; lắc mông khi chơi | → — | | REN-10 |
| FN-REN-20 | `render3DChestAndPaws(ctx, p, pose, layer)` | Lớp `under`: bụng, lông ngực, chân đặt trên sàn (gập, nhồi bột, duỗi). Lớp `over`: chân giơ lên (ngửa, xin ăn, liếm, rửa mặt, vồ) vẽ đè lên mặt | → — | Gọi `drawPaw`, `drawForeleg` | REN-10 |
| FN-REN-21 | `render3DHead(ctx, p)` | Hai tai, viền đầu má xù mềm, sọc chữ M, vệt lông trắng (toạ độ quanh tâm đầu) | → — | Gọi `drawEar` | REN-08, REN-09 |
| FN-REN-22 | `render3DFace(ctx, p, expr, state)` | Má hồng theo `blush`, hai mắt + lông mày, quầng thâm (`eyeBags`), vạch u ám (`sickTint`), nước mắt (`tear`), đệm râu, râu, miệng, mũi bo, nhăn mũi (`noseWrinkle`); dấu gân 💢 khi cáu/rít; giọt mồ hôi khi dỗi | → — | Vuốt/rù rù đổi mắt mở thành mắt cười (trừ khi cáu/rít) | REN-08 |
| FN-REN-23 | `getRigTarget(state)` | Đích rig = `RIG_DEFAULTS` + đích của trạng thái + kịch bản theo `stateTime` (xin ăn kêu theo nhịp, nháy chậm, giật mình nhảy, chào đón, chu kỳ rình → vồ) + tâm trạng nền từ vitals khi IDLE | → object | Đọc `gameState.data.vitals` | PET-07, PET-08, REN-12 |
| FN-REN-24 | `updateRig(delta, state)` | Nội suy rig về đích: `rig += (đích − rig) × (1 − e^(−9·delta))` | → — | | PET-07 |
| FN-REN-25 | `onStateEnter(state)` | Sinh ký hiệu cảm xúc (`STATE_MARKERS`) bay lên trên đầu | → — | | PET-11 |
| FN-REN-26 | `getPawPose(state, expr)` | Tư thế chân: theo `expr.paws`, riêng lúc vồ khi chơi là `bat` | → `string` | | REN-10 |
| FN-REN-27 | `drawPaw(ctx, x, y, rx, ry, rot, p, opts)` | Một bàn chân: khối tròn có vạch ngón (`toes`) hoặc đệm thịt hồng (`beans`) | → — | | REN-10 |
| FN-REN-28 | `drawForeleg(ctx, fromX, fromY, toX, toY, p, width)` | Cẳng chân: dải lông có viền nối vai và bàn chân | → — | | REN-10 |
| FN-REN-29 | `drawEar(ctx, p, side)` | Một tai: xoay theo `earRot` + giật tai, ép theo `earFlat`, đầu tai bo, lông tơ trong tai | `side` −1/+1 → — | | REN-09 |
| FN-REN-30 | `renderCatEye(ctx, cx, cy, r, side, style, p, look)` | Mắt mở: mống mắt phủ kín, đồng tử elip (khe ↔ tròn theo `pupil`), bám con trỏ hoặc nhìn hướng cố định, mí trên theo `eyeOpen`/`lidTilt`, đốm sáng; chuyển sang kiểu khác khi cần | → — | | REN-03, PET-07 |
| FN-REN-31 | `renderEyeArc(ctx, cx, cy, r, side, style)` | Mắt nhắm: `happy` ^ ^, `closed` ︶, `squeeze` > < | → — | | REN-03 |
| FN-REN-32 | `renderWhiskers(ctx, p)` | Râu mọc từ đệm râu, góc và độ dài theo `whisker`; màu sáng trên lông tối | → — | | REN-08 |
| FN-REN-33 | `renderMouth(ctx, style, p)` | Nhân trung + 14 kiểu miệng: smile, open, meow, yawn (có nanh), chew, lick, blep, o, pout, flat, grumble (gằn lộ nanh), wobble (run, ốm), licklips (liếm mép), hiss (há rộng 4 nanh); độ há theo `mouthOpen` | → — | | REN-08 |
| FN-REN-34 | `renderHeadCostumes(ctx, customization)` | Kính và mũ, toạ độ quanh tâm đầu nên nghiêng/cúi theo đầu | → — | | CUS-02, CUS-03 |
| FN-REN-35 | `renderNeckCostume(ctx, customization)` | Nơ đỏ, chuông vàng ở cổ (toạ độ thân) | → — | | CUS-04 |
| FN-REN-36 | `isPointOnCat(px, py)` | Điểm (toạ độ canvas) có nằm trong elip quanh mèo không; dùng cho vuốt ve và thả đồ ăn | → `boolean` | | ACT-01, ACT-02 |
| FN-REN-37 | `setFoodDrag(foodId, clientX, clientY)` | Cập nhật món đang kéo và vị trí con trỏ; mắt mèo nhìn theo | → `boolean` (đang ở trên mèo) | Đặt `foodDrag`, `mouseX/Y` | ACT-02, PET-12 |
| FN-REN-38 | `endFoodDrag()` | Kết thúc kéo | → `boolean` (thả trúng mèo) | Xoá `foodDrag` | ACT-02 |
| FN-REN-39 | `renderBrows(ctx, p)` | Lông mày hoạt hình theo `lidTilt`: âm = chau chữ V (cáu), dương = nhướn lo lắng (dỗi, nài nỉ); màu sáng trên lông tối | → — | | PET-09, REN-08 |
| FN-REN-40 | `renderFoodDropZone()` | Vòng nét đứt quanh mèo khi đang kéo đồ ăn, sáng vàng khi con trỏ ở trên mèo | → — | | ACT-02 |
| FN-REN-41 | `layoutOnRug()` | Tính vị trí thảm từ `ROOM_BG` (cover, căn đáy), `scale` theo ảnh nền, thử lưới điểm trên thảm và chọn điểm ít bị `getBlockedRects()` che nhất, ưu tiên gần giữa; đặt `runLeft/runRight` cho Zoomies | → — | `getBlockedRects` do app.js gán | REN-05 |

---

## 4. AUD — `audio-synth.js` (lớp `CatAudioEngine`, toàn cục `window.catAudio`)

Mọi hàm âm thanh đều thoát sớm khi `isMuted`, và gọi `init()` để đảm bảo có `AudioContext`.

| ID | Hàm | Mô tả | Feature |
|---|---|---|---|
| FN-AUD-01 | `constructor()` | Trạng thái ban đầu (`ctx = null`, chưa tắt tiếng) | AUD-05 |
| FN-AUD-02 | `init()` | Tạo `AudioContext` và `resume()` nếu bị treo | AUD-05 |
| FN-AUD-03 | `toggleMute()` → `boolean` | Bật/tắt tiếng; khi tắt thì dừng rù rù và nhạc nền | AUD-05 |
| FN-AUD-04 | `meow(type='normal')` | Tiếng meow quét tần số; `type`: `normal`, `happy`, `hungry`, `purr-chirp` | AUD-01 |
| FN-AUD-05 | `startPurr()` | Bắt đầu vòng lặp rù rù (nhiễu lọc, điều biến) | AUD-02 |
| FN-AUD-06 | `stopPurr()` | Dừng rù rù | AUD-02 |
| FN-AUD-07 | `crunch()` | Tiếng nhai hạt | AUD-03 |
| FN-AUD-08 | `slurp()` | Tiếng uống | AUD-03 |
| FN-AUD-09 | `pop()` | Tiếng "pop" — **không nơi nào gọi** (mã chết) | AUD-03 |
| FN-AUD-10 | `coin()` | Tiếng xu | AUD-03 |
| FN-AUD-11 | `levelUp()` | Giai điệu lên cấp | AUD-03 |
| FN-AUD-12 | `yawn()` | Tiếng ngáp | AUD-03 |
| FN-AUD-13 | `squeak()` | Tiếng kêu chít (đồ chơi) | AUD-03 |
| FN-AUD-14 | `toggleBGM()` → `boolean` | Bật/tắt nhạc nền | AUD-04 |
| FN-AUD-15 | `startBGM()` | Phát nhạc nền theo bộ hẹn giờ | AUD-04 |
| FN-AUD-16 | `stopBGM()` | Dừng nhạc nền | AUD-04 |
| FN-AUD-17 | `hiss()` | Tiếng rít: nhiễu trắng lọc cao, lên nhanh rồi tắt dần (0.7 giây) | PET-17 |

---

## 5. NET — `network-client.js` (lớp `OfficeNetworkClient`, toàn cục `window.officeNetwork`)

| ID | Hàm | Mô tả | Vào → Ra | Phụ thuộc / Hiệu ứng phụ | Feature |
|---|---|---|---|---|---|
| FN-NET-01 | `constructor()` | Đọc cấu hình, biệt danh đã lưu; dựng UI và kết nối | — | `localStorage[meow_office_nickname]` | NET-02 |
| FN-NET-02 | `initUI()` | Tạo `#office-action-stream` và thanh trạng thái `#office-network-bar` | — | Chèn vào `body`; bấm vào tên để đổi biệt danh | NET-07 |
| FN-NET-03 | `connect()` | Mở WebSocket tới `window.location.host` (fallback `SERVER_IP:PORT`); tự thử lại sau 3 giây | — | Gửi lại biệt danh khi mở | NET-02, NET-08 |
| FN-NET-04 | `updateStatusDot(connected)` | Đổi màu chấm và chữ Online/Ngoại tuyến | → — | | NET-07 |
| FN-NET-05 | `handleMessage(msg)` | Điều phối theo `type`: `welcome`, `user_joined`/`user_left`, `system_broadcast`, `action_broadcast`, `nickname_updated` | → — | `user_joined` chưa bao giờ được server gửi | NET-02, NET-05 |
| FN-NET-06 | `updateMyDeviceDisplay()` | Hiển thị biệt danh/hostname/IP của mình | — | | NET-04, NET-07 |
| FN-NET-07 | `promptEditNickname()` | Hộp nhập biệt danh, lưu và gửi lên server | — | `window.prompt`; toast chèn biệt danh vào HTML | NET-04 |
| FN-NET-08 | `send(obj)` | Gửi JSON nếu socket đang mở | → — | | NET-02 |
| FN-NET-09 | `broadcastAction(actionType, detail, icon, themeColor)` | Gửi sự kiện hành động; vuốt ve bị throttle `PET_THROTTLE_MS` | → — | Bỏ qua khi mất kết nối | NET-05 |
| FN-NET-10 | `renderFloatingActionCard(data)` | Dựng thẻ thông báo nổi (giới hạn 5 thẻ, tự xoá sau `NOTIFICATION_DURATION_MS`) | `data` → — | Escape hostname/IP/nickname nhưng **không escape `detail`** | NET-06 |
| FN-NET-11 | `spawnSystemNotice(msg)` | Thẻ thông báo hệ thống (3.8 giây) | → — | Escape `msg` | NET-09 |
| FN-NET-12 | `escapeHtml(str)` | Thoát `& < > " '` | → `string` | | NFR-03 |
| FN-NET-13 | Khởi tạo toàn cục | Tạo `window.officeNetwork` ở `DOMContentLoaded` | — | | NET-02 |

---

## 6. SRV — `server.js` (Node.js)

| ID | Hàm | Mô tả | Vào → Ra | Phụ thuộc / Hiệu ứng phụ | Feature |
|---|---|---|---|---|---|
| FN-SRV-01 | `extractClientIp(req)` | Lấy IP sạch từ `x-forwarded-for` hoặc socket, bỏ tiền tố IPv6 | `req` → `string` | Tin tưởng header, dễ bị giả | NET-03 |
| FN-SRV-02 | `resolveHostname(ip)` | Reverse DNS (timeout 1.5 giây), có cache `Map`; localhost → "Máy Chủ (Host)" | `ip` → `Promise<string>` | `config.ENABLE_REVERSE_DNS` | NET-03 |
| FN-SRV-03 | Bộ xử lý HTTP | Phục vụ file tĩnh, `GET /api/my-info`, `OPTIONS` (CORS `*`), chặn path traversal, chặn `tools/` (Cat Lab) với kết nối không phải localhost (`isLoopback`) | — | Phục vụ mọi file trong thư mục dự án (kể cả `.git/`) | NET-01 |
| FN-SRV-04 | `wss.on('connection')` | Gán `clientId`, lưu thông tin, gửi `welcome`, broadcast `system_broadcast` | — | `connectedClients` | NET-02, NET-09 |
| FN-SRV-05 | `ws.on('message')` | Xử lý `set_nickname` (cắt 30 ký tự) và `action` (dựng `action_broadcast` rồi phát cho mọi máy) | — | Không xác thực, không giới hạn tần suất; `detail` chuyển nguyên văn | NET-04, NET-05 |
| FN-SRV-06 | `broadcast(messageObj)` | Gửi JSON tới mọi socket đang mở | → — | | NET-05 |
| FN-SRV-07 | `ws.on('close')` / `ws.on('error')` | Gỡ client, phát `user_left`, ghi log lỗi | — | | NET-09 |
| FN-SRV-08 | `server.listen(PORT, '0.0.0.0')` | Khởi động, in địa chỉ chia sẻ | — | `config.PORT`, `config.SERVER_IP` | NET-01 |

---

## 7. Phụ lục — Giao diện dữ liệu

### 7.1 Từ điển dữ liệu `gameState.data` (lưu trong `localStorage`)

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `name` | string | Tên mèo |
| `level`, `exp`, `expToNext` | number | Cấp, EXP hiện tại, EXP cần lên cấp tiếp |
| `coins` | number | Số xu |
| `vitals` | `{hunger, happiness, health, energy}` | 0–100 |
| `currentAction` | `{title, desc, progress}` | Nội dung thẻ hành động |
| `inventory` | `{kibble, salmon, milk, pate, dried_fish, catnip_snack}` | Số lượng đồ ăn |
| `ownedToys`, `activeToy` | string[], string\|null | Đồ chơi sở hữu, đồ chơi đang dùng |
| `customization` | `{fur, hat, glasses, accessory, roomTheme}` | Trang phục đang mặc |
| `ownedCostumes` | string[] | Trang phục đã mở khoá |
| `dailyQuests` | `{id, text, target, current, done, rewardCoins, rewardExp}[]` | 4 nhiệm vụ |
| `collection` | `{foodsDiscovered, toysUsed, achievements}` | Sổ sưu tập |
| `stats` | `{petCount, timesFed, timesPlayed, sleepSeconds}` | Thống kê |
| `lastSeen` | number (ms) | *(nhánh offline)* lần cuối có mặt |
| `pendingGifts` | `{type, icon, label, amount, id?}[]` | *(nhánh offline)* quà chưa nhận |

Không lưu: `behaviorState`, `stateTimer`, `nextAutonomousActionTimer`, `awayFrom`.

### 7.2 Thông điệp WebSocket

| Hướng | `type` | Trường | Ghi chú |
|---|---|---|---|
| C→S | `set_nickname` | `nickname` | Cắt 30 ký tự |
| C→S | `action` | `actionType, detail, icon, themeColor` | `actionType`: pet, feed, toy, outfit, sleep, room, rename, roll, stretch, special |
| S→C | `welcome` | `clientId, ip, hostname, onlineCount, serverIp` | Chỉ gửi cho chính client |
| S→C | `system_broadcast` | `message, onlineCount` | Khi có người vào |
| S→C | `action_broadcast` | `id, senderId, clientIp, hostname, nickname, displayName, actionType, detail, icon, themeColor, timestamp` | Gửi cho mọi máy |
| S→C | `user_left` | `onlineCount` | |
| S→C | `nickname_updated` | `nickname` | Chỉ gửi cho chính client |

### 7.3 HTTP

| Phương thức | Đường dẫn | Trả về |
|---|---|---|
| GET | `/` | `index.html` |
| GET | `/api/my-info` | `{ip, hostname, serverIp, port}` |
| GET | bất kỳ đường dẫn khác | File trong thư mục dự án, hoặc 404/403 |
| OPTIONS | bất kỳ | 204 (CORS `*`) |

### 7.4 Bảng truy vết Feature → Function (rút gọn)

| Module | Feature | Function chính |
|---|---|---|
| CORE | CORE-01..05 | FN-APP-30, FN-GS-01..06, FN-REN-07, FN-REN-10 |
| PET | PET-01..17 | FN-GS-11..17, FN-GS-29, FN-REN-22..25, FN-AUD-17 |
| ACT | ACT-01..11 | FN-GS-15..19, FN-GS-28, FN-REN-03, FN-REN-04, FN-REN-06, FN-REN-16, FN-REN-36..38, FN-APP-08, FN-APP-11..15, FN-APP-33, FN-APP-34 |
| ECO | ECO-01..08 | FN-GS-20..26, FN-APP-04, FN-APP-20, FN-APP-22 |
| OFF | OFF-01..04 | FN-GS-04, 05, 07..10, FN-APP-05, FN-APP-25, FN-APP-26, FN-APP-29 |
| CUS | CUS-01..05 | FN-GS-27, FN-REN-09, FN-REN-34, FN-REN-35, FN-APP-09, FN-APP-21 |
| REN | REN-01..13 | FN-REN-01..41 |
| AUD | AUD-01..05 | FN-AUD-01..16 |
| UI | UI-01..08 | FN-APP-03, FN-APP-07, FN-APP-08, FN-APP-11..24 |
| NET | NET-01..09 | FN-NET-01..13, FN-SRV-01..08 |
