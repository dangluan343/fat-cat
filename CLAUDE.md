# CLAUDE.md — Meow 2D (fat-cat)

Game nuôi mèo ảo 2D chạy trên trình duyệt, kèm server Node.js nhỏ để chia sẻ trong mạng LAN/WiFi văn phòng. Giao diện và comment viết bằng **tiếng Việt**; hãy giữ phong cách này khi thêm chữ hiển thị hoặc comment mới.

- Repo: https://github.com/dangluan343/fat-cat (nhánh `main`, remote `origin`)
- Tên package: `meow-2d` v1.0.0, CommonJS, một dependency duy nhất: `ws` (WebSocket)
- Không có build step, không có bundler, không có framework, không có test, không có linter. Toàn bộ frontend là vanilla JS nạp bằng thẻ `<script>`.
- Tài liệu phân rã: [docs/FEATURE_LIST.md](docs/FEATURE_LIST.md) (feature theo module, mã `CORE-01`..., ưu tiên, trạng thái, backlog) và [docs/FUNCTION_LIST.md](docs/FUNCTION_LIST.md) (từng hàm, mã `FN-GS-01`..., liên kết về feature). Khi thêm/sửa tính năng hoặc hàm, cập nhật cả hai file và giữ mã ổn định.
- Model mèo, biểu cảm, hành động: [docs/CAT_ANIMATION.md](docs/CAT_ANIMATION.md). Mọi thay đổi animation đi qua **Cat Lab** trước (xem "Quy trình làm việc").

## Quy trình làm việc

### Quy trình chung cho mọi thay đổi

1. **Nhánh riêng**: không sửa thẳng `main`; tạo nhánh theo việc (`feat/...`, `fix/...`).
2. **Đọc trước khi sửa**: file này, rồi Feature List / Function List để biết mã feature/hàm liên quan và vấn đề đã biết.
3. **Ghi kế hoạch** cho việc lớn (nhiều file hoặc thay đổi hành vi): thêm hoặc cập nhật tài liệu trong `docs/` trước khi code (ví dụ `docs/CAT_ANIMATION.md` cho phần mèo).
4. **Sửa code** theo "Quy ước khi chỉnh sửa" ở cuối file.
5. **Kiểm tra**: `node --check <file>` cho mọi file JS đã sửa; chạy `npm start`, F5 http://localhost:3333 và thử đúng các hành động bị ảnh hưởng; mở DevTools xem console không có lỗi mới. Phần vẽ mèo thì kiểm tra trong Cat Lab.
6. **Cập nhật tài liệu**: Feature List (trạng thái, mã mới, bảng tổng quan), Function List (hàm mới/đổi, giữ mã cũ và đánh dấu "Đã gỡ"/"Đã tách" thay vì đánh số lại), file này nếu kiến trúc hoặc quy trình đổi.
7. **Commit** theo từng tính năng, nội dung commit nói rõ thay đổi và lý do.

### Quy trình animation (Cat Lab → dự án)

Không sửa trực tiếp `cat-renderer.js` để thử nghiệm. Thử trên **bản nháp**, so sánh với bản chính, chỉ áp dụng khi đã ưng.

**Cat Lab chỉ tồn tại và chỉ chạy trên máy local:**
- Thư mục `tools/` (Cat Lab, `lab-sync.js`, bản nháp) nằm trong `.gitignore`, **không bao giờ commit/push**. Máy khác clone repo sẽ không có công cụ này.
- Server trả 403 cho mọi đường dẫn trong `tools/` nếu kết nối không đến từ chính máy chạy server (kiểm tra địa chỉ socket, không tin `x-forwarded-for`). Đồng nghiệp mở `http://<IP LAN>:3333/tools/...` sẽ bị chặn; chỉ mở bằng `http://localhost:3333/tools/cat-lab.html`.
- Đừng thêm script npm hay tham chiếu nào trong code game tới `tools/`.

```bash
node tools/lab-sync.js draft     # chép cat-renderer.js → tools/lab/cat-renderer.draft.js (bản nháp)
```

1. **Tạo nháp** bằng lệnh trên. Lệnh từ chối ghi đè một bản nháp đang có thay đổi chưa áp dụng (thêm `--force` nếu chắc chắn bỏ).
2. **Thử nhanh tham số** (không cần sửa code): mở http://localhost:3333/tools/cat-lab.html, chọn trạng thái, mở "Chỉnh rig bằng tay", bật ghim, kéo thanh trượt. Chỉ các tham số đã kéo (tô cam) bị ghim. Ưng thì bấm "Sao chép đoạn rig" để lấy `rig: { ... }` dán vào `CAT_EXPRESSIONS` trong bản nháp.
3. **Sửa bản nháp** `tools/lab/cat-renderer.draft.js` (thêm trạng thái, kiểu mắt/miệng/chân, đổi hình vẽ). Lab tự nạp lại script mới mỗi lần F5.
4. **Xem và tương tác** trong lab:
   - Nút trạng thái: xem lưới cả 24 trạng thái hoặc một trạng thái phóng to (bấm tiêu đề ô).
   - Phát: dừng/chạy (Space), từng khung (→), phát lại hoạt ảnh có kịch bản (R), tốc độ 0.25×–2×.
   - Tương tác: vuốt (P) với kết quả chọn được (thích / cáu / đang ngủ / giật mình), bấm vào mèo (C), cho ăn (F), đá bóng len (K), chớp mắt (B), đồ chơi.
   - Ngoại hình: 5 màu lông, mũ, kính, phụ kiện cổ, tâm trạng nền.
   - Ô đang phóng to hiện bảng giá trị rig theo thời gian thực.
5. **So sánh** http://localhost:3333/tools/cat-lab.html?compare=1: bản nháp (trái) và bản chính (phải) chạy cùng thiết lập và cùng thao tác. Kiểm tra đủ các trạng thái và ít nhất lông cam, lông đen (màu tối hay lộ lỗi tương phản).
6. **Áp dụng**:
   ```bash
   node tools/lab-sync.js status    # nháp có khác bản chính không, bản chính có bị đổi từ lúc tạo nháp không
   node tools/lab-sync.js apply     # kiểm tra cú pháp nháp rồi chép đè vào cat-renderer.js
   ```
   `apply` từ chối nếu nháp lỗi cú pháp, hoặc nếu `cat-renderer.js` đã bị sửa sau khi tạo nháp (gộp tay rồi mới áp dụng, hoặc `--force`).
7. **Thử trong game**: F5 http://localhost:3333; logic gắn với trạng thái (khi nào mèo vào trạng thái, thưởng/phạt) nằm ở `game-state.js` và chỉ kiểm tra được trong game, không có trong lab (lab dùng `gameState` giả).
8. **Tài liệu**: cập nhật `docs/CAT_ANIMATION.md` (bảng hành động, trạng thái ✅), Feature List, Function List; rồi commit.

Thêm một trạng thái hành vi mới cần sửa đủ: `CAT_EXPRESSIONS` (+ `STATE_MARKERS`, kịch bản trong `getRigTarget` nếu có) ở renderer; `setBehavior` (banner), AI/điều kiện kích hoạt ở `game-state.js`; câu bong bóng thoại trong `updateHUD` (`app.js`); danh sách `STATES` trong `tools/cat-lab.html`.

## Chạy dự án

```bash
npm install
npm start        # = node server.js
```

- Cổng mặc định **3333** (đặt trong `config.js`; server fallback về 3000 nếu thiếu). Mở http://localhost:3333.
- Server in ra link chia sẻ `http://<SERVER_IP>:3333`. `SERVER_IP` chỉ là chuỗi gõ tay trong `config.js` để hiển thị link, **không** được tự dò. Đổi mạng WiFi thì phải sửa tay.
- Server nghe `0.0.0.0`, và phục vụ file tĩnh với `Cache-Control: no-cache`, nên sửa frontend chỉ cần F5, không cần restart. Sửa `server.js` hoặc `config.js` thì phải restart.
- `npm test` chỉ là placeholder, thất bại có chủ đích. Kiểm tra cú pháp nhanh: `node --check app.js` (làm tương tự với `game-state.js`, `server.js`).
- Cat Lab (công cụ phát triển, **chỉ local**, không có trong repo): http://localhost:3333/tools/cat-lab.html. Lệnh bản nháp: `node tools/lab-sync.js draft | status | apply`.

## Cấu trúc file

| File | Dòng | Vai trò |
|---|---|---|
| `index.html` | ~325 | Một trang duy nhất: canvas + lớp UI overlay + các modal. Thứ tự nạp script quan trọng (xem dưới) |
| `style.css` | ~1190 | Toàn bộ CSS, dùng biến `:root` (`--accent-amber`, `--card-bg`...). Nền phòng lấy từ `assets/room_bg.jpg`; chế độ `sunset-mode`/`night-mode` gắn lên `#game-container` |
| `config.js` | 36 | Cấu hình mạng + vài hằng UI. **Dùng chung** cho Node (`module.exports`) và trình duyệt (`window.MEOW_CONFIG`) |
| `server.js` | 280 | HTTP tĩnh + `/api/my-info` + WebSocket (broadcast hành động giữa các máy) |
| `network-client.js` | 381 | Lớp `OfficeNetworkClient`: kết nối WS, thanh trạng thái online, thẻ thông báo nổi từ dưới lên |
| `game-state.js` | ~690 | Lớp `CatGameState`: dữ liệu mèo, chỉ số, AI tự trị, phản ứng khi vuốt, tiến trình, cửa hàng, lưu/nạp, tiến trình offline |
| `cat-renderer.js` | ~1810 | Lớp `CatRenderer`: vẽ mèo theo rig biểu cảm (`RIG_DEFAULTS`, `CAT_EXPRESSIONS`), đồ vật, hạt hiệu ứng, xử lý chuột/cảm ứng |
| `audio-synth.js` | 406 | Lớp `CatAudioEngine`: âm thanh tổng hợp bằng Web Audio, không có file audio nào |
| `app.js` | ~775 | Điều phối UI: HUD, dock kho đồ, modal, nút hành động, vòng lặp game |
| `assets/room_bg.jpg` | 710 KB | Ảnh nền phòng, tài nguyên ảnh duy nhất |
| `tools/` | — | **Chỉ có trên máy local, git bỏ qua.** `cat-lab.html` (Cat Lab), `lab-sync.js` (tạo / kiểm tra / áp dụng bản nháp), `lab/` (bản nháp `cat-renderer.draft.js` + mốc `.draft-base`) |
| `docs/` | — | Feature List, Function List, CAT_ANIMATION |

### Thứ tự nạp script (không được đảo)

`config.js` → `network-client.js` → `audio-synth.js` → `game-state.js` → `cat-renderer.js` → `app.js`

Các module giao tiếp qua **biến toàn cục trên `window`**, không dùng ES module:

- `window.MEOW_CONFIG` (config.js)
- `window.officeNetwork` (network-client.js, tạo ở `DOMContentLoaded`)
- `window.catAudio` (audio-synth.js, tạo ngay khi nạp)
- `window.gameState` (game-state.js, tạo ngay khi nạp)
- `window.showToast`, `window.showLevelUpModal` (app.js, gán trong `DOMContentLoaded`)

Mọi chỗ gọi sang module khác đều bảo vệ bằng `if (window.catAudio)`, `if (window.officeNetwork)`... Giữ thói quen này, vì `officeNetwork` chỉ tồn tại sau `DOMContentLoaded` và `showToast` chỉ có sau khi `app.js` chạy.

## Kiến trúc chạy

### Vòng lặp chính (`app.js`, cuối file)

`requestAnimationFrame` → `delta = min(0.1s, dt)` → `state.updateVitals(delta)` → `renderer.update(delta)` → `renderer.render()`.
Delta bị chặn ở 0.1s nên tab ẩn/treo **không** tích lũy thời gian (đây là lý do cần cơ chế offline riêng, xem dưới).

### Trạng thái game (`CatGameState`)

- Dữ liệu bền vững nằm trong `this.data`, lưu vào `localStorage` khóa `meow_2d_save_data_v1`. `load()` trộn nông `{...default, ...saved}` nên **thêm trường mới ở cấp trên cùng** trong default là tương thích với save cũ; trường lồng nhau (`vitals`, `stats`...) bị save cũ ghi đè cả khối, nên thêm trường lồng nhau cần tự xử lý khi thiếu.
- Mỗi lần `notify()` thì `save()` rồi gọi mọi listener (hiện chỉ có `updateHUD`). Hầu như mọi hành động (`addCoins`, `addExp`, `setAction`...) đều gọi `notify()`, nên `updateHUD` dựng lại DOM rất thường xuyên.
- Trạng thái hành vi **không lưu**: `behaviorState`, `stateTimer`, `nextAutonomousActionTimer`, `petTimes`, `annoyedPets`, `nextBehavior` chỉ nằm trong bộ nhớ. 24 giá trị: `IDLE, PETTING, SLEEPING, YAWNING, LICKING_PAW, ROLLING, BEGGING, EATING, PLAYING, ZOOMIES, SULKING, SLOW_BLINK, CURIOUS, SURPRISED, ANNOYED, KNEADING, BLEP, GREETING, GROOMING, SICK, EXHAUSTED, STARVING, FULL, HISS` (ý nghĩa và kích hoạt: `docs/CAT_ANIMATION.md` mục 4).
- `pet(isClick)` trả `'ok' | 'annoyed' | 'hiss' | 'dozing' | 'startled'`: vuốt ≥ 32 lần trong 10 giây thì `ANNOYED` (không thưởng, `PET_OVERLOAD`); vẫn vuốt 6 lần khi đang cáu thì `HISS`; rê chuột khi mèo ngủ thì ngủ tiếp; bấm khi ngủ thì `SURPRISED`. `slowBlinkAtCat()` cho nút "Nháy mắt" (hồi chiêu 8 giây). Quay lại sau khi vắng thì `GREETING`.
- **Biểu cảm theo chỉ số** (ngưỡng ở `VITAL_MOODS`): sức khoẻ < 30 → `SICK`; đói < 10 → `STARVING` (thay `BEGGING`); năng lượng < 15 → `EXHAUSTED` (từ chối chơi, `playWithToy` trả `false`); ăn tới đói ≥ 95 → `FULL` sau khi ăn, đã no thì `feed` trả `'full'` và không trừ món. Trạng thái nối tiếp dùng `nextBehavior` (bị xoá mỗi khi `setBehavior`).
- `setBehavior(state, duration)` đồng thời cập nhật banner "Hành động hiện tại" (`setAction`). `renderer` đọc `gameState.behaviorState` mỗi khung hình để chọn hoạt ảnh.
- Chỉ số (`vitals`): `hunger`, `happiness`, `health`, `energy`, thang 0–100.
  - Online: hunger giảm 0.1/giây (hết sạch sau ~17 phút). Khi hunger < 25 thì happiness giảm (sàn 10) và health giảm (sàn 20); ngược lại health tự hồi 0.05/giây. Energy giảm 0.05/giây, hồi 1.5/giây khi `SLEEPING`.
  - Mèo không chết, hình phạt nhẹ có chủ đích.
- **AI tự trị** (`tickAutonomousAI`): mỗi 8–16 giây chọn hành động, không ngắt các trạng thái trong `UNINTERRUPTIBLE_STATES`: đói (<35) thì `BEGGING`; năng lượng thấp (<25) thì `SLEEPING`; năng lượng cao (>80) có 25% bùng `ZOOMIES` (+5 xu, +20 vui); vui < 30 có 50% `SULKING`; còn lại chọn ngẫu nhiên ngáp/liếm chân/rửa mặt/lăn/tò mò/thè lưỡi/đứng yên, vui > 65 thêm nháy mắt chậm và nhồi bột.
- Tiến trình: `addExp` → `levelUp` (EXP cần = `level * 100 * 1.15`, thưởng `level * 50` xu, gọi `window.showLevelUpModal`). Cửa hàng: `buyItem(category, id, price)` với `category` là `food | toy | costume`.
- Món ăn (`feed`) định nghĩa trong hàm: `kibble, salmon, milk, pate, dried_fish, catnip_snack`, mỗi món có chỉ số hunger/happiness/health/exp riêng.
- Nhiệm vụ hằng ngày (`dailyQuests`): `feed_cat`, `play_cat`, `pet_cat`, `sleep_cat`, cập nhật qua `completeQuestProgress`.
- Thành tựu: `first_pet`, `gourmet_cat`, `stylish_pet`, `laser_chaser`, `zoomies_champ` (`laser_chaser` chưa có chỗ nào mở khóa).

### Tiến trình offline (nhánh `feat/offline-progress`)

Cơ chế "mèo để lại quà như Neko Atsume", đã làm nhưng **chưa commit** tại thời điểm viết file này.

- `data.lastSeen` được cập nhật trong `save()` (trừ khi tab đang ẩn) và mỗi 15 giây khi tab hiển thị. `markAway()` ghi mốc rời đi khi tab ẩn hoặc `pagehide`. Lúc nạp, `load()` lấy `lastSeen` đã lưu làm `awayFrom`.
- `applyOfflineProgress()` chạy lúc khởi động và mỗi khi tab hiện lại. Vắng < 120 giây thì bỏ qua; thời gian tính tối đa 8 giờ. Hunger giảm chậm (0.006/giây, tối đa 50 điểm, sàn 25 để không kích hoạt hình phạt đói), happiness giảm tối đa 20 (sàn 40), energy tăng tối đa 50. Chỉ số đang thấp hơn sàn thì giữ nguyên, không bị nâng lên.
- Quà: 1 món / 30 phút vắng, tối đa 6. `rollGift()` ra xu (60%, 10–25 xu), đồ ăn thường (30%), hoặc `salmon`/`catnip_snack` (10%). Quà chờ lưu trong `data.pendingGifts` (tối đa 12), nhận bằng `claimGifts()` qua modal `#gift-modal` (nút `#btn-claim-gifts`). Modal này không đóng khi bấm nền.
- Mọi hằng số cân bằng nằm ở `OFFLINE_CONFIG` đầu `game-state.js`.

### Renderer (`CatRenderer`)

- Vẽ hoàn toàn bằng Canvas 2D theo lệnh (không dùng sprite). Con mèo là dáng "loaf" góc nghiêng 3/4. Chi tiết: `docs/CAT_ANIMATION.md`.
- **Rig biểu cảm**: `RIG_DEFAULTS` (19 tham số: mắt, mí, đồng tử, miệng, má, râu, tai, đầu, đuôi, thân) và `CAT_EXPRESSIONS[state]` (kiểu mắt/miệng/chân/đuôi rời rạc + đích rig). Mỗi khung: `getRigTarget(state)` (đích + kịch bản theo `stateTime` + tâm trạng nền từ vitals khi IDLE) → `updateRig` nội suy mượt. Thêm biểu cảm = thêm dữ liệu vào `CAT_EXPRESSIONS`, ít khi phải sửa hàm vẽ.
- Thứ tự lớp trong `render3DCatLoaf`: bóng đổ → biến đổi thân (nhảy/kéo/hạ/lắc) → đuôi → thân → chân lớp dưới → [biến đổi đầu: tai, đầu, mặt, mũ/kính] → phụ kiện cổ → chân lớp trên (chân giơ lên vẽ đè lên mặt). Toạ độ đầu, mặt, mũ, kính tính quanh tâm đầu `CAT_HEAD`.
- `update(delta)` xử lý hoạt ảnh (thở, chớp mắt, giật tai, nhồi bột, nhai, Zoomies chạy ngang), đếm `stateTime`/gọi `onStateEnter` (ký hiệu ❓❗💢...), `updateRig`, tắt tiếng rù rù khi hết vuốt, vật lý bóng len, hạt hiệu ứng, vị trí bong bóng thoại `#cat-speech-bubble`.
- Vuốt ve: di chuột vào vùng elip quanh mèo (mỗi ≥260 ms) hoặc bấm giữ gọi `triggerPetFeedback`, từ đó gọi `gameState.pet(isClick)` và phản ứng theo kết quả; chỉ broadcast khi kết quả `ok`.
- Renderer chỉ đọc `window.gameState` (`behaviorState`, `data.customization`, `data.vitals`, `data.activeToy`) và gọi `pet()`, `setBehavior()`; vì vậy Cat Lab chạy được với một `gameState` giả.
- **Vị trí mèo**: `resize()` → `layoutOnRug()` tính tấm thảm trên màn hình từ `ROOM_BG` (ảnh nền 1376×768, CSS `cover` + `center bottom`), `scale = cover × 1.2` (kẹp 0.7–1.9), rồi chọn điểm trên thảm ít bị UI che nhất. Các khối UI lấy từ `renderer.getBlockedRects` (app.js gán: dock, thẻ hành động, menu phải, bảng trái). **Đổi ảnh nền hoặc bố cục UI lớn thì phải đo lại `ROOM_BG.rug`/cập nhật danh sách khối.** Đĩa ăn, bóng len đặt lại cạnh mèo mỗi lần resize. Constructor chạy trước `resize()` (có `setTimeout 100ms`).
- Màu lông: `orange_tabby` (gốc), `calico`, `tuxedo`, `black_cat`, `siamese`. Phụ kiện: mũ (`party_hat`, `chef_hat`, `wizard_hat`), kính (`sunglasses`, `round_glasses`), phụ kiện cổ (`red_bowtie`, `gold_bell`).

### Âm thanh (`CatAudioEngine`)

Toàn bộ do `AudioContext` tổng hợp: `meow(type)`, `startPurr/stopPurr`, `crunch`, `slurp`, `pop`, `coin`, `levelUp`, `yawn`, `squeak`, nhạc nền `toggleBGM`. `init()` chỉ được gọi sau cú click/phím đầu tiên (chính sách autoplay của trình duyệt, xem `unlockAudio` trong `app.js`). `isMuted` điều khiển tắt tiếng.

### UI (`app.js`)

- `updateHUD(data)` cập nhật hồ sơ/EXP/xu, 4 thanh chỉ số, danh sách nhiệm vụ, thẻ hành động hiện tại, bong bóng thoại và dock kho đồ.
- Dock dưới có 5 tab: `food`, `toy`, `outfit`, `decor`, `special`; `renderInventorySlots()` dựng lại theo tab. **Danh mục vật phẩm bị lặp ở nhiều nơi**: dock, `renderShopItems` (catalog), `renderWardrobeGrid`, và định nghĩa món ăn trong `game-state.js` + tên quà trong `GIFT_FOODS`. Thêm một vật phẩm mới phải sửa cả mấy chỗ này.
- **Cho ăn bằng kéo thả** (không còn nút "Cho ăn"): nhấn giữ ô đồ ăn trong dock → bóng món ăn `.food-drag-ghost` bay theo con trỏ → app gọi `renderer.setFoodDrag()` (mèo chờ ăn, vùng thả nét đứt) → thả trúng mèo (`renderer.endFoodDrag()` trả true) thì `dropFood` + `state.feed`. Dùng Pointer Events nên chạy cả chuột và cảm ứng; bấm tại chỗ chỉ hiện hướng dẫn, thả trượt không mất món.
- Modal: shop, wardrobe, collection, settings, level-up, gift. Mở bằng `openModal(id)`, đóng bằng `.btn-close-modal` hoặc bấm nền.
- Đồ chơi `windup_mouse` và `catnip_fish` có trong shop/kho nhưng renderer chưa vẽ gì cho chúng: `renderActiveToys` chỉ xử lý `laser_pointer` và `feather_wand`. Bóng len (`yarn_ball`) là vật thể luôn hiện trên sàn, bấm trực tiếp vào canvas để đá, không đi qua `activeToy`.
- Nước Tăng Lực (`super_tonic`) trong tab "Đặc biệt" luôn hiển thị `count: 1` cứng và **dùng không giới hạn, miễn phí**, hồi đầy 3 chỉ số.

## Mạng nhiều người (văn phòng)

**Quan trọng để hiểu đúng:** mỗi trình duyệt có **một con mèo riêng** trong `localStorage` của nó. Server **không** giữ trạng thái mèo. Phần "chơi chung" chỉ là **luồng thông báo hành động**: ai vuốt/cho ăn/chơi thì mọi máy khác thấy thẻ nổi "máy X vừa ...".

### Giao thức WebSocket (JSON, cùng cổng với HTTP)

Client → server:
- `{type:'set_nickname', nickname}` (cắt tối đa 30 ký tự)
- `{type:'action', actionType, detail, icon, themeColor}`; `actionType` dùng: `pet, feed, toy, outfit, sleep, room, rename, roll, stretch, special`

Server → client:
- `welcome` {clientId, ip, hostname, onlineCount, serverIp} (chỉ gửi cho chính client)
- `system_broadcast` {message, onlineCount} khi có người vào
- `action_broadcast` {id, senderId, clientIp, hostname, nickname, displayName, actionType, detail, icon, themeColor, timestamp}
- `user_left` {onlineCount}
- `nickname_updated` {nickname} (chỉ gửi cho chính client)

Ghi chú: client có xử lý `user_joined` nhưng server **không bao giờ gửi** loại này (vào phòng đi qua `system_broadcast`).

### Hành vi đáng nhớ

- IP/hostname: server lấy IP từ `x-forwarded-for` hoặc socket, cắt prefix IPv6, rồi phân giải tên máy qua **reverse DNS** (timeout 1.5 giây, có cache `Map`). `ENABLE_REVERSE_DNS` trong `config.js` bật/tắt. Localhost hiển thị là "Máy Chủ (Host)".
- Client tự kết nối lại sau 3 giây khi mất kết nối. URL WS lấy từ `window.location.host`, chỉ fallback sang `SERVER_IP:PORT` khi mở bằng `file://`.
- Biệt danh lưu `localStorage` khóa `meow_office_nickname`, gửi lại server mỗi lần kết nối.
- Vuốt ve bị throttle phía client (`PET_THROTTLE_MS` = 1200 ms) để khỏi spam. Số thẻ nổi tối đa `MAX_FLOATING_NOTIFICATIONS` (5), mỗi thẻ hiện `NOTIFICATION_DURATION_MS` (4500 ms).
- API HTTP duy nhất ngoài file tĩnh: `GET /api/my-info` → `{ip, hostname, serverIp, port}`.

## Dữ liệu lưu trữ phía trình duyệt

| Khóa localStorage | Nội dung |
|---|---|
| `meow_2d_save_data_v1` | Toàn bộ `gameState.data` (JSON) |
| `meow_office_nickname` | Biệt danh hiển thị trong văn phòng |

Nút "Đặt lại" trong Cài đặt gọi `resetData()` (xóa khóa save rồi reload). Đổi cấu trúc save không tương thích thì nên tăng hậu tố `_v1`.

## Vấn đề đã biết (chưa sửa)

Đây là những gì phát hiện khi đọc code, ghi lại để tránh dẫm phải hoặc để xử lý sau.

**Bảo mật (mức LAN):**
1. **XSS qua thông báo hành động.** `renderFloatingActionCard` trong `network-client.js` chèn `data.detail` bằng `innerHTML` mà không escape. Server chuyển nguyên `detail` do client gửi, và tin `rename` còn nhúng tên mèo người dùng gõ vào `detail`. Một máy trong mạng có thể gửi HTML/JS để chạy trên mọi máy khác. Các trường khác (hostname, nickname, IP) đã được `escapeHtml`. Tương tự, toast của đổi tên và đổi biệt danh cũng ghép chuỗi người dùng nhập vào `innerHTML`.
2. **Server phục vụ mọi file trong thư mục dự án**, gồm `server.js`, `package.json`, và cả `.git/` (đã thử: `/.git/config` trả về 200), vì chỉ chặn path traversal chứ không có danh sách cho phép. Không nên chạy trên mạng không tin cậy.
3. Header `Access-Control-Allow-Origin: *` và WebSocket không kiểm tra `Origin`; `x-forwarded-for` được tin tưởng nên IP hiển thị có thể bị giả.
4. Không có xác thực hay giới hạn tần suất phía server cho tin `action`.

**Logic/gameplay:**
5. **Nhiệm vụ hằng ngày không reset.** Không có logic ngày; sau khi hoàn thành là xong vĩnh viễn. Dữ liệu mặc định còn cài sẵn tiến độ dở dang (ví dụ `feed_cat` đã 1/2).
6. `super_tonic` miễn phí và vô hạn (xem trên); `laser_chaser` không có đường nào mở khóa; `windup_mouse`/`catnip_fish` chưa có hoạt ảnh.
7. Dữ liệu mặc định ở lần chơi đầu đã là Lv.3, 280 xu và có sẵn vài thành tựu.
8. Hunger giảm rất nhanh khi đang mở tab (~17 phút từ đầy đến cạn) so với tốc độ kiếm xu, nên nếu mở tab lâu mèo sẽ liên tục đòi ăn.

**Kỹ thuật:**
9. `updateHUD` dựng lại toàn bộ danh sách nhiệm vụ và dock bằng `innerHTML` ở mỗi `notify()` (kể cả khi chỉ thay đổi nhỏ do AI tự trị), có thể tốn nếu thêm nhiều vật phẩm.
10. Không có test tự động nào; mọi kiểm tra là thủ công trong trình duyệt.

## Quy ước khi chỉnh sửa

- Giữ vanilla JS + biến toàn cục `window.*`, không thêm bundler/framework nếu không được yêu cầu.
- Chữ hiển thị cho người dùng bằng tiếng Việt, kèm emoji theo phong cách hiện tại. Khi chèn dữ liệu do người dùng nhập vào HTML, dùng `textContent` hoặc `officeNetwork.escapeHtml`.
- Hằng số cân bằng game đặt thành object có tên ở đầu file (như `OFFLINE_CONFIG`); hằng số mạng/UI chung đặt trong `config.js`.
- Sau khi sửa JS, chạy `node --check <file>` rồi kiểm tra tay trên trình duyệt (F5). Có thể giả lập vắng mặt bằng cách sửa `lastSeen` trong `localStorage` rồi tải lại; lưu ý trang sẽ ghi đè `localStorage` ở sự kiện `pagehide`, nên cần sửa trực tiếp `gameState` trong console nếu muốn thử số liệu thấp.
- Commit theo từng tính năng; nhánh hiện tại cho tính năng offline và model mèo là `feat/offline-progress`.
- File trong repo dùng xuống dòng CRLF trên máy Windows này (`core.autocrlf=true`); script sửa file hàng loạt phải giữ `\r\n`.
