/**
 * Meow 2D - Game State, Autonomous AI & Progression System
 */

class CatGameState {
  constructor() {
    this.STORAGE_KEY = 'meow_2d_save_data_v1';
    
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
      }
    };

    // Autonomous behavior state
    this.behaviorState = 'IDLE'; // 'IDLE', 'PETTING', 'SLEEPING', 'YAWNING', 'LICKING_PAW', 'ROLLING', 'BEGGING', 'EATING', 'PLAYING', 'ZOOMIES', 'SULKING'
    this.stateTimer = 0;
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
      }
    } catch (e) {
      console.warn('Could not load from localStorage', e);
    }
  }

  resetData() {
    localStorage.removeItem(this.STORAGE_KEY);
    location.reload();
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
        // Return to natural idle if temporary state finished
        if (this.behaviorState !== 'SLEEPING' && this.behaviorState !== 'PLAYING') {
          this.setBehavior('IDLE', 0);
        }
      }
    }

    // Schedule next spontaneous action
    this.nextAutonomousActionTimer -= delta;
    if (this.nextAutonomousActionTimer <= 0) {
      this.nextAutonomousActionTimer = 8 + Math.random() * 8; // Every 8-16s

      // Don't interrupt playing or manual petting
      if (this.behaviorState === 'PETTING' || this.behaviorState === 'PLAYING') return;

      // Check urgent vitals
      if (this.data.vitals.hunger < 35 && this.behaviorState !== 'EATING') {
        this.setBehavior('BEGGING', 5);
        if (window.catAudio) window.catAudio.meow('hungry');
        return;
      }

      if (this.data.vitals.energy < 25 && this.behaviorState !== 'SLEEPING') {
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

      // Random spontaneous cute actions
      const choices = ['YAWNING', 'LICKING_PAW', 'ROLLING', 'IDLE', 'IDLE'];
      const pick = choices[Math.floor(Math.random() * choices.length)];
      
      if (pick === 'YAWNING') {
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

  // Petting action
  pet() {
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

  // Play with Toy
  playWithToy(toyId) {
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
