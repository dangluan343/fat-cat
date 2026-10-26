/**
 * ===================================================================
 * MEOW 2D - 3/4 PERSPECTIVE FLUFFY CHUBBY CAT RENDERER
 * ===================================================================
 * 
 * Tái hiện chính xác chú mèo mập ú dáng nằm loaf góc nghiêng 3/4 (theo ảnh mẫu):
 * - Đuôi xù to dựng cao bên trái với sọc vằn và chóp trắng bồng bềnh.
 * - Thân bánh mì béo múp, bụng trắng mềm mại nằm êm ái trên thảm.
 * - Đầu nghiêng nhẹ về bên phải, má xù túm lông tầng, tai dựng nhung hồng.
 * - Khuôn mặt siêu ngọt ngào: Mắt cười híp tịt hình trăng khuyết ^ ^ khi được vuốt ve,
 *   má hồng đào ửng sáng, mũi hồng chúm chím và nụ cười mèo :3.
 * - 9 trạng thái hoạt ảnh độc đáo: Vuốt ve nhào bột, Ngủ say cuộn tròn, Lắc mông săn mồi,
 *   Ngáp duỗi móng, Ăn nhồm nhoàm chóp chép, Lăn ngửa bụng khoe đệm chân hồng (toe beans),
 *   Chắp tay xin ăn (begging), Liếm chân chải chuốt, Phóng Zoomies cuồng nhiệt.
 * - Biểu cảm và tư thế chạy bằng rig tham số (mắt, mí, đồng tử, tai, râu, đuôi, thân),
 *   xem docs/CAT_ANIMATION.md.
 */

// Tâm đầu mèo trong hệ toạ độ thân
const CAT_HEAD = { x: 42, y: -28 };

// Rig biểu cảm & tư thế. Mỗi trạng thái hành vi khai báo "đích" cho các tham số;
// renderer nội suy giá trị hiện tại về đích mỗi khung hình nên chuyển trạng thái mượt.
// Ý nghĩa dựa trên ngôn ngữ cơ thể mèo thật (docs/CAT_ANIMATION.md, mục 2-3).
const RIG_DEFAULTS = {
  eyeOpen: 1,         // 0 nhắm ... 1 mở ... 1.35 mở to (ngạc nhiên)
  pupil: 0.45,        // 0.15 khe dọc (cáu) ... 0.9 giãn tròn (hứng thú, giật mình)
  lidTilt: 0,         // >0 đuôi mí cụp (buồn, nài nỉ), <0 đầu mí cụp (cau có)
  mouthOpen: 0,       // 0 khép ... 1 há to
  blush: 0.45,        // độ hồng của má
  whisker: 0,         // -1 cụp sát má (sợ, cáu) ... +1 chĩa ra trước (tò mò, săn)
  earRot: 0,          // >0 xoay ngang ra ngoài (tai máy bay), <0 chụm về trước
  earFlat: 0,         // 0 dựng ... 1 ép sát đầu
  headTilt: 0,        // radian
  headDX: 0,
  headDY: 0,
  tailRaise: 0.8,     // 0 hạ sát sàn (buồn) ... 1 dựng thẳng (thân thiện)
  tailPuff: 0,        // 0 bình thường ... 1 xù to (giật mình)
  tailSwayAmp: 14,    // biên độ vẫy đuôi
  tailSwaySpeed: 2.2, // tốc độ vẫy (nhanh = quất đuôi khi cáu)
  bodyLift: 0,        // dịch thân theo chiều dọc (âm = nhảy lên)
  bodyStretch: 0,     // kéo dài thân (vươn vai, vồ)
  crouch: 0,          // 0 bình thường ... 1 hạ thấp người rình mồi
  bodyRock: 0,        // lắc lư thân (lăn lộn)
  stand: 0            // 0 nằm loaf ... 1 đứng bốn chân (đi dạo); chân mọc dần khi đứng dậy
};

// Đứng dậy nâng thân lên bao nhiêu (đơn vị thân) và tốc độ đi dạo (px/giây ở scale 1)
const STAND_LIFT = 26;
const WALK_SPEED = 38;

// Kiểu rời rạc (mắt, miệng, chân, đuôi) + đích rig cho từng trạng thái hành vi.
// eyes: open | happy | closed | squeeze | kawaii
// mouth: smile | open | meow | yawn | chew | lick | blep | o | pout | flat | grumble | wobble | licklips | hiss
// paws: tucked | knead | stretch | up | beg | lick | wash   (bat: lúc vồ khi PLAYING)
// tail: up (dáng theo tailRaise) | curl
// look: hướng nhìn cố định {x, y} trong [-1, 1], bỏ trống = nhìn theo con trỏ
const CAT_EXPRESSIONS = {
  IDLE: { eyes: 'open', mouth: 'smile', paws: 'tucked', tail: 'up' },
  PETTING: { eyes: 'happy', mouth: 'smile', paws: 'knead', tail: 'up',
    rig: { blush: 0.85, headTilt: 0.1, whisker: 0.2, earRot: 0.1, tailRaise: 1, tailSwayAmp: 6, tailSwaySpeed: 1.4 } },
  SLEEPING: { eyes: 'closed', mouth: 'smile', paws: 'tucked', tail: 'curl',
    rig: { headDY: 10, headTilt: -0.08, earRot: 0.18, earFlat: 0.15, blush: 0.35, whisker: -0.2 } },
  YAWNING: { eyes: 'squeeze', mouth: 'yawn', paws: 'stretch', tail: 'up',
    rig: { mouthOpen: 1, headDY: -8, headTilt: -0.14, earRot: 0.3, earFlat: 0.25, bodyStretch: 0.06, whisker: -0.4 } },
  LICKING_PAW: { eyes: 'closed', mouth: 'lick', paws: 'lick', tail: 'up',
    rig: { headDY: 6, headTilt: -0.1, tailRaise: 0.6, tailSwayAmp: 5 } },
  ROLLING: { eyes: 'happy', mouth: 'open', paws: 'up', tail: 'up',
    rig: { headTilt: 0.25, bodyRock: 1, blush: 0.75, tailRaise: 0.15, tailSwayAmp: 22, tailSwaySpeed: 3 } },
  BEGGING: { eyes: 'kawaii', mouth: 'meow', paws: 'beg', tail: 'up',
    rig: { lidTilt: 0.35, headTilt: 0.14, earRot: -0.1, whisker: 0.5, tailRaise: 1 } },
  EATING: { eyes: 'happy', mouth: 'chew', paws: 'tucked', tail: 'up',
    rig: { headDY: 12, headDX: -6, headTilt: 0.06, tailRaise: 0.7, tailSwayAmp: 6, blush: 0.6 } },
  PLAYING: { eyes: 'open', mouth: 'smile', paws: 'tucked', tail: 'up',
    rig: { pupil: 0.88, earRot: -0.12, whisker: 1, crouch: 0.5, tailRaise: 0.35, tailSwayAmp: 9, tailSwaySpeed: 11 } },
  ZOOMIES: { eyes: 'open', mouth: 'open', paws: 'tucked', tail: 'up',
    rig: { eyeOpen: 1.25, pupil: 0.9, earRot: 0.35, earFlat: 0.2, tailPuff: 0.5, tailRaise: 0.9, whisker: -0.3 } },
  SULKING: { eyes: 'open', mouth: 'pout', paws: 'tucked', tail: 'up', look: { x: -1, y: 0.4 },
    rig: { eyeOpen: 0.5, lidTilt: 0.55, pupil: 0.35, earRot: 0.4, earFlat: 0.45, headTilt: -0.16, headDX: -6, headDY: 4,
      blush: 0.15, whisker: -0.5, tailRaise: 0.05, tailSwayAmp: 4, tailSwaySpeed: 1 } },
  SLOW_BLINK: { eyes: 'open', mouth: 'smile', paws: 'tucked', tail: 'up',
    rig: { blush: 0.7, headTilt: 0.08, pupil: 0.5, tailRaise: 0.9, tailSwayAmp: 6, tailSwaySpeed: 1.2 } },
  CURIOUS: { eyes: 'open', mouth: 'o', paws: 'tucked', tail: 'up',
    rig: { eyeOpen: 1.15, pupil: 0.62, headTilt: 0.3, earRot: -0.18, whisker: 0.85, mouthOpen: 0.1, tailRaise: 0.85, tailSwayAmp: 4, tailSwaySpeed: 6 } },
  SURPRISED: { eyes: 'open', mouth: 'o', paws: 'tucked', tail: 'up',
    rig: { eyeOpen: 1.35, pupil: 0.85, earRot: -0.15, whisker: 1, mouthOpen: 0.7, blush: 0.2, tailRaise: 1, tailSwayAmp: 2 } },
  ANNOYED: { eyes: 'open', mouth: 'grumble', paws: 'tucked', tail: 'up',
    rig: { eyeOpen: 0.62, lidTilt: -0.9, pupil: 0.16, earRot: 0.62, earFlat: 0.5, whisker: -0.7, blush: 0,
      headTilt: -0.08, headDY: 3, tailRaise: 0.45, tailSwayAmp: 30, tailSwaySpeed: 9 } },
  KNEADING: { eyes: 'happy', mouth: 'smile', paws: 'knead', tail: 'up',
    rig: { blush: 0.8, earRot: 0.12, headTilt: -0.06, tailRaise: 0.85, tailSwayAmp: 5, tailSwaySpeed: 1.2 } },
  BLEP: { eyes: 'open', mouth: 'blep', paws: 'tucked', tail: 'up',
    rig: { pupil: 0.55, headTilt: 0.06, blush: 0.55 } },
  GREETING: { eyes: 'happy', mouth: 'meow', paws: 'tucked', tail: 'up',
    rig: { blush: 0.75, earRot: -0.1, headTilt: 0.12, whisker: 0.4, tailRaise: 1, tailSwayAmp: 3, tailSwaySpeed: 14 } },
  GROOMING: { eyes: 'closed', mouth: 'smile', paws: 'wash', tail: 'up',
    rig: { headTilt: -0.15, headDY: 2, earRot: 0.15, tailRaise: 0.6, tailSwayAmp: 6 } },

  // Nhóm gắn với chỉ số (P1). Cờ phụ: shiver (run), eyeBags (quầng mắt), sickTint (vạch u ám trên trán),
  // tear (giọt nước mắt), bellyPuff (bụng phình), noseWrinkle (nhăn mũi)
  SICK: { eyes: 'open', mouth: 'wobble', paws: 'tucked', tail: 'up', shiver: 1.2, eyeBags: true, sickTint: true,
    rig: { eyeOpen: 0.45, lidTilt: 0.45, pupil: 0.3, blush: 0, whisker: -0.4, earRot: 0.35, earFlat: 0.35,
      headDY: 6, headTilt: -0.1, tailRaise: 0.08, tailSwayAmp: 2, tailSwaySpeed: 0.8, crouch: 0.2 } },
  EXHAUSTED: { eyes: 'open', mouth: 'smile', paws: 'tucked', tail: 'up', eyeBags: true,
    rig: { eyeOpen: 0.4, lidTilt: 0.15, pupil: 0.4, blush: 0.2, whisker: -0.2, earRot: 0.3, earFlat: 0.2,
      tailRaise: 0.25, tailSwayAmp: 3, tailSwaySpeed: 0.8, crouch: 0.3 } },
  STARVING: { eyes: 'open', mouth: 'meow', paws: 'tucked', tail: 'up', tear: true,
    rig: { eyeOpen: 0.7, lidTilt: 0.6, pupil: 0.85, blush: 0.15, whisker: -0.3, earRot: 0.35, earFlat: 0.4,
      headDY: 12, headTilt: -0.06, tailRaise: 0, tailSwayAmp: 2, tailSwaySpeed: 0.6, crouch: 0.65 } },
  FULL: { eyes: 'happy', mouth: 'licklips', paws: 'tucked', tail: 'up', bellyPuff: 1,
    rig: { blush: 0.75, headTilt: -0.12, headDY: 2, earRot: 0.12, tailRaise: 0.5, tailSwayAmp: 5, tailSwaySpeed: 1,
      bodyStretch: 0.05, crouch: 0.15 } },
  HISS: { eyes: 'open', mouth: 'hiss', paws: 'tucked', tail: 'up', noseWrinkle: true,
    rig: { eyeOpen: 1.1, lidTilt: -0.75, pupil: 0.92, mouthOpen: 1, blush: 0, whisker: -1, earRot: 0.45, earFlat: 0.9,
      headDX: -5, headDY: -3, headTilt: -0.1, tailRaise: 0.75, tailPuff: 1, tailSwayAmp: 4, tailSwaySpeed: 10, bodyLift: -4 } },

  // Đi dạo chậm qua lại trên thảm: đứng bốn chân, đuôi dựng, nhìn về phía trước
  WALKING: { eyes: 'open', mouth: 'smile', paws: 'walk', tail: 'up', look: { x: 0.8, y: 0.1 },
    rig: { stand: 1, tailRaise: 0.95, tailSwayAmp: 8, tailSwaySpeed: 2.6, headTilt: 0.04, whisker: 0.2, earRot: -0.05 } }
};

// Trạng thái thù địch: không nhận vuốt, không rù rù, không phản ứng với đồ ăn
const HOSTILE_STATES = ['ANNOYED', 'HISS'];

// Ký hiệu cảm xúc bay lên khi mèo vào trạng thái
const STATE_MARKERS = {
  CURIOUS: '❓',
  SURPRISED: '❗',
  ANNOYED: '💢',
  SLOW_BLINK: '💗',
  GREETING: '💛',
  SULKING: '💧',
  KNEADING: '🎵',
  SICK: '🤒',
  EXHAUSTED: '😪',
  STARVING: '😿',
  FULL: '😋',
  HISS: '😾'
};

// Tấm thảm tròn trong ảnh nền assets/room_bg.jpg (pixel ảnh). Ảnh vẽ bằng CSS
// background-size: cover; background-position: center bottom (style.css, #game-container).
// Đổi ảnh nền thì phải đo lại các số này.
const ROOM_BG = {
  width: 1376,
  height: 768,
  rug: { x: 730, y: 632, rx: 360, ry: 66 }
};

class CatRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Neo trên tấm thảm tròn
    this.baseX = this.width * 0.52;
    this.baseY = this.height * 0.59;
    this.x = this.baseX;
    this.y = this.baseY;
    this.scale = 1.25;

    // Con trỏ chuột
    this.mouseX = this.baseX;
    this.mouseY = this.baseY - 100;
    this.isHoveringCat = false;
    this.isPetting = false;
    this.lastPetTime = 0;

    // Bộ đếm thời gian & vật lý chuyển động
    this.time = 0;
    this.breathCycle = 0;
    this.tailCycle = 0;
    this.blinkTimer = 3;
    this.isBlinking = false;
    this.earTwitchTimer = 3.5;
    this.earTwitchAmount = 0;
    this.squishX = 1.0;
    this.squishY = 1.0;
    this.purrIntensity = 0;

    // Hoạt ảnh chuyên biệt
    this.buttWiggle = 0;
    this.kneadCycle = 0;
    this.chewCycle = 0;

    // Zoomies
    this.zoomiesProgress = 0;
    this.zoomiesSpeed = 750;
    this.zoomiesDir = 1;

    // Đi dạo: hướng mặt (1 phải, -1 trái, giữ nguyên khi dừng), nhịp bước, điểm đến
    this.facing = 1;
    this.walkPhase = 0;
    this.walkTargetX = null;

    // Đồ chơi
    this.yarnBall = { x: this.baseX - 180, y: this.baseY + 55, vx: 0, vy: 0, radius: 24, rotation: 0 };
    this.foodBowl = { x: this.baseX - 140, y: this.baseY + 45, active: false, foodType: null, timer: 0 };
    this.featherWand = { x: this.baseX + 90, y: this.baseY - 60, targetX: 0, targetY: 0 };
    this.laserDot = { x: this.baseX + 60, y: this.baseY + 20, active: false };

    // Hạt hiệu ứng
    this.particles = [];

    // Rig biểu cảm hiện tại và thời gian đã ở trong trạng thái hành vi
    this.rig = { ...RIG_DEFAULTS };
    this.prevState = null;
    this.stateTime = 0;
    this.isPurring = false;

    // Món ăn đang được kéo về phía mèo: { foodId, near } (near = con trỏ đang ở trên mèo)
    this.foodDrag = null;

    this.initEvents();
  }

  // Con trỏ (toạ độ canvas) có nằm trong vùng elip quanh dáng nằm loaf không
  isPointOnCat(px, py) {
    const dx = px - (this.x + 10 * this.scale);
    const dy = py - (this.y - 10 * this.scale);
    const rx = 125 * this.scale;
    const ry = 85 * this.scale;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0;
  }

  // --- KÉO THẢ ĐỒ ĂN: UI gọi khi người chơi kéo món ăn (toạ độ client) ---
  setFoodDrag(foodId, clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = clientX - rect.left;
    this.mouseY = clientY - rect.top;
    this.foodDrag = { foodId, near: this.isPointOnCat(this.mouseX, this.mouseY) };
    return this.foodDrag.near;
  }

  // Kết thúc kéo; trả về true nếu món ăn được thả trúng mèo
  endFoodDrag() {
    const dropped = !!(this.foodDrag && this.foodDrag.near);
    this.foodDrag = null;
    return dropped;
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.layoutOnRug();

    if (!window.gameState || window.gameState.behaviorState !== 'ZOOMIES') {
      this.x = this.baseX;
      this.y = this.baseY;
    }

    // Đồ vật trên sàn đặt cạnh mèo (trước đây cố định theo kích thước canvas lúc khởi tạo)
    this.foodBowl.x = this.baseX - 150 * this.scale;
    this.foodBowl.y = this.baseY + 45 * this.scale;
    this.yarnBall.x = this.baseX - 205 * this.scale;
    this.yarnBall.y = this.baseY + 50 * this.scale;
    this.yarnBall.vx = 0;
    this.yarnBall.vy = 0;
  }

  // Vị trí mặc định: mèo nằm chính giữa tấm thảm của ảnh nền. Đi dạo xong thì nằm lại chỗ dừng
  // cho tới lần resize kế tiếp.
  layoutOnRug() {
    const W = this.width;
    const H = this.height;
    const cover = Math.max(W / ROOM_BG.width, H / ROOM_BG.height);
    const offX = (W - ROOM_BG.width * cover) / 2;
    const offY = H - ROOM_BG.height * cover;
    const rug = ROOM_BG.rug;
    const cx = offX + rug.x * cover;
    const cy = offY + rug.y * cover;
    const rx = rug.rx * cover;
    const ry = rug.ry * cover;

    // Mèo co giãn theo ảnh nền để giữ đúng tỉ lệ với căn phòng
    this.scale = Math.max(0.7, Math.min(1.9, cover * 1.2));
    const s = this.scale;

    // Tâm bóng đổ (điểm tiếp đất) trùng tâm thảm; gốc mèo lệch so với bóng đổ (-10, 44)
    this.baseX = cx + 10 * s;
    this.baseY = cy - 44 * s;
    // Zoomies chạy ngang trong phạm vi tấm thảm; đi dạo trong khoảng giữa thảm
    this.runLeft = Math.max(cx - rx * 0.9, 0);
    this.runRight = Math.min(cx + rx * 0.9, W);
    this.walkLeft = Math.max(cx - rx * 0.5 + 10 * s, 0);
    this.walkRight = Math.min(cx + rx * 0.5 + 10 * s, W);
    this.walkTargetX = null;
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());
    setTimeout(() => this.resize(), 100);

    const onMove = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = clientX - rect.left;
      this.mouseY = clientY - rect.top;

      this.featherWand.targetX = this.mouseX;
      this.featherWand.targetY = this.mouseY;
      this.laserDot.x = this.mouseX;
      this.laserDot.y = this.mouseY;

      this.isHoveringCat = this.isPointOnCat(this.mouseX, this.mouseY);

      // Đang kéo đồ ăn thì không tính là vuốt ve
      if (this.isHoveringCat && !this.foodDrag) {
        const now = performance.now();
        if (now - this.lastPetTime > 260) {
          this.lastPetTime = now;
          this.triggerPetFeedback();
        }
      }
    };

    this.canvas.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.isHoveringCat) {
        this.isPetting = true;
        this.triggerPetFeedback(true);
      } else {
        const dYarn = Math.hypot(this.mouseX - this.yarnBall.x, this.mouseY - this.yarnBall.y);
        if (dYarn < 45 * this.scale) {
          this.yarnBall.vx = (this.yarnBall.x - this.mouseX) * 0.45;
          this.yarnBall.vy = -200;
          if (window.catAudio) window.catAudio.squeak();
          // Mèo đang rảnh thì nghiêng đầu tò mò nhìn bóng len
          if (window.gameState && ['IDLE', 'WALKING'].includes(window.gameState.behaviorState)) {
            window.gameState.setBehavior('CURIOUS', 2.8);
          }
          // Nhiệm vụ ngày "Đá bóng len" (lab dùng gameState giả nên có thể không có hàm này)
          if (window.gameState && window.gameState.trackQuest) window.gameState.trackQuest('yarn');
          this.spawnParticle('sparkle', this.yarnBall.x, this.yarnBall.y, { text: '✨', size: 24 });
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isPetting = false;
    });
  }

  triggerPetFeedback(isClick = false) {
    if (!window.gameState) return;

    const result = window.gameState.pet(isClick);

    if (result === 'annoyed' || result === 'hiss') {
      // Mèo đang cáu: không rù rù, chỉ giật mình nhẹ
      this.squishX = 0.96;
      this.squishY = 1.04;
      if (Math.random() < 0.3) {
        this.spawnParticle('mark', this.x + 80 * this.scale, this.y - 90 * this.scale, { text: '💢', size: 22 * this.scale });
      }
      return;
    }
    if (result === 'startled') return;
    if (result === 'dozing') {
      // Vuốt nhẹ khi mèo ngủ: mèo ngủ tiếp, chỉ rù rù khẽ
      this.purrIntensity = Math.max(this.purrIntensity, 0.4);
      return;
    }

    // Nhún đàn hồi squishy loaf
    this.squishX = 1.15;
    this.squishY = 0.82;
    this.purrIntensity = 1.0;

    // Sinh tim pixel hồng bồng bềnh bay lên như hình mẫu
    const heartText = ['❤️', '💖', '💕', '✨', '🌸'][Math.floor(Math.random() * 5)];
    const px = this.x + (Math.random() - 0.3) * 90 * this.scale;
    const py = this.y - (30 + Math.random() * 40) * this.scale;

    this.spawnParticle('heart', px, py, {
      text: heartText,
      size: (24 + Math.random() * 8) * this.scale,
      vy: -65 - Math.random() * 45,
      vx: (Math.random() - 0.5) * 40
    });

    if (window.catAudio) {
      if (isClick) {
        window.catAudio.meow('purr-chirp');
      } else {
        window.catAudio.startPurr();
      }
    }

    if (window.officeNetwork) {
      window.officeNetwork.broadcastAction('pet', 'vừa vuốt ve xoa đầu Bé Mập ~ ❤️', '❤️', '#f43f5e');
    }
  }

  spawnParticle(type, x, y, options = {}) {
    this.particles.push({
      type,
      x,
      y,
      vx: (Math.random() - 0.5) * 35 + (options.vx || 0),
      vy: -45 - Math.random() * 35 + (options.vy || 0),
      life: 1.0,
      decay: options.decay || (0.55 + Math.random() * 0.35),
      size: (options.size || 22),
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 1.5,
      text: options.text || '❤️'
    });
  }

  dropFood(foodType) {
    // Đĩa ăn đặt cạnh chỗ mèo đang nằm (mèo có thể đã đi dạo khỏi giữa thảm)
    this.foodBowl.x = this.x - 150 * this.scale * (this.renderFacing || 1);
    this.foodBowl.y = this.baseY + 45 * this.scale;
    this.foodBowl.active = true;
    this.foodBowl.foodType = foodType;
    this.foodBowl.timer = 9.0;

    if (window.gameState) {
      window.gameState.setBehavior('EATING', 6.0);
    }
    if (window.catAudio) {
      window.catAudio.crunch();
    }

    for (let i = 0; i < 6; i++) {
      this.spawnParticle('crumb', this.foodBowl.x + (Math.random() - 0.5) * 35, this.foodBowl.y - 10, {
        vy: -70 - Math.random() * 40,
        size: 16,
        text: foodType === 'salmon' ? '🍣' : foodType === 'milk' ? '🥛' : '✨'
      });
    }
  }

  update(delta) {
    this.time += delta;

    this.squishX += (1.0 - this.squishX) * 0.15;
    this.squishY += (1.0 - this.squishY) * 0.15;
    this.purrIntensity = Math.max(0, this.purrIntensity - delta * 0.8);

    const state = window.gameState ? window.gameState.behaviorState : 'IDLE';

    const breathSpeed = state === 'SLEEPING' ? 1.5 : (state === 'PETTING' ? 4.2 : 2.5);
    this.breathCycle = Math.sin(this.time * breathSpeed);
    this.tailCycle = Math.sin(this.time * 2.2);

    this.blinkTimer -= delta;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -0.15) {
        this.isBlinking = false;
        this.blinkTimer = 2.5 + Math.random() * 4.0;
      }
    }

    this.earTwitchTimer -= delta;
    if (this.earTwitchTimer <= 0) {
      this.earTwitchAmount = Math.sin(this.earTwitchTimer * 26) * 0.16;
      if (this.earTwitchTimer <= -0.28) {
        this.earTwitchAmount = 0;
        this.earTwitchTimer = 3.2 + Math.random() * 5.0;
      }
    }

    if (state === 'PLAYING') {
      this.buttWiggle = Math.sin(this.time * 14) * 6;
    } else {
      this.buttWiggle = 0;
    }

    if (state === 'PETTING') {
      this.kneadCycle = Math.sin(this.time * 6);
    } else if (state === 'KNEADING') {
      this.kneadCycle = Math.sin(this.time * 5);
      this.purrIntensity = Math.max(this.purrIntensity, 0.35);
    } else {
      this.kneadCycle = 0;
    }

    // Rig biểu cảm: đếm thời gian trong trạng thái và nội suy về đích
    if (state !== this.prevState) {
      // Dừng đi dạo (vì tương tác hay hết giờ) thì nằm lại ngay chỗ đang đứng
      if (this.prevState === 'WALKING') this.baseX = this.x;
      this.prevState = state;
      this.stateTime = 0;
      this.onStateEnter(state);
    } else {
      this.stateTime += delta;
    }
    this.updateRig(delta, state);

    // Tiếng rù rù chỉ kéo dài khi còn được vuốt
    if (window.catAudio) {
      if (window.catAudio.purrGain) this.isPurring = true;
      if (this.isPurring && this.purrIntensity < 0.05) {
        window.catAudio.stopPurr();
        this.isPurring = false;
      }
    }

    if (state === 'EATING') {
      this.chewCycle = Math.sin(this.time * 9);
      if (Math.random() < delta * 2.5) {
        this.spawnParticle('crumb', this.x - 70 * this.scale, this.y + 20 * this.scale, {
          text: '✨',
          size: 14,
          vy: -35
        });
      }
    }

    this.updateToys(delta, state);

    if (state === 'WALKING') {
      // Đi chậm qua lại giữa hai nửa thảm; đang có đồ ăn kéo tới thì đứng lại chờ
      const left = this.walkLeft ?? this.width * 0.35;
      const right = this.walkRight ?? this.width * 0.65;
      const mid = (left + right) / 2;
      if (this.walkTargetX === null || this.walkTargetX < left || this.walkTargetX > right) {
        this.walkTargetX = this.x < mid ? mid + Math.random() * (right - mid) : left + Math.random() * (mid - left);
      }
      if (!this.foodDrag) {
        const dx = this.walkTargetX - this.x;
        if (Math.abs(dx) < 3) {
          // Tới nơi: chọn điểm mới ở nửa thảm bên kia
          this.walkTargetX = this.x < mid ? mid + Math.random() * (right - mid) : left + Math.random() * (mid - left);
        } else {
          this.facing = Math.sign(dx);
          this.x += this.facing * Math.min(Math.abs(dx), WALK_SPEED * this.scale * delta);
        }
        this.walkPhase += delta * 6;
      }
      this.y += (this.baseY - this.y) * 0.1;
    } else if (state === 'ZOOMIES') {
      this.x += this.zoomiesDir * this.zoomiesSpeed * delta;
      if (this.x > (this.runRight ?? this.width * 0.78)) {
        this.zoomiesDir = -1;
        this.spawnParticle('dust', this.x, this.y + 20, { text: '💨', size: 32 });
      } else if (this.x < (this.runLeft ?? this.width * 0.25)) {
        this.zoomiesDir = 1;
        this.spawnParticle('dust', this.x, this.y + 20, { text: '💨', size: 32 });
      }
      if (Math.random() < 0.25) {
        this.spawnParticle('dust', this.x - this.zoomiesDir * 40, this.y + 15, { text: '💨', size: 24 });
      }
    } else {
      this.x += (this.baseX - this.x) * 0.1;
      this.y += (this.baseY - this.y) * 0.1;
    }

    if (state === 'SLEEPING') {
      if (Math.random() < delta * 1.6) {
        this.spawnParticle('zzz', this.x + 35 * this.scale, this.y - 45 * this.scale, {
          text: ['Z', 'z', '💤'][Math.floor(Math.random() * 3)],
          size: 18 + Math.random() * 8,
          decay: 0.38
        });
      }
    }

    const bubble = document.getElementById('cat-speech-bubble');
    if (bubble) {
      const bx = this.x + 45 * this.scale * (this.renderFacing || 1);
      const by = this.y - 78 * this.scale;
      bubble.style.left = `${bx}px`;
      bubble.style.top = `${by}px`;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.rotation += p.vRot * delta;
      p.life -= p.decay * delta;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.foodBowl.active) {
      this.foodBowl.timer -= delta;
      if (this.foodBowl.timer <= 0) {
        this.foodBowl.active = false;
      }
    }
  }

  updateToys(delta, state) {
    this.yarnBall.x += this.yarnBall.vx * delta;
    this.yarnBall.y += this.yarnBall.vy * delta;
    this.yarnBall.vy += 380 * delta;
    this.yarnBall.vx *= 0.96;

    const floorY = this.baseY + 50 * this.scale;
    if (this.yarnBall.y > floorY) {
      this.yarnBall.y = floorY;
      this.yarnBall.vy = -this.yarnBall.vy * 0.52;
    }
    this.yarnBall.rotation += this.yarnBall.vx * 0.02;

    this.featherWand.x += (this.featherWand.targetX - this.featherWand.x) * 0.16;
    this.featherWand.y += (this.featherWand.targetY - this.featherWand.y) * 0.16;
  }

  // --- PALETTE MÀU LÔNG ---
  getCoatPalette(furType) {
    switch (furType) {
      case 'calico':
        return {
          main: '#fef3c7',
          mainGradient: '#fde68a',
          shadowTone: '#d97706',
          secondary: '#ea580c',
          accent: '#1e293b',
          belly: '#ffffff',
          innerEar: '#fda4af',
          eyeColor: '#10b981',
          nose: '#f43f5e'
        };
      case 'tuxedo':
        return {
          main: '#0f172a',
          mainGradient: '#1e293b',
          shadowTone: '#020617',
          secondary: '#334155',
          accent: '#ffffff',
          belly: '#ffffff',
          innerEar: '#fda4af',
          eyeColor: '#84cc16',
          whisker: 'rgba(226, 232, 240, 0.8)',
          nose: '#f43f5e'
        };
      case 'black_cat':
        return {
          main: '#090d16',
          mainGradient: '#1e293b',
          shadowTone: '#020617',
          secondary: '#334155',
          accent: '#475569',
          belly: '#0f172a',
          innerEar: '#fb7185',
          eyeColor: '#facc15',
          whisker: 'rgba(226, 232, 240, 0.8)',
          nose: '#1e293b'
        };
      case 'siamese':
        return {
          main: '#fdf4dc',
          mainGradient: '#faebd7',
          shadowTone: '#78350f',
          secondary: '#451a03',
          accent: '#78350f',
          belly: '#fdf4dc',
          innerEar: '#78350f',
          eyeColor: '#0284c7',
          nose: '#451a03'
        };
      case 'orange_tabby':
      default:
        return {
          main: '#f59e0b',        // Cam vàng ấm
          mainGradient: '#fb923c',// Nắng rực rỡ ở lưng
          shadowTone: '#c2410c',  // Đổ bóng ấm áp
          secondary: '#b45309',   // Sọc vằn tabby rõ nét
          accent: '#ea580c',
          belly: '#ffffff',       // Bụng & má trắng muốt
          innerEar: '#fda4af',    // Tai hồng
          eyeColor: '#059669',    // Mắt ngọc lục bảo
          nose: '#fb7185'         // Mũi hồng chúm chím
        };
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const state = window.gameState ? window.gameState.behaviorState : 'IDLE';
    const customization = window.gameState ? window.gameState.data.customization : { fur: 'orange_tabby' };

    this.renderFloorItems();
    this.render3DCatLoaf(state, customization);
    this.renderFoodDropZone();
    this.renderActiveToys();
    this.renderParticles();
  }

  renderFloorItems() {
    const ctx = this.ctx;
    const s = this.scale;

    // Bóng len
    ctx.save();
    ctx.translate(this.yarnBall.x, this.yarnBall.y);
    ctx.rotate(this.yarnBall.rotation);

    ctx.beginPath();
    ctx.ellipse(0, 18 * s, 24 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 20 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#ec4899';
    ctx.fill();
    ctx.lineWidth = 2.5 * s;
    ctx.strokeStyle = '#be185d';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 14 * s, 0.5, 2.5);
    ctx.arc(0, 0, 10 * s, 3.2, 5.5);
    ctx.strokeStyle = '#fbcfe8';
    ctx.lineWidth = 2.2 * s;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(this.yarnBall.x, this.yarnBall.y + 10 * s);
    ctx.quadraticCurveTo(this.yarnBall.x - 30 * s, this.yarnBall.y + 16 * s, this.yarnBall.x - 65 * s, this.yarnBall.y + 12 * s);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2.5 * s;
    ctx.stroke();

    // Đĩa thức ăn
    if (this.foodBowl.active) {
      ctx.save();
      ctx.translate(this.foodBowl.x, this.foodBowl.y);

      ctx.beginPath();
      ctx.ellipse(0, 12 * s, 34 * s, 11 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, 0, 32 * s, 17 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.lineWidth = 2.5 * s;
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, -2 * s, 26 * s, 12 * s, 0, 0, Math.PI * 2);
      if (this.foodBowl.foodType === 'salmon') {
        ctx.fillStyle = '#fb7185';
      } else if (this.foodBowl.foodType === 'milk') {
        ctx.fillStyle = '#f8fafc';
      } else if (this.foodBowl.foodType === 'pate') {
        ctx.fillStyle = '#b45309';
      } else {
        ctx.fillStyle = '#d97706';
      }
      ctx.fill();

      ctx.fillStyle = '#78350f';
      for (let i = -12; i <= 12; i += 7) {
        ctx.beginPath();
        ctx.arc(i * s, (-2 + (i % 3)) * s, 2.5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ===================================================================
  // RIG BIỂU CẢM: ĐÍCH THEO TRẠNG THÁI + NỘI SUY MƯỢT
  // ===================================================================
  getRigTarget(state) {
    const expr = CAT_EXPRESSIONS[state] || CAT_EXPRESSIONS.IDLE;
    const target = { ...RIG_DEFAULTS, ...(expr.rig || {}) };
    const t = this.stateTime;

    switch (state) {
      case 'IDLE': {
        // Tâm trạng nền: lúc rảnh, chỉ số hiện ra mặt mà không cần trạng thái riêng
        const v = window.gameState ? window.gameState.data.vitals : null;
        if (v) {
          if (v.happiness > 80) { target.blush = 0.6; target.tailRaise = 0.95; }
          if (v.happiness < 35) { target.lidTilt = 0.3; target.tailRaise = 0.4; target.earRot = 0.15; }
          if (v.hunger < 35) { target.lidTilt = Math.max(target.lidTilt, 0.25); target.whisker = 0.3; }
          if (v.energy < 25) { target.eyeOpen = 0.55; target.earRot += 0.1; }
        }
        break;
      }
      case 'BEGGING':
        target.mouthOpen = 0.2 + 0.45 * Math.max(0, Math.sin(t * 4));
        break;
      case 'SLOW_BLINK':
        // Khép hờ → nhắm lâu → mở dần (chuỗi nháy chậm, Humphrey et al. 2020)
        target.eyeOpen = t < 0.5 ? 0.55 : t < 1.7 ? 0.04 : t < 2.2 ? 0.5 : 0.85;
        break;
      case 'SURPRISED':
        target.bodyLift = t < 0.25 ? -24 : 0;
        target.tailPuff = t < 1.2 ? 1 : 0.4;
        break;
      case 'GREETING':
        target.mouthOpen = t > 0.2 && t < 0.8 ? 0.45 : 0;
        break;
      case 'EXHAUSTED': {
        // Gật gù: mí sụp dần, đầu gục xuống, rồi giật mình ngẩng lên, lặp mỗi 3 giây
        const c = t % 3;
        target.eyeOpen = c < 2.2 ? 0.45 - c * 0.17 : 0.55;
        target.headDY = c < 2.2 ? 4 + c * 4 : 0;
        break;
      }
      case 'STARVING':
        // Kêu yếu ớt từng hồi
        target.mouthOpen = (t % 2.4) < 0.5 ? 0.35 : 0;
        break;
      case 'HISS':
        // Lao người ra trước rồi lùi lại phòng thủ
        if (t < 0.2) {
          target.headDX = 6;
          target.bodyLift = -8;
        }
        break;
      case 'WALKING':
        // Đầu nhấp nhô và thân nảy nhẹ theo nhịp bước (đứng yên chờ đồ ăn thì thôi)
        if (!this.foodDrag) {
          target.headDY = Math.sin(this.walkPhase * 2) * 1.5;
          target.bodyLift = -Math.abs(Math.sin(this.walkPhase)) * 2;
        }
        break;
      case 'PLAYING': {
        // Rình (lắc mông) → vồ → tiếp đất, lặp mỗi 3.2 giây
        const c = t % 3.2;
        if (c > 2.2 && c < 2.6) {
          target.crouch = 0;
          target.bodyLift = -26;
          target.bodyStretch = 0.12;
          target.eyeOpen = 1.2;
        } else if (c >= 2.6) {
          target.crouch = 0.25;
        }
        break;
      }
    }
    return target;
  }

  updateRig(delta, state) {
    const target = this.getRigTarget(state);
    // Thấy đồ ăn được kéo tới: mắt mở to, đồng tử giãn, tai/râu chĩa trước; sát miệng thì há chờ
    if (this.foodDrag && state !== 'SLEEPING' && !HOSTILE_STATES.includes(state)) {
      target.eyeOpen = Math.max(target.eyeOpen, 1.12);
      target.pupil = 0.85;
      target.whisker = 0.8;
      target.earRot = -0.15;
      target.earFlat = 0;
      target.lidTilt = 0;
      target.headTilt = 0.12;
      target.mouthOpen = this.foodDrag.near ? 0.65 : 0.15;
    }
    const k = 1 - Math.exp(-delta * 9);
    for (const key in target) {
      this.rig[key] += (target[key] - this.rig[key]) * k;
    }
  }

  // Ký hiệu cảm xúc bay lên trên đầu khi vào trạng thái
  onStateEnter(state) {
    const mark = STATE_MARKERS[state];
    if (!mark) return;
    this.spawnParticle('mark', this.x + 95 * this.scale * (this.renderFacing || 1), this.y - 100 * this.scale, {
      text: mark,
      size: 30 * this.scale,
      vx: 0,
      vy: 10,
      decay: 0.45
    });
  }

  getPawPose(state, expr) {
    if (state === 'PLAYING') {
      const c = this.stateTime % 3.2;
      if (c > 2.2 && c < 2.75) return 'bat';
    }
    return expr.paws;
  }

  // ===================================================================
  // CHÍNH XÁC DÁNG NẰM LOAF GÓC NGHIÊNG 3/4 (THEO ẢNH MẪU)
  // ===================================================================
  render3DCatLoaf(state, customization) {
    const ctx = this.ctx;
    const s = this.scale;
    const p = this.getCoatPalette(customization.fur);
    const rig = this.rig;
    const expr = CAT_EXPRESSIONS[state] || CAT_EXPRESSIONS.IDLE;

    ctx.save();
    ctx.translate(this.x, this.y);

    const breathY = this.breathCycle * 0.022;
    ctx.scale(this.squishX * s, (this.squishY + breathY) * s);

    // Quay mặt theo hướng chạy/đi (mặc định mặt hướng sang phải)
    this.renderFacing = state === 'ZOOMIES' ? this.zoomiesDir : this.facing;
    ctx.scale(this.renderFacing, 1);

    // 1. Bóng đổ nằm trên sàn, thu nhỏ khi mèo nhảy lên
    const shadowScale = 1 + Math.min(0, rig.bodyLift) / 140;
    ctx.beginPath();
    ctx.ellipse(-10, 44, 115 * shadowScale * (1 + rig.bodyStretch), 30 * shadowScale, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
    ctx.fill();

    // Vòng purr phát sáng
    if (this.purrIntensity > 0.05 && !HOSTILE_STATES.includes(state)) {
      ctx.save();
      const ringRadius = 115 + (1 - this.purrIntensity) * 45;
      ctx.beginPath();
      ctx.arc(0, 10, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 63, 94, ${this.purrIntensity * 0.45})`;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();
    }

    // Biến đổi toàn thân: nhảy, kéo dài, hạ thấp rình mồi, lắc lư
    ctx.translate(0, rig.bodyLift + rig.crouch * 12 - rig.stand * STAND_LIFT);
    ctx.scale(1 + rig.bodyStretch, 1 - rig.crouch * 0.14);
    if (rig.bodyRock > 0.01) {
      ctx.rotate(Math.sin(this.time * 3.2) * 0.08 * rig.bodyRock);
    }
    // Run lẩy bẩy (ốm)
    if (expr.shiver) {
      ctx.translate(Math.sin(this.time * 45) * expr.shiver, 0);
    }

    const paws = this.getPawPose(state, expr);

    // 2-3. Đuôi sau thân; riêng đuôi cuộn khi ngủ quấn ra trước thân
    if (expr.tail !== 'curl') this.render3DTail(ctx, p, expr);
    if (rig.stand > 0.05) this.renderWalkLegs(ctx, p);
    this.render3DBody(ctx, p, state);
    if (expr.tail === 'curl') this.render3DTail(ctx, p, expr);

    // 4. Bụng trắng và chân trước lớp dưới (chân đặt trên sàn)
    this.render3DChestAndPaws(ctx, p, paws, 'under', expr.bellyPuff || 0);

    // 5-6. Đầu, mặt và mũ/kính cùng một phép biến đổi để nghiêng/cúi cùng nhau
    ctx.save();
    ctx.translate(CAT_HEAD.x + rig.headDX, CAT_HEAD.y + rig.headDY);
    ctx.rotate(rig.headTilt);
    this.render3DHead(ctx, p);
    this.render3DFace(ctx, p, expr, state);
    this.renderHeadCostumes(ctx, customization);
    ctx.restore();

    // 7. Phụ kiện cổ, rồi chân giơ lên (vẽ đè lên mặt khi liếm/rửa mặt)
    this.renderNeckCostume(ctx, customization);
    this.render3DChestAndPaws(ctx, p, paws, 'over');

    ctx.restore();
  }

  // --- 2. ĐUÔI THAM SỐ: DỰNG/HẠ, XÙ, VẪY/QUẤT ---
  render3DTail(ctx, p, expr) {
    ctx.save();
    const rig = this.rig;

    if (expr.tail === 'curl') {
      // Đuôi cuộn tròn quanh chân khi ngủ
      ctx.beginPath();
      ctx.moveTo(-65, 20);
      ctx.bezierCurveTo(-95, 28, -95, 48, -48, 50);
      ctx.lineCap = 'round';
      ctx.lineWidth = 38;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.stroke();
      ctx.lineWidth = 34;
      ctx.strokeStyle = p.main;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-48, 50, 16, 0, Math.PI * 2);
      ctx.fillStyle = p.belly;
      ctx.fill();
      ctx.restore();
      return;
    }

    // Đường cong xương đuôi nội suy giữa "hạ sát sàn" và "dựng thẳng"
    const raise = Math.max(0, Math.min(1, rig.tailRaise));
    const sway = Math.sin(this.time * rig.tailSwaySpeed) * rig.tailSwayAmp;
    const mix = (low, high) => low + (high - low) * raise;
    const P0 = { x: -72, y: 18 };
    const P1 = { x: mix(-100, -112), y: mix(36, 0) };
    const P2 = { x: mix(-140, -125) - sway * 0.6, y: mix(40, -40) };
    const P3 = { x: mix(-168, -88) - sway * 1.2, y: mix(32, -72) + sway * 0.3 * (1 - raise) };
    const width = 30 * (1 + 0.6 * rig.tailPuff);

    const spine = () => {
      ctx.beginPath();
      ctx.moveTo(P0.x, P0.y);
      ctx.bezierCurveTo(P1.x, P1.y, P2.x, P2.y, P3.x, P3.y);
    };

    ctx.lineCap = 'round';

    // Đuôi xù: viền lông tua tủa (nét đứt dày hơn thân đuôi)
    if (rig.tailPuff > 0.15) {
      spine();
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = width + 12 * rig.tailPuff;
      ctx.strokeStyle = p.main;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    spine();
    ctx.lineWidth = width + 5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.stroke();

    const tailGrad = ctx.createLinearGradient(P0.x, P0.y, P3.x, P3.y);
    tailGrad.addColorStop(0, p.shadowTone || p.main);
    tailGrad.addColorStop(0.6, p.main);
    tailGrad.addColorStop(1, p.mainGradient || p.main);
    spine();
    ctx.lineWidth = width;
    ctx.strokeStyle = tailGrad;
    ctx.stroke();

    // Sọc vằn vuông góc với đường cong đuôi
    if (p.secondary) {
      const bez = (t, a, b, c, d) => {
        const u = 1 - t;
        return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
      };
      ctx.lineCap = 'butt';
      ctx.lineWidth = 8;
      ctx.strokeStyle = p.secondary;
      [0.42, 0.62, 0.8].forEach(t => {
        const x = bez(t, P0.x, P1.x, P2.x, P3.x);
        const y = bez(t, P0.y, P1.y, P2.y, P3.y);
        const nx = bez(t + 0.01, P0.x, P1.x, P2.x, P3.x) - x;
        const ny = bez(t + 0.01, P0.y, P1.y, P2.y, P3.y) - y;
        const len = Math.hypot(nx, ny) || 1;
        const half = width * 0.42;
        ctx.beginPath();
        ctx.moveTo(x - (ny / len) * half, y + (nx / len) * half);
        ctx.lineTo(x + (ny / len) * half, y - (nx / len) * half);
        ctx.stroke();
      });
    }

    // Chóp đuôi trắng bồng bềnh
    // Chóp đuôi chỉ to thêm một chút khi xù, để không thành quả bóng
    const tipR = 30 * 0.55 * (1 + 0.25 * rig.tailPuff);
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.arc(P3.x, P3.y, tipR, 0, Math.PI * 2);
    ctx.arc(P3.x - tipR * 0.5, P3.y + tipR * 0.3, tipR * 0.45, 0, Math.PI * 2);
    ctx.arc(P3.x + tipR * 0.5, P3.y + tipR * 0.3, tipR * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- 3. THÂN BÁNH MÌ LOAF BÉO TRÒN (CHUBBY LOAF BODY) ---
  render3DBody(ctx, p, state) {
    ctx.save();
    if (state === 'PLAYING') {
      ctx.translate(this.buttWiggle, 0);
    }

    // Dáng nằm bánh mì loaf góc 3/4: Lưng vồng cao từ trái sang phải
    ctx.beginPath();
    ctx.moveTo(-92, 25);
    ctx.bezierCurveTo(-96, -26, -35, -45, 20, -36);
    ctx.bezierCurveTo(75, -28, 110, -5, 105, 34);
    ctx.bezierCurveTo(90, 52, -75, 52, -92, 25);
    ctx.closePath();

    const bodyGrad = ctx.createRadialGradient(10, -10, 20, 0, 20, 115);
    bodyGrad.addColorStop(0, p.mainGradient || '#fb923c');
    bodyGrad.addColorStop(0.68, p.main);
    bodyGrad.addColorStop(1, p.shadowTone || '#c2410c');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.stroke();

    // Sọc vằn lưng Tabby cong nghiêng theo phối cảnh 3/4
    if (p.secondary) {
      ctx.fillStyle = p.secondary;
      ctx.beginPath();
      ctx.ellipse(-48, -14, 11, 26, -0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-8, -16, 12, 28, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(35, -12, 11, 24, 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Đùi sau tròn: chỉ một đường viền cong tạo chiều sâu
    ctx.beginPath();
    ctx.ellipse(-50, 24, 34, 24, -0.15, Math.PI * 1.0, Math.PI * 1.75);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.stroke();

    // Bàn chân sau thò ra dưới đùi
    if (this.rig.stand < 0.3) this.drawPaw(ctx, -60, 45, 16, 9, -0.08, p, { toes: true });

    ctx.restore();
  }

  // Một bàn chân: khối tròn có ngón, hoặc đệm thịt hồng khi ngửa lên
  drawPaw(ctx, x, y, rx, ry, rot, p, opts = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.belly;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.stroke();

    if (opts.beans) {
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.ellipse(0, ry * 0.18, rx * 0.42, ry * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-rx * 0.46, -ry * 0.36, rx * 0.17, 0, Math.PI * 2);
      ctx.arc(0, -ry * 0.56, rx * 0.18, 0, Math.PI * 2);
      ctx.arc(rx * 0.46, -ry * 0.36, rx * 0.17, 0, Math.PI * 2);
      ctx.fill();
    } else if (opts.toes) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-rx * 0.3, ry * 0.15); ctx.lineTo(-rx * 0.3, ry * 0.92);
      ctx.moveTo(rx * 0.3, ry * 0.15);  ctx.lineTo(rx * 0.3, ry * 0.92);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Bốn chân khi đứng/đi (vẽ trước thân để thân che phần trên). Chân phía xa tối hơn,
  // bước theo cặp chéo; độ dài chân theo rig.stand nên chân mọc dần khi đứng dậy
  renderWalkLegs(ctx, p) {
    const stand = this.rig.stand;
    const floorY = 44 + STAND_LIFT * stand - 2;
    const legs = [
      { x: -60, far: true, offset: 0 },
      { x: 50, far: true, offset: Math.PI },
      { x: -36, far: false, offset: Math.PI },
      { x: 76, far: false, offset: 0 }
    ];
    legs.forEach(leg => {
      const phase = this.walkPhase + leg.offset;
      const footX = leg.x + Math.sin(phase) * 9 * stand;
      const lift = Math.max(0, -Math.cos(phase)) * 5 * stand;
      const footY = floorY - lift;
      ctx.save();
      if (leg.far) ctx.filter = 'brightness(0.82)';
      this.drawForeleg(ctx, leg.x, 26, footX, footY - 6, p, 20);
      this.drawPaw(ctx, footX, footY - 3, 14, 8, 0, p, { toes: true });
      ctx.restore();
    });
  }

  // Cẳng chân trước: dải lông trắng có viền, nối vai với bàn chân
  drawForeleg(ctx, fromX, fromY, toX, toY, p, width = 22) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineWidth = width + 4;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.stroke();
    ctx.lineWidth = width;
    ctx.strokeStyle = p.belly;
    ctx.stroke();
    ctx.restore();
  }

  // --- 4. BỤNG TRẮNG VÀ CHÂN TRƯỚC (WHITE BELLY & PAWS) ---
  // layer 'under': bụng + chân đặt trên sàn; layer 'over': chân giơ lên trước mặt/ngực
  render3DChestAndPaws(ctx, p, pose, layer, bellyPuff = 0) {
    ctx.save();

    if (layer === 'under') {
      // Mảng bụng trắng trải từ giữa thân ra phía trước
      ctx.beginPath();
      ctx.moveTo(-35, 46);
      ctx.quadraticCurveTo(-15, 16, 25, 12);
      ctx.bezierCurveTo(65, 12, 98, 22, 98, 44);
      ctx.quadraticCurveTo(30, 52, -35, 46);
      ctx.closePath();
      ctx.fillStyle = p.belly;
      ctx.fill();

      // Bụng no căng phình ra phía trước
      if (bellyPuff > 0) {
        ctx.beginPath();
        ctx.ellipse(34, 38, 60 + 6 * bellyPuff, 14 + 8 * bellyPuff, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.stroke();
      }

      // Lông ngực xù
      ctx.beginPath();
      ctx.arc(-15, 34, 10, 0, Math.PI * 2);
      ctx.arc(8, 24, 12, 0, Math.PI * 2);
      ctx.arc(30, 16, 12, 0, Math.PI * 2);
      ctx.arc(52, 18, 12, 0, Math.PI * 2);
      ctx.arc(72, 20, 10, 0, Math.PI * 2);
      ctx.fill();

      if (pose === 'stretch') {
        // Duỗi dài chân trước khi vươn vai
        this.drawForeleg(ctx, 30, 30, 48, 54, p);
        this.drawForeleg(ctx, 70, 30, 92, 52, p);
        this.drawPaw(ctx, 52, 56, 22, 13, -0.05, p, { toes: true });
        this.drawPaw(ctx, 96, 54, 22, 13, 0.08, p, { toes: true });
      } else if (pose === 'tucked' || pose === 'knead') {
        // Nhồi bột: nhấc từng chân lên xuống luân phiên
        const amp = pose === 'knead' ? 7 : 4;
        const left = this.kneadCycle * amp;
        const right = -this.kneadCycle * amp;
        this.drawForeleg(ctx, 28, 26, 28, 40 + left, p, 24);
        this.drawForeleg(ctx, 74, 26, 74, 39 + right, p, 24);
        this.drawPaw(ctx, 28, 47 + left, 19, 13 - Math.max(0, left) * 0.2, -0.05, p, { toes: true });
        this.drawPaw(ctx, 74, 46 + right, 20, 13 - Math.max(0, right) * 0.2, 0.08, p, { toes: true });
      } else {
        // Các tư thế giơ một chân: chân còn lại vẫn đặt trên sàn
        if (pose !== 'beg' && pose !== 'up' && pose !== 'walk') {
          this.drawForeleg(ctx, 74, 26, 74, 39, p, 24);
          this.drawPaw(ctx, 74, 46, 20, 13, 0.08, p, { toes: true });
        }
      }
    } else {
      const t = this.time;
      if (pose === 'up') {
        // Lăn ngửa bụng: hai chân co trước ngực khoe đệm thịt, quơ quơ
        const paddle = Math.sin(t * 5) * 4;
        this.drawForeleg(ctx, 0, 24, -12, 0 + paddle, p);
        this.drawForeleg(ctx, 26, 26, 14, 8 - paddle, p);
        this.drawPaw(ctx, -14, -6 + paddle, 15, 18, -0.35, p, { beans: true });
        this.drawPaw(ctx, 12, 2 - paddle, 15, 18, 0.2, p, { beans: true });
      } else if (pose === 'beg') {
        // Chắp hai chân trước ngực, nhún theo nhịp xin ăn
        const bob = Math.sin(t * 8) * 5;
        this.drawForeleg(ctx, 26, 30, 30, 14 + bob, p);
        this.drawForeleg(ctx, 66, 30, 58, 14 + bob, p);
        this.drawPaw(ctx, 31, 10 + bob, 14, 16, 0.3, p, { toes: true });
        this.drawPaw(ctx, 57, 10 + bob, 14, 16, -0.3, p, { toes: true });
      } else if (pose === 'lick') {
        // Giơ chân lên sát miệng để liếm
        const lift = Math.sin(t * 6) * 2;
        this.drawForeleg(ctx, 30, 32, 30, 6 + lift, p);
        this.drawPaw(ctx, 30, 0 + lift, 15, 18, 0.45, p, { beans: true });
      } else if (pose === 'wash') {
        // Xoa chân vòng tròn lên má
        const wx = 66 + Math.cos(t * 5) * 8;
        const wy = -26 + Math.sin(t * 5) * 7;
        this.drawForeleg(ctx, 34, 30, wx - 6, wy + 10, p);
        this.drawPaw(ctx, wx, wy, 15, 18, -0.4, p, { toes: true });
      } else if (pose === 'bat') {
        // Vồ: một chân vả về phía trước
        this.drawForeleg(ctx, 60, 24, 104, -2, p);
        this.drawPaw(ctx, 108, -6, 16, 18, -0.6, p, { beans: true });
      }
    }

    ctx.restore();
  }

  // --- 5. ĐẦU: TAI THEO RIG, VIỀN MÁ XÙ MỀM (toạ độ quanh tâm đầu) ---
  render3DHead(ctx, p) {
    this.drawEar(ctx, p, -1);
    this.drawEar(ctx, p, 1);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-44, -28);
    ctx.quadraticCurveTo(0, -48, 44, -28);
    // Má phải: ba túm lông bo tròn
    ctx.quadraticCurveTo(58, -20, 60, -8);
    ctx.quadraticCurveTo(78, -6, 66, 4);
    ctx.quadraticCurveTo(82, 12, 64, 21);
    ctx.quadraticCurveTo(74, 34, 46, 38);
    // Cằm tròn
    ctx.quadraticCurveTo(0, 52, -46, 38);
    // Má trái
    ctx.quadraticCurveTo(-74, 34, -64, 21);
    ctx.quadraticCurveTo(-82, 12, -66, 4);
    ctx.quadraticCurveTo(-78, -6, -60, -8);
    ctx.quadraticCurveTo(-58, -20, -44, -28);
    ctx.closePath();

    const headGrad = ctx.createRadialGradient(0, -6, 15, 0, 8, 75);
    headGrad.addColorStop(0, p.mainGradient || '#fb923c');
    headGrad.addColorStop(0.72, p.main);
    headGrad.addColorStop(1, p.shadowTone || '#c2410c');
    ctx.fillStyle = headGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.stroke();

    // Sọc trán chữ M
    if (p.secondary) {
      ctx.fillStyle = p.secondary;
      ctx.beginPath();
      ctx.ellipse(-14, -28, 4, 11, -0.2, 0, Math.PI * 2);
      ctx.ellipse(0, -32, 4.5, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(14, -28, 4, 11, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vệt lông trắng từ giữa trán xoè xuống hai má
    ctx.beginPath();
    ctx.moveTo(-2, -24);
    ctx.bezierCurveTo(-14, -10, -38, 8, -38, 24);
    ctx.bezierCurveTo(-38, 42, -10, 44, 0, 38);
    ctx.bezierCurveTo(10, 44, 38, 42, 38, 24);
    ctx.bezierCurveTo(38, 8, 14, -10, -2, -24);
    ctx.closePath();
    ctx.fillStyle = p.belly;
    ctx.fill();

    ctx.restore();
  }

  // Tai: side -1 trái (phía sau), +1 phải (phía trước). Xoay ngang và ép theo rig
  drawEar(ctx, p, side) {
    const rig = this.rig;
    const m = -side; // hình gốc vẽ cho tai trái, lật ngang cho tai phải
    const twitch = side < 0 ? this.earTwitchAmount : -this.earTwitchAmount;

    ctx.save();
    ctx.translate(side * 35, -32);
    ctx.rotate(side * rig.earRot * 0.9 + twitch);
    // Ép tai: co theo chiều dọc quanh chân tai
    ctx.translate(0, 16);
    ctx.scale(1, 1 - rig.earFlat * 0.45);
    ctx.translate(0, -16);

    ctx.beginPath();
    ctx.moveTo(-12 * m, 24);
    ctx.lineTo(-21 * m, -20);
    ctx.quadraticCurveTo(-25 * m, -32, -15 * m, -26);
    ctx.lineTo(22 * m, 10);
    ctx.closePath();
    ctx.fillStyle = p.main;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-9 * m, 20);
    ctx.lineTo(-17 * m, -14);
    ctx.quadraticCurveTo(-19 * m, -22, -12 * m, -18);
    ctx.lineTo(15 * m, 8);
    ctx.closePath();
    ctx.fillStyle = p.innerEar;
    ctx.fill();

    // Lông tơ trong tai
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4 * m, 16); ctx.lineTo(-10 * m, 0);
    ctx.moveTo(0, 14);      ctx.lineTo(-3 * m, -2);
    ctx.moveTo(4 * m, 13);  ctx.lineTo(4 * m, 2);
    ctx.stroke();

    ctx.restore();
  }

  // --- 6. KHUÔN MẶT: MÁ, MẮT, MÕM, MŨI, MIỆNG, RÂU (toạ độ quanh tâm đầu) ---
  render3DFace(ctx, p, expr, state) {
    ctx.save();
    const rig = this.rig;

    // A. Má hồng
    const blush = Math.max(0, Math.min(1, rig.blush));
    ctx.fillStyle = `rgba(251, 113, 133, ${blush})`;
    ctx.beginPath();
    ctx.ellipse(-38, 16, 13, 8, -0.05, 0, Math.PI * 2);
    ctx.ellipse(38, 16, 13, 8, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + blush * 0.5})`;
    ctx.beginPath();
    ctx.arc(-36, 14, 2.5, 0, Math.PI * 2);
    ctx.arc(36, 14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // B. Mắt: vuốt ve/rù rù luôn ra mắt cười, trừ khi đang cáu
    let eyeStyle = expr.eyes;
    if (eyeStyle === 'open' && !HOSTILE_STATES.includes(state) && (this.isPetting || this.purrIntensity > 0.3)) {
      eyeStyle = 'happy';
    }
    this.renderCatEye(ctx, -28, -4, 13, -1, eyeStyle, p, expr.look);
    this.renderCatEye(ctx, 28, -4, 13, 1, eyeStyle, p, expr.look);
    if (eyeStyle === 'open' || eyeStyle === 'kawaii') this.renderBrows(ctx, p);

    // Quầng thâm dưới mắt (ốm, kiệt sức)
    if (expr.eyeBags) {
      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-28, 4, 11, 0.35, Math.PI - 0.35);
      ctx.moveTo(28 + 11 * Math.cos(0.35), 4 + 11 * Math.sin(0.35));
      ctx.arc(28, 4, 11, 0.35, Math.PI - 0.35);
      ctx.stroke();
      ctx.restore();
    }

    // Vạch u ám trên trán (ốm)
    if (expr.sickTint) {
      ctx.save();
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.55)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      [-18, -6, 6, 18].forEach(x => {
        ctx.moveTo(x, -40);
        ctx.lineTo(x, -27);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Giọt nước mắt đọng ở mi dưới (đói lả)
    if (expr.tear) {
      const drip = (this.time * 0.6) % 1;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-34, 7 + drip * 6);
      ctx.quadraticCurveTo(-29, 15 + drip * 6, -34, 17 + drip * 6);
      ctx.quadraticCurveTo(-39, 15 + drip * 6, -34, 7 + drip * 6);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.9)';
      ctx.fill();
      ctx.restore();
    }

    // C. Đệm râu hai bên mõm (chữ ω)
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.ellipse(-9, 16, 11, 8, 0.1, 0, Math.PI * 2);
    ctx.ellipse(9, 16, 11, 8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    [[-13, 13], [-9, 17], [-15, 18], [13, 13], [9, 17], [15, 18]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // D. Râu
    this.renderWhiskers(ctx, p);

    // E. Miệng (vẽ trước mũi để mũi nằm trên nhân trung); đồ ăn kề miệng thì há chờ
    const waitingFood = this.foodDrag && this.foodDrag.near && state !== 'SLEEPING' && !HOSTILE_STATES.includes(state);
    this.renderMouth(ctx, waitingFood ? 'meow' : expr.mouth, p);

    // F. Mũi bo tròn có đốm sáng
    ctx.beginPath();
    ctx.moveTo(-6.5, 6.5);
    ctx.quadraticCurveTo(0, 4, 6.5, 6.5);
    ctx.quadraticCurveTo(4.5, 11, 0, 13);
    ctx.quadraticCurveTo(-4.5, 11, -6.5, 6.5);
    ctx.closePath();
    ctx.fillStyle = p.nose;
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-1.8, 7.6, 2.2, 1.2, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Nhăn sống mũi khi rít
    if (expr.noseWrinkle) {
      ctx.save();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, 2); ctx.quadraticCurveTo(0, -1, 6, 2);
      ctx.moveTo(-5, -2); ctx.quadraticCurveTo(0, -5, 5, -2);
      ctx.stroke();
      ctx.restore();
    }

    // H. Dấu gân giận 💢 trên trán khi cáu, đập theo nhịp
    if (HOSTILE_STATES.includes(state)) {
      const beat = 1 + Math.max(0, Math.sin(this.time * 9)) * 0.18;
      ctx.save();
      ctx.translate(46, -36);
      ctx.scale(beat, beat);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Bốn cung cong quay lưng vào nhau như ký hiệu 💢
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
        ctx.moveTo(sx * 2.5, sy * 8);
        ctx.quadraticCurveTo(sx * 2.5, sy * 2.5, sx * 8, sy * 2.5);
      });
      ctx.stroke();
      ctx.restore();
    }

    // G. Giọt mồ hôi khi dỗi
    if (state === 'SULKING') {
      ctx.beginPath();
      ctx.moveTo(56, -30);
      ctx.quadraticCurveTo(64, -16, 56, -12);
      ctx.quadraticCurveTo(48, -16, 56, -30);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Mắt mèo: side -1 trái, +1 phải. Mống mắt phủ kín, đồng tử elip dọc, mí trên theo rig
  renderCatEye(ctx, cx, cy, r, side, style, p, look) {
    const rig = this.rig;
    const open = this.isBlinking ? 0 : rig.eyeOpen;

    if (style === 'happy' || style === 'squeeze') {
      this.renderEyeArc(ctx, cx, cy, r, side, style);
      return;
    }
    if (style === 'kawaii') {
      this.renderKawaiiEye(ctx, cx, cy, p.eyeColor, r * 1.12);
      return;
    }
    if (style === 'closed' || open < 0.12) {
      this.renderEyeArc(ctx, cx, cy, r, side, 'closed');
      return;
    }

    const w = r * 1.08;
    const h = r * 0.95 * Math.max(1, open);
    const tilt = side * 0.12; // đuôi mắt hơi xếch lên

    const eyePath = () => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, w, h, tilt, 0, Math.PI * 2);
    };

    ctx.save();
    eyePath();
    ctx.clip();

    // Mống mắt phủ kín: màu lông mắt, viền tối, đáy sáng
    ctx.fillStyle = p.eyeColor;
    ctx.fillRect(cx - w - 2, cy - h - 2, w * 2 + 4, h * 2 + 4);
    const shade = ctx.createRadialGradient(cx, cy + h * 0.2, r * 0.2, cx, cy, r * 1.15);
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    shade.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = shade;
    ctx.fillRect(cx - w - 2, cy - h - 2, w * 2 + 4, h * 2 + 4);

    // Hướng nhìn: theo con trỏ, hoặc hướng cố định của biểu cảm (nhìn đi chỗ khác)
    const maxLook = r * 0.32;
    let lookX = 0;
    let lookY = 0;
    if (look) {
      lookX = look.x * maxLook;
      lookY = look.y * maxLook;
    } else {
      // Toạ độ mắt trên màn hình (tính cả hướng mặt), rồi đổi hướng nhìn về toạ độ cục bộ
      const s = this.scale;
      const facing = this.renderFacing || 1;
      const gx = this.x + facing * (CAT_HEAD.x + rig.headDX + cx) * s;
      const gy = this.y + (CAT_HEAD.y + rig.headDY + cy) * s;
      const dx = this.mouseX - gx;
      const dy = this.mouseY - gy;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        lookX = facing * (dx / dist) * Math.min(dist * 0.05, maxLook);
        lookY = (dy / dist) * Math.min(dist * 0.05, maxLook);
      }
    }

    // Đồng tử: khe dọc khi nhỏ, tròn khi giãn
    const pupil = Math.max(0.1, Math.min(1, rig.pupil));
    ctx.beginPath();
    ctx.ellipse(cx + lookX, cy + lookY, r * (0.14 + 0.62 * pupil), r * (0.78 + 0.12 * pupil), 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Đốm sáng phản chiếu
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.34 + lookX * 0.3, cy - r * 0.36, r * 0.27, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.3 + lookX * 0.3, cy + r * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Mí trên: hạ theo eyeOpen, nghiêng theo lidTilt (buồn: đuôi mí cụp; cau: đầu mí cụp)
    const lidY = cy - h + 2 * h * (1 - Math.min(1, open));
    const xOuter = cx + side * (w + 2);
    const xInner = cx - side * (w + 2);
    const yOuter = lidY + rig.lidTilt * h * 0.7;
    const yInner = lidY - rig.lidTilt * h * 0.7;
    ctx.beginPath();
    ctx.moveTo(xInner, yInner);
    ctx.lineTo(xOuter, yOuter);
    ctx.lineTo(xOuter, cy - h - 6);
    ctx.lineTo(xInner, cy - h - 6);
    ctx.closePath();
    ctx.fillStyle = p.main;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(xInner, yInner);
    ctx.lineTo(xOuter, yOuter);
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    ctx.restore();

    // Viền mắt + mi trên đậm
    eyePath();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, tilt, Math.PI * 1.1, Math.PI * 1.9);
    ctx.lineWidth = 3.4;
    ctx.stroke();
  }

  // Mắt nhắm: 'happy' ^ ^ (cười), 'closed' ︶ (ngủ, thư giãn), 'squeeze' > < (nhắm chặt)
  renderEyeArc(ctx, cx, cy, r, side, style) {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (style === 'happy') {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 6);
      ctx.quadraticCurveTo(cx, cy - 11, cx + 14, cy + 6);
      ctx.stroke();
      // Lông mi cong ở đuôi mắt
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx + side * 14, cy + 6);
      ctx.lineTo(cx + side * 20, cy + 1);
      ctx.stroke();
    } else if (style === 'squeeze') {
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(cx + side * 11, cy - 7);
      ctx.lineTo(cx - side * 9, cy + 1);
      ctx.lineTo(cx + side * 11, cy + 8);
      ctx.stroke();
    } else {
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, r * 0.95, 0.35, Math.PI - 0.35);
      ctx.stroke();
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.85, cy + 3);
      ctx.lineTo(cx + side * (r * 0.85 + 5), cy + 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Lông mày hoạt hình theo lidTilt: < 0 cau có (đầu mày trong hạ), > 0 lo lắng/nài nỉ (đầu mày trong nhướn)
  renderBrows(ctx, p) {
    const t = this.rig.lidTilt;
    const strength = Math.min(1, (Math.abs(t) - 0.2) * 2.5);
    if (strength <= 0) return;
    ctx.save();
    ctx.globalAlpha = strength;
    ctx.strokeStyle = p.whisker ? 'rgba(226, 232, 240, 0.9)' : 'rgba(15, 23, 42, 0.8)';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    [-1, 1].forEach(side => {
      const innerY = -21 - t * 6;
      const outerY = -21 + t * 4;
      ctx.moveTo(side * 15, innerY);
      ctx.quadraticCurveTo(side * 28, (innerY + outerY) / 2 - 2, side * 40, outerY);
    });
    ctx.stroke();
    ctx.restore();
  }

  renderKawaiiEye(ctx, cx, cy, eyeColor, radius) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    const grad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.55, eyeColor);
    grad.addColorStop(1, '#ecfccb');
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.05, radius * 0.4, radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.32, cy - radius * 0.36, radius * 0.34, 0, Math.PI * 2);
    ctx.arc(cx + radius * 0.3, cy + radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.arc(cx - radius * 0.2, cy + radius * 0.45, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.8;
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Râu: whisker > 0 chĩa ra trước và xoè (tò mò), < 0 cụp sát má (sợ, cáu)
  renderWhiskers(ctx, p) {
    const w = this.rig.whisker;
    const wiggle = Math.sin(this.time * 3) * 0.03;
    const len = 46 * (1 + 0.1 * w);
    ctx.save();
    ctx.strokeStyle = p.whisker || 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    [-1, 1].forEach(side => {
      [-0.14, 0.08, 0.3].forEach((base, i) => {
        const a = base * (1 + 0.35 * w) - w * 0.18 + (i === 0 ? wiggle : -wiggle);
        const ox = side * 17;
        const oy = 13 + i * 4;
        const ex = ox + side * Math.cos(a) * len;
        const ey = oy + Math.sin(a) * len;
        ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo(ox + side * len * 0.5, oy + Math.sin(a) * len * 0.35 - 3, ex, ey);
      });
    });
    ctx.stroke();
    ctx.restore();
  }

  // Miệng theo kiểu biểu cảm; mouthOpen của rig quyết định độ há
  renderMouth(ctx, style, p) {
    const open = Math.max(0, Math.min(1, this.rig.mouthOpen));
    const dark = '#0f172a';
    const inside = '#9f1239';
    const tongue = '#fb7185';

    ctx.save();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Nhân trung từ mũi xuống
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 16.5);
    ctx.stroke();

    const omega = () => {
      ctx.beginPath();
      ctx.arc(-6, 17, 6, 0.15, Math.PI - 0.15);
      ctx.arc(6, 17, 6, 0.15, Math.PI - 0.15);
      ctx.stroke();
    };

    switch (style) {
      case 'open': {
        // Há miệng cười
        ctx.beginPath();
        ctx.moveTo(-11, 18);
        ctx.quadraticCurveTo(0, 15, 11, 18);
        ctx.quadraticCurveTo(0, 34, -11, 18);
        ctx.closePath();
        ctx.fillStyle = inside;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 26, 6, 3.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = tongue;
        ctx.fill();
        break;
      }
      case 'meow': {
        const h = 4 + open * 14;
        ctx.beginPath();
        ctx.moveTo(-8, 17);
        ctx.quadraticCurveTo(0, 15, 8, 17);
        ctx.quadraticCurveTo(4, 17 + h, 0, 17 + h);
        ctx.quadraticCurveTo(-4, 17 + h, -8, 17);
        ctx.closePath();
        ctx.fillStyle = inside;
        ctx.fill();
        ctx.stroke();
        if (h > 9) {
          ctx.beginPath();
          ctx.ellipse(0, 15 + h, 4, 2.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = tongue;
          ctx.fill();
        }
        break;
      }
      case 'yawn': {
        const h = 6 + open * 14;
        ctx.beginPath();
        ctx.ellipse(0, 18 + h * 0.55, 13, h, 0, 0, Math.PI * 2);
        ctx.fillStyle = inside;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 18 + h * 1.1, 8, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = tongue;
        ctx.fill();
        // Răng nanh ở hàm trên
        const fangY = 18 - h * 0.45 + h * 0.35;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-9, fangY); ctx.lineTo(-5, fangY); ctx.lineTo(-7, fangY + 6); ctx.closePath();
        ctx.moveTo(5, fangY);  ctx.lineTo(9, fangY);  ctx.lineTo(7, fangY + 6);  ctx.closePath();
        ctx.fill();
        break;
      }
      case 'chew': {
        const h = 3 + Math.abs(this.chewCycle) * 6;
        ctx.beginPath();
        ctx.ellipse(0, 19, 7, h, 0, 0, Math.PI * 2);
        ctx.fillStyle = inside;
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'lick': {
        omega();
        const wag = Math.sin(this.time * 9) * 2;
        ctx.beginPath();
        ctx.ellipse(-3 + wag, 25, 5, 7, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = tongue;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      }
      case 'blep': {
        omega();
        ctx.beginPath();
        ctx.moveTo(-4, 21);
        ctx.lineTo(4, 21);
        ctx.quadraticCurveTo(4, 28, 0, 28);
        ctx.quadraticCurveTo(-4, 28, -4, 21);
        ctx.closePath();
        ctx.fillStyle = tongue;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      }
      case 'o': {
        ctx.beginPath();
        ctx.ellipse(0, 22, 5, 4 + open * 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = inside;
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'pout': {
        // Bĩu môi: hai cung úp xuống
        ctx.beginPath();
        ctx.arc(-5, 22, 5, Math.PI + 0.4, Math.PI * 2 - 0.4);
        ctx.moveTo(10, 20.5);
        ctx.arc(5, 22, 5, Math.PI + 0.4, Math.PI * 2 - 0.4);
        ctx.stroke();
        break;
      }
      case 'flat': {
        // Mím môi khó chịu
        ctx.beginPath();
        ctx.moveTo(-10, 21);
        ctx.quadraticCurveTo(0, 17.5, 10, 21);
        ctx.stroke();
        break;
      }
      case 'wobble': {
        // Ốm: miệng run run hình sóng nhỏ
        ctx.beginPath();
        ctx.moveTo(-9, 21);
        ctx.quadraticCurveTo(-6, 18, -3, 21);
        ctx.quadraticCurveTo(0, 24, 3, 21);
        ctx.quadraticCurveTo(6, 18, 9, 21);
        ctx.stroke();
        break;
      }
      case 'licklips': {
        // No căng: liếm mép, lưỡi quét qua lại
        omega();
        const lx = Math.sin(this.time * 4) * 6;
        ctx.beginPath();
        ctx.ellipse(lx, 22.5, 4.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = tongue;
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.stroke();
        break;
      }
      case 'hiss': {
        // Rít: há rộng, lộ 4 răng nanh, lưỡi cong
        const h = 10 + open * 10;
        ctx.beginPath();
        ctx.moveTo(-15, 17);
        ctx.quadraticCurveTo(-7, 13, 0, 15);
        ctx.quadraticCurveTo(7, 13, 15, 17);
        ctx.quadraticCurveTo(12, 17 + h, 0, 17 + h);
        ctx.quadraticCurveTo(-12, 17 + h, -15, 17);
        ctx.closePath();
        ctx.fillStyle = inside;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 13 + h, 6, 3, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = tongue;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-10, 16); ctx.lineTo(-6, 16); ctx.lineTo(-8, 23); ctx.closePath();
        ctx.moveTo(6, 16);   ctx.lineTo(10, 16); ctx.lineTo(8, 23);  ctx.closePath();
        ctx.moveTo(-8, 17 + h); ctx.lineTo(-5, 17 + h); ctx.lineTo(-6.5, 12 + h); ctx.closePath();
        ctx.moveTo(5, 17 + h);  ctx.lineTo(8, 17 + h);  ctx.lineTo(6.5, 12 + h);  ctx.closePath();
        ctx.fill();
        break;
      }
      case 'grumble': {
        // Cáu: miệng gằn hình sóng, một răng nanh nhú ra
        ctx.beginPath();
        ctx.moveTo(-11, 22);
        ctx.quadraticCurveTo(-5.5, 17, 0, 20);
        ctx.quadraticCurveTo(5.5, 17, 11, 22);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, 19.2);
        ctx.lineTo(8, 19.8);
        ctx.lineTo(6.2, 25);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.stroke();
        break;
      }
      case 'smile':
      default:
        omega();
        break;
    }
    ctx.restore();
  }

  // --- 7. PHỤ KIỆN & TRANG PHỤC ---
  // Phụ kiện cổ (toạ độ thân)
  renderNeckCostume(ctx, customization) {
    if (customization.accessory === 'red_bowtie') {
      ctx.save();
      ctx.translate(CAT_HEAD.x, 22);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-20, -10); ctx.lineTo(-20, 10); ctx.closePath();
      ctx.moveTo(0, 0); ctx.lineTo(20, -10); ctx.lineTo(20, 10); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#b91c1c';
      ctx.fill();
      ctx.restore();
    } else if (customization.accessory === 'gold_bell') {
      ctx.save();
      ctx.translate(CAT_HEAD.x, 22);
      ctx.beginPath();
      ctx.ellipse(0, -2, 34, 10, 0, 0, Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 6, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#a16207';
      ctx.stroke();
      ctx.restore();
    }
  }

  // Kính và mũ (toạ độ quanh tâm đầu, nghiêng theo đầu)
  renderHeadCostumes(ctx, customization) {
    if (customization.glasses === 'sunglasses') {
      ctx.save();
      ctx.translate(0, -6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-45, -8, 38, 18);
      ctx.fillRect(7, -8, 38, 18);
      ctx.fillRect(-7, -4, 14, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-38, -4, 24, 3);
      ctx.fillRect(14, -4, 24, 3);
      ctx.restore();
    } else if (customization.glasses === 'round_glasses') {
      ctx.save();
      ctx.translate(0, -6);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-26, 0, 14, 0, Math.PI * 2);
      ctx.moveTo(40, 0);
      ctx.arc(26, 0, 14, 0, Math.PI * 2);
      ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
      ctx.stroke();
      ctx.restore();
    }

    if (customization.hat === 'party_hat') {
      ctx.save();
      ctx.translate(0, -45);
      ctx.beginPath();
      ctx.moveTo(-22, 10); ctx.lineTo(0, -45); ctx.lineTo(22, 10); ctx.closePath();
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-14, -5); ctx.lineTo(6, -25);
      ctx.moveTo(-18, 5);  ctx.lineTo(14, -15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -46, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.restore();
    } else if (customization.hat === 'chef_hat') {
      ctx.save();
      ctx.translate(0, -45);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-26, -5, 52, 15);
      ctx.beginPath();
      ctx.arc(-18, -18, 16, 0, Math.PI * 2);
      ctx.arc(0, -28, 20, 0, Math.PI * 2);
      ctx.arc(18, -18, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();
      ctx.restore();
    } else if (customization.hat === 'wizard_hat') {
      ctx.save();
      ctx.translate(0, -45);
      ctx.beginPath();
      ctx.ellipse(0, 10, 42, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#581c87';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-24, 8);
      ctx.quadraticCurveTo(-15, -30, 20, -55);
      ctx.quadraticCurveTo(5, -25, 24, 8);
      ctx.closePath();
      ctx.fillStyle = '#6b21a8';
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(2, -15, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Vùng thả đồ ăn: vòng nét đứt quanh mèo khi đang kéo, sáng vàng khi con trỏ ở trên mèo
  renderFoodDropZone() {
    if (!this.foodDrag) return;
    const ctx = this.ctx;
    const s = this.scale;
    const near = this.foodDrag.near;
    ctx.save();
    ctx.translate(this.x + 10 * s, this.y - 10 * s);
    ctx.beginPath();
    ctx.ellipse(0, 0, 125 * s, 85 * s, 0, 0, Math.PI * 2);
    ctx.setLineDash([10 * s, 8 * s]);
    ctx.lineDashOffset = -this.time * 30;
    ctx.lineWidth = (near ? 4 : 2.5) * s;
    ctx.strokeStyle = near ? 'rgba(250, 204, 21, 0.95)' : 'rgba(255, 255, 255, 0.45)';
    ctx.stroke();
    if (near) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
      ctx.fill();
    }
    ctx.restore();
  }

  // --- ĐỒ CHƠI TƯƠNG TÁC ---
  renderActiveToys() {
    const ctx = this.ctx;
    const s = this.scale;
    const activeToy = window.gameState ? window.gameState.data.activeToy : null;

    if (activeToy === 'laser_pointer') {
      const lx = this.laserDot.x;
      const ly = this.laserDot.y;

      const grad = ctx.createRadialGradient(lx, ly, 1, lx, ly, 22 * s);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
      grad.addColorStop(0.4, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.beginPath();
      ctx.arc(lx, ly, 22 * s, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(lx, ly, 4 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (activeToy === 'feather_wand') {
      const wx = this.featherWand.x;
      const wy = this.featherWand.y;

      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      ctx.moveTo(wx + 80 * s, wy - 140 * s);
      ctx.lineTo(wx, wy);
      ctx.stroke();

      const colors = ['#a855f7', '#ec4899', '#06b6d4'];
      colors.forEach((col, idx) => {
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate((idx - 1) * 0.45 + Math.sin(this.time * 6 + idx) * 0.2);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(15 * s, 25 * s, 0, 48 * s);
        ctx.quadraticCurveTo(-15 * s, 25 * s, 0, 0);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.restore();
      });

      ctx.beginPath();
      ctx.arc(wx, wy, 5 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();
    }
  }

  renderParticles() {
    const ctx = this.ctx;
    this.particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.font = `${p.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    });
  }
}

window.CatRenderer = CatRenderer;
