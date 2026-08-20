/**
 * Economy, Shop, Inventory, and Upgrade Progression System
 */

export const RODS = [
  {
    id: 'rod_twig',
    name: '나뭇가지 낚싯대',
    tier: 1,
    price: 0,
    maxLineLength: 1000, // ~50m
    maxTension: 100,
    reelSpeed: 190,
    castPower: 380,
    color: '#8b5a2b',
    description: '작은 나뭇가지로 만든 정겨운 첫 낚싯대. 표층(50m)의 물고기들을 낚을 수 있습니다.'
  },
  {
    id: 'rod_bamboo',
    name: '단단 대나무 낚싯대',
    tier: 2,
    price: 180,
    maxLineLength: 2400, // ~120m
    maxTension: 180,
    reelSpeed: 250,
    castPower: 520,
    color: '#70e000',
    description: '유연하고 질긴 대나무 낚싯대. 중층 바다(120m)까지 깊숙이 낚싯줄을 내립니다.'
  },
  {
    id: 'rod_carbon',
    name: '카본 프로 로드',
    tier: 3,
    price: 750,
    maxLineLength: 5200, // ~260m
    maxTension: 300,
    reelSpeed: 340,
    castPower: 680,
    color: '#343a40',
    description: '탄소 섬유로 제작되어 가볍고 튼튼합니다. 심해 어둠층(260m)의 희귀 어종과 겨룹니다.'
  },
  {
    id: 'rod_titanium',
    name: '심해 티타늄 로드',
    tier: 4,
    price: 2200,
    maxLineLength: 8400, // ~420m
    maxTension: 480,
    reelSpeed: 450,
    castPower: 850,
    color: '#48cae4',
    description: '심해의 극심한 수압을 견디는 특수 티타늄 합금. 심연의 해구(420m)를 탐사합니다.'
  },
  {
    id: 'rod_aurora',
    name: '전설의 별빛 오로라 로드',
    tier: 5,
    price: 5500,
    maxLineLength: 11000, // ~550m+
    maxTension: 850,
    reelSpeed: 580,
    castPower: 1000,
    color: '#ff006e',
    description: '별빛과 오로라가 깃든 신화의 로드. 500m 초심연의 별빛 고래와 크라켄도 낚아올립니다!'
  }
];

export const BOATS = [
  {
    id: 'boat_raft',
    name: '통나무 뗏목',
    price: 0,
    speed: 70,
    maxTravelX: 1000,
    description: '해변 근처에서 잔잔하게 즐기는 통나무 뗏목.',
    drawType: 'raft'
  },
  {
    id: 'boat_rowboat',
    name: '낭만 조각배',
    price: 250,
    speed: 120,
    maxTravelX: 2500,
    description: '노를 저으며 먼바다로 나아가는 클래식 나룻배.',
    drawType: 'rowboat'
  },
  {
    id: 'boat_cruiser',
    name: '쾌속 냥냥 어선',
    price: 900,
    speed: 180,
    maxTravelX: 4500,
    description: '원거리 원양 낚시를 위한 기동성 뛰어난 고양이 어선.',
    drawType: 'cruiser'
  },
  {
    id: 'boat_submarine',
    name: '냥냥 노란 잠수정',
    price: 3200,
    speed: 240,
    maxTravelX: 3400,
    description: '깊은 바다 한가운데까지 진출할 수 있는 최첨단 고양이 잠수정!',
    drawType: 'submarine'
  }
];

export const BAITS = [
  {
    id: 'bread',
    name: '식빵 부스러기',
    category: 'bait',
    price: 0, // Infinite
    costPerBuy: 0,
    countPerBuy: 999,
    description: '기본 미끼. 얕은 바다의 작은 물고기들이 좋아합니다.',
    icon: '🍞',
    sinkSpeed: 1.0
  },
  {
    id: 'worm',
    name: '통통 갯지렁이',
    category: 'bait',
    price: 15,
    countPerBuy: 5,
    description: '활발하게 꿈틀거려 표층과 중층의 물고기들을 유혹합니다.',
    icon: '🪱',
    sinkSpeed: 1.2
  },
  {
    id: 'shrimp',
    name: '싱싱 핑크 생새우',
    category: 'bait',
    price: 45,
    countPerBuy: 5,
    description: '고소한 냄새로 참돔, 오징어 등 중층 고급 어종이 가장 선호합니다.',
    icon: '🦐',
    sinkSpeed: 1.4
  },
  {
    id: 'lure',
    name: '반짝 야광 루어',
    category: 'bait',
    price: 120,
    countPerBuy: 3,
    description: '어두운 심해에서 화려하게 발광하여 초롱아귀와 희귀어를 유혹합니다.',
    icon: '✨',
    sinkSpeed: 1.7
  },
  {
    id: 'golden',
    name: '황금 크릴 엑기스',
    category: 'bait',
    price: 350,
    countPerBuy: 2,
    description: '전설의 바다 생물도 매혹시키는 황금빛 특급 미끼!',
    icon: '👑',
    sinkSpeed: 2.1
  },
  {
    id: 'rocket',
    name: '🚀 냥냥 로켓 폭죽',
    category: 'item',
    price: 80,
    countPerBuy: 3,
    description: '찌를 던질 때 로켓 불꽃을 뿜으며 초원거리로 날아갑니다!',
    icon: '🚀',
    sinkSpeed: 1.0
  },
  {
    id: 'bomb',
    name: '💣 심해 어군 폭탄',
    category: 'item',
    price: 120,
    countPerBuy: 2,
    description: '물속에서 우클릭 시 폭발하여 주변의 방해 물고기를 즉시 퇴치합니다!',
    icon: '💣',
    sinkSpeed: 1.0
  },
  {
    id: 'multi_hook_2',
    name: '🪝 2중 찌 바늘 리그',
    category: 'tackle',
    price: 200,
    countPerBuy: 1,
    isTackle: true,
    description: '미끼 2개를 동시에 달아 한 번에 두 마리를 낚아올립니다!',
    icon: '🪝',
    sinkSpeed: 1.0
  },
  {
    id: 'multi_hook_3',
    name: '🔱 3중 찌 바늘 리그',
    category: 'tackle',
    price: 450,
    countPerBuy: 1,
    isTackle: true,
    description: '미끼 3개를 동시에 달아 한 번에 최대 세 마리를 낚아올립니다!',
    icon: '🔱',
    sinkSpeed: 1.0
  }
];

export const HATS = [
  {
    id: 'hat_none',
    name: '맨머리 냥이',
    price: 0,
    icon: '🐱',
    perk: '자연 그대로의 귀여움',
    drawType: 'none'
  },
  {
    id: 'hat_straw',
    name: '포근 밀짚모자',
    price: 50,
    icon: '👒',
    perk: '평화로운 낚시 감성 +50%',
    drawType: 'straw'
  },
  {
    id: 'hat_sailor',
    name: '꼬마 마린 선원모',
    price: 180,
    icon: '⚓',
    perk: '릴링 속도 +15%',
    drawType: 'sailor'
  },
  {
    id: 'hat_frog',
    name: '개구리 우비 후드',
    price: 350,
    icon: '🐸',
    perk: '물고기 입질 거리 +25%',
    drawType: 'frog'
  },
  {
    id: 'hat_wizard',
    name: '별빛 마법사 고깔',
    price: 800,
    icon: '🧙‍♂️',
    perk: '밤바다 희귀 어종 확률 +30%',
    drawType: 'wizard'
  },
  {
    id: 'hat_pirate',
    name: '카리스마 해적 모자',
    price: 1600,
    icon: '🏴‍☠️',
    perk: '보물상자 & 대어 출현율 2배',
    drawType: 'pirate'
  },
  {
    id: 'hat_crown',
    name: '영롱한 황금 왕관',
    price: 3500,
    icon: '👑',
    perk: '물고기 판매 가격 +30%',
    drawType: 'crown'
  }
];

export const PASSIVE_UPGRADES = [
  {
    id: 'line_durability',
    name: '초강력 낚싯줄 코팅',
    maxLevel: 10,
    basePrice: 80,
    priceMult: 1.55,
    icon: '🧵',
    description: '낚싯줄의 팽팽함(Tension) 내구도를 레벨당 +20% 향상시킵니다.'
  },
  {
    id: 'sinker_weight',
    name: '고속 다이빙 추',
    maxLevel: 10,
    basePrice: 60,
    priceMult: 1.5,
    icon: '⚓',
    description: '미끼가 가라앉는 속도를 레벨당 +25% 빠르게 하여 500m 심해에 신속히 도달합니다.'
  },
  {
    id: 'fish_sonar',
    name: '냥냥 음파 어군 탐지기',
    maxLevel: 5,
    basePrice: 200,
    priceMult: 2.0,
    icon: '📡',
    description: '수심 500m 전 구역의 물고기 위치와 ✨ 이로치 여부를 HUD에 표시합니다.'
  },
  {
    id: 'lucky_charm',
    name: '황금 마네키네코 방울',
    maxLevel: 10,
    basePrice: 120,
    priceMult: 1.65,
    icon: '🔔',
    description: '✨ 이로치(Shiny) 황금 반짝이 물고기 출현 확률을 레벨당 +10% 높여줍니다.'
  }
];

export class Economy {
  constructor() {
    this.gold = 50; // Starting money
    this.exp = 0;
    this.level = 1;

    this.currentRodId = 'rod_twig';
    this.ownedRods = ['rod_twig'];

    this.currentBoatId = 'boat_raft';
    this.ownedBoats = ['boat_raft'];

    this.currentHatId = 'hat_none';
    this.ownedHats = ['hat_none'];

    this.currentBaitId = 'bread';
    this.useRocket = false;
    this.hookCount = 1;

    this.baitInventory = {
      bread: 999,
      worm: 3,
      shrimp: 0,
      lure: 0,
      golden: 0,
      rocket: 2,
      bomb: 2,
      multi_hook_2: 0,
      multi_hook_3: 0
    };

    this.upgradeLevels = {
      line_durability: 0,
      sinker_weight: 0,
      fish_sonar: 0,
      lucky_charm: 0
    };

    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('cozy_cat_economy_v1');
      if (saved) {
        const data = JSON.parse(saved);
        this.gold = data.gold ?? 50;
        this.exp = data.exp ?? 0;
        this.level = data.level ?? 1;
        this.currentRodId = data.currentRodId || 'rod_twig';
        this.ownedRods = data.ownedRods || ['rod_twig'];
        this.currentBoatId = data.currentBoatId || 'boat_raft';
        this.ownedBoats = data.ownedBoats || ['boat_raft'];
        this.currentHatId = data.currentHatId || 'hat_none';
        this.ownedHats = data.ownedHats || ['hat_none'];
        this.currentBaitId = data.currentBaitId || 'bread';
        this.useRocket = data.useRocket || false;
        this.hookCount = data.hookCount || 1;
        this.baitInventory = Object.assign(this.baitInventory, data.baitInventory || {});
        this.upgradeLevels = Object.assign(this.upgradeLevels, data.upgradeLevels || {});
      }
    } catch (e) {
      console.warn("Failed to load economy:", e);
    }
  }

  saveToStorage() {
    try {
      const data = {
        gold: this.gold,
        exp: this.exp,
        level: this.level,
        currentRodId: this.currentRodId,
        ownedRods: this.ownedRods,
        currentBoatId: this.currentBoatId,
        ownedBoats: this.ownedBoats,
        currentHatId: this.currentHatId,
        ownedHats: this.ownedHats,
        currentBaitId: this.currentBaitId,
        useRocket: this.useRocket,
        hookCount: this.hookCount,
        baitInventory: this.baitInventory,
        upgradeLevels: this.upgradeLevels
      };
      localStorage.setItem('cozy_cat_economy_v1', JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save economy:", e);
    }
  }

  spendBomb() {
    if ((this.baitInventory['bomb'] || 0) > 0) {
      this.baitInventory['bomb'] -= 1;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  spendRocket() {
    if ((this.baitInventory['rocket'] || 0) > 0) {
      this.baitInventory['rocket'] -= 1;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  addGold(amount) {
    // Hat bonus: Golden Crown (+30%)
    let mult = 1.0;
    if (this.currentHatId === 'hat_crown') mult += 0.3;
    const finalAmount = Math.round(amount * mult);
    this.gold += finalAmount;
    this.saveToStorage();
    return finalAmount;
  }

  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  addExp(amount) {
    this.exp += amount;
    const expNeeded = this.getExpForNextLevel();
    let leveledUp = false;
    while (this.exp >= expNeeded) {
      this.exp -= expNeeded;
      this.level += 1;
      leveledUp = true;
    }
    this.saveToStorage();
    return leveledUp;
  }

  getExpForNextLevel() {
    return Math.round(50 * Math.pow(1.35, this.level - 1));
  }

  getCurrentRod() {
    return RODS.find(r => r.id === this.currentRodId) || RODS[0];
  }

  getCurrentBoat() {
    return BOATS.find(b => b.id === this.currentBoatId) || BOATS[0];
  }

  getCurrentHat() {
    return HATS.find(h => h.id === this.currentHatId) || HATS[0];
  }

  hasBait(baitId) {
    if (!baitId || baitId === 'bread') return true;
    return (this.baitInventory[baitId] || 0) > 0;
  }

  consumeBait() {
    if (this.currentBaitId === 'bread') return 'bread';
    if (this.hasBait(this.currentBaitId)) {
      const usedBait = this.currentBaitId;
      this.baitInventory[usedBait] -= 1;
      if (this.baitInventory[usedBait] <= 0) {
        this.currentBaitId = 'bread'; // Fallback to free bread when depleted
      }
      this.saveToStorage();
      return usedBait;
    }
    // If player somehow had 0, fallback to bread
    this.currentBaitId = 'bread';
    this.saveToStorage();
    return 'bread';
  }

  buyBait(baitId) {
    const bait = BAITS.find(b => b.id === baitId);
    if (!bait || bait.price === 0) return false;
    if (bait.isTackle && (this.baitInventory[baitId] || 0) >= 1) return false; // Already owned
    if (this.spendGold(bait.price)) {
      this.baitInventory[baitId] = (this.baitInventory[baitId] || 0) + bait.countPerBuy;
      if (bait.id === 'multi_hook_2') this.hookCount = 2;
      if (bait.id === 'multi_hook_3') this.hookCount = 3;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  buyRod(rodId) {
    const rod = RODS.find(r => r.id === rodId);
    if (!rod || this.ownedRods.includes(rodId)) return false;
    if (this.spendGold(rod.price)) {
      this.ownedRods.push(rodId);
      this.currentRodId = rodId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  equipRod(rodId) {
    if (this.ownedRods.includes(rodId)) {
      this.currentRodId = rodId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  buyBoat(boatId) {
    const boat = BOATS.find(b => b.id === boatId);
    if (!boat || this.ownedBoats.includes(boatId)) return false;
    if (this.spendGold(boat.price)) {
      this.ownedBoats.push(boatId);
      this.currentBoatId = boatId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  equipBoat(boatId) {
    if (this.ownedBoats.includes(boatId)) {
      this.currentBoatId = boatId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  buyHat(hatId) {
    const hat = HATS.find(h => h.id === hatId);
    if (!hat || this.ownedHats.includes(hatId)) return false;
    if (this.spendGold(hat.price)) {
      this.ownedHats.push(hatId);
      this.currentHatId = hatId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  equipHat(hatId) {
    if (this.ownedHats.includes(hatId)) {
      this.currentHatId = hatId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getUpgradeCost(upgradeId) {
    const up = PASSIVE_UPGRADES.find(u => u.id === upgradeId);
    if (!up) return 0;
    const currentLv = this.upgradeLevels[upgradeId] || 0;
    if (currentLv >= up.maxLevel) return -1; // Max level
    return Math.round(up.basePrice * Math.pow(up.priceMult, currentLv));
  }

  buyUpgrade(upgradeId) {
    const cost = this.getUpgradeCost(upgradeId);
    if (cost <= 0) return false;
    if (this.spendGold(cost)) {
      this.upgradeLevels[upgradeId] = (this.upgradeLevels[upgradeId] || 0) + 1;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Calculated Effective Stats
  getEffectiveTensionMax() {
    const base = this.getCurrentRod().maxTension;
    const bonus = 1 + (this.upgradeLevels.line_durability || 0) * 0.20;
    return base * bonus;
  }

  getEffectiveReelSpeed() {
    const base = this.getCurrentRod().reelSpeed;
    let bonus = 1.0;
    if (this.currentHatId === 'hat_sailor') bonus += 0.15;
    return base * bonus;
  }

  getEffectiveSinkSpeed() {
    const baitObj = BAITS.find(b => b.id === this.currentBaitId) || BAITS[0];
    const baitSink = baitObj.sinkSpeed || 1.0;
    const sinkerBonus = 1 + (this.upgradeLevels.sinker_weight || 0) * 0.25;
    return baitSink * sinkerBonus;
  }

  getLuckMultiplier() {
    let mult = 1 + (this.upgradeLevels.lucky_charm || 0) * 0.15;
    if (this.currentHatId === 'hat_pirate') mult *= 1.5;
    return mult;
  }

  getShinyChance() {
    const lv = this.upgradeLevels.lucky_charm || 0;
    let chance = 0.12 + lv * 0.05; // 12% ~ 62%
    if (this.currentHatId === 'hat_pirate') chance += 0.15;
    return Math.min(0.75, chance);
  }

  getAttractionRadiusBonus() {
    if (this.currentHatId === 'hat_frog') return 1.35;
    return 1.0;
  }
}
