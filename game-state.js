/**
 * Meow 2D - Game State, Autonomous AI & Progression System
 */

// Offline progress tuning. Vitals while away decay slower than online and stop
// at floors (hunger floor stays above the starvation penalty threshold of 25).
const OFFLINE_CONFIG = {
  MIN_AWAY_SECONDS: 120,        // shorter absences are ignored
  MAX_AWAY_SECONDS: 8 * 3600,   // time beyond this is not counted
  HUNGER_PER_SEC: 0.006,        // ~22 pts/hour
  MAX_HUNGER_DROP: 50,
  HUNGER_FLOOR: 25,
  HAPPY_PER_SEC: 0.002,         // ~7 pts/hour
  MAX_HAPPY_DROP: 20,
  HAPPY_FLOOR: 40,
  ENERGY_GAIN_PER_SEC: 0.01,    // the cat naps while you are away
  MAX_ENERGY_GAIN: 50,
  GIFT_INTERVAL_SECONDS: 1800,  // one gift per 30 min away
  MAX_GIFTS: 6
};

// Vuốt liên tục quá lâu làm mèo bị kích thích quá mức và cáu (petting-induced aggression)
const PET_OVERLOAD = {
  WINDOW_MS: 10000,   // cửa sổ đếm
  MAX_PETS: 32,       // số lần vuốt trong cửa sổ thì cáu (~8-9 giây rê chuột liên tục)
  ANNOYED_SECONDS: 3.5
};

// Người chơi nháy mắt chậm với mèo: hồi chiêu để không spam lấy EXP
const SLOW_BLINK_COOLDOWN_MS = 8000;

// Ngưỡng biểu cảm theo chỉ số (docs/CAT_ANIMATION.md, nhóm P1)
const VITAL_MOODS = {
  SICK_HEALTH: 30,       // sức khoẻ dưới mức này thì thỉnh thoảng ốm
  STARVING_HUNGER: 10,   // đói dưới mức này thì đói lả (thay cho xin ăn)
  EXHAUSTED_ENERGY: 15,  // năng lượng dưới mức này thì từ chối chơi, gật gù
  FULL_HUNGER: 95,       // từ mức này mèo từ chối ăn thêm; ăn lên tới mức này thì no căng
  HISS_AFTER_PETS: 6     // vẫn bị vuốt ngần này lần trong lúc cáu thì rít (~1.5 giây rê chuột)
};

// Trạng thái AI tự trị không được ngắt giữa chừng
const UNINTERRUPTIBLE_STATES = ['PETTING', 'PLAYING', 'EATING', 'ANNOYED', 'HISS', 'SURPRISED', 'GREETING', 'FULL'];

const GIFT_FOODS = {
  kibble: 'Thức ăn hạt',
  dried_fish: 'Cá khô giòn',
  milk: 'Sữa tươi',
  pate: 'Pate thơm ngon',
  salmon: 'Cá hồi',
  catnip_snack: 'Snack Cỏ Mèo'
};

class CatGameState {
  constructor() {
    this.STORAGE_KEY = 'meow_2d_save_data_v1';
    this.awayFrom = null; // timestamp (ms) the player left, consumed by applyOfflineProgress()

    // Default initial data
    this.data = {
      name: 'Bé Mập',
      level: 3,
      exp: 80,
      expToNext: 100,
      coins: 280,
      vitals: {
        hunger: 70,      // 0-100 (Fork/spoon)
        happiness: 85,   // 0-100 (Smiley)
        health: 90,      // 0-100 (Heart)
        energy: 60       // 0-100 (Moon)
      },
      currentAction: {
        title: 'Đang thư giãn',
        desc: 'Hưởng thụ nắng ấm ban mai ~',
        progress: 100
      },
      inventory: {
        kibble: 5,
        salmon: 2,
        milk: 3,
        pate: 4,
        dried_fish: 0,
        catnip_snack: 2
      },
      ownedToys: ['yarn_ball', 'feather_wand', 'laser_pointer'],
      activeToy: null, // 'yarn_ball' | 'feather_wand' | 'laser_pointer' | 'windup_mouse'
      
      customization: {
        fur: 'orange_tabby', // 'orange_tabby', 'calico', 'tuxedo', 'black_cat', 'siamese'
        hat: 'none',         // 'none', 'chef_hat', 'wizard_hat', 'party_hat', 'straw_hat', 'detective_cap'
        glasses: 'none',     // 'none', 'sunglasses', 'round_glasses', 'star_glasses'
        accessory: 'none',   // 'none', 'red_bowtie', 'gold_bell'
        roomTheme: 'cozy_day' // 'cozy_day', 'warm_sunset', 'starry_night'
      },
      
      ownedCostumes: ['orange_tabby', 'party_hat', 'sunglasses', 'red_bowtie'],
      
      dailyQuests: [
        { id: 'feed_cat', text: 'Cho mèo ăn', target: 2, current: 1, done: false, rewardCoins: 25, rewardExp: 20 },
        { id: 'play_cat', text: 'Chơi với mèo 3 lần', target: 3, current: 2, done: false, rewardCoins: 35, rewardExp: 30 },
        { id: 'pet_cat', text: 'Vuốt ve mèo', target: 15, current: 8, done: false, rewardCoins: 20, rewardExp: 15 },
        { id: 'sleep_cat', text: 'Để mèo ngủ đủ giấc', target: 1, current: 0, done: false, rewardCoins: 30, rewardExp: 25 }
      ],

      collection: {
        foodsDiscovered: ['kibble', 'salmon', 'milk', 'pate'],
        toysUsed: ['yarn_ball', 'feather_wand', 'laser_pointer'],
        achievements: {
          first_pet: { name: 'Cái vuốt đầu tiên', desc: 'Lần đầu vuốt ve bé mèo', unlocked: true },
          gourmet_cat: { name: 'Mỹ thực gia mèo', desc: 'Đã nếm thử 4 loại món ăn', unlocked: true },
          stylish_pet: { name: 'Mèo thời trang', desc: 'Mặc thử trang phục sành điệu', unlocked: true },
          laser_chaser: { name: 'Thợ săn chấm đỏ', desc: 'Bắt hụt tia laser 10 lần', unlocked: false },
          zoomies_champ: { name: 'Cơn lốc cuồng loạn', desc: 'Bùng nổ Zoomies phóng quanh phòng', unlocked: false }
        }
      },

      stats: {
        petCount: 8,
        timesFed: 1,
        timesPlayed: 2,
        sleepSeconds: 0
      },

      lastSeen: Date.now(),  // last time the player was present (ms)
      pendingGifts: []       // gifts the cat left while away, not yet claimed
    };

    // Autonomous behavior state
    // 'IDLE', 'PETTING', 'SLEEPING', 'YAWNING', 'LICKING_PAW', 'ROLLING', 'BEGGING', 'EATING', 'PLAYING', 'ZOOMIES', 'SULKING',
    // 'SLOW_BLINK', 'CURIOUS', 'SURPRISED', 'ANNOYED', 'KNEADING', 'BLEP', 'GREETING', 'GROOMING',
    // 'SICK', 'EXHAUSTED', 'STARVING', 'FULL', 'HISS'
    // Hình dạng từng trạng thái: CAT_EXPRESSIONS trong cat-renderer.js
    this.behaviorState = 'IDLE';
    this.stateTimer = 0;
    this.petTimes = [];        // mốc thời gian các lần vuốt gần đây (phát hiện vuốt quá lâu)
    this.annoyedPets = 0;      // số lần bị vuốt tiếp trong lúc đang cáu
    this.nextBehavior = null;  // trạng thái nối tiếp khi trạng thái hiện tại hết giờ (ví dụ ăn xong → no căng)
    this.lastSlowBlinkAt = 0;
    this.nextAutonomousActionTimer = 8; // seconds

    this.listeners = [];
    this.load();
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.save();
    this.listeners.forEach(fn => fn(this.data));
  }

  save() {
    // A hidden tab is "away": keep lastSeen at the moment the player left.
    if (document.visibilityState !== 'hidden') this.data.lastSeen = Date.now();
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = { ...this.data, ...parsed };
        // Saves from before offline progress have no lastSeen: treat as just seen.
        if (typeof parsed.lastSeen === 'number') this.awayFrom = parsed.lastSeen;
      }
    } catch (e) {
      console.warn('Could not load from localStorage', e);
    }
  }

  resetData() {
    localStorage.removeItem(this.STORAGE_KEY);
    location.reload();
  }

  // --- OFFLINE PROGRESS ---
  // Call when the player leaves (tab hidden) so the away time starts there.
  markAway() {
    this.data.lastSeen = Date.now();
    this.awayFrom = this.data.lastSeen;
    this.save();
  }

  // Applies capped vitals decay for the time since awayFrom and queues the gifts
  // the cat left. Returns { awaySeconds, gifts } or null if the absence was too short.
  applyOfflineProgress() {
    const cfg = OFFLINE_CONFIG;
    const now = Date.now();
    const awayFrom = this.awayFrom;
    this.awayFrom = null;
    this.data.lastSeen = now;

    // Missing timestamp or clock moved backwards: nothing to apply.
    if (awayFrom === null || now <= awayFrom) return null;
    const rawSeconds = (now - awayFrom) / 1000;
    if (rawSeconds < cfg.MIN_AWAY_SECONDS) return null;

    const seconds = Math.min(rawSeconds, cfg.MAX_AWAY_SECONDS);
    const v = this.data.vitals;

    // Never push a stat below its floor, and never raise one that is already below it.
    const decay = (value, perSec, maxDrop, floor) =>
      Math.min(value, Math.max(floor, value - Math.min(seconds * perSec, maxDrop)));
    v.hunger = decay(v.hunger, cfg.HUNGER_PER_SEC, cfg.MAX_HUNGER_DROP, cfg.HUNGER_FLOOR);
    v.happiness = decay(v.happiness, cfg.HAPPY_PER_SEC, cfg.MAX_HAPPY_DROP, cfg.HAPPY_FLOOR);
    v.energy = Math.min(100, v.energy + Math.min(seconds * cfg.ENERGY_GAIN_PER_SEC, cfg.MAX_ENERGY_GAIN));

    const giftCount = Math.min(cfg.MAX_GIFTS, Math.floor(seconds / cfg.GIFT_INTERVAL_SECONDS));
    const gifts = [];
    for (let i = 0; i < giftCount; i++) gifts.push(this.rollGift());
    // Cap the unclaimed pile so ignoring the modal for days does not grow the save forever.
    this.data.pendingGifts = this.data.pendingGifts.concat(gifts).slice(-cfg.MAX_GIFTS * 2);

    this.setBehavior('GREETING', 3.5);
    return { awaySeconds: rawSeconds, gifts };
  }

  rollGift() {
    const r = Math.random();
    if (r < 0.6) {
      return { type: 'coins', icon: '🐟', label: 'Cá nhỏ', amount: 10 + Math.floor(Math.random() * 16) };
    }
    const pick = (ids) => ids[Math.floor(Math.random() * ids.length)];
    const id = r < 0.9 ? pick(['kibble', 'dried_fish', 'milk', 'pate']) : pick(['salmon', 'catnip_snack']);
    return { type: 'food', id, icon: '🎁', label: GIFT_FOODS[id], amount: 1 };
  }

  claimGifts() {
    const gifts = this.data.pendingGifts;
    if (!gifts.length) return null;

    let coins = 0;
    gifts.forEach(g => {
      if (g.type === 'coins') {
        coins += g.amount;
      } else if (g.type === 'food' && GIFT_FOODS[g.id]) {
        this.data.inventory[g.id] = (this.data.inventory[g.id] || 0) + g.amount;
      }
    });
    const claimed = gifts.length;
    this.data.pendingGifts = [];
    if (coins > 0) this.addCoins(coins);
    this.addExp(claimed * 5);
    return { count: claimed, coins };
  }

  // --- STATS & VITAL MANAGEMENT ---
  updateVitals(deltaSeconds) {
    // Hunger decays gradually: ~1 pt per 10s
    this.data.vitals.hunger = Math.max(0, this.data.vitals.hunger - deltaSeconds * 0.1);

    // Energy behavior
    if (this.behaviorState === 'SLEEPING') {
      this.data.vitals.energy = Math.min(100, this.data.vitals.energy + deltaSeconds * 1.5);
      this.data.stats.sleepSeconds += deltaSeconds;
      if (this.data.vitals.energy >= 100) {
        this.completeQuestProgress('sleep_cat', 1);
        this.setAction('Đã ngủ đẫy giấc!', 'Mèo vươn vai tràn đầy năng lượng ✨');
        this.setBehavior('YAWNING', 3);
      }
    } else {
      // Normal energy decay
      this.data.vitals.energy = Math.max(0, this.data.vitals.energy - deltaSeconds * 0.05);
    }

    // Happiness decays slowly if neglected, or if starving
    if (this.data.vitals.hunger < 25) {
      this.data.vitals.happiness = Math.max(10, this.data.vitals.happiness - deltaSeconds * 0.15);
      this.data.vitals.health = Math.max(20, this.data.vitals.health - deltaSeconds * 0.08);
    } else {
      this.data.vitals.health = Math.min(100, this.data.vitals.health + deltaSeconds * 0.05);
    }

    // Tick autonomous AI decisions
    this.tickAutonomousAI(deltaSeconds);
  }

  setAction(title, desc, progress = 100) {
    this.data.currentAction = { title, desc, progress };
    this.notify();
  }

  setBehavior(state, duration = 4) {
    this.behaviorState = state;
    this.stateTimer = duration;
    this.nextBehavior = null; // đổi trạng thái thì bỏ trạng thái nối tiếp cũ
    
    // Update action UI banner to match
    switch (state) {
      case 'PETTING':
        this.setAction('Đang được vuốt ve', 'Thích thú quá đi! ❤️');
        break;
      case 'SLEEPING':
        this.setAction('Đang ngủ say', 'Khò khò... Đang hồi phục năng lượng 💤');
        break;
      case 'YAWNING':
        this.setAction('Đang ngáp dài', 'Oaaa... Mèo vươn vai khoan khoái ~');
        break;
      case 'LICKING_PAW':
        this.setAction('Đang chải chuốt', 'Liếm láp bàn chân xinh xắn 🐾');
        break;
      case 'ROLLING':
        this.setAction('Đang lăn lộn ngửa bụng', 'Lăn vòng nghịch ngợm đáng yêu!');
        break;
      case 'BEGGING':
        this.setAction('Đang xin ăn', 'Meow meow! Sen ơi đói bụng quá 🐟');
        break;
      case 'EATING':
        this.setAction('Đang ăn ngon lành', 'Nhai nhồm nhoàm crunch crunch 😋');
        break;
      case 'ZOOMIES':
        this.setAction('Cơn cuồng loạn Zoomies ⚡', 'Phóng vèo vèo quanh phòng không phanh!');
        this.unlockAchievement('zoomies_champ');
        break;
      case 'SULKING':
        this.setAction('Đang dỗi hờn', 'Quay lưng giận dỗi vì bị bỏ rơi...');
        break;
      case 'PLAYING':
        this.setAction('Đang chơi đùa', 'Vồ bắt hăng say, rèn luyện phản xạ! 🪶');
        break;
      case 'SLOW_BLINK':
        this.setAction('Đang nháy mắt chậm', 'Mèo nói "mình tin bạn" bằng ánh mắt 😌');
        break;
      case 'CURIOUS':
        this.setAction('Đang tò mò', 'Nghiêng đầu ngó nghiêng... cái gì thế? ❓');
        break;
      case 'SURPRISED':
        this.setAction('Giật mình!', 'Ối! Ai vừa đánh thức mèo đấy? ❗');
        break;
      case 'ANNOYED':
        this.setAction('Đang cáu nhẹ', 'Vuốt nhiều quá rồi, cho mèo nghỉ chút 💢');
        break;
      case 'KNEADING':
        this.setAction('Đang nhồi bột', 'Nhào nhào bàn chân, rù rù mãn nguyện 🍞');
        break;
      case 'BLEP':
        this.setAction('Đang thè lưỡi', 'Quên thụt lưỡi vào... blep 😛');
        break;
      case 'GREETING':
        this.setAction('Chào mừng bạn về!', 'Dựng đuôi kêu rừ rừ đón sen 💛');
        break;
      case 'GROOMING':
        this.setAction('Đang rửa mặt', 'Liếm chân rồi xoa mặt sạch sẽ 🧼');
        break;
      case 'SICK':
        this.setAction('Đang ốm', 'Run run, mệt mỏi... cho mèo ăn uống đầy đủ nhé 🤒');
        break;
      case 'EXHAUSTED':
        this.setAction('Kiệt sức', 'Mắt díp lại, gật gù... cho mèo đi ngủ thôi 😪');
        break;
      case 'STARVING':
        this.setAction('Đói lả', 'Nằm bẹp, kêu yếu ớt... sen ơi cho ăn với 😿');
        break;
      case 'FULL':
        this.setAction('No căng bụng', 'Liếm mép thoả mãn, bụng tròn vo 😋');
        break;
      case 'HISS':
        this.setAction('Đang rít', 'Khè! Đã bảo dừng tay rồi mà 😾');
        break;
      default:
        this.setAction('Đang thư giãn', 'Lim dim ngắm cảnh bên khung cửa sổ ~');
        break;
    }
  }

  // Autonomous Behavior AI Cycle
  tickAutonomousAI(delta) {
    if (this.stateTimer > 0) {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        // Return to natural idle (or the chained state) if temporary state finished
        if (this.behaviorState !== 'SLEEPING' && this.behaviorState !== 'PLAYING') {
          const next = this.nextBehavior;
          if (next) {
            this.setBehavior(next.state, next.duration);
          } else {
            this.setBehavior('IDLE', 0);
          }
        }
      }
    }

    // Schedule next spontaneous action
    this.nextAutonomousActionTimer -= delta;
    if (this.nextAutonomousActionTimer <= 0) {
      this.nextAutonomousActionTimer = 8 + Math.random() * 8; // Every 8-16s

      // Don't interrupt playing, petting or short reactions
      if (UNINTERRUPTIBLE_STATES.includes(this.behaviorState)) return;

      // Check urgent vitals
      const v = this.data.vitals;
      if (v.health < VITAL_MOODS.SICK_HEALTH && Math.random() < 0.6) {
        this.setBehavior('SICK', 8);
        return;
      }

      if (v.hunger < VITAL_MOODS.STARVING_HUNGER) {
        this.setBehavior('STARVING', 8);
        if (window.catAudio) window.catAudio.meow('hungry');
        return;
      }

      if (v.hunger < 35 && this.behaviorState !== 'EATING') {
        this.setBehavior('BEGGING', 5);
        if (window.catAudio) window.catAudio.meow('hungry');
        return;
      }

      if (v.energy < 25 && this.behaviorState !== 'SLEEPING') {
        // Quá mệt thì đôi khi gật gù cố thức trước khi ngủ
        if (v.energy < VITAL_MOODS.EXHAUSTED_ENERGY && this.behaviorState !== 'EXHAUSTED' && Math.random() < 0.5) {
          this.setBehavior('EXHAUSTED', 6);
          return;
        }
        this.setBehavior('SLEEPING', 12);
        if (window.catAudio) window.catAudio.yawn();
        return;
      }

      // High energy random Zoomies!
      if (this.data.vitals.energy > 80 && Math.random() < 0.25) {
        this.setBehavior('ZOOMIES', 4.5);
        this.data.vitals.energy = Math.max(40, this.data.vitals.energy - 25);
        this.data.vitals.happiness = Math.min(100, this.data.vitals.happiness + 20);
        this.addCoins(5);
        return;
      }

      // Bị bỏ rơi (vui thấp) thì dỗi
      if (this.data.vitals.happiness < 30 && this.behaviorState !== 'SULKING' && Math.random() < 0.5) {
        this.setBehavior('SULKING', 8);
        return;
      }

      // Random spontaneous cute actions; mèo vui có thêm nháy mắt chậm và nhồi bột
      const choices = ['YAWNING', 'LICKING_PAW', 'GROOMING', 'ROLLING', 'CURIOUS', 'BLEP', 'IDLE', 'IDLE'];
      if (this.data.vitals.happiness > 65) choices.push('SLOW_BLINK', 'KNEADING');
      const pick = choices[Math.floor(Math.random() * choices.length)];

      if (pick === 'GROOMING') {
        this.setBehavior('GROOMING', 4.5);
      } else if (pick === 'CURIOUS') {
        this.setBehavior('CURIOUS', 2.8);
      } else if (pick === 'BLEP') {
        this.setBehavior('BLEP', 3.5);
      } else if (pick === 'SLOW_BLINK') {
        this.setBehavior('SLOW_BLINK', 2.8);
      } else if (pick === 'KNEADING') {
        this.setBehavior('KNEADING', 5);
        if (window.catAudio) window.catAudio.meow('purr-chirp');
      } else if (pick === 'YAWNING') {
        this.setBehavior('YAWNING', 3.5);
        if (window.catAudio) window.catAudio.yawn();
      } else if (pick === 'LICKING_PAW') {
        this.setBehavior('LICKING_PAW', 4.5);
        if (window.catAudio) window.catAudio.meow('purr-chirp');
      } else if (pick === 'ROLLING') {
        this.setBehavior('ROLLING', 4);
        if (window.catAudio) window.catAudio.meow('happy');
      } else {
        this.setBehavior('IDLE', 5);
      }
    }
  }

  // --- ACTIONS ---

  // Petting action. Trả về 'ok' | 'annoyed' (đang cáu/rít, không thưởng) | 'hiss' (bị vuốt tiếp khi cáu nên rít)
  // | 'dozing' (vuốt nhẹ khi ngủ) | 'startled' (bấm khi ngủ làm mèo giật mình)
  pet(isClick = false) {
    if (this.behaviorState === 'HISS') return 'annoyed';
    if (this.behaviorState === 'ANNOYED') {
      this.annoyedPets++;
      if (this.annoyedPets >= VITAL_MOODS.HISS_AFTER_PETS) {
        this.annoyedPets = 0;
        this.data.vitals.happiness = Math.max(0, this.data.vitals.happiness - 5);
        this.setBehavior('HISS', 2.5);
        if (window.catAudio && window.catAudio.hiss) window.catAudio.hiss();
        return 'hiss';
      }
      return 'annoyed';
    }

    if (this.behaviorState === 'SLEEPING') {
      if (!isClick) {
        this.data.vitals.happiness = Math.min(100, this.data.vitals.happiness + 0.4);
        return 'dozing';
      }
      this.setBehavior('SURPRISED', 1.6);
      if (window.catAudio) window.catAudio.meow('happy');
      return 'startled';
    }

    const now = Date.now();
    this.petTimes = this.petTimes.filter(t => now - t < PET_OVERLOAD.WINDOW_MS);
    this.petTimes.push(now);
    if (this.petTimes.length >= PET_OVERLOAD.MAX_PETS) {
      this.petTimes = [];
      this.annoyedPets = 0;
      this.data.vitals.happiness = Math.max(0, this.data.vitals.happiness - 3);
      this.setBehavior('ANNOYED', PET_OVERLOAD.ANNOYED_SECONDS);
      if (window.catAudio) window.catAudio.meow('hungry');
      return 'annoyed';
    }

    this.data.stats.petCount++;
    this.data.vitals.happiness = Math.min(100, this.data.vitals.happiness + 1.2);
    this.data.vitals.health = Math.min(100, this.data.vitals.health + 0.3);
    
    // Add EXP
    this.addExp(2);
    
    // Random chance of coins drop
    if (Math.random() < 0.15) {
      this.addCoins(1);
    }

    this.completeQuestProgress('pet_cat', 1);
    this.unlockAchievement('first_pet');

    if (this.behaviorState !== 'PETTING') {
      this.setBehavior('PETTING', 2.5);
    } else {
      this.stateTimer = 2.5; // prolong petting
    }
    return 'ok';
  }

  // Người chơi nháy mắt chậm với mèo, mèo tin tưởng sẽ nháy lại (Humphrey et al. 2020).
  // Trả về false khi mèo đang ngủ/cáu hoặc còn hồi chiêu.
  slowBlinkAtCat() {
    const now = Date.now();
    if (this.behaviorState === 'SLEEPING' || this.behaviorState === 'ANNOYED') return false;
    if (now - this.lastSlowBlinkAt < SLOW_BLINK_COOLDOWN_MS) return false;
    this.lastSlowBlinkAt = now;
    this.data.vitals.happiness = Math.min(100, this.data.vitals.happiness + 4);
    this.setBehavior('SLOW_BLINK', 2.8);
    this.addExp(3);
    return true;
  }

  // Feeding action
  feed(foodId) {
    const foodDefs = {
      kibble: { name: 'Thức ăn hạt', hunger: 25, happiness: 10, health: 5, exp: 12 },
      salmon: { name: 'Cá hồi', hunger: 45, happiness: 35, health: 15, exp: 25 },
      milk: { name: 'Sữa tươi', hunger: 15, happiness: 15, health: 20, exp: 15, isLiquid: true },
      pate: { name: 'Pate thơm ngon', hunger: 35, happiness: 25, health: 10, exp: 20 },
      dried_fish: { name: 'Cá khô giòn', hunger: 15, happiness: 20, health: 5, exp: 12 },
      catnip_snack: { name: 'Snack Cỏ Mèo', hunger: 10, happiness: 45, health: 10, exp: 30 }
    };

    const item = foodDefs[foodId];
    if (!item) return false;

    if (!this.data.inventory[foodId] || this.data.inventory[foodId] <= 0) {
      return false; // Out of stock
    }

    // No căng thì từ chối ăn thêm, không trừ kho
    if (this.isFull()) {
      this.setBehavior('FULL', 3);
      return 'full';
    }

    this.data.inventory[foodId]--;
    this.data.stats.timesFed++;

    // Apply vitals
    this.data.vitals.hunger = Math.min(100, this.data.vitals.hunger + item.hunger);
    this.data.vitals.happiness = Math.min(100, this.data.vitals.happiness + item.happiness);
    this.data.vitals.health = Math.min(100, this.data.vitals.health + (item.health || 0));
    this.addExp(item.exp);

    // Track food discovery
    if (!this.data.collection.foodsDiscovered.includes(foodId)) {
      this.data.collection.foodsDiscovered.push(foodId);
    }
    if (this.data.collection.foodsDiscovered.length >= 4) {
      this.unlockAchievement('gourmet_cat');
    }

    this.completeQuestProgress('feed_cat', 1);
    this.setBehavior('EATING', 3.5);
    // Ăn tới mức no căng thì ăn xong chuyển sang liếm mép, bụng tròn
    if (this.isFull()) this.nextBehavior = { state: 'FULL', duration: 5 };

    // Audio FX
    if (window.catAudio) {
      if (item.isLiquid) {
        window.catAudio.slurp();
      } else {
        window.catAudio.crunch();
      }
    }

    this.notify();
    return true;
  }

  isFull() {
    return this.data.vitals.hunger >= VITAL_MOODS.FULL_HUNGER;
  }

  // Play with Toy. Trả về false khi mèo kiệt sức (không chơi, không thưởng)
  playWithToy(toyId) {
    if (this.data.vitals.energy < VITAL_MOODS.EXHAUSTED_ENERGY) {
      this.setBehavior('EXHAUSTED', 5);
      return false;
    }
    this.data.activeToy = toyId;
    this.data.stats.timesPlayed++;
    this.data.vitals.happiness = Math.min(100, this.data.vitals.happiness + 20);
    this.data.vitals.energy = Math.max(10, this.data.vitals.energy - 10);
    this.addExp(18);
    this.addCoins(6);

    this.completeQuestProgress('play_cat', 1);

    if (!this.data.collection.toysUsed.includes(toyId)) {
      this.data.collection.toysUsed.push(toyId);
    }

    this.setBehavior('PLAYING', 10);
    if (window.catAudio) {
      window.catAudio.squeak();
      window.catAudio.meow('happy');
    }

    this.notify();
    return true;
  }

  stopPlaying() {
    this.data.activeToy = null;
    this.setBehavior('IDLE', 0);
    this.notify();
  }

  // Put to sleep / Nap toggle
  toggleSleep() {
    if (this.behaviorState === 'SLEEPING') {
      this.setBehavior('YAWNING', 3);
      if (window.catAudio) window.catAudio.yawn();
    } else {
      this.setBehavior('SLEEPING', 30);
      if (window.catAudio) window.catAudio.yawn();
    }
    this.notify();
  }

  // Currency & Progression
  addCoins(amount) {
    this.data.coins += amount;
    if (window.catAudio) window.catAudio.coin();
    this.notify();
  }

  addExp(amount) {
    this.data.exp += amount;
    if (this.data.exp >= this.data.expToNext) {
      this.levelUp();
    } else {
      this.notify();
    }
  }

  levelUp() {
    this.data.level++;
    this.data.exp = this.data.exp - this.data.expToNext;
    this.data.expToNext = Math.round(this.data.level * 100 * 1.15);
    
    // Reward for leveling up!
    const bonusCoins = this.data.level * 50;
    this.data.coins += bonusCoins;

    if (window.catAudio) window.catAudio.levelUp();
    
    // Level Up celebration event
    if (window.showLevelUpModal) {
      window.showLevelUpModal(this.data.level, bonusCoins);
    }

    this.notify();
  }

  renamePet(newName) {
    if (newName && newName.trim()) {
      this.data.name = newName.trim();
      this.notify();
    }
  }

  // Quests & Achievements
  completeQuestProgress(questId, amount = 1) {
    const q = this.data.dailyQuests.find(quest => quest.id === questId);
    if (q && !q.done) {
      q.current = Math.min(q.target, q.current + amount);
      if (q.current >= q.target) {
        q.done = true;
        this.addCoins(q.rewardCoins);
        this.addExp(q.rewardExp);
        if (window.showToast) {
          window.showToast(`🎉 Hoàn thành: "${q.text}"! Nhận +${q.rewardCoins} xu, +${q.rewardExp} EXP!`);
        }
      }
      this.notify();
    }
  }

  unlockAchievement(id) {
    if (this.data.collection.achievements[id] && !this.data.collection.achievements[id].unlocked) {
      this.data.collection.achievements[id].unlocked = true;
      this.addCoins(50);
      this.addExp(40);
      if (window.showToast) {
        window.showToast(`🏆 Danh hiệu mới: "${this.data.collection.achievements[id].name}"!`);
      }
      this.notify();
    }
  }

  // Shop Purchases
  buyItem(category, itemId, price) {
    if (this.data.coins < price) {
      if (window.showToast) window.showToast('❌ Không đủ xu rồi sen ơi!');
      return false;
    }

    this.data.coins -= price;

    if (category === 'food') {
      this.data.inventory[itemId] = (this.data.inventory[itemId] || 0) + 1;
    } else if (category === 'toy') {
      if (!this.data.ownedToys.includes(itemId)) {
        this.data.ownedToys.push(itemId);
      }
    } else if (category === 'costume') {
      if (!this.data.ownedCostumes.includes(itemId)) {
        this.data.ownedCostumes.push(itemId);
      }
    }

    if (window.catAudio) window.catAudio.coin();
    if (window.showToast) window.showToast('✨ Mua sắm thành công!');
    this.notify();
    return true;
  }

  equipCostume(type, itemId) {
    this.data.customization[type] = itemId;
    this.unlockAchievement('stylish_pet');
    this.notify();
  }
}

// Global instance
window.gameState = new CatGameState();
