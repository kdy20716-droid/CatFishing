/**
 * Cozy Personal Aquarium Simulation - Mobile Idle Tycoon Edition
 * 1/10 Rebalanced GPS Rate, Progressive Food Leveling & Sequential Unlocks, 8 Facility Upgrades, Individual Fish Leveling
 */
import { Fish } from '../entities/Fish.js?v=7.7.0';
import { Vector2 } from '../engine/Vector.js?v=7.7.0';

export const AQUARIUM_THEMES_INFO = [
  {
    id: 'coral',
    name: '산호초 파라다이스',
    price: 0,
    capacity: 20,
    icon: '🪸',
    badge: '기본 무료',
    desc: '따뜻한 에메랄드빛 바다와 살랑이는 열대 산호초가 어우러진 아늑한 기본 수조입니다.',
    perk: '기본 초당 골드 생산 (1.0x)',
    multiplier: 1.0,
    image: 'assets/aquarium/coral.jpg'
  },
  {
    id: 'night_glow',
    name: '심해 야광 오로라',
    price: 5000,
    capacity: 25,
    icon: '🌌',
    badge: 'Tier 2',
    desc: '네온빛을 발하는 발광 산호와 몽환적인 심해 발광 플랑크톤이 가득한 신비로운 밤의 수조.',
    perk: '심해/어둠층 물고기 수익 +50%, 버블 주기 20% 단축',
    multiplier: 1.25,
    image: 'assets/aquarium/night_glow.jpg'
  },
  {
    id: 'ancient',
    name: '고대 아틀란티스 신전',
    price: 25000,
    capacity: 30,
    icon: '🏛️',
    badge: 'Tier 3',
    desc: '물속으로 비치는 성스러운 금빛 햇살과 고대 해저 문명의 마법 룬 유적이 살아 숨 쉬는 신전 수조.',
    perk: '희귀/영웅 물고기 수익 +75%, 밥주기 즉시 보상 +50%',
    multiplier: 1.5,
    image: 'assets/aquarium/ancient.jpg'
  },
  {
    id: 'sakura',
    name: '벚꽃 해저 정원',
    price: 80000,
    capacity: 35,
    icon: '🌸',
    badge: 'Tier 4',
    desc: '물결을 타고 살랑살랑 흩날리는 핑크빛 벚꽃 잎과 파스텔 산호초가 마음을 정화해 주는 동화 수조.',
    perk: '전체 물고기 골드 생산량 +50%, 벚꽃잎 터치 보너스',
    multiplier: 1.8,
    image: 'assets/aquarium/sakura.jpg'
  },
  {
    id: 'cosmic',
    name: '별빛 은하수 우주',
    price: 250000,
    capacity: 40,
    icon: '✨',
    badge: '최고 티어 Mythic',
    desc: '성운 오로라와 신비로운 별자리, 은하수 스타더스트가 춤추는 무한한 우주의 수조.',
    perk: '전설/신화/보스 수익 +150%, 🧲 자동 코인 자석 흡입, 💤 금고 보관 한도 2배',
    multiplier: 2.5,
    image: 'assets/aquarium/cosmic.jpg'
  }
];

// 8 Facility Upgrades with progressive costs and high replayability
export const FACILITY_UPGRADES = [
  {
    id: 'vault_cap',
    name: '코인 금고 용량 확장',
    icon: '🏦',
    maxLevel: 10,
    caps: [1000, 2500, 6000, 15000, 35000, 80000, 180000, 400000, 900000, 2000000],
    costs: [600, 1800, 4500, 12000, 30000, 75000, 180000, 420000, 950000, 0],
    desc: (lv, next) => `방치 보관 한도: ${lv.toLocaleString()} G ➔ ${next ? next.toLocaleString() + ' G' : 'MAX'}`
  },
  {
    id: 'purifier',
    name: '나노 산소 정화기',
    icon: '💧',
    maxLevel: 10,
    bonuses: [0, 10, 20, 30, 45, 60, 75, 95, 120, 150],
    costs: [500, 1400, 3600, 9000, 22000, 50000, 110000, 240000, 550000, 0],
    desc: (cur, next) => `전체 물고기 기본 생산량: +${cur}% ➔ ${next !== undefined ? '+' + next + '%' : 'MAX'}`
  },
  {
    id: 'led_light',
    name: '바이오 LED 조광기',
    icon: '💡',
    maxLevel: 10,
    bonuses: [0, 15, 30, 50, 70, 95, 125, 160, 200, 250],
    costs: [800, 2200, 5500, 14000, 34000, 78000, 170000, 380000, 850000, 0],
    desc: (cur, next) => `심해 및 희귀 이상 물고기 생산량: +${cur}% ➔ ${next !== undefined ? '+' + next + '%' : 'MAX'}`
  },
  {
    id: 'music_box',
    name: '힐링 오르골 멜로디',
    icon: '🎵',
    maxLevel: 10,
    bonuses: [0, 12, 24, 36, 48, 60, 75, 90, 110, 130],
    costs: [1200, 3200, 8000, 20000, 48000, 110000, 240000, 500000, 1100000, 0],
    desc: (cur, next) => `밥주기 쿨다운 단축: -${cur}초 ➔ ${next !== undefined ? '-' + next + '초' : 'MAX'}`
  },
  {
    id: 'vitamin_booster',
    name: '농축 비타민 수질 영양제',
    icon: '🧪',
    maxLevel: 10,
    bonuses: [0, 20, 40, 65, 90, 120, 155, 195, 240, 300],
    costs: [2000, 5500, 14000, 35000, 85000, 190000, 420000, 900000, 2000000, 0],
    desc: (cur, next) => `이로치 및 대물 물고기 수익 배율: +${cur}% ➔ ${next !== undefined ? '+' + next + '%' : 'MAX'}`
  },
  {
    id: 'magnetic_fan',
    name: '자석 버블 흡입 팬',
    icon: '🧲',
    maxLevel: 10,
    bonuses: [0, 10, 20, 35, 50, 70, 90, 115, 145, 180],
    costs: [2500, 6800, 17000, 42000, 100000, 230000, 500000, 1100000, 2400000, 0],
    desc: (cur, next) => `오프라인 방치 누적 보너스: +${cur}% ➔ ${next !== undefined ? '+' + next + '%' : 'MAX'}`
  },
  {
    id: 'auto_feeder',
    name: '스마트 자동 급식기',
    icon: '🤖',
    maxLevel: 5,
    bonuses: [0, 180, 140, 100, 70, 45],
    costs: [10000, 30000, 80000, 200000, 500000, 0],
    desc: (cur, next) => cur === 0 ? `미보유 ➔ 1레벨 구매 시 3분마다 자동 먹이 투하!` : `자동 먹이 투하 주기: ${cur}초 ➔ ${next !== undefined ? next + '초' : 'MAX'}`
  },
  {
    id: 'coral_decor',
    name: '천연 산호석 인테리어',
    icon: '🪸',
    maxLevel: 10,
    bonuses: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10], // Extra capacity
    costs: [10000, 20000, 45000, 100000, 220000, 500000, 1100000, 2500000, 5500000, 0],
    desc: (cur, next) => `수조 최대 수용 인원: +${cur}마리 ➔ ${next !== undefined ? '+' + next + '마리' : 'MAX'}`
  }
];

export const FOOD_TIERS = [
  {
    tier: 1,
    name: '일반 빵가루',
    price: 0,
    reqLevel: 0,
    reqTierName: '',
    baseCost: 150,
    cooldownSec: 600,
    bonusMult: 1.0,
    icon: '🍞',
    desc: '기본 먹이. 10분마다 밥주기 시 기본 골드 보상.'
  },
  {
    tier: 2,
    name: '크릴새우 플레이크',
    price: 15000,
    reqLevel: 20,
    reqTier: 1,
    reqTierName: '빵가루 Lv.20',
    baseCost: 800,
    cooldownSec: 480,
    bonusMult: 1.5,
    icon: '🦐',
    desc: '영양 가득 크릴새우. 밥주기 쿨다운 8분 단축 & 보상 +50%!'
  },
  {
    tier: 3,
    name: '황금 플랑크톤 젤리',
    price: 60000,
    reqLevel: 30,
    reqTier: 2,
    reqTierName: '크릴새우 Lv.30',
    baseCost: 3500,
    cooldownSec: 300,
    bonusMult: 2.2,
    icon: '🔮',
    desc: '고급 발광 젤리. 밥주기 쿨다운 5분 단축 & 보상 +120%!'
  },
  {
    tier: 4,
    name: '심해 별빛 파우더',
    price: 250000,
    reqLevel: 40,
    reqTier: 3,
    reqTierName: '플랑크톤 젤리 Lv.40',
    baseCost: 15000,
    cooldownSec: 180,
    bonusMult: 3.5,
    icon: '✨',
    desc: '전설의 별빛 사료. 밥주기 쿨다운 3분 단축 & 보상 +250%!'
  }
];

export class Aquarium {
  constructor(encyclopedia, economy, soundEngine) {
    this.encyclopedia = encyclopedia;
    this.economy = economy;
    this.sound = soundEngine;

    this.isOpen = false;
    this.theme = 'coral';
    this.ownedThemes = ['coral'];

    // 🏦 Capped Coin Vault & 8 Facility Levels
    this.vaultGold = 0;
    this.facilityLevels = {
      vault_cap: 1,
      purifier: 1,
      led_light: 1,
      coral_decor: 1,
      music_box: 1,
      vitamin_booster: 1,
      magnetic_fan: 1,
      auto_feeder: 0
    };

    // 🥐 Food Tier & Individual Food Levels
    this.foodTier = 1;
    this.foodLevels = { 1: 1, 2: 1, 3: 1, 4: 1 };
    this.ownedFoodTiers = [1];

    this.lastOfflineTime = Date.now();
    this.lastAutoFeedTime = Date.now();
    this.minuteTimer = 60; // 60-second batch timer for minute accumulation

    this.themeImages = {};
    this.loadThemeImages();
    this.tankFish = [];
    this.placedFish = []; // [{ instanceId, speciesId, name, isShiny, sizeCm, level: 1, addedAt }]
    this.foodFlakes = [];
    this.coinBubbles = [];
    this.hearts = [];

    this.animTime = 0;
    this.tankWidth = 900;
    this.tankHeight = 550;

    this.lastFeedRewardTime = 0;

    this.loadFromStorage();
  }

  loadThemeImages() {
    this.themeImages = {};
    const themeFiles = {
      coral: 'assets/aquarium/coral.jpg',
      night_glow: 'assets/aquarium/night_glow.jpg',
      ancient: 'assets/aquarium/ancient.jpg',
      cosmic: 'assets/aquarium/cosmic.jpg',
      sakura: 'assets/aquarium/sakura.jpg'
    };
    for (const [key, src] of Object.entries(themeFiles)) {
      const img = new Image();
      img.src = src;
      this.themeImages[key] = img;
    }
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('cozy_cat_aquarium_v3') || localStorage.getItem('cozy_cat_aquarium_v2') || localStorage.getItem('cozy_cat_aquarium_v1');
      if (saved) {
        const data = JSON.parse(saved);
        this.theme = data.theme || 'coral';
        this.ownedThemes = Array.isArray(data.ownedThemes) && data.ownedThemes.length > 0
          ? Array.from(new Set(['coral', ...data.ownedThemes]))
          : ['coral'];
        this.vaultGold = typeof data.vaultGold === 'number' ? data.vaultGold : 0;
        
        if (data.facilityLevels && typeof data.facilityLevels === 'object') {
          this.facilityLevels = { ...this.facilityLevels, ...data.facilityLevels };
        } else if (typeof data.vaultLevel === 'number') {
          this.facilityLevels.vault_cap = data.vaultLevel;
          this.facilityLevels.purifier = data.filterLevel || 1;
        }

        this.foodTier = typeof data.foodTier === 'number' ? data.foodTier : 1;
        if (data.foodLevels && typeof data.foodLevels === 'object') {
          this.foodLevels = { ...this.foodLevels, ...data.foodLevels };
        }
        if (Array.isArray(data.ownedFoodTiers)) {
          this.ownedFoodTiers = Array.from(new Set([1, ...data.ownedFoodTiers]));
        }

        this.placedFish = Array.isArray(data.placedFish)
          ? data.placedFish.map(f => ({ ...f, level: typeof f.level === 'number' ? f.level : 1 }))
          : [];
        this.lastOfflineTime = typeof data.lastOfflineTime === 'number' ? data.lastOfflineTime : Date.now();
      }
      const savedFeedTime = localStorage.getItem('cozy_cat_aqua_feed_time_v1');
      if (savedFeedTime) {
        this.lastFeedRewardTime = parseInt(savedFeedTime, 10) || 0;
      }
    } catch (e) {
      console.warn("Failed to load aquarium:", e);
    }
  }

  saveToStorage() {
    try {
      const data = {
        theme: this.theme,
        ownedThemes: this.ownedThemes,
        vaultGold: Math.round(this.vaultGold),
        facilityLevels: this.facilityLevels,
        foodTier: this.foodTier,
        foodLevels: this.foodLevels,
        ownedFoodTiers: this.ownedFoodTiers,
        placedFish: this.placedFish.slice(0, this.getMaxCapacity()),
        lastOfflineTime: this.lastOfflineTime || Date.now()
      };
      localStorage.setItem('cozy_cat_aquarium_v3', JSON.stringify(data));
      localStorage.setItem('cozy_cat_aqua_feed_time_v1', this.lastFeedRewardTime.toString());
      if (this.onSaveCallback) this.onSaveCallback();
    } catch (e) {
      console.warn("Failed to save aquarium:", e);
    }
  }

  getThemeInfo(themeId = this.theme) {
    return AQUARIUM_THEMES_INFO.find(t => t.id === themeId) || AQUARIUM_THEMES_INFO[0];
  }

  getMaxCapacity() {
    const currentThemeInfo = this.getThemeInfo(this.theme);
    const baseCap = currentThemeInfo ? currentThemeInfo.capacity : 20;
    const decorLv = this.facilityLevels.coral_decor || 1;
    const decorBonus = FACILITY_UPGRADES.find(u => u.id === 'coral_decor').bonuses[decorLv - 1] || 0;
    return baseCap + decorBonus;
  }

  get maxCapacity() {
    return this.getMaxCapacity();
  }

  getVaultMaxCapacity() {
    const vLv = this.facilityLevels.vault_cap || 1;
    const vInfo = FACILITY_UPGRADES.find(u => u.id === 'vault_cap');
    const baseCap = vInfo.caps[vLv - 1] || 1000;
    const cosmicMultiplier = this.theme === 'cosmic' ? 2.0 : 1.0;
    return Math.round(baseCap * cosmicMultiplier);
  }

  getCurrentFoodTier() {
    return FOOD_TIERS.find(f => f.tier === this.foodTier) || FOOD_TIERS[0];
  }

  getFoodLevel(tier = this.foodTier) {
    return this.foodLevels[tier] || 1;
  }

  getFoodUpgradeCost(tier = this.foodTier) {
    const food = FOOD_TIERS.find(f => f.tier === tier) || FOOD_TIERS[0];
    const lv = this.getFoodLevel(tier);
    return Math.round(food.baseCost * Math.pow(1.18, lv - 1));
  }

  levelUpFood(tier = this.foodTier) {
    const cost = this.getFoodUpgradeCost(tier);
    const food = FOOD_TIERS.find(f => f.tier === tier);
    if (!food) return { success: false, message: '사료를 찾을 수 없습니다.' };

    if (this.economy.spendGold(cost)) {
      this.foodLevels[tier] = (this.foodLevels[tier] || 1) + 1;
      this.saveToStorage();
      if (this.sound) this.sound.playCoin();
      return { success: true, message: `🥐 ${food.name}이(가) Lv.${this.foodLevels[tier]}로 성장했습니다!` };
    }
    return { success: false, message: '골드가 부족합니다!' };
  }

  buyFoodTier(targetTier) {
    const food = FOOD_TIERS.find(f => f.tier === targetTier);
    if (!food) return { success: false, message: '존재하지 않는 사료입니다.' };

    if (this.ownedFoodTiers.includes(targetTier)) {
      this.foodTier = targetTier;
      this.saveToStorage();
      return { success: true, message: `${food.name} 사료를 선택했습니다.` };
    }

    // Check requirement
    if (food.reqTier) {
      const curReqLv = this.getFoodLevel(food.reqTier);
      if (curReqLv < food.reqLevel) {
        return { success: false, message: `🔒 ${food.reqTierName} 달성 후 구매 가능합니다! (현재: Lv.${curReqLv})` };
      }
    }

    if (this.economy.spendGold(food.price)) {
      this.ownedFoodTiers.push(targetTier);
      this.foodTier = targetTier;
      this.saveToStorage();
      if (this.sound) this.sound.playCoin();
      return { success: true, message: `🎉 ${food.name} 사료 구매 및 장착 완료!` };
    }
    return { success: false, message: '골드가 부족합니다!' };
  }

  getFeedCooldownMs() {
    const currentFood = this.getCurrentFoodTier();
    let sec = currentFood.cooldownSec;
    const musicLv = this.facilityLevels.music_box || 1;
    const musicBonusSec = FACILITY_UPGRADES.find(u => u.id === 'music_box').bonuses[musicLv - 1] || 0;
    sec = Math.max(30, sec - musicBonusSec);
    return sec * 1000;
  }

  canGetFeedReward() {
    return (Date.now() - this.lastFeedRewardTime) >= this.getFeedCooldownMs();
  }

  getFeedRewardRemainingMs() {
    return Math.max(0, this.getFeedCooldownMs() - (Date.now() - this.lastFeedRewardTime));
  }

  upgradeFacility(facId) {
    const fac = FACILITY_UPGRADES.find(u => u.id === facId);
    if (!fac) return { success: false, message: '존재하지 않는 시설입니다.' };

    const curLv = this.facilityLevels[facId] || (facId === 'auto_feeder' ? 0 : 1);
    if (curLv >= fac.maxLevel) {
      return { success: false, message: '이미 최고 레벨입니다.' };
    }

    const cost = fac.costs[curLv - (facId === 'auto_feeder' ? 0 : 1)];
    if (!cost || cost === 0) return { success: false, message: '이미 최고 레벨입니다.' };

    if (this.economy.spendGold(cost)) {
      this.facilityLevels[facId] = curLv + 1;
      this.saveToStorage();
      if (this.sound) this.sound.playCoin();
      return { success: true, message: `✨ ${fac.name} Lv.${this.facilityLevels[facId]} 강화 완료!` };
    }
    return { success: false, message: '골드가 부족합니다!' };
  }

  calculateFishGPM(item) {
    if (!item) return 0;
    const species = this.encyclopedia.getFishData(item.speciesId);
    if (!species) return 1;

    // 🎯 Pure 1-Minute Gold Yield (분당 고정 수익)
    const rarityGPM = {
      common: 1,        // 분당 1 G
      uncommon: 3,      // 분당 3 G
      rare: 8,          // 분당 8 G
      epic: 20,         // 분당 20 G
      legendary: 60,    // 분당 60 G
      mythic: 200       // 분당 200 G
    };
    let base = rarityGPM[species.rarity] || 2;
    if (species.isBoss) {
      base = 250;
    }

    // Fish Level (+25% per level)
    const fishLv = item.level || 1;
    base *= (1 + (fishLv - 1) * 0.25);

    // Shiny bonus (2x) & Vitamin booster bonus
    if (item.isShiny) {
      const vitLv = this.facilityLevels.vitamin_booster || 1;
      const vitBonus = FACILITY_UPGRADES.find(u => u.id === 'vitamin_booster').bonuses[vitLv - 1] || 0;
      base *= (2.0 + (vitBonus / 100));
    }

    // Size bonus (up to +50%)
    if (species.sizeRange && Array.isArray(species.sizeRange) && item.sizeCm) {
      const minS = species.sizeRange[0];
      const maxS = species.sizeRange[1];
      const sizeRatio = Math.max(0, Math.min(1, (item.sizeCm - minS) / Math.max(1, maxS - minS)));
      base *= (1 + sizeRatio * 0.5);
    }

    // Theme Specific Boosts
    const themeId = this.theme;
    if (themeId === 'night_glow') {
      if (species.zone === 'deep' || species.zone === 'abyss' || species.zone === 'hadal') {
        base *= 1.5;
      }
    } else if (themeId === 'ancient') {
      if (species.rarity === 'rare' || species.rarity === 'epic') {
        base *= 1.75;
      }
    } else if (themeId === 'sakura') {
      base *= 1.5;
    } else if (themeId === 'cosmic') {
      if (species.rarity === 'legendary' || species.rarity === 'mythic' || species.isBoss) {
        base *= 2.5;
      } else {
        base *= 1.5;
      }
    }

    // Purifier Bonus (+10% ~ +150%)
    const purLv = this.facilityLevels.purifier || 1;
    const purBonus = FACILITY_UPGRADES.find(u => u.id === 'purifier').bonuses[purLv - 1] || 0;
    base *= (1 + purBonus / 100);

    // LED Lighting Bonus (+15% ~ +250% for deep/rare fish)
    if (species.rarity === 'rare' || species.rarity === 'epic' || species.rarity === 'legendary' || species.rarity === 'mythic' || species.zone === 'deep' || species.zone === 'abyss') {
      const ledLv = this.facilityLevels.led_light || 1;
      const ledBonus = FACILITY_UPGRADES.find(u => u.id === 'led_light').bonuses[ledLv - 1] || 0;
      base *= (1 + ledBonus / 100);
    }

    // Prosperity upgrade multiplier from Economy
    const prosperityMult = (this.economy && typeof this.economy.getAquariumProsperityMultiplier === 'function')
      ? this.economy.getAquariumProsperityMultiplier()
      : 1.0;

    return Math.round(base * prosperityMult);
  }

  getGPM() {
    let total = 0;
    for (const item of this.placedFish) {
      total += this.calculateFishGPM(item);
    }
    return Math.round(total);
  }

  calculateFishGPS(item) {
    return this.calculateFishGPM(item) / 60;
  }

  getGPS() {
    return this.getGPM() / 60;
  }

  getFishUpgradeCost(item) {
    if (!item) return 100;
    const species = this.encyclopedia.getFishData(item.speciesId);
    const basePrice = species ? species.basePrice : 50;
    const lv = item.level || 1;
    return Math.round(basePrice * 1.0 * Math.pow(1.35, lv - 1));
  }

  levelUpFish(instanceId) {
    const item = this.placedFish.find(f => f.instanceId === instanceId);
    if (!item) return { success: false, message: '물고기를 찾을 수 없습니다.' };

    const cost = this.getFishUpgradeCost(item);
    if (this.economy.spendGold(cost)) {
      item.level = (item.level || 1) + 1;
      this.saveToStorage();
      if (this.sound) this.sound.playCoin();
      return { success: true, message: `✨ ${item.name}이(가) Lv.${item.level}로 성장했습니다!` };
    }
    return { success: false, message: '골드가 부족합니다!' };
  }

  claimVaultGold() {
    const amount = Math.round(this.vaultGold);
    if (amount <= 0) return 0;
    this.vaultGold = 0;
    this.saveToStorage();
    if (this.economy) {
      this.economy.addGold(amount);
      if (this.sound) this.sound.playCoin();
    }
    return amount;
  }

  calculateOfflineEarnings() {
    const now = Date.now();
    const last = this.lastOfflineTime || now;
    const elapsedSec = Math.max(0, (now - last) / 1000);

    if (elapsedSec < 30) {
      return { elapsedSeconds: 0, earnings: 0, hours: 0, minutes: 0 };
    }

    let gpm = this.getGPM();
    if (this.placedFish.length === 0) {
      gpm = 1;
    }

    const magLv = this.facilityLevels.magnetic_fan || 1;
    const magBonus = FACILITY_UPGRADES.find(u => u.id === 'magnetic_fan').bonuses[magLv - 1] || 0;
    const magMult = 1 + (magBonus / 100);

    const elapsedMinutes = Math.floor(elapsedSec / 60);
    const vaultMax = this.getVaultMaxCapacity();
    const potentialEarned = elapsedMinutes * gpm * magMult;
    const addedToVault = Math.min(potentialEarned, Math.max(0, vaultMax - this.vaultGold));

    const hours = Math.floor(elapsedSec / 3600);
    const minutes = Math.floor((elapsedSec % 3600) / 60);

    return {
      elapsedSeconds: Math.round(elapsedSec),
      earnings: Math.round(addedToVault),
      hours,
      minutes
    };
  }

  processOfflineAccumulation() {
    const off = this.calculateOfflineEarnings();
    if (off.earnings > 0) {
      this.vaultGold = Math.min(this.getVaultMaxCapacity(), this.vaultGold + off.earnings);
    }
    this.lastOfflineTime = Date.now();
    this.saveToStorage();
    return off;
  }

  buyTheme(themeId) {
    const info = this.getThemeInfo(themeId);
    if (!info) return { success: false, message: '존재하지 않는 테마입니다.' };
    if (this.ownedThemes.includes(themeId)) {
      this.setTheme(themeId);
      return { success: true, message: `${info.name} 테마가 적용되었습니다!` };
    }
    if (this.economy.spendGold(info.price)) {
      this.ownedThemes.push(themeId);
      this.setTheme(themeId);
      this.saveToStorage();
      if (this.sound) this.sound.playCoin();
      return { success: true, message: `🎉 ${info.name} 테마 구매 및 적용 완료!` };
    }
    return { success: false, message: '골드가 부족합니다!' };
  }

  addFishToAquarium(basketItem) {
    if (this.placedFish.length >= this.getMaxCapacity()) {
      return null;
    }
    const item = {
      instanceId: 'aq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      speciesId: basketItem.speciesId,
      name: basketItem.name,
      isShiny: !!basketItem.isShiny,
      sizeCm: basketItem.sizeCm,
      level: 1,
      addedAt: Date.now()
    };
    this.placedFish.push(item);
    this.saveToStorage();
    if (this.isOpen) this.populateTank();
    return item;
  }

  sellFishFromAquarium(instanceId) {
    const idx = this.placedFish.findIndex(f => f.instanceId === instanceId);
    if (idx === -1) return null;

    const [removed] = this.placedFish.splice(idx, 1);
    const species = this.encyclopedia.getFishData(removed.speciesId);
    let price = 50;
    if (species) {
      price = species.basePrice || 50;
      if (removed.isShiny) price = Math.round(price * 2.5);
      const lvBonus = 1 + ((removed.level || 1) - 1) * 0.25;
      price = Math.round(price * lvBonus);
    }
    if (this.economy) {
      this.economy.addGold(price);
    }
    this.saveToStorage();
    if (this.isOpen) this.populateTank();
    return { fish: removed, price };
  }

  sellAllFishFromAquarium() {
    if (this.placedFish.length === 0) return { count: 0, totalGold: 0 };
    let totalGold = 0;
    const count = this.placedFish.length;

    this.placedFish.forEach(item => {
      const species = this.encyclopedia.getFishData(item.speciesId);
      if (species) {
        let price = species.basePrice || 50;
        if (item.isShiny) price = Math.round(price * 2.5);
        const lvBonus = 1 + ((item.level || 1) - 1) * 0.25;
        totalGold += Math.round(price * lvBonus);
      }
    });

    if (this.economy) {
      this.economy.addGold(totalGold);
      if (this.sound) this.sound.playCoin();
    }
    this.placedFish = [];
    this.saveToStorage();
    if (this.isOpen) this.populateTank();
    return { count, totalGold };
  }

  open() {
    this.isOpen = true;
    this.processOfflineAccumulation();
    this.populateTank();
  }

  close() {
    this.isOpen = false;
    this.lastOfflineTime = Date.now();
    this.saveToStorage();
  }

  setTheme(themeName) {
    this.theme = themeName;
    this.saveToStorage();
  }

  populateTank() {
    this.tankFish = [];

    if (this.placedFish.length > 0) {
      this.placedFish.forEach(item => {
        const species = this.encyclopedia.getFishData(item.speciesId);
        if (species) {
          const startPos = new Vector2(
            60 + Math.random() * (this.tankWidth - 120),
            60 + Math.random() * (this.tankHeight - 120)
          );
          const fish = new Fish(species, startPos, item.isShiny);
          fish.scale = Math.min(1.2, Math.max(0.7, item.sizeCm / 40));
          this.tankFish.push(fish);
        }
      });
    } else {
      const unlocked = this.encyclopedia.getUnlockedFish();
      unlocked.slice(0, 6).forEach(species => {
        const startPos = new Vector2(
          60 + Math.random() * (this.tankWidth - 120),
          60 + Math.random() * (this.tankHeight - 120)
        );
        const fish = new Fish(species, startPos, false);
        fish.scale = 0.85;
        this.tankFish.push(fish);
      });
    }
  }

  dropFood(x, y) {
    if (this.foodFlakes.length >= 15) return false;

    let givesReward = false;
    if (this.canGetFeedReward()) {
      givesReward = true;
      this.lastFeedRewardTime = Date.now();
      localStorage.setItem('cozy_cat_aqua_feed_time_v1', this.lastFeedRewardTime.toString());
    }

    this.foodFlakes.push({
      pos: new Vector2(x, y),
      size: 4.5,
      vy: 20 + Math.random() * 15,
      vx: (Math.random() - 0.5) * 10,
      givesReward
    });
    this.sound.playDrop();
    return { dropped: true, givesReward };
  }

  update(dt) {
    if (!this.isOpen) return;

    this.animTime += dt;
    this.lastOfflineTime = Date.now();

    // 🤖 Auto-feeder logic (if unlocked)
    const autoLv = this.facilityLevels.auto_feeder || 0;
    if (autoLv > 0) {
      const intervalSec = FACILITY_UPGRADES.find(u => u.id === 'auto_feeder').bonuses[autoLv] || 180;
      if ((Date.now() - this.lastAutoFeedTime) >= intervalSec * 1000) {
        this.lastAutoFeedTime = Date.now();
        const randX = 120 + Math.random() * (this.tankWidth - 240);
        this.dropFood(randX, 20);
      }
    }

    // 🏦 Accumulate in 1-Minute Clean Batches (분 단위 정산)
    this.minuteTimer -= dt;
    if (this.minuteTimer <= 0) {
      this.minuteTimer = 60;
      const gpm = this.getGPM();
      const vaultMax = this.getVaultMaxCapacity();
      if (gpm > 0 && this.vaultGold < vaultMax) {
        this.vaultGold = Math.min(vaultMax, this.vaultGold + gpm);
        this.saveToStorage();
      }
    }

    // Update Food
    for (let i = this.foodFlakes.length - 1; i >= 0; i--) {
      const f = this.foodFlakes[i];
      f.pos.y += f.vy * dt;
      f.pos.x += f.vx * dt;
      if (f.pos.y > this.tankHeight - 40) {
        this.foodFlakes.splice(i, 1);
      }
    }

    // Update Hearts
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.pos.y += h.vy * dt;
      h.alpha -= dt * 0.8;
      if (h.alpha <= 0) this.hearts.splice(i, 1);
    }

    // Update Coin Bubbles
    for (let i = this.coinBubbles.length - 1; i >= 0; i--) {
      const b = this.coinBubbles[i];
      b.pos.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.pos.y < 30) {
        if (this.economy) this.economy.addGold(b.amount);
        this.coinBubbles.splice(i, 1);
      }
    }

    // Update Fish AI
    const bounds = {
      left: 45,
      right: this.tankWidth - 45,
      top: 45,
      bottom: this.tankHeight - 65
    };

    this.tankFish.forEach(fish => {
      fish.animTime += dt;

      let closestFood = null;
      let closestDist = 280;

      for (let i = 0; i < this.foodFlakes.length; i++) {
        const food = this.foodFlakes[i];
        const d = fish.pos.dist(food.pos);
        if (d < closestDist) {
          closestDist = d;
          closestFood = { food, index: i };
        }
      }

      if (closestFood) {
        const dir = Vector2.sub(closestFood.food.pos, fish.pos).normalize();
        fish.facing = dir.x >= 0 ? 1 : -1;
        fish.pos.add(Vector2.mult(dir, fish.data.speed * 1.4 * dt));

        if (closestDist < 12) {
          const eatenFlake = closestFood.food;
          this.foodFlakes.splice(closestFood.index, 1);
          this.sound.playBubble();

          this.hearts.push({
            pos: fish.pos.clone().add(new Vector2(0, -15)),
            vy: -30,
            alpha: 1.0
          });

          if (eatenFlake.givesReward) {
            const foodTier = this.getCurrentFoodTier();
            const foodLv = this.getFoodLevel();
            const foodLvMult = 1 + (foodLv - 1) * 0.08;
            const ancientBonus = this.theme === 'ancient' ? 1.5 : 1.0;
            const prosperityMult = (this.economy && typeof this.economy.getAquariumProsperityMultiplier === 'function') 
              ? this.economy.getAquariumProsperityMultiplier() 
              : 1.0;
            const baseAmt = Math.max(30, Math.round((fish.data.basePrice || 40) * 1.2 * ancientBonus * foodTier.bonusMult * foodLvMult));
            const rewardAmt = Math.round(baseAmt * prosperityMult);
            this.coinBubbles.push({
              pos: fish.pos.clone().add(new Vector2(0, -10)),
              amount: rewardAmt,
              size: 20,
              vy: -26 - Math.random() * 12,
              life: 25
            });
          }
        }
      } else {
        fish.wanderTimer -= dt;
        if (fish.wanderTimer <= 0) {
          fish.wanderTimer = 3 + Math.random() * 4;
          fish.wanderAngle = (Math.random() - 0.5) * Math.PI * 0.8;
          fish.facing = Math.cos(fish.wanderAngle) >= 0 ? 1 : -1;
        }

        const speed = fish.data.speed * 0.45;
        fish.vel.x = Math.cos(fish.wanderAngle) * speed;
        fish.vel.y = Math.sin(fish.wanderAngle) * speed * 0.5;
        fish.pos.add(Vector2.mult(fish.vel, dt));

        if (fish.pos.x < bounds.left) {
          fish.pos.x = bounds.left;
          fish.wanderAngle = 0;
          fish.facing = 1;
        } else if (fish.pos.x > bounds.right) {
          fish.pos.x = bounds.right;
          fish.wanderAngle = Math.PI;
          fish.facing = -1;
        }

        if (fish.pos.y < bounds.top) {
          fish.pos.y = bounds.top;
          fish.wanderAngle = Math.abs(fish.wanderAngle);
        } else if (fish.pos.y > bounds.bottom) {
          fish.pos.y = bounds.bottom;
          fish.wanderAngle = -Math.abs(fish.wanderAngle);
        }
      }
    });
  }

  draw(ctx, screenW, screenH) {
    if (!this.isOpen) return;

    ctx.save();

    // Responsive Left and Right Side Margins (Zero Overlap on PC & Mobile)
    let leftMargin = screenW <= 920 ? Math.max(160, screenW * 0.24) : 310;
    let rightMargin = screenW <= 920 ? Math.max(180, screenW * 0.30) : 380;
    let availableW = screenW - leftMargin - rightMargin;
    let availableH = screenH - 75;

    let scale = Math.min(1.0, Math.max(0.35, Math.min(availableW / this.tankWidth, availableH / this.tankHeight)));
    let centerX = leftMargin + availableW / 2;
    let centerY = 35 + availableH / 2;

    const scaledW = this.tankWidth * scale;
    const scaledH = this.tankHeight * scale;
    const startX = centerX - scaledW / 2;
    const startY = centerY - scaledH / 2;

    ctx.translate(startX, startY);
    ctx.scale(scale, scale);

    // 1. Tank Glass Frame Outer
    ctx.fillStyle = '#2b2d42';
    ctx.beginPath();
    ctx.roundRect(-12, -12, this.tankWidth + 24, this.tankHeight + 24, 18);
    ctx.fill();

    // 2. Tank Background
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, this.tankWidth, this.tankHeight, 10);
    ctx.clip();

    const themeImg = this.themeImages[this.theme];
    if (themeImg && themeImg.complete && themeImg.naturalWidth > 0) {
      ctx.drawImage(themeImg, 0, 0, this.tankWidth, this.tankHeight);

      if (this.theme === 'night_glow') {
        ctx.fillStyle = 'rgba(3, 7, 30, 0.2)';
        ctx.fillRect(0, 0, this.tankWidth, this.tankHeight);
        for (let i = 0; i < 18; i++) {
          const px = ((i * 53 + this.animTime * 15) % this.tankWidth);
          const py = ((i * 37 + Math.sin(this.animTime * 2 + i) * 25 + 300) % this.tankHeight);
          const alpha = 0.3 + 0.4 * Math.sin(this.animTime * 3 + i);
          ctx.fillStyle = i % 2 === 0 ? `rgba(6, 214, 160, ${alpha})` : `rgba(247, 37, 133, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (this.theme === 'ancient') {
        const beamAlpha = 0.12 + 0.06 * Math.sin(this.animTime * 1.5);
        ctx.fillStyle = `rgba(255, 209, 102, ${beamAlpha})`;
        ctx.beginPath();
        ctx.moveTo(100, 0);
        ctx.lineTo(280, 0);
        ctx.lineTo(420, this.tankHeight);
        ctx.lineTo(180, this.tankHeight);
        ctx.closePath();
        ctx.fill();
      } else if (this.theme === 'cosmic') {
        for (let i = 0; i < 24; i++) {
          const px = ((i * 41 + this.animTime * 8) % this.tankWidth);
          const py = ((i * 29 + Math.cos(this.animTime + i) * 20 + 200) % this.tankHeight);
          const starAlpha = 0.4 + 0.5 * Math.sin(this.animTime * 4 + i);
          ctx.fillStyle = i % 3 === 0 ? `rgba(255, 255, 255, ${starAlpha})` : `rgba(187, 134, 252, ${starAlpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (this.theme === 'sakura') {
        for (let i = 0; i < 16; i++) {
          const px = ((i * 61 + this.animTime * 22) % this.tankWidth);
          const py = ((i * 43 + Math.sin(this.animTime * 1.8 + i) * 35) % this.tankHeight);
          const petalRot = this.animTime * 1.5 + i;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(petalRot);
          ctx.fillStyle = 'rgba(255, 182, 193, 0.75)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, this.tankHeight);
      bgGrad.addColorStop(0, '#48cae4');
      bgGrad.addColorStop(0.6, '#0096c7');
      bgGrad.addColorStop(1, '#023e8a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.tankWidth, this.tankHeight);

      ctx.fillStyle = '#f4a261';
      ctx.fillRect(0, this.tankHeight - 45, this.tankWidth, 45);

      for (let i = 0; i < 12; i++) {
        const cx = 50 + i * 75;
        const cy = this.tankHeight - 45;
        const sway = Math.sin(this.animTime * 2 + i) * 8;
        ctx.strokeStyle = i % 2 === 0 ? '#ff70a6' : '#70e000';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + sway, cy - 35, cx + sway * 1.2, cy - 65);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 4. Draw Swimming Fish
    this.tankFish.forEach(fish => fish.draw(ctx));

    // 5. Draw Food Flakes
    ctx.fillStyle = '#ffbe0b';
    this.foodFlakes.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.pos.x, f.pos.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Draw Hearts
    this.hearts.forEach(h => {
      ctx.fillStyle = `rgba(255, 77, 109, ${h.alpha})`;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', h.pos.x, h.pos.y);
    });

    // 7. Draw Coin Bubbles
    this.coinBubbles.forEach(b => {
      const glow = ctx.createRadialGradient(b.pos.x, b.pos.y, 2, b.pos.x, b.pos.y, b.size);
      glow.addColorStop(0, 'rgba(255, 234, 0, 0.95)');
      glow.addColorStop(1, 'rgba(255, 183, 3, 0.45)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#d90429';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${b.amount}G`, b.pos.x, b.pos.y + 4);
    });

    // 8. Glass Highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.lineTo(this.tankWidth - 10, 20);
    ctx.stroke();

    const glassGrad = ctx.createLinearGradient(0, 0, this.tankWidth, this.tankHeight);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    glassGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0)');
    glassGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
    glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.tankWidth, this.tankHeight, 10);
    ctx.fill();

    ctx.restore();
  }
}
