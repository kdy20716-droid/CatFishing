/**
 * Fish Encyclopedia & Species Database (0m ~ 500m+ Full Oceanic Ecosystem)
 * Detailed ecological data, 5 depth layers, rarity, and catch logs
 */

export const FISH_SPECIES = [
  // =========================================================
  // --- Zone 1: 표층 바다 (Surface Shallows: 0 ~ 30m) ---
  // =========================================================
  {
    id: 'baby_anchovy',
    name: '아기 멸치',
    engName: 'Baby Anchovy',
    zone: 'shallow',
    minDepth: 1,
    maxDepth: 18,
    rarity: 'common',
    basePrice: 12,
    baseExp: 10,
    sizeRange: [5, 12],
    favBait: ['bread', 'worm', 'shrimp', 'golden'],
    baitSize: 'small',
    speed: 55,
    strength: 12,
    description: '바다의 반짝이는 꼬마 요정. 작아서 큰 물고기들이 아주 좋아하는 특급 간식이에요.',
    colors: { body: '#a0c4ff', belly: '#e0f0ff', fin: '#70a8ff', pattern: '#ffffff' },
    drawType: 'anchovy'
  },
  {
    id: 'rainbow_guppy',
    name: '무지개 구피',
    engName: 'Rainbow Guppy',
    zone: 'shallow',
    minDepth: 2,
    maxDepth: 25,
    rarity: 'common',
    basePrice: 18,
    baseExp: 15,
    sizeRange: [8, 16],
    favBait: ['bread', 'worm', 'golden'],
    baitSize: 'small',
    speed: 45,
    strength: 15,
    description: '물결을 따라 살랑거리는 일곱 빛깔 지느러미. 보고만 있어도 마음이 평화로워집니다.',
    colors: { body: '#ffadad', belly: '#ffd6a5', fin: '#caffbf', pattern: '#9bf6ff' },
    drawType: 'guppy'
  },
  {
    id: 'clownfish',
    name: '니모 흰동가리',
    engName: 'Cozy Clownfish',
    zone: 'shallow',
    minDepth: 3,
    maxDepth: 28,
    rarity: 'uncommon',
    basePrice: 35,
    baseExp: 25,
    sizeRange: [10, 18],
    favBait: ['worm', 'shrimp', 'golden'],
    baitSize: 'small',
    speed: 50,
    strength: 22,
    description: '말미잘 집에서 잠시 산책 나온 호기심쟁이 물고기. 하얀 줄무늬가 깜찍합니다.',
    colors: { body: '#ff7b00', belly: '#ff9e00', fin: '#e85d04', pattern: '#ffffff', border: '#212529' },
    drawType: 'clownfish'
  },
  {
    id: 'pufferfish',
    name: '뽈록 복어',
    engName: 'Chubby Puffer',
    zone: 'shallow',
    minDepth: 4,
    maxDepth: 30,
    rarity: 'uncommon',
    basePrice: 45,
    baseExp: 35,
    sizeRange: [15, 30],
    favBait: ['shrimp', 'worm', 'golden'],
    baitSize: 'medium',
    speed: 35,
    strength: 30,
    description: '조금만 놀라도 빵빵하게 부풀어 올라요! 둥글둥글 귀여운 바다의 복덩이.',
    colors: { body: '#fdffb6', belly: '#fffffc', fin: '#e9edc9', spot: '#d4a373' },
    drawType: 'pufferfish'
  },
  {
    id: 'pink_jellyfish',
    name: '말랑 해파리',
    engName: 'Jelly Bloom',
    zone: 'shallow',
    minDepth: 2,
    maxDepth: 30,
    rarity: 'common',
    basePrice: 25,
    baseExp: 20,
    sizeRange: [12, 25],
    favBait: ['bread', 'worm', 'shrimp', 'golden'],
    baitSize: 'small',
    speed: 25,
    strength: 16,
    description: '두둥실 춤추듯 떠다니는 젤리 같은 친구. 물속을 몽환적으로 물들입니다.',
    colors: { body: '#ffc6ff', glow: '#bdb2ff', tentacle: '#e8c2ff' },
    drawType: 'jellyfish'
  },
  {
    id: 'yellow_butterfly',
    name: '노랑 나비고기',
    engName: 'Butterfly Fish',
    zone: 'shallow',
    minDepth: 5,
    maxDepth: 30,
    rarity: 'uncommon',
    basePrice: 50,
    baseExp: 35,
    sizeRange: [12, 22],
    favBait: ['worm', 'shrimp', 'golden'],
    baitSize: 'small',
    speed: 52,
    strength: 24,
    description: '산호초 사이를 나비처럼 우아하게 날아다니는 샛노란 귀염둥이 물고기.',
    colors: { body: '#ffd166', stripe: '#111', fin: '#ffb703' },
    drawType: 'butterfly'
  },
  {
    id: 'flounder',
    name: '꼬마 넙치 가자미',
    engName: 'Sand Flounder',
    zone: 'shallow',
    minDepth: 12,
    maxDepth: 30,
    rarity: 'common',
    basePrice: 38,
    baseExp: 28,
    sizeRange: [18, 35],
    favBait: ['worm', 'shrimp', 'bread'],
    baitSize: 'small',
    speed: 38,
    strength: 28,
    description: '모래 바닥에 납작하게 엎드려 눈만 깜빡이는 모래 속 숨바꼭질 달인.',
    colors: { body: '#d4a373', belly: '#fefae0', spot: '#8c5835' },
    drawType: 'flounder'
  },

  // =========================================================
  // --- Zone 2: 중층 바다 (Twilight Zone: 30 ~ 100m) ---
  // =========================================================
  {
    id: 'pink_sea_bream',
    name: '분홍 참돔',
    engName: 'Red Sea Bream',
    zone: 'mid',
    minDepth: 30,
    maxDepth: 85,
    rarity: 'uncommon',
    basePrice: 75,
    baseExp: 50,
    sizeRange: [30, 65],
    favBait: ['shrimp', 'lure', 'live_small', 'golden'],
    baitSize: 'medium',
    speed: 60,
    strength: 42,
    description: '바다의 귀공자! 은은한 분홍빛 비늘에 푸른 에메랄드 반점이 콕콕 박혀있습니다.',
    colors: { body: '#ff4d6d', belly: '#ffb3c1', fin: '#c9184a', spot: '#80ffdb' },
    drawType: 'bream'
  },
  {
    id: 'flash_mackerel',
    name: '번개 고등어',
    engName: 'Flash Mackerel',
    zone: 'mid',
    minDepth: 32,
    maxDepth: 90,
    rarity: 'common',
    basePrice: 55,
    baseExp: 42,
    sizeRange: [25, 45],
    favBait: ['worm', 'shrimp', 'lure', 'golden'],
    baitSize: 'medium',
    speed: 85,
    strength: 38,
    description: '등 푸른 물결 무늬가 매력적인 날쌘돌이. 낚싯대를 팽팽하게 끌어당깁니다.',
    colors: { body: '#0077b6', belly: '#caf0f8', fin: '#023e8a', stripe: '#03045e' },
    drawType: 'mackerel'
  },
  {
    id: 'inky_squid',
    name: '잉크 오징어',
    engName: 'Inky Squid',
    zone: 'mid',
    minDepth: 35,
    maxDepth: 95,
    rarity: 'rare',
    basePrice: 110,
    baseExp: 70,
    sizeRange: [20, 45],
    favBait: ['shrimp', 'lure', 'live_small', 'golden'],
    baitSize: 'medium',
    speed: 70,
    strength: 48,
    description: '지느러미를 펄럭이며 제트 분사로 질주하는 오징어. 밤바다에서 은은하게 빛납니다.',
    colors: { body: '#e0aaff', belly: '#ffffff', tentacle: '#c77dff', glow: '#9d4edd' },
    drawType: 'squid'
  },
  {
    id: 'silver_ribbon',
    name: '은빛 갈치',
    engName: 'Silver Ribbonfish',
    zone: 'mid',
    minDepth: 40,
    maxDepth: 100,
    rarity: 'rare',
    basePrice: 135,
    baseExp: 85,
    sizeRange: [60, 130],
    favBait: ['shrimp', 'lure', 'live_small', 'golden'],
    baitSize: 'large',
    speed: 55,
    strength: 52,
    description: '달빛을 받아 반짝이는 은빛 칼날 같은 물고기. 우아하게 꼿꼿이 서서 헤엄쳐요.',
    colors: { body: '#e9ecef', belly: '#f8f9fa', fin: '#adb5bd', shine: '#ffffff' },
    drawType: 'ribbon'
  },
  {
    id: 'sea_turtle',
    name: '유유자적 바다거북',
    engName: 'Gentle Sea Turtle',
    zone: 'mid',
    minDepth: 35,
    maxDepth: 100,
    rarity: 'rare',
    basePrice: 185,
    baseExp: 110,
    sizeRange: [50, 110],
    favBait: ['shrimp', 'golden'],
    baitSize: 'large',
    speed: 30,
    strength: 65,
    description: '수백 년 동안 평화롭게 대양을 누빈 바다의 현자. 묵직하고 느긋합니다.',
    colors: { shell: '#2d6a4f', body: '#74c69d', pattern: '#1b4332' },
    drawType: 'turtle'
  },
  {
    id: 'flying_fish',
    name: '날개 날치',
    engName: 'Winged Flying Fish',
    zone: 'mid',
    minDepth: 30,
    maxDepth: 75,
    rarity: 'uncommon',
    basePrice: 85,
    baseExp: 60,
    sizeRange: [20, 35],
    favBait: ['worm', 'shrimp', 'golden'],
    baitSize: 'small',
    speed: 90,
    strength: 36,
    description: '물속을 전속력으로 질주하다가 수면 위로 솟구쳐 활공하는 비행 물고기.',
    colors: { body: '#48cae4', fin: '#90e0ef', wing: '#ade8f4' },
    drawType: 'flying'
  },
  {
    id: 'golden_carp_bream',
    name: '비단 잉어돔',
    engName: 'Golden Koi Bream',
    zone: 'mid',
    minDepth: 45,
    maxDepth: 100,
    rarity: 'rare',
    basePrice: 160,
    baseExp: 95,
    sizeRange: [40, 75],
    favBait: ['shrimp', 'lure', 'golden'],
    baitSize: 'medium',
    speed: 48,
    strength: 55,
    description: '행운을 가져다준다는 황금빛 붉은 비단 무늬의 성스러운 돔.',
    colors: { body: '#f77f00', belly: '#fcbf49', spot: '#d62828' },
    drawType: 'koibream'
  },
  {
    id: 'blue_marlin',
    name: '청새치',
    engName: 'Royal Blue Marlin',
    zone: 'mid',
    minDepth: 50,
    maxDepth: 100,
    rarity: 'epic',
    basePrice: 240,
    baseExp: 150,
    sizeRange: [120, 250],
    favBait: ['live_small', 'lure', 'golden'],
    baitSize: 'large',
    speed: 95,
    strength: 85,
    description: '날카로운 검과 거대한 돛 지느러미를 가진 대양의 쾌속 전사!',
    colors: { body: '#03045e', belly: '#0077b6', fin: '#0096c7', beak: '#023e8a' },
    drawType: 'marlin'
  },

  // =========================================================
  // --- Zone 3: 심해 어둠층 (Midnight Zone: 100 ~ 250m) ---
  // =========================================================
  {
    id: 'anglerfish',
    name: '발광 초롱아귀',
    engName: 'Luminous Angler',
    zone: 'deep',
    minDepth: 100,
    maxDepth: 210,
    rarity: 'rare',
    basePrice: 220,
    baseExp: 140,
    sizeRange: [35, 75],
    favBait: ['lure', 'live_small', 'golden'],
    baitSize: 'medium',
    speed: 40,
    strength: 68,
    description: '이마에 달린 신비한 발광 초롱으로 칠흑 같은 어둠을 밝히며 호기심 많은 먹이를 노립니다.',
    colors: { body: '#3a0ca3', light: '#4cc9f0', fin: '#480ca8', teeth: '#f72585' },
    drawType: 'angler'
  },
  {
    id: 'giant_oarfish',
    name: '전설의 산갈치',
    engName: 'Giant Oarfish',
    zone: 'deep',
    minDepth: 120,
    maxDepth: 240,
    rarity: 'epic',
    basePrice: 420,
    baseExp: 260,
    sizeRange: [200, 480],
    favBait: ['live_small', 'lure', 'golden'],
    baitSize: 'large',
    speed: 50,
    strength: 95,
    description: '바다의 신룡이라 불리는 거대한 은빛 띠 물고기. 붉은 볏을 펄럭이며 심해를 가릅니다.',
    colors: { body: '#e0e1dd', belly: '#f8f9fa', fin: '#e63946', crest: '#d90429' },
    drawType: 'oarfish'
  },
  {
    id: 'blobfish',
    name: '찌그러진 블롭피쉬',
    engName: 'Derpy Blobfish',
    zone: 'deep',
    minDepth: 130,
    maxDepth: 250,
    rarity: 'rare',
    basePrice: 190,
    baseExp: 120,
    sizeRange: [25, 50],
    favBait: ['worm', 'shrimp', 'lure', 'golden'],
    baitSize: 'medium',
    speed: 25,
    strength: 45,
    description: '심해의 엄청난 수압 속에서는 완벽하지만, 물 밖으로 나오면 멍충미 넘치게 변해요.',
    colors: { body: '#ffafcc', nose: '#ff758f', mouth: '#c9184a' },
    drawType: 'blobfish'
  },
  {
    id: 'lantern_shark',
    name: '심해 랜턴 상어',
    engName: 'Velvet Lantern Shark',
    zone: 'deep',
    minDepth: 140,
    maxDepth: 250,
    rarity: 'rare',
    basePrice: 280,
    baseExp: 180,
    sizeRange: [40, 80],
    favBait: ['live_small', 'lure', 'golden'],
    baitSize: 'medium',
    speed: 65,
    strength: 75,
    description: '배 전체에서 청록색 자체 발광 빛을 뿜어내며 심해의 어둠을 순찰하는 미니 상어.',
    colors: { body: '#1f2421', belly: '#52b788', glow: '#74c69d', eye: '#52b788' },
    drawType: 'shark'
  },
  {
    id: 'giant_octopus',
    name: '심해 대왕 문어',
    engName: 'Deep Giant Octopus',
    zone: 'deep',
    minDepth: 120,
    maxDepth: 230,
    rarity: 'rare',
    basePrice: 310,
    baseExp: 200,
    sizeRange: [80, 180],
    favBait: ['shrimp', 'lure', 'live_small', 'golden'],
    baitSize: 'large',
    speed: 40,
    strength: 82,
    description: '바위틈에 도사리고 있다가 강력한 빨판 다리로 낚싯대를 꽉 움켜쥐는 영리한 심해 사냥꾼.',
    colors: { body: '#6a040f', tentacle: '#9d0208', sucker: '#ffba08' },
    drawType: 'octopus'
  },
  {
    id: 'horseshoe_crab',
    name: '고대 투구게',
    engName: 'Horseshoe Crab',
    zone: 'deep',
    minDepth: 110,
    maxDepth: 220,
    rarity: 'uncommon',
    basePrice: 150,
    baseExp: 90,
    sizeRange: [30, 60],
    favBait: ['worm', 'shrimp', 'golden'],
    baitSize: 'medium',
    speed: 25,
    strength: 50,
    description: '파란색 피를 지닌 고대의 살아있는 화석. 단단한 돔 껍질로 바닥을 기어 다닙니다.',
    colors: { shell: '#6c584c', belly: '#a98467', tail: '#4a3b32' },
    drawType: 'crab'
  },
  {
    id: 'sunken_chest',
    name: '황금 보물상자',
    engName: 'Sunken Pirate Chest',
    zone: 'deep',
    minDepth: 100,
    maxDepth: 250,
    rarity: 'epic',
    basePrice: 550,
    baseExp: 350,
    sizeRange: [40, 60],
    favBait: ['lure', 'golden', 'shrimp', 'worm', 'bread'],
    baitSize: 'large',
    speed: 0,
    strength: 90,
    description: '먼 옛날 카리브 해적선에서 가라앉은 황금 보물상자! 금화와 보석이 가득 들어있어요.',
    colors: { wood: '#582f0e', gold: '#ffd166', metal: '#7f4f24' },
    drawType: 'chest'
  },
  {
    id: 'message_bottle',
    name: '유리병 편지',
    engName: 'Message in a Bottle',
    zone: 'deep',
    minDepth: 100,
    maxDepth: 250,
    rarity: 'uncommon',
    basePrice: 120,
    baseExp: 80,
    sizeRange: [20, 30],
    favBait: ['bread', 'worm', 'shrimp', 'lure', 'golden'],
    baitSize: 'small',
    speed: 15,
    strength: 20,
    description: '누군가의 따뜻한 소망과 꿈이 담긴 빈티지 유리병. 열어보면 힐링 쪽지가 들어있어요.',
    colors: { glass: '#a8dadc', cork: '#bc6c25', paper: '#fefae0' },
    drawType: 'bottle'
  },

  // =========================================================
  // --- Zone 4: 심연의 해구 (Abyssal Trench: 250 ~ 400m) ---
  // =========================================================
  {
    id: 'coelacanth',
    name: '고대 실러캔스',
    engName: 'Living Coelacanth',
    zone: 'abyss',
    minDepth: 250,
    maxDepth: 380,
    rarity: 'epic',
    basePrice: 480,
    baseExp: 320,
    sizeRange: [80, 160],
    favBait: ['live_small', 'lure', 'golden'],
    baitSize: 'large',
    speed: 45,
    strength: 98,
    description: '4억 년 전부터 변함없이 심해의 해구를 지켜온 살아있는 전설의 화석.',
    colors: { body: '#14213d', belly: '#2b2d42', spot: '#e5e5e5', fin: '#001219' },
    drawType: 'coelacanth'
  },
  {
    id: 'phantom_ray',
    name: '유령 가오리',
    engName: 'Phantom Manta Ray',
    zone: 'abyss',
    minDepth: 260,
    maxDepth: 390,
    rarity: 'epic',
    basePrice: 520,
    baseExp: 350,
    sizeRange: [120, 240],
    favBait: ['lure', 'live_small', 'golden'],
    baitSize: 'large',
    speed: 55,
    strength: 105,
    description: '거대한 날개를 펄럭이며 우주처럼 깊은 해구를 비행하는 푸른 영혼의 가오리.',
    colors: { body: '#03045e', belly: '#0077b6', glow: '#48cae4', pattern: '#90e0ef' },
    drawType: 'ray'
  },
  {
    id: 'megamouth',
    name: '거대 주둥이 메가마우스',
    engName: 'Megamouth Shark',
    zone: 'abyss',
    minDepth: 270,
    maxDepth: 400,
    rarity: 'epic',
    basePrice: 620,
    baseExp: 420,
    sizeRange: [250, 550],
    favBait: ['live_small', 'lure', 'golden'],
    baitSize: 'large',
    speed: 35,
    strength: 120,
    description: '빛나는 거대한 입을 벌려 발광 플랑크톤을 집어삼키는 심연의 거인 상어.',
    colors: { body: '#2b2d42', belly: '#8d99ae', mouth: '#ff758f', glow: '#edf2f4' },
    drawType: 'megamouth'
  },
  {
    id: 'glass_octopus',
    name: '투명 유리문어',
    engName: 'Glass Octopus',
    zone: 'abyss',
    minDepth: 280,
    maxDepth: 400,
    rarity: 'epic',
    basePrice: 580,
    baseExp: 380,
    sizeRange: [30, 60],
    favBait: ['lure', 'golden', 'shrimp'],
    baitSize: 'medium',
    speed: 45,
    strength: 88,
    description: '온몸이 투명한 유리 크리스탈처럼 빛나며 내장과 눈동자만 영롱하게 보입니다.',
    colors: { body: '#caf0f8', organ: '#ffd166', eye: '#ff006e' },
    drawType: 'glass_octo'
  },
  {
    id: 'dragonfish',
    name: '심연의 잠자리물고기',
    engName: 'Abyssal Dragonfish',
    zone: 'abyss',
    minDepth: 260,
    maxDepth: 390,
    rarity: 'rare',
    basePrice: 380,
    baseExp: 240,
    sizeRange: [25, 50],
    favBait: ['lure', 'golden'],
    baitSize: 'medium',
    speed: 60,
    strength: 80,
    description: '긴 수염 끝에 적색 발광기를 달고 먹이를 유인하는 심해의 작은 용.',
    colors: { body: '#000814', fin: '#001d3d', light: '#d90429' },
    drawType: 'dragonfish'
  },
  {
    id: 'ghost_shark',
    name: '메갈로돈 유령',
    engName: 'Phantom Megalodon',
    zone: 'abyss',
    minDepth: 300,
    maxDepth: 400,
    rarity: 'legendary',
    basePrice: 850,
    baseExp: 600,
    sizeRange: [350, 700],
    favBait: ['live_small', 'golden'],
    baitSize: 'large',
    speed: 75,
    strength: 140,
    description: '고대 바다를 지배했던 최강 포식자의 영혼. 푸른 도깨비불을 두르고 다닙니다.',
    colors: { body: '#03045e', belly: '#4cc9f0', ghost: '#7209b7' },
    drawType: 'ghost_shark'
  },
  {
    id: 'abyssal_jellyfish',
    name: '심연의 황금 해파리',
    engName: 'Golden Abyssal Jelly',
    zone: 'abyss',
    minDepth: 270,
    maxDepth: 400,
    rarity: 'epic',
    basePrice: 490,
    baseExp: 330,
    sizeRange: [40, 90],
    favBait: ['lure', 'golden'],
    baitSize: 'medium',
    speed: 28,
    strength: 78,
    description: '어두운 해구 깊은 곳에서 황금빛 오로라를 뿜어내는 거대한 심해 해파리.',
    colors: { body: '#ffd166', glow: '#ffb703', tentacle: '#f77f00' },
    drawType: 'gold_jelly'
  },

  // =========================================================
  // --- Zone 5: 미지의 초심연 (Hadal Outer Abyss: 400 ~ 520m+) ---
  // =========================================================
  {
    id: 'star_whale',
    name: '별빛 고래',
    engName: 'Cosmic Star Whale',
    zone: 'hadal',
    minDepth: 420,
    maxDepth: 520,
    rarity: 'mythic',
    basePrice: 1500,
    baseExp: 1200,
    sizeRange: [450, 950],
    favBait: ['golden', 'live_small'],
    baitSize: 'large',
    speed: 38,
    strength: 180,
    description: '밤하늘의 은하수를 등어리에 품고 헤엄치는 바다의 전설. 낚는 순간 우주가 펼쳐집니다.',
    colors: { body: '#0d1b2a', belly: '#1b263b', star: '#ffd166', glow: '#7209b7' },
    drawType: 'starwhale'
  },
  {
    id: 'kraken',
    name: '심연의 고대신 크라켄',
    engName: 'Ancient Abyssal Kraken',
    zone: 'hadal',
    minDepth: 430,
    maxDepth: 520,
    rarity: 'mythic',
    basePrice: 1800,
    baseExp: 1500,
    sizeRange: [500, 1100],
    favBait: ['golden', 'live_small'],
    baitSize: 'large',
    speed: 55,
    strength: 210,
    description: '전설 속의 초대형 크라켄. 붉은 황금빛 촉수로 심해 해구를 완전히 뒤흔듭니다!',
    colors: { body: '#590d22', tentacle: '#a4133c', eye: '#ffb703', rune: '#ff4d6d' },
    drawType: 'kraken'
  },
  {
    id: 'leviathan',
    name: '바다의 수호신 레비아탄',
    engName: 'Ocean Guardian Leviathan',
    zone: 'hadal',
    minDepth: 450,
    maxDepth: 520,
    rarity: 'mythic',
    basePrice: 2200,
    baseExp: 2000,
    sizeRange: [600, 1400],
    favBait: ['golden', 'live_small'],
    baitSize: 'large',
    speed: 65,
    strength: 240,
    description: '바다의 가장 깊은 밑바닥에서 잠들어 있던 태초의 해룡. 낚시꾼의 궁극적인 로망!',
    colors: { body: '#0b090a', belly: '#161a1d', scale: '#00f5d4', aura: '#7209b7' },
    drawType: 'leviathan'
  },
  {
    id: 'constellation_seahorse',
    name: '별자리 해마',
    engName: 'Starlight Seahorse',
    zone: 'hadal',
    minDepth: 400,
    maxDepth: 500,
    rarity: 'legendary',
    basePrice: 950,
    baseExp: 750,
    sizeRange: [25, 45],
    favBait: ['golden', 'lure'],
    baitSize: 'small',
    speed: 35,
    strength: 90,
    description: '초심연 바닥에서 별자리를 그리며 춤추는 신비로운 반짝이 해마.',
    colors: { body: '#7209b7', glow: '#f72585', star: '#4cc9f0' },
    drawType: 'seahorse'
  },
  {
    id: 'cosmic_turtle',
    name: '무지개 우주 거북이',
    engName: 'Cosmic Shell Turtle',
    zone: 'hadal',
    minDepth: 440,
    maxDepth: 520,
    rarity: 'legendary',
    basePrice: 1100,
    baseExp: 880,
    sizeRange: [150, 320],
    favBait: ['golden', 'shrimp'],
    baitSize: 'large',
    speed: 32,
    strength: 150,
    description: '등껍질 속에 우주 성운을 담고 있는 무지개 거북이. 바다 깊은 곳을 유영합니다.',
    colors: { shell: '#3a0ca3', body: '#4cc9f0', nebula: '#f72585' },
    drawType: 'cosmic_turtle'
  },
  {
    id: 'ancient_relic',
    name: '아틀란티스 고대 유물',
    engName: 'Atlantis Ancient Relic',
    zone: 'hadal',
    minDepth: 400,
    maxDepth: 520,
    rarity: 'legendary',
    basePrice: 1250,
    baseExp: 950,
    sizeRange: [50, 80],
    favBait: ['golden', 'lure'],
    baitSize: 'large',
    speed: 0,
    strength: 110,
    description: '가라앉은 전설의 해저 문명 아틀란티스의 신비로운 에너지를 머금은 황금 신전 유물.',
    colors: { gold: '#ffd166', crystal: '#06d6a0', rune: '#00b4d8' },
    drawType: 'relic'
  }
];

export class Encyclopedia {
  constructor() {
    this.records = {};
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('cozy_cat_encyclopedia_v1');
      if (saved) {
        this.records = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load encyclopedia:", e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('cozy_cat_encyclopedia_v1', JSON.stringify(this.records));
    } catch (e) {
      console.warn("Failed to save encyclopedia:", e);
    }
  }

  recordCatch(fishId, sizeCm, price, isShiny = false) {
    const isFirstTime = !this.records[fishId] || this.records[fishId].caughtCount === 0;
    
    if (!this.records[fishId]) {
      this.records[fishId] = {
        caughtCount: 0,
        shinyCount: 0,
        maxSize: 0,
        firstCaughtDate: new Date().toLocaleDateString(),
        totalEarned: 0
      };
    }

    const rec = this.records[fishId];
    rec.caughtCount += 1;
    if (isShiny) {
      rec.shinyCount = (rec.shinyCount || 0) + 1;
    }
    const isNewRecord = sizeCm > rec.maxSize;
    if (isNewRecord) {
      rec.maxSize = sizeCm;
    }
    rec.totalEarned += price;

    this.saveToStorage();

    return {
      isFirstTime,
      isNewRecord,
      isShiny,
      totalCaught: rec.caughtCount,
      shinyCaught: rec.shinyCount || 0,
      maxSize: rec.maxSize
    };
  }

  getFishData(fishId) {
    return FISH_SPECIES.find(f => f.id === fishId);
  }

  getRecord(fishId) {
    return this.records[fishId] || { caughtCount: 0, shinyCount: 0, maxSize: 0, firstCaughtDate: null };
  }

  getCompletionStats() {
    const total = FISH_SPECIES.length;
    const caught = Object.keys(this.records).filter(id => this.records[id].caughtCount > 0).length;
    const percent = Math.round((caught / total) * 100);
    return { caught, total, percent };
  }

  getUnlockedFish() {
    return FISH_SPECIES.filter(f => this.records[f.id] && this.records[f.id].caughtCount > 0);
  }
}
