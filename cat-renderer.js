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
 */

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

    // Đồ chơi
    this.yarnBall = { x: this.baseX - 180, y: this.baseY + 55, vx: 0, vy: 0, radius: 24, rotation: 0 };
    this.foodBowl = { x: this.baseX - 140, y: this.baseY + 45, active: false, foodType: null, timer: 0 };
    this.featherWand = { x: this.baseX + 90, y: this.baseY - 60, targetX: 0, targetY: 0 };
    this.laserDot = { x: this.baseX + 60, y: this.baseY + 20, active: false };

    // Hạt hiệu ứng
    this.particles = [];

    this.initEvents();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.scale = Math.min(this.width / 1300, this.height / 800) * 1.28;
    this.scale = Math.max(0.9, Math.min(1.5, this.scale));

    this.baseX = this.width * 0.52;
    this.baseY = this.height * 0.59;

    if (!window.gameState || window.gameState.behaviorState !== 'ZOOMIES') {
      this.x = this.baseX;
      this.y = this.baseY;
    }
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

      // Vùng va chạm quanh dáng nằm loaf
      const dx = this.mouseX - (this.x + 10 * this.scale);
      const dy = this.mouseY - (this.y - 10 * this.scale);
      const hitRadiusX = 125 * this.scale;
      const hitRadiusY = 85 * this.scale;

      this.isHoveringCat = (dx * dx) / (hitRadiusX * hitRadiusX) + (dy * dy) / (hitRadiusY * hitRadiusY) <= 1.0;

      if (this.isHoveringCat) {
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

    window.gameState.pet();

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
    } else {
      this.kneadCycle = 0;
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

    if (state === 'ZOOMIES') {
      this.x += this.zoomiesDir * this.zoomiesSpeed * delta;
      if (this.x > this.width * 0.78) {
        this.zoomiesDir = -1;
        this.spawnParticle('dust', this.x, this.y + 20, { text: '💨', size: 32 });
      } else if (this.x < this.width * 0.25) {
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
      const bx = this.x + 45 * this.scale;
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
  // CHÍNH XÁC DÁNG NẰM LOAF GÓC NGHIÊNG 3/4 (THEO ẢNH MẪU)
  // ===================================================================
  render3DCatLoaf(state, customization) {
    const ctx = this.ctx;
    const s = this.scale;
    const p = this.getCoatPalette(customization.fur);

    ctx.save();
    ctx.translate(this.x, this.y);

    const breathY = this.breathCycle * 0.022;
    const currentSquishX = this.squishX;
    const currentSquishY = this.squishY + breathY;
    ctx.scale(currentSquishX * s, currentSquishY * s);

    if (state === 'ZOOMIES') {
      ctx.scale(this.zoomiesDir, 1);
    }

    // 1. Bóng đổ 3/4 dưới thân trên thảm
    ctx.beginPath();
    ctx.ellipse(-10, 44, 115, 30, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
    ctx.fill();

    // Vòng purr phát sáng
    if (this.purrIntensity > 0.05) {
      ctx.save();
      const ringRadius = 115 + (1 - this.purrIntensity) * 45;
      ctx.beginPath();
      ctx.arc(0, 10, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 63, 94, ${this.purrIntensity * 0.45})`;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();
    }

    // 2. ĐUÔI XÙ DỰNG CAO BÊN TRÁI (THEO ẢNH MẪU)
    this.render3DTail(ctx, p, state);

    // 3. THÂN BÁNH MÌ LOAF BÉO MÚP (3/4 PERSPECTIVE BODY)
    this.render3DBody(ctx, p, state);

    // 4. BỤNG TRẮNG VÀ CHÂN TRƯỚC XẾP GỌN (WHITE BELLY & PAWS)
    this.render3DChestAndPaws(ctx, p, state);

    // 5. ĐẦU NGHIÊNG BÊN PHẢI VỚI MÁ XÙ 3 TẦNG (FLUFFY HEAD & CHEEKS)
    this.render3DHead(ctx, p, state);

    // 6. KHUÔN MẶT CƯỜI HÍP TỊT ^ ^ VÀ BIỂU CẢM (SWEET FACE)
    this.render3DFace(ctx, p, state);

    // 7. PHỤ KIỆN
    this.renderCostumes(ctx, customization);

    ctx.restore();
  }

  // --- 2. ĐUÔI XÙ TO UỐN LƯỢN BÊN TRÁI (FLUFFY UPWARD TAIL) ---
  render3DTail(ctx, p, state) {
    ctx.save();
    const isSleeping = state === 'SLEEPING';
    const isPlaying = state === 'PLAYING';

    let tailSway = this.tailCycle * 14;
    if (isPlaying) {
      tailSway = Math.sin(this.time * 8) * 24;
    }

    if (isSleeping) {
      // Đuôi cuộn tròn quanh chân
      ctx.beginPath();
      ctx.moveTo(-65, 20);
      ctx.bezierCurveTo(-95, 28, -95, 48, -48, 50);
      ctx.lineWidth = 34;
      ctx.lineCap = 'round';
      ctx.strokeStyle = p.main;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-48, 50, 16, 0, Math.PI * 2);
      ctx.fillStyle = p.belly;
      ctx.fill();
    } else {
      // Đuôi mọc từ góc sau bên trái, xù to uốn cong lên trên (như hình mẫu)
      const rootX = -72;
      const rootY = 18;
      const tipX = -88 - tailSway * 1.2;
      const tipY = -72;

      ctx.beginPath();
      // Mép trái đuôi xù
      ctx.moveTo(rootX, rootY);
      ctx.bezierCurveTo(-115, 0, -125 - tailSway, -40, tipX - 16, tipY);
      // Chóp đuôi tròn xù
      ctx.arc(tipX, tipY, 22, Math.PI, 0, false);
      // Mép phải đuôi lượn về lưng
      ctx.bezierCurveTo(tipX + 22, -35, -70, -15, -45, 10);
      ctx.closePath();

      const tailGrad = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
      tailGrad.addColorStop(0, p.shadowTone || p.main);
      tailGrad.addColorStop(0.65, p.main);
      tailGrad.addColorStop(1, p.mainGradient || p.main);
      ctx.fillStyle = tailGrad;
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.stroke();

      // Sọc vằn trên đuôi xù
      if (p.secondary) {
        ctx.strokeStyle = p.secondary;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-108 - tailSway * 0.4, -12); ctx.lineTo(-80 - tailSway * 0.4, -20);
        ctx.moveTo(-100 - tailSway * 0.8, -38); ctx.lineTo(-72 - tailSway * 0.8, -45);
        ctx.stroke();
      }

      // Chóp đuôi lông xù trắng muốt bồng bềnh
      ctx.beginPath();
      ctx.arc(tipX, tipY, 21, 0, Math.PI * 2);
      ctx.fillStyle = p.belly;
      ctx.fill();

      // Búi lông tơ chóp đuôi
      ctx.beginPath();
      ctx.arc(tipX - 10, tipY + 6, 9, 0, Math.PI * 2);
      ctx.arc(tipX + 10, tipY + 6, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- 3. THÂN BÁNH MÌ LOAF BÉO TRÒN (CHUBBY LOAF BODY) ---
  render3DBody(ctx, p, state) {
    ctx.save();
    const isPlaying = state === 'PLAYING';
    const isYawning = state === 'YAWNING';

    if (isPlaying) {
      ctx.translate(this.buttWiggle, 0);
    }
    if (isYawning) {
      ctx.translate(0, -6);
      ctx.scale(1.02, 1.08);
    }

    // Dáng nằm bánh mì loaf góc 3/4: Lưng vồng cao từ trái sang phải
    ctx.beginPath();
    ctx.moveTo(-92, 25);
    // Lưng cong múp míp
    ctx.bezierCurveTo(-96, -26, -35, -45, 20, -36);
    ctx.bezierCurveTo(75, -28, 110, -5, 105, 34);
    // Bụng mềm áp sát mặt sàn
    ctx.bezierCurveTo(90, 52, -75, 52, -92, 25);
    ctx.closePath();

    // Shading nổi khối mềm mượt (Warm 3D Shading)
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

    ctx.restore();
  }

  // --- 4. BỤNG TRẮNG VÀ CHÂN TRƯỚC (WHITE BELLY & PAWS) ---
  render3DChestAndPaws(ctx, p, state) {
    ctx.save();
    const isRolling = state === 'ROLLING';
    const isYawning = state === 'YAWNING';
    const isLicking = state === 'LICKING_PAW';
    const isBegging = state === 'BEGGING';

    // 1. Mảng bụng trắng muốt trải từ giữa thân ra phía trước (như ảnh mẫu)
    ctx.beginPath();
    ctx.moveTo(-35, 46);
    ctx.quadraticCurveTo(-15, 16, 25, 12);
    ctx.bezierCurveTo(65, 12, 98, 22, 98, 44);
    ctx.quadraticCurveTo(30, 52, -35, 46);
    ctx.closePath();
    ctx.fillStyle = p.belly;
    ctx.fill();

    // Viền lông xù ở mép bụng trắng
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.arc(-15, 34, 10, 0, Math.PI * 2);
    ctx.arc(8, 24, 12, 0, Math.PI * 2);
    ctx.arc(38, 20, 11, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hai bàn chân trước xinh xắn
    if (isRolling) {
      // Lăn ngửa bụng khoe đệm chân hồng
      ctx.fillStyle = p.belly;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.lineWidth = 2.5;

      [-28, 38].forEach(px => {
        ctx.beginPath();
        ctx.ellipse(px, -15, 16, 20, px < 0 ? -0.25 : 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.ellipse(px, -17, 8, 7, 0, 0, Math.PI * 2);
        ctx.arc(px - 6, -26, 3.5, 0, Math.PI * 2);
        ctx.arc(px, -29, 3.8, 0, Math.PI * 2);
        ctx.arc(px + 6, -26, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.belly;
      });
    } else if (isBegging) {
      // Chắp 2 chân xin ăn
      const begY = -12 + Math.sin(this.time * 8) * 8;
      ctx.fillStyle = p.belly;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(32, begY, 15, 18, 0.15, 0, Math.PI * 2);
      ctx.ellipse(58, begY, 15, 18, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (isLicking) {
      // Giơ một chân liếm
      ctx.fillStyle = p.belly;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(22, -18, 16, 18, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.ellipse(22, -18, 6, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.belly;
      ctx.beginPath();
      ctx.ellipse(75, 45, 20, 13, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (isYawning) {
      // Duỗi chân trước vươn vai
      ctx.fillStyle = p.belly;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(40, 56, 22, 14, -0.05, 0, Math.PI * 2);
      ctx.ellipse(82, 54, 22, 14, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Bình thường: 2 bàn chân xếp ngay ngắn ở góc trước (như ảnh mẫu)
      const leftKnead = this.kneadCycle * 4;
      const rightKnead = -this.kneadCycle * 4;

      ctx.fillStyle = p.belly;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.lineWidth = 2.5;

      // Chân trước trái
      ctx.beginPath();
      ctx.ellipse(28, 47 + leftKnead, 19, 13, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Chân trước phải
      ctx.beginPath();
      ctx.ellipse(74, 46 + rightKnead, 20, 13, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ngấn ngón chân tròn xoe
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(23, 53 + leftKnead); ctx.lineTo(23, 43 + leftKnead);
      ctx.moveTo(33, 53 + leftKnead); ctx.lineTo(33, 43 + leftKnead);
      ctx.moveTo(69, 52 + rightKnead);  ctx.lineTo(69, 42 + rightKnead);
      ctx.moveTo(79, 52 + rightKnead);  ctx.lineTo(79, 42 + rightKnead);
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- 5. ĐẦU NGHIÊNG BÊN PHẢI VỚI MÁ XÙ 3 TẦNG (FLUFFY HEAD & CHEEKS) ---
  render3DHead(ctx, p, state) {
    ctx.save();
    // Đầu nằm lệch sang phải theo phối cảnh 3/4
    const headX = 42;
    const headY = -28;
    const isPetting = state === 'PETTING';
    const twitch = this.earTwitchAmount;

    // A. HAI TAI XÙ VỚI TÚM LÔNG TRẮNG
    const earAngle = isPetting ? 0.14 : 0;

    // Tai Trái (ở sau góc nhìn)
    ctx.save();
    ctx.translate(headX - 35, headY - 32);
    ctx.rotate(-earAngle + twitch);
    ctx.beginPath();
    ctx.moveTo(-12, 24);
    ctx.lineTo(-24, -28);
    ctx.lineTo(22, 10);
    ctx.closePath();
    ctx.fillStyle = p.main;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-9, 20);
    ctx.lineTo(-19, -20);
    ctx.lineTo(15, 8);
    ctx.closePath();
    ctx.fillStyle = p.innerEar;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2, 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tai Phải (ở trước góc nhìn)
    ctx.save();
    ctx.translate(headX + 35, headY - 32);
    ctx.rotate(earAngle - twitch);
    ctx.beginPath();
    ctx.moveTo(12, 24);
    ctx.lineTo(26, -28);
    ctx.lineTo(-20, 10);
    ctx.closePath();
    ctx.fillStyle = p.main;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(9, 20);
    ctx.lineTo(20, -20);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fillStyle = p.innerEar;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // B. MẶT BÉO VỚI 3 TẦNG LÔNG XÙ Ở MÁ (NHƯ HÌNH MẪU!)
    ctx.save();
    ctx.translate(headX, headY);

    ctx.beginPath();
    // Đỉnh đầu tròn
    ctx.moveTo(-40, -32);
    ctx.quadraticCurveTo(0, -42, 40, -32);

    // Má Phải: 3 tầng túm lông xù nhô dài ra ngoài
    ctx.lineTo(54, -16);
    ctx.lineTo(72, -10); // Túm 1
    ctx.lineTo(60, 4);
    ctx.lineTo(78, 12);  // Túm 2
    ctx.lineTo(62, 22);
    ctx.lineTo(72, 30);  // Túm 3
    ctx.lineTo(46, 40);

    // Cằm tròn múp
    ctx.quadraticCurveTo(0, 48, -45, 40);

    // Má Trái: Túm lông xù
    ctx.lineTo(-68, 30);
    ctx.lineTo(-58, 20);
    ctx.lineTo(-72, 12);
    ctx.lineTo(-58, 2);
    ctx.lineTo(-68, -10);
    ctx.lineTo(-52, -18);
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

    // C. VỆT LÔNG TRẮNG TỪ GIỮA MẮT XÒE XUỐNG 2 MÁ
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
    ctx.restore();
  }

  // --- 6. KHUÔN MẶT CƯỜI HÍP TỊT ^ ^ VÀ BIỂU CẢM NGỌT NGÀO ---
  render3DFace(ctx, p, state) {
    ctx.save();
    const headX = 42;
    const headY = -28;
    ctx.translate(headX, headY);

    // A. MÁ HỒNG ĐÀO NGỌT NGÀO (ROSY BLUSH)
    const blushIntensity = state === 'PETTING' ? 0.8 : 0.48;
    ctx.fillStyle = `rgba(251, 113, 133, ${blushIntensity})`;
    ctx.beginPath();
    ctx.ellipse(-38, 16, 13, 8, -0.05, 0, Math.PI * 2);
    ctx.ellipse(38, 16, 13, 8, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(-36, 14, 2.5, 0, Math.PI * 2);
    ctx.arc(36, 14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // B. RÂU MÈO DÀI UỐN LƯỢN (3 CỘNG MỖI BÊN)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.9;
    ctx.lineCap = 'round';
    const whiskerWiggle = Math.sin(this.time * 3) * 1.5;

    ctx.beginPath();
    // Trái
    ctx.moveTo(-32, 14); ctx.quadraticCurveTo(-54, 10 + whiskerWiggle, -78, 8);
    ctx.moveTo(-33, 19); ctx.quadraticCurveTo(-56, 20, -80, 22);
    ctx.moveTo(-32, 24); ctx.quadraticCurveTo(-54, 28 - whiskerWiggle, -75, 33);
    // Phải
    ctx.moveTo(32, 14);  ctx.quadraticCurveTo(54, 10 + whiskerWiggle, 78, 8);
    ctx.moveTo(33, 19);  ctx.quadraticCurveTo(56, 20, 80, 22);
    ctx.moveTo(32, 24);  ctx.quadraticCurveTo(54, 28 - whiskerWiggle, 75, 33);
    ctx.stroke();

    // C. MŨI HỒNG ĐÀO HÌNH TAM GIÁC NHỎ
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.lineTo(-5.5, 7);
    ctx.lineTo(5.5, 7);
    ctx.closePath();
    ctx.fillStyle = p.nose;
    ctx.fill();

    // D. NỤ CƯỜI CHỮ :3 (CAT SMILE)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    if (state === 'YAWNING') {
      ctx.beginPath();
      ctx.ellipse(0, 21, 14, 18, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#991b1b';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 28, 9, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
    } else if (state === 'EATING') {
      const mouthOpen = Math.abs(this.chewCycle) * 6;
      ctx.beginPath();
      ctx.ellipse(0, 17, 7, 3 + mouthOpen, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#991b1b';
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-6.5, 17, 6.5, 0.15, Math.PI - 0.15);
      ctx.arc(6.5, 17, 6.5, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }

    // E. ĐÔI MẮT BIỂU CẢM (THE EYES)
    const eyeSpacing = 28;
    const eyeY = -4;
    const isPettingNow = state === 'PETTING' || this.isPetting || this.purrIntensity > 0.08;

    if (isPettingNow) {
      // 1. KHI ĐƯỢC VUỐT VE: MẮT CƯỜI HÍP TỊT HÌNH CUNG ^ ^ (Y HỆT ẢNH MẪU!)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.0;
      ctx.lineCap = 'round';

      // Mắt trái ^
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing - 14, eyeY + 6);
      ctx.quadraticCurveTo(-eyeSpacing, eyeY - 11, -eyeSpacing + 14, eyeY + 6);
      ctx.stroke();

      // Mắt phải ^
      ctx.beginPath();
      ctx.moveTo(eyeSpacing - 14, eyeY + 6);
      ctx.quadraticCurveTo(eyeSpacing, eyeY - 11, eyeSpacing + 14, eyeY + 6);
      ctx.stroke();

      // Lông mi đuôi mắt cong vút cực duyên
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing + 14, eyeY + 6); ctx.lineTo(-eyeSpacing + 20, eyeY + 1);
      ctx.moveTo(eyeSpacing + 14, eyeY + 6);  ctx.lineTo(eyeSpacing + 20, eyeY + 1);
      ctx.stroke();

    } else if (this.isBlinking || state === 'SLEEPING') {
      // 2. KHI CHỚP MẮT HOẶC NGỦ SAY: CUNG MẮT NHẮM THƯ THÁI ⌒ ⌒
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY + 2, 11, 3.4, 6.0);
      ctx.arc(eyeSpacing, eyeY + 2, 11, 3.4, 6.0);
      ctx.stroke();

    } else if (state === 'BEGGING') {
      // 3. XIN ĂN: MẮT ANIME LONG LANH
      this.renderKawaiiEye(ctx, -eyeSpacing, eyeY, p.eyeColor, 15);
      this.renderKawaiiEye(ctx, eyeSpacing, eyeY, p.eyeColor, 15);

    } else {
      // 4. BÌNH THƯỜNG / SĂN MỒI: MẮT DÕI THEO CHUỘT
      const isHunting = state === 'PLAYING';
      this.renderTrackingEye(ctx, -eyeSpacing, eyeY, p.eyeColor, isHunting ? 14.5 : 13, isHunting, headX, headY);
      this.renderTrackingEye(ctx, eyeSpacing, eyeY, p.eyeColor, isHunting ? 14.5 : 13, isHunting, headX, headY);
    }

    ctx.restore();
  }

  renderTrackingEye(ctx, cx, cy, eyeColor, radius, isHunting, headX, headY) {
    // Tròng mắt hình quả hạnh nhân mềm mại (Almond kawaii cat eyes)
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 1.05, radius * 0.95, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Tọa độ mắt tuyệt đối trên canvas
    const eyeGlobalX = this.x + (headX + cx) * this.scale;
    const eyeGlobalY = this.y + (headY + cy) * this.scale;
    const dx = this.mouseX - eyeGlobalX;
    const dy = this.mouseY - eyeGlobalY;
    const dist = Math.hypot(dx, dy);
    const maxLook = radius * 0.35;
    const lookX = dist > 0 ? (dx / dist) * Math.min(dist * 0.05, maxLook) : 0;
    const lookY = dist > 0 ? (dy / dist) * Math.min(dist * 0.05, maxLook) : 0;

    const pupilX = cx + lookX;
    const pupilY = cy + lookY;

    // Iris mắt mèo ngọc lục bảo sâu thẳm
    const irisGrad = ctx.createRadialGradient(pupilX, pupilY, 1, pupilX, pupilY, radius * 0.85);
    irisGrad.addColorStop(0, '#0f172a');
    irisGrad.addColorStop(0.55, eyeColor);
    irisGrad.addColorStop(1, '#064e3b');

    ctx.beginPath();
    ctx.arc(pupilX, pupilY, radius * 0.82, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // Con ngươi đen
    const pupilR = isHunting ? radius * 0.54 : radius * 0.36;
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, pupilR, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // 2 đốm sáng phản chiếu long lanh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX - radius * 0.28, pupilY - radius * 0.28, radius * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pupilX + radius * 0.25, pupilY + radius * 0.25, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Mí mắt trên mềm mại
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.05, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  renderKawaiiEye(ctx, cx, cy, eyeColor, radius) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    const grad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, eyeColor);
    grad.addColorStop(1, '#a7f3d0');

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.86, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 5, 5.5, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy + 4, 3.2, 0, Math.PI * 2);
    ctx.arc(cx - 3, cy + 6, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 7. PHỤ KIỆN & TRANG PHỤC ---
  renderCostumes(ctx, customization) {
    const headX = 42;
    const headY = -28;

    if (customization.accessory === 'red_bowtie') {
      ctx.save();
      ctx.translate(headX, 22);
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
      ctx.translate(headX, 22);
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

    if (customization.glasses === 'sunglasses') {
      ctx.save();
      ctx.translate(headX, headY - 6);
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
      ctx.translate(headX, headY - 6);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-26, 0, 14, 0, Math.PI * 2);
      ctx.arc(26, 0, 14, 0, Math.PI * 2);
      ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
      ctx.stroke();
      ctx.restore();
    }

    if (customization.hat === 'party_hat') {
      ctx.save();
      ctx.translate(headX, headY - 45);
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
      ctx.translate(headX, headY - 45);
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
      ctx.translate(headX, headY - 45);
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
