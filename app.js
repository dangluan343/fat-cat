/**
 * Meow 2D - Main UI Controller & Application Orchestration
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Renderer & Engine
  const renderer = new CatRenderer('cat-canvas');
  const state = window.gameState;
  const audio = window.catAudio;

  let activeTab = 'food'; // 'food', 'toy', 'outfit', 'decor', 'special'

  // --- AUDIO UNLOCK ON FIRST CLICK ---
  const unlockAudio = () => {
    if (audio) audio.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // --- TOAST NOTIFICATIONS ---
  window.showToast = (msg) => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  };

  // --- HỘP THOẠI CHÚC MỪNG XẾP HÀNG ---
  // Quà offline, lên cấp, phần thưởng có thể xảy ra cùng lúc (mở hộp quà → lên cấp);
  // hiện lần lượt, đóng cái này mới hiện cái kế (xem closeModal)
  const CELEBRATION_MODALS = ['gift-modal', 'level-up-modal', 'reward-modal'];
  const celebrationQueue = [];
  const showCelebration = (id, setup) => {
    const busy = CELEBRATION_MODALS.some(m => document.getElementById(m).classList.contains('open'));
    if (busy) {
      celebrationQueue.push({ id, setup });
      return;
    }
    setup();
    document.getElementById(id).classList.add('open');
  };

  // --- LEVEL UP MODAL CELEBRATION ---
  window.showLevelUpModal = (newLevel, bonusCoins) => {
    // Hoãn một nhịp để hộp thoại của hành động gây ra lên cấp (ví dụ mở hộp quà) hiện trước
    setTimeout(() => showCelebration('level-up-modal', () => {
      document.getElementById('level-up-num').textContent = newLevel;
      document.getElementById('level-up-bonus-coins').textContent = bonusCoins;

      // Confetti / sparkles burst
      for (let i = 0; i < 20; i++) {
        renderer.spawnParticle('sparkle', renderer.x + (Math.random() - 0.5) * 160, renderer.y - 60, {
          text: ['✨', '⭐', '🎉', '🌟'][Math.floor(Math.random() * 4)],
          size: 24,
          vy: -80 - Math.random() * 80
        });
      }
    }), 0);
  };

  // --- OFFLINE GIFTS MODAL ---
  const formatAway = (seconds) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
  };

  const showGiftModal = (awaySeconds) => {
    if (!state.data.pendingGifts.length) return;
    if (document.getElementById('gift-modal').classList.contains('open')) return;
    showCelebration('gift-modal', () => {
      const gifts = state.data.pendingGifts;
      document.getElementById('gift-away-text').textContent =
        awaySeconds ? `Bạn vắng mặt ${formatAway(awaySeconds)}` : 'Bạn vừa quay lại';
      const list = document.getElementById('gift-list');
      list.innerHTML = '';
      gifts.forEach(g => {
        const item = document.createElement('div');
        item.className = 'gift-item';
        item.innerHTML = `<span class="gift-icon">${g.icon}</span><span>${g.label}</span>` +
          `<span class="gift-amount">${g.type === 'coins' ? `+${g.amount} xu` : `x${g.amount}`}</span>`;
        list.appendChild(item);
      });
    });
  };

  // --- HỘP THOẠI PHẦN THƯỞNG CHUNG (hộp quà ngày, mốc chuỗi) ---
  const showRewardModal = ({ title, subtitle, items }) => {
    showCelebration('reward-modal', () => {
      document.getElementById('reward-title').textContent = title;
      document.getElementById('reward-subtitle').textContent = subtitle || '';
      const list = document.getElementById('reward-list');
      list.innerHTML = '';
      items.forEach(it => {
        const item = document.createElement('div');
        item.className = 'gift-item';
        item.innerHTML = `<span class="gift-icon">${it.icon}</span><span></span><span class="gift-amount"></span>`;
        item.children[1].textContent = it.label;
        item.children[2].textContent = it.amount;
        list.appendChild(item);
      });
    });
  };

  // Xu bay từ nút nhận về ví (phản hồi khi nhận thưởng)
  const flyCoins = (fromEl, count = 5) => {
    const target = document.getElementById('pet-coins-badge');
    if (!fromEl || !target) return;
    const from = fromEl.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.className = 'flying-coin';
      coin.textContent = '🪙';
      coin.style.left = `${from.left + from.width / 2}px`;
      coin.style.top = `${from.top + from.height / 2}px`;
      document.body.appendChild(coin);
      setTimeout(() => {
        coin.style.transform = `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(0.6)`;
        coin.style.opacity = '0.2';
      }, 30 + i * 70);
      setTimeout(() => coin.remove(), 900 + i * 70);
    }
  };

  const formatCountdown = (ms) => {
    const minutes = Math.max(1, Math.ceil(ms / 60000));
    const hours = Math.floor(minutes / 60);
    return hours ? `${hours} giờ ${minutes % 60} phút` : `${minutes} phút`;
  };

  // --- BẢNG NHIỆM VỤ NGÀY ---
  // Chỉ dựng lại khi dữ liệu nhiệm vụ/chuỗi đổi, để nút không bị thay giữa lúc đang bấm
  let questsRenderKey = '';
  const renderQuests = (data) => {
    document.getElementById('quest-reset').textContent = `Làm mới sau ${formatCountdown(state.msUntilReset())}`;
    const streak = state.getStreakView();
    const key = JSON.stringify([data.quests, streak]);
    if (key === questsRenderKey) return;
    questsRenderKey = key;

    const streakEl = document.getElementById('quest-streak');
    streakEl.textContent = `🔥 ${streak.count}${streak.freezes ? ` ❄️${streak.freezes}` : ''}`;
    streakEl.classList.toggle('inactive', !streak.activeToday);
    streakEl.title = `Chuỗi ngày chăm mèo: ${streak.count} ngày (kỷ lục ${streak.best}). ` +
      (streak.activeToday ? 'Hôm nay đã giữ chuỗi ✓' : 'Nhận 1 nhiệm vụ hôm nay để giữ chuỗi') +
      `. Vé đóng băng ❄️: ${streak.freezes} (tự dùng khi lỡ một ngày)`;

    const quests = data.quests;
    const list = document.getElementById('daily-quests-list');
    list.innerHTML = '';
    quests.list.forEach((q, i) => {
      const li = document.createElement('li');
      li.className = `quest-item${q.done ? ' done' : ''}${q.claimed ? ' claimed' : ''}`;
      const percent = Math.round((q.current / q.target) * 100);
      let action = '';
      if (q.claimed) {
        action = '<span class="quest-claimed" title="Đã nhận">✓</span>';
      } else if (q.done) {
        action = `<button class="quest-btn" data-action="claim" data-index="${i}">Nhận</button>`;
      } else if (quests.rerolls > 0) {
        action = `<button class="quest-reroll" data-action="reroll" data-index="${i}" title="Đổi nhiệm vụ khác (còn ${quests.rerolls} lượt hôm nay)">🔄</button>`;
      }
      li.innerHTML = `
        <span class="quest-icon">${q.icon}</span>
        <div class="quest-body">
          <div class="quest-text"></div>
          <div class="quest-progress"><div class="quest-progress-fill" style="width: ${percent}%"></div></div>
          <div class="quest-meta">
            <span>${q.current}/${q.target}</span>
            <span class="quest-reward">🪙${q.coins} ⭐${q.exp}</span>
          </div>
        </div>
        ${action}
      `;
      li.querySelector('.quest-text').textContent = q.text;
      list.appendChild(li);
    });

    // Hộp quà ngày: tiến độ ●●○ và nút mở khi đã nhận đủ
    const claimedCount = quests.list.filter(q => q.claimed).length;
    const dots = quests.list.map(q => (q.claimed ? '●' : '○')).join('');
    // Tóm tắt khi bảng thu gọn; "!" nếu có nhiệm vụ đang chờ nhận
    const readyCount = quests.list.filter(q => q.done && !q.claimed).length;
    document.getElementById('quests-mini').textContent =
      `${claimedCount}/${quests.list.length}${readyCount || state.isDailyChestReady() ? ' 🎁' : ''}`;
    const chest = document.getElementById('quest-chest');
    if (quests.chestClaimed) {
      chest.innerHTML = '<span class="chest-label">🎁 Đã mở hộp quà hôm nay ✓</span>';
    } else if (state.isDailyChestReady()) {
      chest.innerHTML = '<button class="quest-chest-btn" data-action="chest">🎁 Mở hộp quà ngày</button>';
    } else {
      chest.innerHTML = `<span class="chest-label">🎁 Hộp quà ngày <span class="chest-dots">${dots}</span> ${claimedCount}/${quests.list.length}</span>`;
    }
  };

  document.getElementById('quests-card').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const index = Number(btn.dataset.index);

    if (btn.dataset.action === 'claim') {
      const result = state.claimQuest(index);
      if (!result) return;
      flyCoins(btn, 5);
      window.showToast(`🎉 Nhận <b>+${result.quest.coins} xu, +${result.quest.exp} EXP</b> từ "${result.quest.text}"`);
      const s = result.streak;
      if (s) {
        if (s.usedFreezes) window.showToast(`❄️ Đã dùng ${s.usedFreezes} vé đóng băng để giữ chuỗi!`);
        if (s.milestone) {
          showRewardModal({
            title: `🔥 Chuỗi ${s.count} ngày!`,
            subtitle: 'Cảm ơn sen đã chăm bé mèo đều đặn ~',
            items: [
              { icon: '🪙', label: 'Xu', amount: `+${s.milestone.coins}` },
              { icon: '⭐', label: 'EXP', amount: `+${s.milestone.exp}` }
            ]
          });
        } else {
          window.showToast(`🔥 Chuỗi chăm mèo: <b>${s.count} ngày</b>${s.freezeEarned ? ' · nhận 1 vé đóng băng ❄️' : ''}`);
        }
      }
      if (window.officeNetwork) {
        window.officeNetwork.broadcastAction('quest', `vừa hoàn thành nhiệm vụ "${result.quest.text}" 🎯`, '🎯', '#22c55e');
      }
    } else if (btn.dataset.action === 'reroll') {
      if (state.rerollQuest(index)) window.showToast('🔄 Đã đổi sang nhiệm vụ khác!');
    } else if (btn.dataset.action === 'chest') {
      const chest = state.claimDailyChest();
      if (!chest) return;
      flyCoins(btn, 8);
      showRewardModal({
        title: '🎁 Hộp quà ngày',
        subtitle: 'Xong hết nhiệm vụ hôm nay, giỏi quá sen ơi!',
        items: chest.rewards
      });
    }
  });

  // --- RENDER HUD UPDATES ---
  const updateHUD = (data) => {
    // 1. Profile & Level
    document.getElementById('pet-name-display').textContent = data.name;
    document.getElementById('pet-level-display').textContent = `Lv. ${data.level}`;
    document.getElementById('pet-exp-text').textContent = `${Math.floor(data.exp)}/${data.expToNext}`;
    const expPercent = Math.min(100, Math.max(0, (data.exp / data.expToNext) * 100));
    document.getElementById('pet-exp-fill').style.width = `${expPercent}%`;
    document.getElementById('pet-coins-display').textContent = `${data.coins} xu`;

    // 2. Vitals
    const v = data.vitals;
    document.getElementById('vital-hunger-fill').style.width = `${v.hunger}%`;
    document.getElementById('vital-hunger-val').textContent = `${Math.round(v.hunger)}/100`;

    document.getElementById('vital-happy-fill').style.width = `${v.happiness}%`;
    document.getElementById('vital-happy-val').textContent = `${Math.round(v.happiness)}/100`;

    document.getElementById('vital-health-fill').style.width = `${v.health}%`;
    document.getElementById('vital-health-val').textContent = `${Math.round(v.health)}/100`;

    document.getElementById('vital-energy-fill').style.width = `${v.energy}%`;
    document.getElementById('vital-energy-val').textContent = `${Math.round(v.energy)}/100`;
    // Dòng tóm tắt khi bảng chỉ số thu gọn
    document.getElementById('vitals-mini').textContent =
      `🍴${Math.round(v.hunger)} 😊${Math.round(v.happiness)} 💖${Math.round(v.health)} 🌙${Math.round(v.energy)}`;

    // 3. Daily Quests
    renderQuests(data);

    // 4. Current Action Card
    document.getElementById('action-card-title').textContent = data.currentAction.title;
    document.getElementById('action-card-subtitle').textContent = data.currentAction.desc;
    document.getElementById('action-card-progress').style.width = `${data.currentAction.progress}%`;

    // 5. Speech Bubble
    const bubble = document.getElementById('cat-speech-bubble');
    const bubbleText = document.getElementById('bubble-text-content');
    
    switch (state.behaviorState) {
      case 'PETTING':
        bubbleText.textContent = 'Purr... thích quá ~ ❤️';
        break;
      case 'SLEEPING':
        bubbleText.textContent = 'Khò khò... zZz... 💤';
        break;
      case 'YAWNING':
        bubbleText.textContent = 'Oaaa... sảng khoái ghê ~ 🥱';
        break;
      case 'LICKING_PAW':
        bubbleText.textContent = 'Chải chuốt bàn chân xinh 🐾';
        break;
      case 'ROLLING':
        bubbleText.textContent = 'Lăn lộn sướng cả người! ✨';
        break;
      case 'BEGGING':
        bubbleText.textContent = 'Meow~ Đói bụng quá sen ơi! 🐟';
        break;
      case 'EATING':
        bubbleText.textContent = 'Nhai măm măm ngon tuyệt! 😋';
        break;
      case 'ZOOMIES':
        bubbleText.textContent = 'Tia chớp 4 chân xuất kích!! ⚡💨';
        break;
      case 'PLAYING':
        bubbleText.textContent = 'Bắt lấy nè! Chụp trúng rồi! 🪶';
        break;
      case 'SULKING':
        bubbleText.textContent = 'Hừm... chẳng ai chơi với mèo cả 😿';
        break;
      case 'SLOW_BLINK':
        bubbleText.textContent = 'Nháy mắt... thương sen lắm đó 😌';
        break;
      case 'CURIOUS':
        bubbleText.textContent = 'Ơ? Cái gì kia ta? ❓';
        break;
      case 'SURPRISED':
        bubbleText.textContent = 'Ối giật cả mình! 🙀';
        break;
      case 'ANNOYED':
        bubbleText.textContent = 'Đủ rồi mà! Để mèo yên chút 💢';
        break;
      case 'KNEADING':
        bubbleText.textContent = 'Nhồi bột nhồi bột... rừ rừ 🍞';
        break;
      case 'BLEP':
        bubbleText.textContent = 'Blep 😛';
        break;
      case 'GREETING':
        bubbleText.textContent = 'Mrrr~ Sen về rồi! 💛';
        break;
      case 'GROOMING':
        bubbleText.textContent = 'Rửa mặt cho thơm tho nè 🧼';
        break;
      case 'SICK':
        bubbleText.textContent = 'Meo... mèo thấy không khoẻ 🤒';
        break;
      case 'EXHAUSTED':
        bubbleText.textContent = 'Buồn ngủ quá... không chơi nổi nữa 😪';
        break;
      case 'STARVING':
        bubbleText.textContent = 'Meo... đói lả cả người rồi 😿';
        break;
      case 'FULL':
        bubbleText.textContent = 'No căng bụng rồi, ăn thêm không nổi 😋';
        break;
      case 'HISS':
        bubbleText.textContent = 'Khèèè! 😾';
        break;
      case 'WALKING':
        bubbleText.textContent = 'Đi dạo một vòng nè ~ 🐾';
        break;
      default:
        if (v.hunger < 35) {
          bubbleText.textContent = 'Bụng đang réo meo meo nè...';
        } else if (v.energy < 25) {
          bubbleText.textContent = 'Mắt díp lại rồi... buồn ngủ quá...';
        } else {
          bubbleText.textContent = 'Good work! Meow meow ~ ❤️';
        }
        break;
    }

    // 6. Refresh bottom inventory slots
    renderInventorySlots();
  };

  // --- RENDER INVENTORY SLOTS BASED ON TAB ---
  const renderInventorySlots = () => {
    const row = document.getElementById('inventory-slots-row');
    row.innerHTML = '';
    const d = state.data;

    if (activeTab === 'food') {
      const foods = [
        { id: 'kibble', name: 'Thức ăn hạt', icon: '🥣', count: d.inventory.kibble || 0 },
        { id: 'salmon', name: 'Cá hồi', icon: '🍣', count: d.inventory.salmon || 0 },
        { id: 'milk', name: 'Sữa tươi', icon: '🥛', count: d.inventory.milk || 0 },
        { id: 'pate', name: 'Pate lon', icon: '🥫', count: d.inventory.pate || 0 },
        { id: 'dried_fish', name: 'Cá khô', icon: '🐟', count: d.inventory.dried_fish || 0 },
        { id: 'catnip_snack', name: 'Cỏ mèo', icon: '🌿', count: d.inventory.catnip_snack || 0 }
      ];

      foods.forEach(f => {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot ui-interactive food-draggable';
        slot.title = 'Kéo thả vào bé mèo để cho ăn';
        slot.innerHTML = `
          <div class="slot-badge">x${f.count}</div>
          <div class="slot-icon">${f.icon}</div>
          <div class="slot-name">${f.name}</div>
        `;
        // Cho ăn bằng kéo thả: nhấn giữ món ăn rồi thả vào mèo
        slot.addEventListener('pointerdown', (e) => {
          if (f.count <= 0) {
            window.showToast(`⚠️ Hết ${f.name} rồi! Bấm "Mua thêm" bên cạnh nhé.`);
            return;
          }
          e.preventDefault();
          beginFoodDrag(f, e);
        });
        row.appendChild(slot);
      });

      // Buy more button
      const buyMore = document.createElement('div');
      buyMore.className = 'inventory-slot slot-buy-more ui-interactive';
      buyMore.innerHTML = `
        <div class="slot-icon">➕</div>
        <div class="slot-name">Mua thêm</div>
      `;
      buyMore.addEventListener('click', () => openModal('shop-modal'));
      row.appendChild(buyMore);

    } else if (activeTab === 'toy') {
      const toys = [
        { id: 'yarn_ball', name: 'Bóng len', icon: '🧶', desc: 'Ném bóng len tưng tưng' },
        { id: 'feather_wand', name: 'Cần câu lông', icon: '🪶', desc: 'Vung vẩy lông vũ chọc mèo' },
        { id: 'laser_pointer', name: 'Đèn Laser', icon: '🔴', desc: 'Chiếu chấm đỏ săn mồi' },
        { id: 'windup_mouse', name: 'Chuột cót', icon: '🐁', desc: 'Chuột chạy vòng quanh' },
        { id: 'catnip_fish', name: 'Cá bông Catnip', icon: '🎏', desc: 'Cá nhồi cỏ mèo thơm lừng' }
      ];

      toys.forEach(t => {
        const isOwned = d.ownedToys.includes(t.id);
        const isActive = d.activeToy === t.id;
        const slot = document.createElement('div');
        slot.className = `inventory-slot ui-interactive ${isActive ? 'active-item' : ''}`;
        slot.innerHTML = `
          <div class="slot-badge">${isOwned ? (isActive ? 'ĐANG CHƠI' : 'SẴN SÀNG') : 'KHÓA'}</div>
          <div class="slot-icon">${t.icon}</div>
          <div class="slot-name">${t.name}</div>
        `;
        slot.addEventListener('click', () => {
          if (isOwned) {
            if (isActive) {
              state.stopPlaying();
              window.showToast(`Đã cất ${t.name}!`);
              if (window.officeNetwork) {
                window.officeNetwork.broadcastAction('toy', `vừa cất đồ chơi ${t.name}`, '📦', '#64748b');
              }
            } else if (state.playWithToy(t.id)) {
              window.showToast(`🎮 Đang chơi <b>${t.name}</b> cùng mèo!`);
              if (window.officeNetwork) {
                window.officeNetwork.broadcastAction('toy', `vừa chơi ${t.name} (${t.icon}) cùng mèo!`, t.icon, '#06b6d4');
              }
            } else {
              window.showToast('😪 Mèo kiệt sức rồi, cho bé ngủ một giấc đã nhé!');
            }
          } else {
            window.showToast(`🔒 Bạn chưa có ${t.name}! Hãy vào Shop để mua nhé.`);
            openModal('shop-modal');
          }
        });
        row.appendChild(slot);
      });

    } else if (activeTab === 'outfit') {
      const items = [
        { type: 'hat', id: 'party_hat', name: 'Mũ Sinh Nhật', icon: '🎉' },
        { type: 'hat', id: 'chef_hat', name: 'Mũ Đầu Bếp', icon: '👨‍🍳' },
        { type: 'hat', id: 'wizard_hat', name: 'Mũ Phù Thủy', icon: '🧙' },
        { type: 'glasses', id: 'sunglasses', name: 'Kính Râm Ngầu', icon: '🕶️' },
        { type: 'glasses', id: 'round_glasses', name: 'Kính Thư Sinh', icon: '👓' },
        { type: 'accessory', id: 'red_bowtie', name: 'Nơ Cổ Đỏ', icon: '🎀' },
        { type: 'accessory', id: 'gold_bell', name: 'Chuông Vàng', icon: '🔔' },
        { type: 'fur', id: 'calico', name: 'Tam Thể', icon: '🐱' },
        { type: 'fur', id: 'tuxedo', name: 'Tuxedo', icon: '🤵' },
        { type: 'fur', id: 'black_cat', name: 'Mèo Đen', icon: '🐈‍⬛' },
        { type: 'fur', id: 'siamese', name: 'Mèo Xiêm', icon: '😻' }
      ];

      items.forEach(it => {
        const isOwned = d.ownedCostumes.includes(it.id);
        const isEquipped = d.customization[it.type] === it.id;
        const slot = document.createElement('div');
        slot.className = `inventory-slot ui-interactive ${isEquipped ? 'active-item' : ''}`;
        slot.innerHTML = `
          <div class="slot-badge">${isEquipped ? 'ĐANG MẶC' : (isOwned ? 'CÓ SẴN' : 'KHÓA')}</div>
          <div class="slot-icon">${it.icon}</div>
          <div class="slot-name">${it.name}</div>
        `;
        slot.addEventListener('click', () => {
          if (isOwned) {
            if (isEquipped) {
              state.equipCostume(it.type, it.type === 'fur' ? 'orange_tabby' : 'none');
              window.showToast(`Đã tháo ${it.name}!`);
              if (window.officeNetwork) {
                window.officeNetwork.broadcastAction('outfit', `vừa tháo phụ kiện ${it.name}`, '👚', '#a855f7');
              }
            } else {
              state.equipCostume(it.type, it.id);
              window.showToast(`✨ Đã diện <b>${it.name}</b> cho mèo!`);
              if (window.officeNetwork) {
                window.officeNetwork.broadcastAction('outfit', `vừa diện ${it.name} (${it.icon}) cho mèo!`, it.icon, '#a855f7');
              }
            }
          } else {
            window.showToast(`🔒 Hãy mua ${it.name} trong Cửa Hàng!`);
            openModal('shop-modal');
          }
        });
        row.appendChild(slot);
      });

    } else if (activeTab === 'decor') {
      const decors = [
        { id: 'cozy_day', name: 'Nắng Ban Mai', icon: '☀️' },
        { id: 'warm_sunset', name: 'Hoàng Hôn Ấm', icon: '🌇' },
        { id: 'starry_night', name: 'Đêm Trăng Sao', icon: '🌙' }
      ];

      decors.forEach(dec => {
        const isCurrent = d.customization.roomTheme === dec.id;
        const slot = document.createElement('div');
        slot.className = `inventory-slot ui-interactive ${isCurrent ? 'active-item' : ''}`;
        slot.innerHTML = `
          <div class="slot-badge">${isCurrent ? 'HIỆN TẠI' : 'CHỌN'}</div>
          <div class="slot-icon">${dec.icon}</div>
          <div class="slot-name">${dec.name}</div>
        `;
        slot.addEventListener('click', () => {
          d.customization.roomTheme = dec.id;
          applyRoomTheme(dec.id);
          if (!isCurrent) state.trackQuest('room');
          state.notify();
          window.showToast(`🌅 Đã đổi không gian phòng sang: <b>${dec.name}</b>!`);
          if (window.officeNetwork) {
            window.officeNetwork.broadcastAction('room', `vừa đổi không gian phòng sang ${dec.name} (${dec.icon})`, dec.icon, '#ec4899');
          }
        });
        row.appendChild(slot);
      });

    } else if (activeTab === 'special') {
      const specials = [
        { id: 'catnip_snack', name: 'Bột Cỏ Mèo', icon: '🌿', count: d.inventory.catnip_snack || 0 },
        { id: 'super_tonic', name: 'Nước Tăng Lực', icon: '🧪', count: 1 }
      ];

      specials.forEach(sp => {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot ui-interactive';
        slot.innerHTML = `
          <div class="slot-badge">x${sp.count}</div>
          <div class="slot-icon">${sp.icon}</div>
          <div class="slot-name">${sp.name}</div>
        `;
        slot.addEventListener('click', () => {
          if (sp.id === 'catnip_snack' && (d.inventory.catnip_snack || 0) > 0) {
            d.inventory.catnip_snack--;
            state.setBehavior('ZOOMIES', 5.5);
            window.showToast('🚀 Mèo ăn cỏ mèo hưng phấn nổi cơn Zoomies phóng cuồng loạn!');
            state.notify();
            if (window.officeNetwork) {
              window.officeNetwork.broadcastAction('special', 'vừa cho mèo ăn Cỏ Mèo phóng Zoomies cuồng loạn! 🚀', '🌿', '#10b981');
            }
          } else if (sp.id === 'super_tonic') {
            d.vitals.energy = 100;
            d.vitals.happiness = 100;
            d.vitals.health = 100;
            window.showToast('💖 Đã hồi phục đầy đủ toàn bộ chỉ số cho bé mèo!');
            state.notify();
            if (window.officeNetwork) {
              window.officeNetwork.broadcastAction('special', 'vừa dùng Nước Tăng Lực hồi 100% sinh lực cho mèo! 🧪', '🧪', '#3b82f6');
            }
          }
        });
        row.appendChild(slot);
      });
    }
  };

  const applyRoomTheme = (theme) => {
    const container = document.getElementById('game-container');
    container.classList.remove('sunset-mode', 'night-mode');
    if (theme === 'warm_sunset') {
      container.classList.add('sunset-mode');
    } else if (theme === 'starry_night') {
      container.classList.add('night-mode');
    }
  };

  // --- THU GỌN CÁC BẢNG UI ---
  // Mỗi bảng có data-collapsible và nút data-toggle-panel; trạng thái lưu theo trình duyệt
  const UI_COLLAPSE_KEY = 'meow_ui_collapsed';
  let collapsedPanels = null;
  try {
    collapsedPanels = JSON.parse(localStorage.getItem(UI_COLLAPSE_KEY));
  } catch (e) {
    collapsedPanels = null;
  }
  // Chưa chọn gì: màn thấp thì thu bảng chỉ số về một dòng để bảng nhiệm vụ không chạm túi đồ
  if (!collapsedPanels) collapsedPanels = window.innerHeight < 900 ? { vitals: true } : {};

  const applyCollapsed = () => {
    const all = [...document.querySelectorAll('[data-collapsible]')];
    all.forEach(el => {
      const id = el.dataset.collapsible;
      const collapsed = !!collapsedPanels[id];
      el.classList.toggle('is-collapsed', collapsed);
      const btn = el.querySelector(`[data-toggle-panel="${id}"]`);
      if (btn) {
        btn.textContent = collapsed ? '+' : '–';
        btn.title = collapsed ? 'Mở rộng' : 'Thu gọn';
        btn.setAttribute('aria-expanded', String(!collapsed));
      }
    });
    const allCollapsed = all.every(el => collapsedPanels[el.dataset.collapsible]);
    document.getElementById('nav-collapse-icon').textContent = allCollapsed ? '👀' : '🙈';
    document.getElementById('nav-collapse-label').textContent = allCollapsed ? 'Mở rộng' : 'Thu gọn';
  };

  const setCollapsed = (changes) => {
    Object.assign(collapsedPanels, changes);
    try {
      localStorage.setItem(UI_COLLAPSE_KEY, JSON.stringify(collapsedPanels));
    } catch (e) {
      // Không lưu được (chế độ riêng tư...) thì chỉ áp dụng cho phiên này
    }
    applyCollapsed();
  };

  // Còn bảng nào đang mở thì thu gọn hết, ngược lại mở hết
  const toggleAllPanels = () => {
    const ids = [...document.querySelectorAll('[data-collapsible]')].map(el => el.dataset.collapsible);
    const collapse = ids.some(id => !collapsedPanels[id]);
    setCollapsed(Object.fromEntries(ids.map(id => [id, collapse])));
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle-panel]');
    if (!btn) return;
    const id = btn.dataset.togglePanel;
    setCollapsed({ [id]: !collapsedPanels[id] });
  });
  document.getElementById('btn-nav-collapse').addEventListener('click', toggleAllPanels);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'h' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    toggleAllPanels();
  });
  applyCollapsed();

  // --- DOCK TAB SWITCHING ---
  document.querySelectorAll('.tab-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.getAttribute('data-tab');
      renderInventorySlots();
      // Bấm một tab khi túi đồ đang thu gọn thì mở ra luôn
      if (collapsedPanels.dock) setCollapsed({ dock: false });
    });
  });

  // --- KÉO THẢ ĐỒ ĂN VÀO MÈO ---
  // Món ăn bay theo con trỏ (phần tử HTML nằm trên mọi lớp UI); renderer cho mèo phản ứng
  // và báo con trỏ có đang ở trên mèo không. Nhấn rồi nhả tại chỗ chỉ hiện hướng dẫn.
  let foodDrag = null; // { food, ghost, startX, startY, moved }

  function beginFoodDrag(food, e) {
    if (foodDrag) foodDrag.ghost.remove(); // lần kéo trước chưa kết thúc (thiếu pointerup)
    const ghost = document.createElement('div');
    ghost.className = 'food-drag-ghost';
    ghost.textContent = food.icon;
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    document.body.appendChild(ghost);
    foodDrag = { food, ghost, startX: e.clientX, startY: e.clientY, moved: false };
  }

  function finishFoodDrag(e, cancelled) {
    if (!foodDrag) return;
    const { food, moved } = foodDrag;
    foodDrag = null;
    document.querySelectorAll('.food-drag-ghost').forEach(g => g.remove());
    if (!cancelled && moved) renderer.setFoodDrag(food.id, e.clientX, e.clientY);
    const dropped = renderer.endFoodDrag() && !cancelled && moved;

    if (dropped && state.isFull()) {
      // No căng: mèo từ chối, món ăn không bị trừ
      state.feed(food.id);
      window.showToast('😋 Bé no căng bụng rồi, để lát nữa hẵng ăn nhé!');
    } else if (dropped) {
      renderer.dropFood(food.id);
      state.feed(food.id);
      window.showToast(`🐾 Cho bé mèo ăn <b>${food.name}</b>!`);
      if (window.officeNetwork) {
        window.officeNetwork.broadcastAction('feed', `vừa cho mèo ăn ${food.name} (${food.icon})`, food.icon, '#f59e0b');
      }
    } else if (!moved) {
      window.showToast(`🐾 Kéo <b>${food.name}</b> thả vào bé mèo để cho ăn nhé!`);
    } else if (!cancelled) {
      window.showToast('🙀 Thả trúng bé mèo mới ăn được nha ~');
    }
  }

  window.addEventListener('pointermove', (e) => {
    if (!foodDrag) return;
    foodDrag.ghost.style.left = `${e.clientX}px`;
    foodDrag.ghost.style.top = `${e.clientY}px`;
    if (Math.hypot(e.clientX - foodDrag.startX, e.clientY - foodDrag.startY) > 6) foodDrag.moved = true;
    if (foodDrag.moved) renderer.setFoodDrag(foodDrag.food.id, e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', (e) => finishFoodDrag(e, false));
  window.addEventListener('pointercancel', (e) => finishFoodDrag(e, true));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') finishFoodDrag(e, true);
  });

  // --- QUICK RIGHT ACTION BUTTONS ---

  document.getElementById('btn-quick-pet').addEventListener('click', () => {
    renderer.triggerPetFeedback(true);
    window.showToast('💖 Đang vuốt ve xoa đầu bé mèo ~ Purr...');
  });

  document.getElementById('btn-quick-play').addEventListener('click', () => {
    // Switch to toy tab and activate feather wand
    document.querySelector('.tab-pill[data-tab="toy"]').click();
    if (!state.playWithToy('feather_wand')) {
      window.showToast('😪 Mèo kiệt sức rồi, cho bé ngủ một giấc đã nhé!');
      return;
    }
    window.showToast('🪶 Rê chuột để vung vẩy cần câu lông vũ cho mèo vồ!');
    if (window.officeNetwork) {
      window.officeNetwork.broadcastAction('toy', 'vừa vung vẩy Cần câu lông vũ cho mèo vồ! 🪶', '🪶', '#06b6d4');
    }
  });

  document.getElementById('btn-quick-sleep').addEventListener('click', () => {
    state.toggleSleep();
    if (state.behaviorState === 'SLEEPING') {
      window.showToast('💤 Bé mèo đang chìm vào giấc ngủ êm ái...');
      if (window.officeNetwork) {
        window.officeNetwork.broadcastAction('sleep', 'vừa ru Bé Mập chìm vào giấc ngủ êm ái 💤', '💤', '#6366f1');
      }
    } else {
      window.showToast('☀️ Bé mèo đã thức giấc và vươn vai!');
      if (window.officeNetwork) {
        window.officeNetwork.broadcastAction('sleep', 'vừa đánh thức Bé Mập dậy vui chơi ☀️', '☀️', '#f59e0b');
      }
    }
  });

  document.getElementById('btn-quick-roll').addEventListener('click', () => {
    state.setBehavior('ROLLING', 5);
    window.showToast('🐾 Bé mèo lăn ngửa bụng khoe đệm chân hồng!');
    if (window.catAudio) window.catAudio.meow('happy');
    if (window.officeNetwork) {
      window.officeNetwork.broadcastAction('roll', 'vừa cù bụng cho mèo lăn lộn khoe đệm chân hồng! 🐾', '🐾', '#ec4899');
    }
  });

  document.getElementById('btn-quick-stretch').addEventListener('click', () => {
    state.setBehavior('YAWNING', 4);
    window.showToast('🥱 Bé mèo ngáp dài và vươn vai sảng khoái ~');
    if (window.catAudio) window.catAudio.yawn();
    if (window.officeNetwork) {
      window.officeNetwork.broadcastAction('stretch', 'vừa vuốt lưng cho mèo ngáp dài vươn vai 🥱', '🥱', '#f59e0b');
    }
  });

  document.getElementById('btn-quick-blink').addEventListener('click', () => {
    if (state.slowBlinkAtCat()) {
      window.showToast('😌 Bạn nháy mắt chậm, bé mèo nháy lại: "mình tin bạn"!');
      if (window.officeNetwork) {
        window.officeNetwork.broadcastAction('blink', 'vừa nháy mắt chậm với mèo, mèo nháy lại đầy tin tưởng 😌', '😌', '#f472b6');
      }
    } else if (state.behaviorState === 'SLEEPING') {
      window.showToast('💤 Mèo đang ngủ, không thấy bạn nháy mắt đâu ~');
    } else {
      window.showToast('👀 Mèo vẫn đang nhìn bạn... chờ chút rồi nháy lại nhé!');
    }
  });

  // --- TOP RIGHT NAVIGATION MODALS ---
  document.getElementById('btn-nav-room').addEventListener('click', () => {
    document.querySelector('.tab-pill[data-tab="decor"]').click();
    window.showToast('🏠 Tùy chỉnh ánh sáng và không gian phòng ở thanh bên dưới!');
  });

  document.getElementById('btn-nav-costume').addEventListener('click', () => {
    document.querySelector('.tab-pill[data-tab="outfit"]').click();
    openModal('wardrobe-modal');
  });

  document.getElementById('btn-nav-collection').addEventListener('click', () => {
    openModal('collection-modal');
  });

  document.getElementById('btn-nav-settings').addEventListener('click', () => {
    openModal('settings-modal');
  });

  // Rename pet button
  document.getElementById('btn-edit-pet-name').addEventListener('click', () => {
    const current = state.data.name;
    const newName = prompt('Nhập tên mới cho bé mèo cưng của bạn:', current);
    if (newName && newName.trim()) {
      state.renamePet(newName.trim());
      window.showToast(`🐱 Tên mới của bé là: <b>${newName.trim()}</b>!`);
      if (window.officeNetwork) {
        window.officeNetwork.broadcastAction('rename', `vừa đặt lại tên cho mèo là "${newName.trim()}"! 🏷️`, '🏷️', '#10b981');
      }
    }
  });

  // Coins badge quick shop
  document.getElementById('pet-coins-badge').addEventListener('click', () => {
    openModal('shop-modal');
  });

  // --- MODAL CONTROLS ---
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('open');
      if (id === 'shop-modal') renderShopItems();
      if (id === 'collection-modal') renderCollectionData();
      if (id === 'wardrobe-modal') renderWardrobeGrid();
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    // Hiện hộp thoại chúc mừng đang chờ (nếu có)
    if (CELEBRATION_MODALS.includes(modal.id) && celebrationQueue.length) {
      const next = celebrationQueue.shift();
      setTimeout(() => showCelebration(next.id, next.setup), 250);
    }
  }

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      closeModal(e.target.closest('.modal-backdrop'));
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      // The gift modal only closes through "Nhận quà", so gifts are never skipped by accident.
      if (e.target === modal && modal.id !== 'gift-modal') closeModal(modal);
    });
  });

  // --- SHOP MODAL RENDERING ---
  function renderShopItems() {
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = '';
    const d = state.data;

    const catalog = [
      { cat: 'food', id: 'salmon', name: 'Cá Hồi Thượng Hạng', icon: '🍣', price: 40, desc: '+45 No, +35 Vui vẻ' },
      { cat: 'food', id: 'milk', name: 'Bình Sữa Bổ Dưỡng', icon: '🥛', price: 20, desc: '+15 No, +20 Sức khoẻ' },
      { cat: 'food', id: 'pate', name: 'Pate Béo Ngậy', icon: '🥫', price: 30, desc: '+35 No, +25 Vui vẻ' },
      { cat: 'food', id: 'dried_fish', name: 'Cá Khô Giòn Rụm', icon: '🐟', price: 15, desc: '+15 No, +20 Vui vẻ' },
      { cat: 'food', id: 'catnip_snack', name: 'Snack Cỏ Mèo', icon: '🌿', price: 50, desc: '+45 Vui vẻ, Zoomies ⚡' },
      
      { cat: 'toy', id: 'windup_mouse', name: 'Chuột Dây Cót', icon: '🐁', price: 80, desc: 'Đồ chơi chạy tự động' },
      { cat: 'toy', id: 'catnip_fish', name: 'Cá Bông Catnip', icon: '🎏', price: 70, desc: 'Mèo ôm ấp lăn lộn' },
      
      { cat: 'costume', id: 'chef_hat', name: 'Mũ Đầu Bếp', icon: '👨‍🍳', price: 120, desc: 'Mũ siêu đầu bếp mèo' },
      { cat: 'costume', id: 'wizard_hat', name: 'Mũ Phù Thủy', icon: '🧙', price: 150, desc: 'Mũ phép thuật bí ẩn' },
      { cat: 'costume', id: 'round_glasses', name: 'Kính Thư Sinh', icon: '👓', price: 85, desc: 'Kính tròn tri thức' },
      { cat: 'costume', id: 'gold_bell', name: 'Chuông Vàng', icon: '🔔', price: 110, desc: 'Vòng cổ chuông leng keng' },
      { cat: 'costume', id: 'calico', name: 'Lông Tam Thể', icon: '🐱', price: 200, desc: 'Màu lông tam thể may mắn' },
      { cat: 'costume', id: 'tuxedo', name: 'Lông Tuxedo', icon: '🤵', price: 220, desc: 'Màu lông quý tộc sang chảnh' },
      { cat: 'costume', id: 'black_cat', name: 'Mèo Đen Hoàng Gia', icon: '🐈‍⬛', price: 180, desc: 'Hắc miêu mắt vàng huyền bí' },
      { cat: 'costume', id: 'siamese', name: 'Công Chúa Xiêm', icon: '😻', price: 250, desc: 'Bộ lông mắt xanh quý phái' }
    ];

    catalog.forEach(item => {
      const card = document.createElement('div');
      card.className = 'shop-item-card';

      let isPurchased = false;
      if (item.cat === 'toy') isPurchased = d.ownedToys.includes(item.id);
      if (item.cat === 'costume') isPurchased = d.ownedCostumes.includes(item.id);

      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}</div>
        <div style="font-size: 10px; color: #94a3b8;">${item.desc}</div>
        <div class="shop-item-price">🪙 ${item.price} xu</div>
        <button class="btn-buy ${isPurchased ? 'equipped' : ''}">
          ${isPurchased ? 'Đã sở hữu' : 'Mua ngay'}
        </button>
      `;

      const btn = card.querySelector('.btn-buy');
      if (!isPurchased) {
        btn.addEventListener('click', () => {
          if (state.buyItem(item.cat, item.id, item.price)) {
            renderShopItems();
          }
        });
      }

      grid.appendChild(card);
    });
  }

  // --- WARDROBE MODAL RENDERING ---
  function renderWardrobeGrid() {
    const grid = document.getElementById('wardrobe-items-grid');
    grid.innerHTML = '';
    const d = state.data;

    const wardrobeList = [
      { type: 'hat', id: 'party_hat', name: 'Mũ Sinh Nhật', icon: '🎉' },
      { type: 'hat', id: 'chef_hat', name: 'Mũ Đầu Bếp', icon: '👨‍🍳' },
      { type: 'hat', id: 'wizard_hat', name: 'Mũ Phù Thủy', icon: '🧙' },
      { type: 'glasses', id: 'sunglasses', name: 'Kính Râm Thug', icon: '🕶️' },
      { type: 'glasses', id: 'round_glasses', name: 'Kính Tròn Thư Sinh', icon: '👓' },
      { type: 'accessory', id: 'red_bowtie', name: 'Nơ Cổ Đỏ', icon: '🎀' },
      { type: 'accessory', id: 'gold_bell', name: 'Chuông Vàng', icon: '🔔' },
      { type: 'fur', id: 'orange_tabby', name: 'Bé Mập Cam (Gốc)', icon: '🐱' },
      { type: 'fur', id: 'calico', name: 'Tam Thể May Mắn', icon: '🐱' },
      { type: 'fur', id: 'tuxedo', name: 'Quý Tộc Tuxedo', icon: '🤵' },
      { type: 'fur', id: 'black_cat', name: 'Mèo Đen Hoàng Gia', icon: '🐈‍⬛' },
      { type: 'fur', id: 'siamese', name: 'Công Chúa Xiêm', icon: '😻' }
    ];

    wardrobeList.forEach(w => {
      const isOwned = d.ownedCostumes.includes(w.id);
      const isEquipped = d.customization[w.type] === w.id;
      const card = document.createElement('div');
      card.className = 'shop-item-card';

      card.innerHTML = `
        <div class="shop-item-icon">${w.icon}</div>
        <div class="shop-item-name">${w.name}</div>
        <div style="font-size: 11px; color: ${isEquipped ? '#10b981' : (isOwned ? '#38bdf8' : '#ef4444')}; font-weight: 800;">
          ${isEquipped ? '✓ ĐANG MẶC' : (isOwned ? 'ĐÃ MỞ KHÓA' : 'CHƯA MỞ')}
        </div>
        <button class="btn-buy ${isEquipped ? 'equipped' : ''}">
          ${!isOwned ? 'Cần mở khóa' : (isEquipped ? 'Tháo ra' : 'Mặc ngay')}
        </button>
      `;

      card.querySelector('.btn-buy').addEventListener('click', () => {
        if (!isOwned) {
          window.showToast(`🔒 Hãy mua ${w.name} trong Cửa Hàng!`);
          openModal('shop-modal');
        } else {
          if (isEquipped) {
            state.equipCostume(w.type, w.type === 'fur' ? 'orange_tabby' : 'none');
          } else {
            state.equipCostume(w.type, w.id);
          }
          renderWardrobeGrid();
        }
      });

      grid.appendChild(card);
    });
  }

  // --- COLLECTION MODAL RENDERING ---
  function renderCollectionData() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';
    const ach = state.data.collection.achievements;

    Object.keys(ach).forEach(k => {
      const a = ach[k];
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'space-between';
      div.style.background = 'rgba(15, 23, 42, 0.5)';
      div.style.padding = '12px 16px';
      div.style.borderRadius = '14px';
      div.style.border = `1.5px solid ${a.unlocked ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'}`;

      div.innerHTML = `
        <div>
          <div style="font-weight: 800; font-size: 14px; color: ${a.unlocked ? '#fde047' : '#94a3b8'};">
            ${a.unlocked ? '🏆' : '🔒'} ${a.name}
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">${a.desc}</div>
        </div>
        <div style="font-size: 12px; font-weight: 800; color: ${a.unlocked ? '#10b981' : '#64748b'};">
          ${a.unlocked ? 'ĐÃ ĐẠT' : 'CHƯA ĐẠT'}
        </div>
      `;
      list.appendChild(div);
    });
  }

  // --- SETTINGS MODAL ---
  document.getElementById('btn-toggle-bgm').addEventListener('click', () => {
    const isPlaying = audio.toggleBGM();
    document.getElementById('bgm-status-text').textContent = isPlaying ? 'Bật (Đang phát)' : 'Tắt';
  });

  document.getElementById('btn-toggle-sfx').addEventListener('click', () => {
    const isMuted = audio.toggleMute();
    document.getElementById('sfx-status-text').textContent = isMuted ? 'Tắt tiếng' : 'Bật';
  });

  document.getElementById('btn-reset-game').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại dữ liệu nuôi mèo không?')) {
      state.resetData();
    }
  });

  // Bind game state change listener
  state.onChange(updateHUD);

  // Initial Theme & HUD render
  applyRoomTheme(state.data.customization.roomTheme);
  updateHUD(state.data);

  // --- OFFLINE PROGRESS ---
  const resumeFromAway = () => {
    const result = state.applyOfflineProgress();
    showGiftModal(result ? result.awaySeconds : null);
    checkNewDay();
  };

  // Qua 0:00 thì có nhiệm vụ mới (kiểm tra định kỳ và khi quay lại tab)
  function checkNewDay() {
    if (state.ensureToday()) {
      state.notify();
      window.showToast('☀️ Ngày mới rồi! Bé mèo có <b>nhiệm vụ mới</b> cho sen đó');
    }
  }

  document.getElementById('btn-claim-gifts').addEventListener('click', () => {
    const claimed = state.claimGifts();
    closeModal(document.getElementById('gift-modal'));
    if (claimed) {
      window.showToast(`🎁 Đã nhận ${claimed.count} món quà${claimed.coins ? `, +${claimed.coins} xu` : ''}!`);
    }
  });

  // Leaving the tab starts an away period; coming back applies it.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      state.markAway();
    } else {
      resumeFromAway();
    }
  });
  window.addEventListener('pagehide', () => state.markAway());
  // Keep lastSeen fresh while the tab is open so a crash does not look like a long absence.
  setInterval(() => {
    if (document.visibilityState === 'visible') state.save();
    checkNewDay();
    renderQuests(state.data); // cập nhật đồng hồ "Làm mới sau"
  }, 15000);

  resumeFromAway();

  // --- MAIN ANIMATION & VITALS LOOP ---
  let lastFrameTime = performance.now();

  const gameLoop = (now) => {
    const delta = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    // Update vitals & AI
    state.updateVitals(delta);

    // Update & Render Cat & Canvas
    renderer.update(delta);
    renderer.render();

    requestAnimationFrame(gameLoop);
  };

  requestAnimationFrame(gameLoop);
});
