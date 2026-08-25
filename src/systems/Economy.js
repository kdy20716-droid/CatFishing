/**
 * Economy, Shop, Inventory, and Upgrade Progression System
 */

export const RODS = [
  {
    id: 'rod_twig',
    name: '🌿 나뭇가지 낚싯대',
    tier: 1,
    price: 0,
    maxLineLength: 1800, // ~90m
    maxTension: 100,
    reelSpeed: 85,
    castPower: 420,
    color: '#8b5a2b',
    description: '작은 나뭇가지로 만든 정겨운 첫 낚싯대. 표층(90m)의 물고기들을 낚을 수 있습니다.'
  },
  {
    id: 'rod_bamboo',
    name: '🎋 단단 대나무 낚싯대',
    tier: 2,
    price: 450,
    maxLineLength: 2800, // ~140m
    maxTension: 160,
    reelSpeed: 105,
    castPower: 540,
    color: '#70e000',
    description: '유연하고 질긴 대나무 낚싯대. 중층 바다(140m)까지 깊숙이 낚싯줄을 내립니다.'
  },
  {
    id: 'rod_glassfiber',
    name: '🪶 낭만 글래스파이버 로드',
    tier: 3,
    price: 2200,
    maxLineLength: 4200, // ~210m
    maxTension: 240,
    reelSpeed: 130,
    castPower: 660,
    color: '#06d6a0',
    description: '유연한 탄성의 유리섬유 로드. 중층~심해 경계(210m)의 힘센 물고기를 낚아올립니다.'
  },
  {
    id: 'rod_carbon',
    name: '🖤 카본 프로 로드',
    tier: 4,
    price: 8500,
    maxLineLength: 6000, // ~300m
    maxTension: 360,
    reelSpeed: 160,
    castPower: 780,
    color: '#343a40',
    description: '가볍고 강력한 탄소 섬유 로드. 심해 어둠층(300m)의 희귀 어종과 겨룹니다.'
  },
  {
    id: 'rod_obsidian',
    name: '💎 흑요석 흑진주 로드',
    tier: 5,
    price: 28000,
    maxLineLength: 7800, // ~390m
    maxTension: 520,
    reelSpeed: 195,
    castPower: 900,
    color: '#7b2cbf',
    description: '심해 화산암과 흑진주를 가공해 극도의 인장력을 자랑합니다. 심연(390m)을 탐사합니다.'
  },
  {
    id: 'rod_titanium',
    name: '🛡️ 심해 티타늄 로드',
    tier: 6,
    price: 85000,
    maxLineLength: 9500, // ~475m
    maxTension: 720,
    reelSpeed: 235,
    castPower: 1020,
    color: '#48cae4',
    description: '수심 475m의 극심한 수압을 견디는 특수 티타늄 합금. 심연의 거대 괴수와 겨룹니다.'
  },
  {
    id: 'rod_neon',
    name: '⚡ 네온 하이드로 로드',
    tier: 7,
    price: 240000,
    maxLineLength: 11200, // ~560m
    maxTension: 1000,
    reelSpeed: 280,
    castPower: 1150,
    color: '#00f5d4',
    description: '500m 해저 바닥을 완벽 돌파! 발광 플라즈마 에너지로 560m 심해어를 매혹합니다.'
  },
  {
    id: 'rod_atlantis',
    name: '🔱 고대 아틀란티스 로드',
    tier: 8,
    price: 650000,
    maxLineLength: 12800, // ~640m
    maxTension: 1450,
    reelSpeed: 335,
    castPower: 1300,
    color: '#ffd166',
    description: '고대 해저 신전의 유물 합금 로드. 640m 초심연의 전설 물고기를 단숨에 제압합니다.'
  },
  {
    id: 'rod_aurora',
    name: '🌌 전설의 별빛 오로라 로드',
    tier: 9,
    price: 1800000,
    maxLineLength: 14200, // ~710m
    maxTension: 2100,
    reelSpeed: 395,
    castPower: 1450,
    color: '#ff007f',
    description: '별빛과 오로라가 깃든 신화의 로드. 710m 해저 바닥의 별빛 고래와 크라켄을 낚아올립니다!'
  },
  {
    id: 'rod_cosmic',
    name: '🪐 코스믹 네뷸라 신화 로드',
    tier: 10,
    price: 5000000,
    maxLineLength: 16000, // ~800m (750m 해저 바닥 완벽 정복!)
    maxTension: 3200,
    reelSpeed: 460,
    castPower: 1650,
    color: '#70e000',
    description: '우주의 성운 에너지가 응축된 궁극의 엔드게임 로드. 750m 초심연 해저의 모든 보스를 압도합니다!'
  }
];

export const BOATS = [
  {
    id: 'boat_raft',
    name: '🪵 통나무 뗏목',
    price: 0,
    speed: 90,
    maxTravelX: 2500,
    description: '해변 근처에서 잔잔하게 즐기는 기본 통나무 뗏목 (항해 2,500px).',
    drawType: 'raft'
  },
  {
    id: 'boat_duck',
    name: '🦆 포근 오리 페달보트',
    price: 350,
    speed: 135,
    maxTravelX: 5500,
    description: '귀여운 노란 오리 페달보트! 연안 바다로 신나게 나아갑니다 (항해 5,500px).',
    drawType: 'duck'
  },
  {
    id: 'boat_rowboat',
    name: '🚣 낭만 조각배',
    price: 1500,
    speed: 180,
    maxTravelX: 8500,
    description: '노를 저으며 먼바다로 나아가는 클래식 나룻배 (항해 8,500px).',
    drawType: 'rowboat'
  },
  {
    id: 'boat_motorboat',
    name: '🚤 쾌속 냥냥 모터보트',
    price: 6800,
    speed: 230,
    maxTravelX: 12000,
    description: '시원한 물살을 가르며 중원양 바다로 질주하는 모터보트 (항해 12,000px).',
    drawType: 'motorboat'
  },
  {
    id: 'boat_jetski',
    name: '⚡ 사이버 네온 제트스키',
    price: 28000,
    speed: 280,
    maxTravelX: 15500,
    description: '폭발적인 추진력으로 원양 파도를 뛰어넘는 네온 제트스키 (항해 15,500px).',
    drawType: 'jetski'
  },
  {
    id: 'boat_trawler',
    name: '🚢 원양 트롤러 어선',
    price: 95000,
    speed: 330,
    maxTravelX: 19500,
    description: '거친 파도를 뚫고 원양 심해 어군을 찾아 나서는 튼튼한 어선 (항해 19,500px).',
    drawType: 'trawler'
  },
  {
    id: 'boat_catamaran',
    name: '⛵ 쌍동선 스포츠 카타마란',
    price: 290000,
    speed: 380,
    maxTravelX: 23500,
    description: '두 개의 날렵한 선체와 트윈 세일로 바람을 가르는 스포츠 쌍동선 (항해 23,500px).',
    drawType: 'catamaran'
  },
  {
    id: 'boat_cruiser',
    name: '🛳️ 럭셔리 요트 크루저',
    price: 780000,
    speed: 430,
    maxTravelX: 27000,
    description: '고급스러운 샴페인 데크를 갖춘 쾌속 크루저 요트 (항해 27,000px).',
    drawType: 'cruiser'
  },
  {
    id: 'boat_submarine',
    name: '潜 냥냥 노란 잠수정',
    price: 2100000,
    speed: 490,
    maxTravelX: 29800,
    description: '심해 탐사 전용 첨단 고양이 잠수정 (항해 29,800px).',
    drawType: 'submarine'
  },
  {
    id: 'boat_hyper',
    name: '🛸 하이퍼 코스믹 비행정',
    price: 5500000,
    speed: 560,
    maxTravelX: 32000,
    description: '바다 끝 32,000px까지 순식간에 도달하는 우주급 비행선 (항해 32,000px).',
    drawType: 'hyper'
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
    maxDepth: 35,
    description: '기본 미끼. 수심 35m까지의 표층·연안 물고기들을 유혹합니다.',
    icon: '🍞',
    sinkSpeed: 1.0
  },
  {
    id: 'worm',
    name: '통통 갯지렁이',
    category: 'bait',
    price: 25,
    countPerBuy: 5,
    maxDepth: 80,
    description: '활발하게 꿈틀거려 수심 80m까지의 표층·중층 물고기들을 유혹합니다.',
    icon: '🪱',
    sinkSpeed: 1.25
  },
  {
    id: 'shrimp',
    name: '싱싱 핑크 생새우',
    category: 'bait',
    price: 75,
    countPerBuy: 5,
    maxDepth: 180,
    description: '고소한 냄새로 수심 180m까지의 중층·중심해 고급 어종을 유혹합니다.',
    icon: '🦐',
    sinkSpeed: 1.5
  },
  {
    id: 'lure',
    name: '반짝 야광 루어',
    category: 'bait',
    price: 200,
    countPerBuy: 3,
    maxDepth: 350,
    description: '화려하게 발광하여 수심 350m까지의 심해 어둠층과 희귀어를 유혹합니다.',
    icon: '✨',
    sinkSpeed: 1.8
  },
  {
    id: 'jelly',
    name: '🔮 발광 플랑크톤 젤리',
    category: 'bait',
    price: 380,
    countPerBuy: 3,
    maxDepth: 520,
    description: '신비롭게 번뜩이는 발광 젤리. 수심 520m까지의 초심해 희귀 어종을 매혹합니다.',
    icon: '🔮',
    sinkSpeed: 2.1
  },
  {
    id: 'pearl',
    name: '🌌 심연의 오로라 펄',
    category: 'bait',
    price: 680,
    countPerBuy: 2,
    maxDepth: 750,
    description: '오로라 광채를 뿜는 신비의 진주. 수심 750m 해저 바닥의 전설 어종을 유혹합니다.',
    icon: '🌌',
    sinkSpeed: 2.4
  },
  {
    id: 'golden',
    name: '👑 황금 크릴 엑기스',
    category: 'bait',
    price: 1200,
    countPerBuy: 2,
    maxDepth: 800,
    description: '👑 10대 전설 신화 보스가 유일하게 먹는 전설의 특급 미끼! (일반 물고기도 물지만 보스는 오직 이 미끼에만 반응)',
    icon: '👑',
    sinkSpeed: 2.6
  },
  {
    id: 'allure',
    name: '💖 환상의 현혹 페로몬',
    category: 'item',
    price: 450,
    countPerBuy: 3,
    description: '물속에서 [Q] 키 입력 시 강력한 매혹 페로몬을 방출하여 주변 넓은 범위의 모든 물고기들이 미끼로 쇄도합니다!',
    icon: '💖',
    sinkSpeed: 1.0
  },
  {
    id: 'rocket',
    name: '🚀 냥냥 로켓 폭죽',
    category: 'item',
    price: 150,
    countPerBuy: 3,
    description: '찌를 던질 때 로켓 불꽃을 뿜으며 초원거리로 날아갑니다!',
    icon: '🚀',
    sinkSpeed: 1.0
  },
  {
    id: 'bomb',
    name: '💣 심해 어군 폭탄',
    category: 'item',
    price: 250,
    countPerBuy: 2,
    description: '물속에서 [Q] 키 입력 시 폭발하여 주변의 방해 물고기를 즉시 퇴치합니다!',
    icon: '💣',
    sinkSpeed: 1.0
  },
  {
    id: 'multi_hook_2',
    name: '🪝 2중 찌 바늘 리그',
    category: 'tackle',
    price: 800,
    countPerBuy: 5,
    isTackle: true,
    hookCount: 2,
    description: '미끼 2개를 동시에 달아 한 번에 2마리를 낚아올립니다! (5회분 소모성 채비)',
    icon: '🪝',
    sinkSpeed: 1.0
  },
  {
    id: 'multi_hook_3',
    name: '🔱 3중 찌 바늘 리그',
    category: 'tackle',
    price: 2500,
    countPerBuy: 3,
    isTackle: true,
    hookCount: 3,
    description: '미끼 3개를 동시에 달아 한 번에 최대 3마리를 낚아올립니다! (3회분 소모성 채비)',
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
    price: 100,
    icon: '👒',
    perk: '평화로운 낚시 감성 +50%',
    drawType: 'straw'
  },
  {
    id: 'hat_sailor',
    name: '꼬마 마린 선원모',
    price: 500,
    icon: '⚓',
    perk: '릴링 속도 +15%',
    drawType: 'sailor'
  },
  {
    id: 'hat_frog',
    name: '개구리 우비 후드',
    price: 1500,
    icon: '🐸',
    perk: '물고기 입질 거리 +25%',
    drawType: 'frog'
  },
  {
    id: 'hat_wizard',
    name: '별빛 마법사 고깔',
    price: 6000,
    icon: '🧙‍♂️',
    perk: '밤바다 희귀 어종 확률 +30%',
    drawType: 'wizard'
  },
  {
    id: 'hat_pirate',
    name: '카리스마 해적 모자',
    price: 25000,
    icon: '🏴‍☠️',
    perk: '보물상자 & 대어 출현율 2배',
    drawType: 'pirate'
  },
  {
    id: 'hat_crown',
    name: '영롱한 황금 왕관',
    price: 100000,
    icon: '👑',
    perk: '상점 전 품목 20% 세일 할인 구매',
    drawType: 'crown'
  },
  {
    id: 'hat_radar',
    name: '📡 냥냥 레이더 모자',
    price: 150000,
    icon: '📡',
    perk: '화면 모서리 보스 레이더 & 찌 주변 음파 어군 탐지 HUD 탑재',
    drawType: 'radar'
  }
];

export const PASSIVE_UPGRADES = [
  {
    id: 'line_durability',
    name: '초강력 낚싯줄 코팅',
    maxLevel: 15,
    basePrice: 150,
    priceMult: 1.65,
    icon: '🧵',
    description: '낚싯줄의 팽팽함(Tension) 내구도를 레벨당 +15% 향상시킵니다.'
  },
  {
    id: 'sinker_weight',
    name: '고속 다이빙 메탈 추',
    maxLevel: 15,
    basePrice: 120,
    priceMult: 1.60,
    icon: '⚓',
    description: '미끼가 가라앉는 속도를 레벨당 +20% 빠르게 하여 750m 심해에 신속히 도달합니다.'
  },
  {
    id: 'reel_motor',
    name: '고성능 전동 릴 모터',
    maxLevel: 15,
    basePrice: 200,
    priceMult: 1.70,
    icon: '⚡',
    description: '릴링으로 물고기를 끌어올리는 속도를 레벨당 +10% 향상시킵니다.'
  },
  {
    id: 'bite_rate',
    name: '냥냥 매혹 유혹술',
    maxLevel: 15,
    basePrice: 220,
    priceMult: 1.65,
    icon: '🎯',
    description: '물고기가 미끼를 덥석 물 확률(입질 성공률)을 레벨당 +2.5%씩 증가시킵니다.'
  },
  {
    id: 'lucky_clover',
    name: '네잎클로버 행운 부적',
    maxLevel: 15,
    basePrice: 300,
    priceMult: 1.75,
    icon: '🍀',
    description: '행운 배율을 레벨당 +15%씩 대폭 증가시킵니다. (15Lv 풀업 시 +225% = 3.25배 행운 증폭 & 이로치 확률 상승!)'
  },
  {
    id: 'aquarium_prosperity',
    name: '아쿠아리움 풍요의 분수',
    maxLevel: 15,
    basePrice: 250,
    priceMult: 1.70,
    icon: '🏺',
    description: '아쿠아리움 물고기 밥주기 시 생성되는 금화 보상을 레벨당 +25% 증가시킵니다.'
  }
];

export const CAT_SKINS = [
  {
    id: 'skin_orange',
    name: '치즈 태비 냥이',
    icon: '🐱',
    desc: '포근하고 따뜻한 주황빛 치즈 호랑이 무늬 (기본)',
    colors: {
      body: '#f4a261',
      stripe: '#e76f51',
      belly: '#fefae0',
      innerEar: '#ffafcc',
      paw: '#ffafcc'
    }
  },
  {
    id: 'skin_mackerel',
    name: '고등어 태비 냥이',
    icon: '🐟',
    desc: '은빛 줄무늬가 매력적인 클래식 고등어 냥이',
    colors: {
      body: '#8d99ae',
      stripe: '#495057',
      belly: '#edf2f4',
      innerEar: '#ffafcc',
      paw: '#ffafcc'
    }
  },
  {
    id: 'skin_calico',
    name: '삼색이 냥이',
    icon: '🌸',
    desc: '행운을 불러오는 아름다운 삼색 털 냥이',
    colors: {
      body: '#fefae0',
      stripe: '#e76f51',
      spot: '#2b2d42',
      belly: '#ffffff',
      innerEar: '#ffafcc',
      paw: '#ffafcc'
    }
  },
  {
    id: 'skin_tuxedo',
    name: '턱시도 냥이',
    icon: '🤵',
    desc: '깔끔한 흰 양말과 검은 턱시도를 차려입은 냥이',
    colors: {
      body: '#2b2d42',
      stripe: '#1a1a24',
      belly: '#ffffff',
      innerEar: '#ffafcc',
      paw: '#ffffff'
    }
  },
  {
    id: 'skin_siamese',
    name: '샴 냥이',
    icon: '☕',
    desc: '고급스러운 크림색 몸체와 초콜릿 포인트',
    colors: {
      body: '#faedcd',
      stripe: '#6b4f3a',
      belly: '#fefae0',
      innerEar: '#4a3525',
      paw: '#4a3525'
    }
  },
  {
    id: 'skin_white',
    name: '순백 스노우 냥이',
    icon: '❄️',
    desc: '눈송이처럼 뽀송뽀송하고 순백의 털을 가진 냥이',
    colors: {
      body: '#ffffff',
      stripe: '#dee2e6',
      belly: '#f8f9fa',
      innerEar: '#ffccd5',
      paw: '#ffccd5'
    }
  },
  {
    id: 'skin_pink',
    name: '딸기우유 냥이',
    icon: '🍓',
    desc: '달콤한 딸기우유빛 솜사탕 털을 가진 냥이',
    colors: {
      body: '#ffb3c6',
      stripe: '#ff758f',
      belly: '#fff0f3',
      innerEar: '#c9184a',
      paw: '#ff4d6d'
    }
  },
  {
    id: 'skin_mint',
    name: '애플민트 냥이',
    icon: '🍃',
    desc: '상큼하고 청량한 민트빛 털과 에메랄드 무늬의 냥이',
    colors: {
      body: '#a7f3d0',
      stripe: '#34d399',
      belly: '#ecfdf5',
      innerEar: '#6ee7b7',
      paw: '#6ee7b7'
    }
  },
  {
    id: 'skin_black',
    name: '흑요석 깜냥이',
    icon: '🐈‍⬛',
    desc: '윤기 나는 밤하늘 흑단 털을 가진 신비로운 고양이',
    colors: {
      body: '#1e293b',
      stripe: '#0f172a',
      belly: '#334155',
      innerEar: '#f43f5e',
      paw: '#1e293b'
    }
  },
  {
    id: 'skin_lavender',
    name: '라벤더 요정 냥이',
    icon: '💜',
    desc: '몽환적이고 은은한 파스텔 보랏빛 라벤더 냥이',
    colors: {
      body: '#e9d5ff',
      stripe: '#c084fc',
      belly: '#faf5ff',
      innerEar: '#f472b6',
      paw: '#d8b4fe'
    }
  },
  {
    id: 'skin_golden',
    name: '황금 럭셔리 냥이',
    icon: '👑',
    desc: '황금빛 샴페인 오라와 부를 부르는 영롱한 냥이',
    colors: {
      body: '#fde047',
      stripe: '#eab308',
      belly: '#fefce8',
      innerEar: '#fb7185',
      paw: '#facc15'
    }
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

    this.catSkinId = 'skin_orange';
    this.ownedSkins = [
      'skin_orange', 'skin_mackerel', 'skin_calico', 'skin_tuxedo', 
      'skin_siamese', 'skin_white', 'skin_pink', 'skin_mint', 
      'skin_black', 'skin_lavender', 'skin_golden'
    ];

    this.currentBaitId = 'bread';
    this.useRocket = false;
    this.hookCount = 1;
    this.hookMode = 1; // 1: standard 1-hook, 2: 2-hook rig, 3: 3-hook rig

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
      reel_motor: 0,
      fish_sonar: 0,
      lucky_clover: 0,
      aquarium_prosperity: 0
    };

    // 🧺 Caught Fish Basket (잡은 물고기 보관 바구니: 상인에게 판매하거나 아쿠아리움에 수집)
    this.caughtFishBasket = [];

    // 🎯 Mini-Game ON/OFF setting
    this.isMinigameEnabled = localStorage.getItem('cozy_cat_minigame_enabled') !== 'false';

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
        this.catSkinId = data.catSkinId || 'skin_orange';
        const allSkinIds = CAT_SKINS.map(s => s.id);
        this.ownedSkins = Array.isArray(data.ownedSkins)
          ? Array.from(new Set([...data.ownedSkins, ...allSkinIds]))
          : allSkinIds;
        this.currentBaitId = data.currentBaitId || 'bread';
        this.useRocket = data.useRocket || false;
        this.hookCount = data.hookCount || 1;
        this.hookMode = data.hookMode || 1;
        this.baitInventory = Object.assign(this.baitInventory, data.baitInventory || {});
        this.upgradeLevels = Object.assign({
          line_durability: 0,
          sinker_weight: 0,
          reel_motor: 0,
          fish_sonar: 0,
          lucky_clover: 0,
          aquarium_prosperity: 0
        }, data.upgradeLevels || {});
        // Migration from legacy lucky_charm
        if (data.upgradeLevels?.lucky_charm && (!this.upgradeLevels.lucky_clover || this.upgradeLevels.lucky_clover === 0)) {
          this.upgradeLevels.lucky_clover = data.upgradeLevels.lucky_charm;
        }
        if (!Array.isArray(this.ownedBoats) || this.ownedBoats.length === 0) {
          this.ownedBoats = ['boat_raft'];
        }
        if (!Array.isArray(this.ownedRods) || this.ownedRods.length === 0) {
          this.ownedRods = ['rod_twig'];
        }
        this.caughtFishBasket = Array.isArray(data.caughtFishBasket) ? data.caughtFishBasket : [];
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
        catSkinId: this.catSkinId,
        ownedSkins: this.ownedSkins,
        currentBaitId: this.currentBaitId,
        useRocket: this.useRocket,
        hookCount: this.hookCount,
        hookMode: this.hookMode,
        baitInventory: this.baitInventory,
        upgradeLevels: this.upgradeLevels,
        caughtFishBasket: this.caughtFishBasket
      };
      localStorage.setItem('cozy_cat_economy_v1', JSON.stringify(data));
      if (this.onSaveCallback) this.onSaveCallback();
    } catch (e) {
      console.warn("Failed to save economy:", e);
    }
  }

  addFishToBasket(fish, price, exp) {
    const item = {
      basketId: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      speciesId: fish.data.id,
      name: fish.data.name,
      engName: fish.data.engName,
      zone: fish.data.zone,
      rarity: fish.data.rarity,
      isShiny: !!fish.isShiny,
      sizeCm: fish.sizeCm,
      price: price,
      exp: exp,
      caughtAt: Date.now()
    };
    this.caughtFishBasket.unshift(item);
    this.saveToStorage();
    return item;
  }

  sellFish(basketId) {
    const idx = this.caughtFishBasket.findIndex(f => f.basketId === basketId);
    if (idx !== -1) {
      const item = this.caughtFishBasket[idx];
      this.addGold(item.price);
      this.caughtFishBasket.splice(idx, 1);
      this.saveToStorage();
      return item;
    }
    return null;
  }

  sellAllFish() {
    if (this.caughtFishBasket.length === 0) return { count: 0, totalGold: 0 };
    let totalGold = 0;
    const count = this.caughtFishBasket.length;
    this.caughtFishBasket.forEach(f => {
      totalGold += f.price;
    });
    this.addGold(totalGold);
    this.caughtFishBasket = [];
    this.saveToStorage();
    return { count, totalGold };
  }

  removeFishFromBasket(basketId) {
    const idx = this.caughtFishBasket.findIndex(f => f.basketId === basketId);
    if (idx !== -1) {
      const item = this.caughtFishBasket.splice(idx, 1)[0];
      this.saveToStorage();
      return item;
    }
    return null;
  }

  equipCatSkin(skinId) {
    if (this.ownedSkins.includes(skinId)) {
      this.catSkinId = skinId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getCurrentCatSkin() {
    return CAT_SKINS.find(s => s.id === this.catSkinId) || CAT_SKINS[0];
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

  spendAllure() {
    if ((this.baitInventory['allure'] || 0) > 0) {
      this.baitInventory['allure'] -= 1;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  addGold(amount) {
    const finalAmount = Math.round(amount);
    this.gold += finalAmount;
    this.saveToStorage();
    return finalAmount;
  }

  getShopDiscountMultiplier() {
    // 👑 영롱한 황금 왕관 착용 시 상점 전 품목 20% 세일 할인!
    if (this.currentHatId === 'hat_crown') {
      return 0.80;
    }
    return 1.0;
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
    return Math.round(60 * Math.pow(1.22, this.level - 1) + this.level * 30);
  }

  getCurrentRod() {
    let found = RODS.find(r => r.id === this.currentRodId);
    if (!found) {
      this.currentRodId = 'rod_twig';
      found = RODS[0];
    }
    return found;
  }

  getCurrentBoat() {
    let found = BOATS.find(b => b.id === this.currentBoatId);
    if (!found) {
      this.currentBoatId = 'boat_raft';
      found = BOATS[0];
    }
    return found;
  }

  getCurrentHat() {
    let found = HATS.find(h => h.id === this.currentHatId);
    if (!found) {
      this.currentHatId = 'hat_none';
      found = HATS[0];
    }
    return found;
  }

  hasBait(baitId) {
    if (!baitId || baitId === 'bread') return true;
    return (this.baitInventory[baitId] || 0) > 0;
  }

  setHookMode(mode) {
    if (mode === 3 && (this.baitInventory['multi_hook_3'] || 0) > 0) {
      this.hookMode = 3;
      this.hookCount = 3;
    } else if (mode === 2 && (this.baitInventory['multi_hook_2'] || 0) > 0) {
      this.hookMode = 2;
      this.hookCount = 2;
    } else {
      this.hookMode = 1;
      this.hookCount = 1;
    }
    this.saveToStorage();
    return this.hookMode;
  }

  getAvailableHookCount() {
    if ((this.hookMode === 3 || this.hookCount === 3) && (this.baitInventory['multi_hook_3'] || 0) > 0) {
      return 3;
    }
    if ((this.hookMode === 2 || this.hookCount === 2) && (this.baitInventory['multi_hook_2'] || 0) > 0) {
      return 2;
    }
    return 1;
  }

  spendHookTackle(hookCount) {
    if (hookCount === 3 && (this.baitInventory['multi_hook_3'] || 0) > 0) {
      this.baitInventory['multi_hook_3'] -= 1;
      if (this.baitInventory['multi_hook_3'] <= 0 && this.hookMode === 3) {
        this.hookMode = 1;
        this.hookCount = 1;
      }
      this.saveToStorage();
      return true;
    }
    if (hookCount === 2 && (this.baitInventory['multi_hook_2'] || 0) > 0) {
      this.baitInventory['multi_hook_2'] -= 1;
      if (this.baitInventory['multi_hook_2'] <= 0 && this.hookMode === 2) {
        this.hookMode = 1;
        this.hookCount = 1;
      }
      this.saveToStorage();
      return true;
    }
    return false;
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
    const finalPrice = Math.round(bait.price * this.getShopDiscountMultiplier());
    if (this.spendGold(finalPrice)) {
      this.baitInventory[baitId] = (this.baitInventory[baitId] || 0) + bait.countPerBuy;
      if (bait.id === 'multi_hook_2') {
        this.hookMode = 2;
        this.hookCount = 2;
      } else if (bait.id === 'multi_hook_3') {
        this.hookMode = 3;
        this.hookCount = 3;
      }
      this.saveToStorage();
      return true;
    }
    return false;
  }

  buyRod(rodId) {
    const rod = RODS.find(r => r.id === rodId);
    if (!rod || this.ownedRods.includes(rodId)) return false;
    const finalPrice = Math.round(rod.price * this.getShopDiscountMultiplier());
    if (this.spendGold(finalPrice)) {
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
    const finalPrice = Math.round(boat.price * this.getShopDiscountMultiplier());
    if (this.spendGold(finalPrice)) {
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
    const finalPrice = Math.round(hat.price * this.getShopDiscountMultiplier());
    if (this.spendGold(finalPrice)) {
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
    const baseCost = Math.round(up.basePrice * Math.pow(up.priceMult, currentLv));
    return Math.round(baseCost * this.getShopDiscountMultiplier());
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
    const bonus = 1 + (this.upgradeLevels.line_durability || 0) * 0.15;
    return base * bonus;
  }

  getEffectiveReelSpeed() {
    const base = this.getCurrentRod().reelSpeed;
    let bonus = 1.0 + (this.upgradeLevels.reel_motor || 0) * 0.10;
    if (this.currentHatId === 'hat_sailor') bonus += 0.15;
    return base * bonus;
  }

  getEffectiveSinkSpeed() {
    const baitObj = BAITS.find(b => b.id === this.currentBaitId) || BAITS[0];
    const baitSink = baitObj.sinkSpeed || 1.0;
    const sinkerBonus = 1 + (this.upgradeLevels.sinker_weight || 0) * 0.20;
    return baitSink * sinkerBonus;
  }

  getSonarRadius() {
    // 📡 냥냥 레이더 모자 착용 시 강력한 음파 탐지 HUD 활성화 (1,800px)
    if (this.currentHatId === 'hat_radar') return 1800;
    return 0;
  }

  getBiteRateBonus() {
    // 🎯 냥냥 매혹 유혹술: 레벨당 입질 성공 확률 +2.5% 증가
    const lv = this.upgradeLevels.bite_rate || 0;
    return lv * 0.025;
  }

  getLuckMultiplier() {
    // 🍀 행운의 네잎클로버 1업당 행운 +15% 증가 (15Lv 풀업 시 +225% = 3.25배)
    let mult = 1 + (this.upgradeLevels.lucky_clover || 0) * 0.15;
    if (this.currentHatId === 'hat_pirate') mult *= 1.4;
    return mult;
  }

  getAquariumProsperityMultiplier() {
    // 🏺 아쿠아리움 밥주기 금화 보상 대폭 증가 (+Lv당 +25%)
    return 1 + (this.upgradeLevels.aquarium_prosperity || 0) * 0.25;
  }

  getBossChance() {
    // 👑 10대 전설 신화 보스 스폰 기본 확률 0.6% (0.006) + 행운 배율 연동
    const base = 0.006;
    let mult = this.getLuckMultiplier();
    if (this.currentBaitId === 'golden') mult *= 2.0; // 황금 미끼는 보스 유인 전용 2배 유지
    return base * mult;
  }

  getShinyChance(isNight = false) {
    // ✨ 이로치(Shiny) 확률: 낮 0.1% (0.001), 밤 0.5% (0.005) + 네잎클로버 업그레이드 비중 대폭 연동 (0.1% ~ 5.0% 사이로 엄격 제어)
    const baseChance = isNight ? 0.005 : 0.001;
    const multiplier = this.getLuckMultiplier(); // 네잎클로버 업그레이드 연동 (황금 미끼 보너스 제거)
    const calculated = baseChance * multiplier;
    return Math.max(0.001, Math.min(0.05, calculated));
  }

  getAttractionRadiusBonus() {
    if (this.currentHatId === 'hat_frog') return 1.35;
    return 1.0;
  }
}
