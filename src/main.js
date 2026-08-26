/**
 * Master Game Controller & Loop
 */
import { Vector2 } from './engine/Vector.js?v=7.4.0';
import { Camera } from './engine/Camera.js?v=7.4.0';
import { Input } from './engine/Input.js?v=7.4.0';
import { SoundEngine } from './audio.js?v=7.4.0';
import { Economy } from './systems/Economy.js?v=7.4.0';
import { Encyclopedia, FISH_SPECIES } from './systems/Encyclopedia.js?v=7.4.0';
import { Environment } from './systems/Environment.js?v=7.4.0';
import { Aquarium } from './systems/Aquarium.js?v=7.4.0';
import { Cat } from './entities/Cat.js?v=7.4.0';
import { Rod } from './entities/Rod.js?v=7.4.0';
import { Fish } from './entities/Fish.js?v=7.4.0';
import { HUD } from './ui/HUD.js?v=7.4.0';
import { Modals } from './ui/Modals.js?v=7.4.0';
import { CloudSave } from './systems/CloudSave.js?v=7.4.0';
import { Multiplayer } from './systems/Multiplayer.js?v=7.4.0';
import { StarCatchMinigame } from './systems/StarCatchMinigame.js?v=7.6.0';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.lastTime = 0;
    this.maxFishCount = 600; // Balanced, comfortable ocean with 1.5x rich deep-sea life (600 fish total)!
    this.fishList = [];
    this.prevTimeOfDay = 'day';

    // 👑 Boss Director (10~15분 주기 보스 출현 타이머)
    this.bossSpawnTimer = 0;
    this.bossSpawnCooldown = 600 + Math.random() * 300; // 600s ~ 900s (10~15 minutes)

    // 🚢 Cruise Fast-Travel Splash State
    this.isCruiseTraveling = false;

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Systems
    this.camera = new Camera(this.canvas.width, this.canvas.height);
    this.input = new Input(this.canvas, this.camera);
    this.sound = new SoundEngine();
    this.economy = new Economy();
    this.encyclopedia = new Encyclopedia();
    this.environment = new Environment();
    this.aquarium = new Aquarium(this.encyclopedia, this.economy, this.sound);
    this.cat = new Cat(this.economy);
    this.rod = new Rod(this.economy, this.sound);
    this.hud = new HUD(this.economy, this.encyclopedia, this.sound, this.environment);
    this.cloudSave = new CloudSave(this.economy, this.encyclopedia, this.aquarium, this.hud, this.sound);
    this.multiplayer = new Multiplayer(this.economy, this.sound, this.hud, this.cloudSave);
    this.modals = new Modals(this.economy, this.encyclopedia, this.aquarium, this.sound, this.hud, this.cloudSave);
    this.starCatchMinigame = new StarCatchMinigame();

    this.hud.setRod(this.rod);
    this.modals.setRod(this.rod);
    this.modals.setMultiplayer(this.multiplayer);
    this.isPaused = false;
    this.modals.onPauseChange = (paused) => {
      this.isPaused = paused;
    };

    this.hasTriggeredDockMerchant = false;
    this.fishSaveTimer = 0;
    this.tabNametagTimer = 0;

    // Initial camera placement (focus on cat's persisted position)
    this.camera.pos.set(this.cat.pos.x, this.cat.pos.y);

    // Populate initial ocean fish (or restore previous fish population)
    this.spawnInitialFish();

    // 🌊 Multiplayer Shared Ocean Callbacks
    if (this.multiplayer) {
      // 1. Host exports ocean world state when creating room
      this.multiplayer.getOceanWorldState = () => {
        return {
          fishList: this.fishList.map(f => ({
            uid: f.uid,
            id: f.data.id,
            x: Math.round(f.pos.x),
            y: Math.round(f.pos.y),
            facing: f.facing,
            sizeCm: f.sizeCm,
            isShiny: !!f.isShiny,
            minSwimX: f.swimBounds?.minX,
            maxSwimX: f.swimBounds?.maxX
          })),
          timeOfDay: this.environment.timeOfDay,
          timeProgress: this.environment.timeProgress
        };
      };

      // 2. Guest receives and loads Host's shared ocean fish population & atmosphere
      this.multiplayer.onSyncOceanWorld = (sharedFishList, worldData) => {
        if (Array.isArray(sharedFishList) && sharedFishList.length > 0) {
          this.fishList = [];
          sharedFishList.forEach(item => {
            const species = FISH_SPECIES.find(s => s.id === item.id);
            if (species) {
              let bounds = { minX: item.minSwimX || -600, maxX: item.maxSwimX || 32000 };
              const fish = new Fish(species, new Vector2(item.x, item.y), !!item.isShiny, bounds, item.uid);
              if (item.facing === 1 || item.facing === -1) fish.facing = item.facing;
              if (typeof item.sizeCm === 'number') fish.sizeCm = item.sizeCm;
              fish.onEscapeCallback = (f) => {
                this.camera.shake(12, 0.5);
                this.hud.showNotification(`⚠️ 너무 오래 방치하여 ${f.isBoss ? '👑 보스 ' : (f.isShiny ? '✨ 이로치 ' : '')}${f.data.name}이(가) 도망쳤습니다!`, '💨');
              };
              this.fishList.push(fish);
            }
          });
          this.saveFishState();
        }
        if (worldData && worldData.timeOfDay) {
          this.environment.timeOfDay = worldData.timeOfDay;
          if (typeof worldData.timeProgress === 'number') {
            this.environment.timeProgress = worldData.timeProgress;
          }
        }
      };

      // 3. Remove caught fish from ocean when another player catches it
      this.multiplayer.onRemoteFishCaught = (ev) => {
        const idx = this.fishList.findIndex(f => f.uid === ev.fishUid || (f.data.id === ev.speciesId && f.pos.dist(this.cat.pos) > 80));
        if (idx !== -1) {
          const removed = this.fishList.splice(idx, 1)[0];
          if (this.rod && removed) {
            for (let i = 0; i < 6; i++) {
              this.rod.waterParticles.push({
                x: removed.pos.x + (Math.random() - 0.5) * 20,
                y: removed.pos.y,
                vx: (Math.random() - 0.5) * 40,
                vy: -20 - Math.random() * 30,
                alpha: 1.0
              });
            }
          }
        }
      };

      // 4. Guest receives newly spawned fish from Host
      this.multiplayer.onRemoteFishSpawned = (fishData) => {
        if (fishData && !this.fishList.some(f => f.uid === fishData.uid)) {
          this.spawnSingleFish(false, fishData);
        }
      };
    }

    // Hook inputs & buttons
    this.initUIButtons();
    this.initInputHandlers();
    this.initMobileControls();

    // Init collapsible panel toggles, clock dock, bait peekup
    this.hud.initPanelToggles();

    // Auto-save fish population on page unload/refresh
    window.addEventListener('beforeunload', () => {
      this.saveFishState();
    });

    // Start Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.camera) {
      this.camera.resize(this.canvas.width, this.canvas.height);
    }
  }

  saveFishState() {
    try {
      // Only save fish that are freely swimming (not hooked)
      const serializableFish = this.fishList
        .filter(f => f.state === 'WANDER' || f.state === 'CURIOUS')
        .map(f => ({
          uid: f.uid,
          id: f.data.id,
          x: Math.round(f.pos.x),
          y: Math.round(f.pos.y),
          facing: f.facing,
          sizeCm: f.sizeCm,
          isShiny: f.isShiny,
          minSwimX: f.swimBounds?.minX,
          maxSwimX: f.swimBounds?.maxX
        }));

      localStorage.setItem('cozy_cat_ocean_fish_v5', JSON.stringify(serializableFish));
    } catch (e) {}
  }

  spawnInitialFish() {
    this.fishList = [];
    let loadedFishCount = 0;

    // 1. Try to restore previous fish population
    try {
      const saved = localStorage.getItem('cozy_cat_ocean_fish_v5');
      if (saved) {
        const fishDataList = JSON.parse(saved);
        if (Array.isArray(fishDataList) && fishDataList.length > 0) {
          fishDataList.forEach(item => {
            const species = FISH_SPECIES.find(s => s.id === item.id);
            if (species) {
              let spawnX = item.x;
              let bounds = { minX: -600, maxX: 32000 };

              if (species.isBoss) {
                // 👑 보스 물고기는 최신 원양 서식 구역(minX ~ maxX)으로 엄격 갱신
                const bMin = species.minX || 1600;
                const bMax = species.maxX || 32000;
                bounds = { minX: bMin - 150, maxX: bMax + 150 };
                if (spawnX < bMin || spawnX > bMax) {
                  spawnX = bMin + Math.random() * (bMax - bMin);
                }
              }

              const fish = new Fish(species, new Vector2(spawnX, item.y), !!item.isShiny, bounds, item.uid);
              if (item.facing === 1 || item.facing === -1) fish.facing = item.facing;
              if (typeof item.sizeCm === 'number') fish.sizeCm = item.sizeCm;

              fish.onEscapeCallback = (f) => {
                this.camera.shake(12, 0.5);
                this.hud.showNotification(`⚠️ 너무 오래 방치하여 ${f.isBoss ? '👑 보스 ' : (f.isShiny ? '✨ 이로치 ' : '')}${f.data.name}이(가) 도망쳤습니다!`, '💨');
              };

              this.fishList.push(fish);
              loadedFishCount++;
            }
          });
        }
      }
    } catch (e) {
      console.warn("Failed to restore ocean fish population:", e);
    }

    // 2. Fill the remaining spots up to maxFishCount (400)
    const needed = this.maxFishCount - loadedFishCount;
    for (let i = 0; i < needed; i++) {
      this.spawnSingleFish();
    }
  }

  spawnSingleFish(forceBoss = false, explicitData = null) {
    if (explicitData) {
      const species = FISH_SPECIES.find(s => s.id === explicitData.id);
      if (!species) return null;
      let bounds = { minX: explicitData.minSwimX || -600, maxX: explicitData.maxSwimX || 32000 };
      const fish = new Fish(species, new Vector2(explicitData.x, explicitData.y), !!explicitData.isShiny, bounds, explicitData.uid);
      if (explicitData.facing === 1 || explicitData.facing === -1) fish.facing = explicitData.facing;
      if (typeof explicitData.sizeCm === 'number') fish.sizeCm = explicitData.sizeCm;
      fish.onEscapeCallback = (f) => {
        this.camera.shake(12, 0.5);
        this.hud.showNotification(`⚠️ 너무 오래 방치하여 ${f.isBoss ? '👑 보스 ' : (f.isShiny ? '✨ 이로치 ' : '')}${f.data.name}이(가) 도망쳤습니다!`, '💨');
      };
      this.fishList.push(fish);
      return fish;
    }

    let chosen = null;
    const bossSpecies = FISH_SPECIES.filter(f => f.isBoss);
    const regularSpecies = FISH_SPECIES.filter(f => !f.isBoss);

    const activeBosses = this.fishList.filter(f => f.isBoss);
    const existingBossIds = activeBosses.map(f => f.data.id);
    const availableBossSpecies = bossSpecies.filter(b => !existingBossIds.includes(b.id));

    const bossChance = this.economy.getBossChance(); // 👑 기본 0.6% + 행운 배율
    const rollBoss = Math.random();

    // 맵 전체에 보스는 최대 2마리까지만 동시 출현하도록 제어 (과밀 스폰 방지)
    const canSpawnBoss = (forceBoss || rollBoss < bossChance) && availableBossSpecies.length > 0 && activeBosses.length < 2;

    if (canSpawnBoss) {
      // 👑 10대 전설 신화 보스 소환 (현재 없는 보스 중 무작위 선택)
      chosen = availableBossSpecies[Math.floor(Math.random() * availableBossSpecies.length)];
    } else {
      // 🌊 수심대별 목표 개체수: 1.5배 증원 (총 600마리, 100m 이하 심해 480마리(80%) 배치!)
      const targetZoneCounts = {
        shallow: 45,  // 표층 0 ~ 30m
        mid: 75,      // 중층 30 ~ 100m
        deep: 150,    // 심해 어둠층 100 ~ 250m
        abyss: 165,   // 심연의 해구 250 ~ 400m
        hadal: 165    // 미지의 초심연 400 ~ 750m
      };

      const currentZoneCounts = { shallow: 0, mid: 0, deep: 0, abyss: 0, hadal: 0 };
      this.fishList.forEach(f => {
        if (!f.isBoss && f.data && f.data.zone && currentZoneCounts[f.data.zone] !== undefined) {
          currentZoneCounts[f.data.zone]++;
        }
      });

      // 가장 개체수 부족분(deficit)이 큰 zone 선택
      const deficits = Object.keys(targetZoneCounts).map(zone => ({
        zone,
        deficit: Math.max(0.1, targetZoneCounts[zone] - currentZoneCounts[zone])
      }));

      const totalDeficit = deficits.reduce((sum, d) => sum + d.deficit, 0);
      let rand = Math.random() * totalDeficit;
      let targetZone = 'deep';
      for (const d of deficits) {
        if (rand < d.deficit) {
          targetZone = d.zone;
          break;
        }
        rand -= d.deficit;
      }

      const zoneSpecies = regularSpecies.filter(f => f.zone === targetZone);
      const candidates = zoneSpecies.length > 0 ? zoneSpecies : regularSpecies;

      // 행운 가중치 적용하여 해당 수심 어종 중 무작위 선택
      const luckMult = this.economy.getLuckMultiplier();
      const roll = Math.random();
      let targetRarity = 'common';
      if (roll < 0.05 * luckMult) targetRarity = 'mythic';
      else if (roll < 0.14 * luckMult) targetRarity = 'legendary';
      else if (roll < 0.30 * luckMult) targetRarity = 'epic';
      else if (roll < 0.58 * luckMult) targetRarity = 'rare';
      else if (roll < 0.82) targetRarity = 'uncommon';

      const rarityCandidates = candidates.filter(f => f.rarity === targetRarity);
      chosen = rarityCandidates.length > 0
        ? rarityCandidates[Math.floor(Math.random() * rarityCandidates.length)]
        : candidates[Math.floor(Math.random() * candidates.length)];
    }

    // 🌊 가로 스폰 범위: 플레이어 활동/탐험 영역에 65% 집중 배치하여 부두막 밑과 어디서든 빽빽하게 밀집!
    let minSpawnX = -350;
    let maxSpawnX = 31500;
    let minSwimX = -600;
    let maxSwimX = 32000;

    if (chosen.isBoss) {
      // 👑 10대 신화 보스는 배 티어별 원양 서식 구역(minX ~ maxX) 준수
      minSpawnX = chosen.minX || 1600;
      maxSpawnX = chosen.maxX || 32000;
      minSwimX = Math.max(1200, minSpawnX - 150);
      maxSwimX = Math.min(32000, maxSpawnX + 150);
    } else {
      // 일반/심해 물고기: 플레이어 주변 및 시작 영역(0~5000px)에 65% 밀집 스폰
      if (Math.random() < 0.65) {
        const catX = (this.cat && typeof this.cat.pos?.x === 'number') ? this.cat.pos.x : 1000;
        const activeMaxX = Math.min(31500, Math.max(4500, catX + 3500));
        maxSpawnX = activeMaxX;
      }
    }

    const startX = minSpawnX + Math.random() * (maxSpawnX - minSpawnX);
    const minY = (chosen.minDepth || 1) * 20;
    const maxY = Math.min(15000, (chosen.maxDepth || 750) * 20);
    const startY = minY + Math.random() * (maxY - minY);

    // ✨ Shiny (이로치) check (0.1% ~ 5.0% 범위)
    const isNight = this.environment && this.environment.timeOfDay === 'night';
    const isShiny = Math.random() < this.economy.getShinyChance(isNight);

    const swimBounds = { minX: minSwimX, maxX: maxSwimX };
    const fish = new Fish(chosen, new Vector2(startX, startY), isShiny, swimBounds);
    fish.onEscapeCallback = (f) => {
      this.camera.shake(12, 0.5);
      this.hud.showNotification(`⚠️ 너무 오래 방치하여 ${f.isBoss ? '👑 보스 ' : (f.isShiny ? '✨ 이로치 ' : '')}${f.data.name}이(가) 도망쳤습니다!`, '💨');
    };

    if (chosen.isBoss && forceBoss && this.hud) {
      this.hud.showNotification(`👑 저 멀리 심해에서 전설의 신화 보스 '${chosen.name}'이(가) 출현했습니다!`, '⚡');
    }

    this.fishList.push(fish);

    // 🌊 Host in Multiplayer: Broadcast newly spawned fish to room guests
    if (this.multiplayer && this.multiplayer.isConnected && this.multiplayer.isHost) {
      this.multiplayer.broadcastFishSpawned({
        uid: fish.uid,
        id: fish.data.id,
        x: Math.round(fish.pos.x),
        y: Math.round(fish.pos.y),
        facing: fish.facing,
        sizeCm: fish.sizeCm,
        isShiny: fish.isShiny,
        minSwimX: swimBounds.minX,
        maxSwimX: swimBounds.maxX
      });
    }

    return fish;
  }

  initUIButtons() {
    // Sound Modal Open Button
    const btnSound = document.getElementById('btn-sound-modal-open');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        this.modals.openSoundModal();
      });
    }

    // Top Navigation buttons
    const btnInv = document.getElementById('btn-open-inventory');
    if (btnInv) btnInv.addEventListener('click', () => this.modals.openInventoryModal());

    const btnMulti = document.getElementById('btn-open-multiplayer');
    if (btnMulti) btnMulti.addEventListener('click', () => this.modals.openMultiplayerModal());

    const btnEncyclo = document.getElementById('btn-open-encyclopedia');
    if (btnEncyclo) btnEncyclo.addEventListener('click', () => this.modals.openEncyclopedia());

    const btnGuide = document.getElementById('btn-open-guide');
    if (btnGuide) btnGuide.addEventListener('click', () => this.modals.openGuide());

    // Canvas click in Aquarium mode to drop food
    this.canvas.addEventListener('click', (e) => {
      if (this.aquarium.isOpen) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const startX = (this.canvas.width - this.aquarium.tankWidth) / 2;
        const startY = (this.canvas.height - this.aquarium.tankHeight) / 2;

        const relX = clickX - startX;
        const relY = clickY - startY;

        if (relX >= 0 && relX <= this.aquarium.tankWidth && relY >= 0 && relY <= this.aquarium.tankHeight) {
          // Check if clicked coin bubble
          let clickedBubble = false;
          for (let i = 0; i < this.aquarium.coinBubbles.length; i++) {
            const b = this.aquarium.coinBubbles[i];
            const dist = Math.hypot(b.pos.x - relX, b.pos.y - relY);
            if (dist < b.size + 10) {
              this.aquarium.collectCoinBubble(i);
              clickedBubble = true;
              break;
            }
          }

          if (!clickedBubble) {
            this.aquarium.dropFood(relX, relY);
          }
        }
      }
    });

    // Start background music on first user gesture
    window.addEventListener('click', () => {
      if (!this.sound.isBgmPlaying && !this.sound.isMuted) {
        this.sound.startBgm();
      }
    }, { once: true });
  }

  initInputHandlers() {
    this.input.on('pointerdown', () => {
      if (this.aquarium.isOpen || this.isCruiseTraveling) return;

      if (this.rod.state === 'READY') {
        this.rod.startCharging();
        this.cat.state = 'CHARGE';
      } else if (this.rod.state === 'FISHING') {
        // 🎯 Perfect Reeling Rhythm Timing Tap!
        const hitResult = this.rod.checkRhythmHit();
        if (hitResult) {
          this.camera.shake(hitResult === 'PERFECT' ? 8 : 4, 0.25);
        }
      }
    });

    this.input.on('pointerup', () => {
      if (this.aquarium.isOpen || this.isCruiseTraveling) return;

      if (this.rod.state === 'CHARGING') {
        this.rod.cast(this.cat);
        this.cat.state = 'CAST';
        setTimeout(() => {
          if (this.cat.state === 'CAST') this.cat.state = 'IDLE';
        }, 500);
      }
    });

    // 1. [Q] Key: 특수 아이템 사용 전용 (현혹 페로몬 💖, 어군 폭탄 💣)
    this.handleUseItemAction = () => {
      if (this.aquarium.isOpen || this.isCruiseTraveling) return;
      if (this.rod.state === 'FISHING' && this.rod.isSubmerged) {
        // A. Try triggering Allure Pheromone first if owned
        if ((this.economy.baitInventory['allure'] || 0) > 0) {
          const success = this.rod.triggerAllure(this.fishList);
          if (success) {
            this.camera.shake(8, 0.4);
            this.hud.showNotification('💖 환상의 현혹 페로몬 발동! 주변 모든 물고기가 미끼로 쇄도합니다!', '✨');
            this.hud.initBaitBar();
            return;
          }
        }

        // B. Otherwise try Depth Charge Bomb
        if ((this.economy.baitInventory['bomb'] || 0) > 0) {
          const success = this.rod.triggerBomb(this.fishList, (eliminatedFish) => {
            const idx = this.fishList.indexOf(eliminatedFish);
            if (idx !== -1) {
              this.fishList.splice(idx, 1);
              setTimeout(() => this.spawnSingleFish(), 3000);
            }
          });

          if (success) {
            this.camera.shake(14, 0.6);
            this.hud.showNotification('💣 콰앙-! 주변 방해 물고기 퇴치 완료!', '💥');
            this.hud.initBaitBar();
            return;
          }
        }

        this.sound.playClick();
        this.hud.showNotification('사용할 수 있는 수중 특수 아이템(현혹 페로몬/어군 폭탄)이 없습니다냥! 🎒', '💡');
      }
    };

    // 2. [마우스 우클릭]: 찌 침강 정지 / 진행 전용 (오로지 STOP & SINK만 작동!)
    this.handleDepthLockAction = () => {
      if (this.aquarium.isOpen || this.isCruiseTraveling) return;
      if (this.rod.state === 'FISHING' && this.rod.isSubmerged) {
        const isLocked = this.rod.toggleDepthLock();
        if (isLocked) {
          this.sound.playClick();
          this.hud.showNotification('🛑 찌 침강 정지 (수심 고정)! 마우스 우클릭으로 다시 가라앉힙니다.', '🔒');
        } else {
          this.sound.playClick();
          this.hud.showNotification('▶️ 찌 침강 재개 (아래로 가라앉는 중)', '🌊');
        }
      }
    };

    // 우클릭은 오로지 찌 침강 STOP & SINK만 실행!
    this.input.on('rightclick', () => this.handleDepthLockAction());
    this.hud.onDepthLockTrigger = () => this.handleDepthLockAction();
    this.hud.onItemUseTrigger = () => this.handleUseItemAction();

    // 🚢 / 🌊 Cruise Fast-Travel (부두 귀환 vs 먼 바다 출항)
    this.hud.onCruiseTrigger = () => {
      if (this.aquarium.isOpen || this.isCruiseTraveling) return;

      const cost = this.economy.level * 1000;
      const isAtDock = (this.cat.pos.x <= 320);

      if (this.economy.gold < cost) {
        this.sound.playClick();
        this.hud.showNotification(`골드가 부족합니다냥! (필요: ${cost.toLocaleString()} G)`, '⚠️');
        return;
      }

      // Determine Destination & Voyage Direction
      let destX = 240;
      let isVoyageOut = false;

      if (isAtDock) {
        // 🌊 먼 바다 출항: 현재 배의 최대 이동 거리에서 살짝 왼쪽으로 이동
        isVoyageOut = true;
        const currentBoat = this.economy.getCurrentBoat();
        const maxDist = currentBoat?.maxTravelX || 1600;
        destX = Math.max(800, maxDist - 250);
      } else {
        // 🚢 부두 귀환: 부두막(x=240)으로 복귀
        destX = 240;
        isVoyageOut = false;
      }

      // Deduct gold & save
      this.economy.addGold(-cost);
      this.economy.saveToStorage();

      // Safely retrieve/reset fishing line if active
      if (this.rod.state !== 'READY') {
        this.rod.reset(this.cat);
      }

      this.isCruiseTraveling = true;
      this.cat.velX = 0;
      this.cat.state = 'IDLE';

      // 1. Play Cruise Horn & Water Splash Sound
      this.sound.playCruiseHorn();
      this.sound.playSplash(1.5);

      // 2. Display 3-Second Grand Cruise Sailing Animation Screen
      const splashOverlay = document.getElementById('cruise-splash-overlay');
      if (splashOverlay) {
        const currentTheme = this.environment.timeOfDay || 'day';
        splashOverlay.dataset.theme = currentTheme;

        // Toggle Direction Mode (mode-voyage vs mode-dock)
        if (isVoyageOut) {
          splashOverlay.classList.remove('mode-dock');
          splashOverlay.classList.add('mode-voyage');
        } else {
          splashOverlay.classList.remove('mode-voyage');
          splashOverlay.classList.add('mode-dock');
        }

        // Update Banner Text
        const titleEl = document.getElementById('cruise-title');
        const descEl = document.getElementById('cruise-desc');
        const meterLeft = document.getElementById('cruise-meter-left');
        const meterRight = document.getElementById('cruise-meter-right');

        if (isVoyageOut) {
          if (titleEl) titleEl.innerText = '🌊 냥이 쾌속 크루즈 먼 바다 대항해 출항!';
          if (descEl) descEl.innerText = `거친 파도를 가르며 현재 보트의 최대 탐험 해역(${(destX / 20).toFixed(0)}m)으로 쾌속 출항합니다냥! 🐾`;
          if (meterLeft) meterLeft.innerText = '⚓ 부두막 (출발)';
          if (meterRight) meterRight.innerText = `🌊 먼 바다 (${(destX / 20).toFixed(0)}m)`;
        } else {
          if (titleEl) titleEl.innerText = '🚢 냥이 럭셔리 크루즈 부두막 귀환 항해';
          if (descEl) descEl.innerText = '시원한 바닷바람과 함께 부두막으로 안전하게 쾌속 순항 중입니다냥... 🐾';
          if (meterLeft) meterLeft.innerText = '⚓ 부두막 (도착)';
          if (meterRight) meterRight.innerText = '🌊 먼 바다';
        }

        // Reset Animations
        const ship = splashOverlay.querySelector('.cruise-grand-ship');
        const meterFill = splashOverlay.querySelector('.meter-bar-fill');
        const meterBoat = splashOverlay.querySelector('.meter-boat-indicator');

        if (ship) {
          ship.style.animation = 'none';
          void ship.offsetWidth;
          ship.style.animation = 'cruise-sail-left 3.0s cubic-bezier(0.12, 0.95, 0.35, 1) forwards, cruise-ship-bob 1.2s ease-in-out infinite alternate';
        }
        if (meterFill) {
          meterFill.style.animation = 'none';
          void meterFill.offsetWidth;
          meterFill.style.animation = 'meter-progress-fill 3.0s linear forwards';
        }
        if (meterBoat) {
          meterBoat.style.animation = 'none';
          void meterBoat.offsetWidth;
          const glideAnim = isVoyageOut ? 'meter-boat-glide-right 3.0s linear forwards' : 'meter-boat-glide 3.0s linear forwards';
          meterBoat.style.animation = glideAnim;
        }

        splashOverlay.classList.add('visible');
      }

      // 3. Move player & camera in background while sailing
      setTimeout(() => {
        this.cat.pos.x = destX;
        this.cat.facing = isVoyageOut ? 1 : 1;
        this.cat.velX = 0;
        this.cat.savePosition();
        this.camera.pos.set(this.cat.pos.x, this.cat.pos.y);
        this.camera.setTarget(this.cat.pos.x + 80 * this.cat.facing, this.cat.pos.y - 40, 1.0);
      }, 1500);

      // 4. Complete Voyage at 3.0 seconds
      setTimeout(() => {
        if (splashOverlay) {
          splashOverlay.classList.remove('visible');
        }

        this.isCruiseTraveling = false;
        this.sound.playSplash(1.2);
        this.sound.playCoin();
        this.camera.shake(6, 0.4);

        if (isVoyageOut) {
          this.hud.showNotification(`🌊 먼 바다(${(destX / 20).toFixed(0)}m) 해역에 쾌속 출항 완료했습니다냥! (-${cost.toLocaleString()} G)`, '✨');
        } else {
          this.hud.showNotification(`🚢 부두막에 무사히 도착했습니다냥! (-${cost.toLocaleString()} G)`, '✨');
        }
      }, 3000);
    };

    // Keyboard Shortcuts (지정된 단축키로 정돈)
    this.input.on('keydown', (code) => {
      // Double safety check: If user is typing in any input, do not trigger shortcuts
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
        return;
      }

      if (this.aquarium.isOpen) {
        if (code === 'Escape' || code === 'KeyE' || code === 'KeyU' || code === 'KeyI' || code === 'KeyR') {
          this.aquarium.close();
          const aquaUI = document.getElementById('aquarium-controls-ui');
          if (aquaUI) aquaUI.classList.remove('visible');
        }
        return;
      }

      // 🛑 [S] / [ArrowDown] 키: 찌 침강 정지 (수심 고정 락) / 침강 재개
      if (code === 'KeyS' || code === 'ArrowDown') {
        if (this.rod.state === 'FISHING' && this.rod.isSubmerged) {
          this.handleDepthLockAction();
        }
      }

      // 🎯 [Space] 키: 릴링 중 리듬 서클 타이밍 맞추기
      if (code === 'Space') {
        if (this.rod.state === 'FISHING') {
          const hitResult = this.rod.checkRhythmHit();
          if (hitResult) {
            this.camera.shake(hitResult === 'PERFECT' ? 8 : 4, 0.25);
          }
        }
      }

      // 💖 / 💣 [Q] 키: 수중 특수 아이템 사용 전용
      if (code === 'KeyQ') {
        this.handleUseItemAction();
      }

      // 🏷️ [Tab] 키: 내 머리 위 닉네임 일시 표시 (3.5초)
      if (code === 'Tab') {
        this.tabNametagTimer = 3.5;
      }

      // 🎒 [E] 키: 내 인벤토리 (가방) 열기 / 닫기 토글
      if (code === 'KeyE') {
        this.modals.toggleInventory();
      }

      // 📖 [U] 키: 도감 열기 / 닫기 토글
      if (code === 'KeyU') {
        this.modals.toggleEncyclopedia();
      }

      // 🌐 [I] 키: 멀티플레이어 창 열기 / 닫기 토글
      if (code === 'KeyI') {
        this.modals.toggleMultiplayer();
      }

      // 🔊 [O] 키: 사운드 & 볼륨 설정 모달 열기 / 닫기
      if (code === 'KeyO') {
        this.modals.toggleSoundModal();
      }

      // 🏪 [R] 키: 고양이 상인 범위 안(x <= 320) 또는 이미 상점 관련 창이 열린 상태일 때 토글
      if (code === 'KeyR') {
        const isNearMerchant = (this.cat.pos.x <= 320);
        if (isNearMerchant || this.modals.isDockMerchantOpen() || this.modals.isFishMarketOpen() || this.modals.isMerchantGuideOpen()) {
          this.modals.toggleDockMerchant();
        }
      }

      // 🎭 [X] 키: 원형 이모트 휠 열기 (누르고 있을 때)
      if (code === 'KeyX' && !this.isEmoteWheelOpen) {
        this.openEmoteWheel();
      }

      if (code === 'KeyH') this.modals.openGuide();
      if (code === 'Escape') {
        this.togglePauseMenu();
      }
    });

    // KeyUp for [X] key emote release
    this.input.on('keyup', (code) => {
      if (code === 'KeyX' && this.isEmoteWheelOpen) {
        this.closeEmoteWheel(false);
      }
    });

    // Mouse tracking for radial emote wheel slice selection
    window.addEventListener('mousemove', (e) => {
      if (this.isEmoteWheelOpen) {
        this.updateEmoteWheelHover(e.clientX, e.clientY);
      }
    });

    window.addEventListener('blur', () => {
      if (this.isEmoteWheelOpen) {
        this.closeEmoteWheel(true);
      }
    });
  }

  togglePauseMenu() {
    this.sound.playClick();
    if (this.isEmoteWheelOpen) {
      this.closeEmoteWheel(true);
    } else if (this.modals.isPauseOpen()) {
      this.modals.closeAll();
      this.isPaused = false;
    } else if (this.modals.hasAnyModalOpen()) {
      this.modals.closeAll();
      this.isPaused = false;
    } else {
      this.isPaused = true;
      this.modals.openPauseModal();
    }
  }

  initMobileControls() {
    const btnMobileLandscape = document.getElementById('btn-mobile-landscape');
    const btnTopbarMobile = document.getElementById('btn-topbar-mobile');
    const btnMobileProfileSettings = document.getElementById('btn-mobile-profile-settings');
    const btnRotateForce = document.getElementById('btn-rotate-force-landscape');
    const rotateOverlay = document.getElementById('mobile-rotate-prompt');
    const btnLeft = document.getElementById('btn-mobile-left');
    const btnRight = document.getElementById('btn-mobile-right');

    const toggleFullscreenLandscape = async () => {
      this.sound.playClick();
      try {
        const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
        if (!isFull) {
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) {
            await docEl.requestFullscreen();
          } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen();
          } else if (docEl.mozRequestFullScreen) {
            await docEl.mozRequestFullScreen();
          }

          // Lock landscape orientation if supported
          if (screen.orientation && screen.orientation.lock) {
            try {
              await screen.orientation.lock('landscape');
            } catch (err) {
              console.warn('Orientation lock failed:', err);
            }
          }

          if (rotateOverlay) rotateOverlay.classList.add('hidden');
          this.hud.showNotification('📱 가로 전체화면 모드로 전환되었습니다냥!', '✨');
        } else {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          }

          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          this.hud.showNotification('📴 전체화면 모드가 종료되었습니다냥.', '💡');
        }
      } catch (e) {
        console.error('Fullscreen toggle error:', e);
      }
    };

    if (btnMobileLandscape) {
      btnMobileLandscape.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreenLandscape();
      });
    }

    if (btnTopbarMobile) {
      btnTopbarMobile.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreenLandscape();
      });
    }

    if (btnMobileProfileSettings) {
      btnMobileProfileSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePauseMenu();
      });
    }

    if (btnRotateForce) {
      btnRotateForce.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreenLandscape();
      });
    }

    // Update button text on fullscreen change
    const updateFullscreenState = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
      if (btnMobileLandscape) {
        const iconEl = btnMobileLandscape.querySelector('.mobile-btn-icon');
        const textEl = btnMobileLandscape.querySelector('.mobile-btn-text');
        if (isFull) {
          if (iconEl) iconEl.innerText = '📴';
          if (textEl) textEl.innerText = '전체화면 종료';
        } else {
          if (iconEl) iconEl.innerText = '📱';
          if (textEl) textEl.innerText = '가로 전체화면';
        }
      }
      setTimeout(() => this.resizeCanvas(), 100);
    };

    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);

    // Orientation change check
    const checkOrientation = () => {
      const isMobileSize = window.innerWidth <= 920 || window.innerHeight <= 520;
      const isPortrait = window.innerHeight > window.innerWidth;

      if (rotateOverlay) {
        if (isMobileSize && isPortrait) {
          rotateOverlay.classList.remove('hidden');
        } else {
          rotateOverlay.classList.add('hidden');
        }
      }
      this.resizeCanvas();
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();

    // Virtual Steering Touch Controls
    if (btnLeft) {
      const handleLeftStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.setVirtualAxis(-1);
        btnLeft.classList.add('active');
      };
      const handleLeftEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.setVirtualAxis(0);
        btnLeft.classList.remove('active');
      };
      btnLeft.addEventListener('pointerdown', handleLeftStart);
      btnLeft.addEventListener('pointerup', handleLeftEnd);
      btnLeft.addEventListener('pointercancel', handleLeftEnd);
      btnLeft.addEventListener('pointerleave', handleLeftEnd);
    }

    if (btnRight) {
      const handleRightStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.setVirtualAxis(1);
        btnRight.classList.add('active');
      };
      const handleRightEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.setVirtualAxis(0);
        btnRight.classList.remove('active');
      };
      btnRight.addEventListener('pointerdown', handleRightStart);
      btnRight.addEventListener('pointerup', handleRightEnd);
      btnRight.addEventListener('pointercancel', handleRightEnd);
      btnRight.addEventListener('pointerleave', handleRightEnd);
    }

    // Main Mobile Action Button (🎣 찌 던지기 ➔ ⚡ 릴 땡기기)
    const btnMobileAction = document.getElementById('btn-mobile-action');
    if (btnMobileAction) {
      const handleActionStart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.aquarium.isOpen || this.isCruiseTraveling) return;

        if (this.rod.state === 'READY') {
          // Start charging cast
          this.rod.startCharging();
          this.cat.state = 'CHARGE';
          btnMobileAction.classList.add('active');
        } else if (this.rod.state === 'FISHING' || this.rod.state === 'FLYING' || this.rod.state === 'REELING_IN') {
          // Reeling in line
          this.input.setVirtualReel(true);
          btnMobileAction.classList.add('active', 'reeling');

          // Trigger timing rhythm tap if in fishing mode
          if (this.rod.state === 'FISHING') {
            const hitResult = this.rod.checkRhythmHit();
            if (hitResult) {
              this.camera.shake(hitResult === 'PERFECT' ? 8 : 4, 0.25);
            }
            if (this.starCatchMinigame && this.starCatchMinigame.isActive) {
              this.starCatchMinigame.pendingTrigger = true;
            }
          }
        }
      };

      const handleActionEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();

        btnMobileAction.classList.remove('active', 'reeling');

        if (this.rod.state === 'CHARGING') {
          this.rod.cast(this.cat);
          this.cat.state = 'CAST';
          setTimeout(() => {
            if (this.cat.state === 'CAST') this.cat.state = 'IDLE';
          }, 500);
        } else {
          this.input.setVirtualReel(false);
        }
      };

      btnMobileAction.addEventListener('pointerdown', handleActionStart);
      btnMobileAction.addEventListener('pointerup', handleActionEnd);
      btnMobileAction.addEventListener('pointercancel', handleActionEnd);
      btnMobileAction.addEventListener('pointerleave', handleActionEnd);
      btnMobileAction.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  updateMobileActionButton() {
    const btn = document.getElementById('btn-mobile-action');
    if (!btn) return;

    const isReady = (this.rod.state === 'READY' || this.rod.state === 'CHARGING');
    const isSubmergedOrFishing = (this.rod.state === 'FISHING' || this.rod.state === 'FLYING' || this.rod.state === 'REELING_IN');

    if (isReady) {
      if (!btn.classList.contains('mode-cast')) {
        btn.className = 'mobile-action-btn mode-cast';
        const iconEl = btn.querySelector('.mobile-action-icon');
        const textEl = btn.querySelector('.mobile-action-text');
        if (iconEl) iconEl.textContent = '🎣';
        if (textEl) textEl.textContent = '찌 던지기';
      }
    } else if (isSubmergedOrFishing) {
      if (!btn.classList.contains('mode-reel')) {
        btn.className = 'mobile-action-btn mode-reel';
        const iconEl = btn.querySelector('.mobile-action-icon');
        const textEl = btn.querySelector('.mobile-action-text');
        if (iconEl) iconEl.textContent = '⚡';
        if (textEl) textEl.textContent = '릴 땡기기';
      }
    }
  }

  openEmoteWheel() {
    this.isEmoteWheelOpen = true;
    this.selectedEmote = 'cancel';

    const wheelEl = document.getElementById('emote-radial-wheel');
    if (wheelEl) {
      wheelEl.classList.add('visible');
      const centerCircle = wheelEl.querySelector('.emote-center-circle');
      if (centerCircle) centerCircle.classList.add('active');
      const nodes = wheelEl.querySelectorAll('.emote-node');
      nodes.forEach(n => n.classList.remove('active'));
    }
  }

  updateEmoteWheelHover(clientX, clientY) {
    const wheelEl = document.getElementById('emote-radial-wheel');
    if (!wheelEl) return;
    const container = wheelEl.querySelector('.emote-wheel-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    let activeEmote = 'cancel';
    if (dist >= 42) {
      // Calculate angle in degrees [-180, 180]
      const deg = Math.atan2(dy, dx) * 180 / Math.PI;
      // Rotate so Top (-90 deg) is 0 deg: [0, 360)
      const normDeg = (deg + 90 + 360) % 360;

      // Sector 0 (324° ~ 36°): joy (😊 기쁨 - Top)
      // Sector 1 (36° ~ 108°): clap (👏 박수 - Top Right)
      // Sector 2 (108° ~ 180°): tease (😜 조롱 - Bottom Right)
      // Sector 3 (180° ~ 252°): sad (😭 슬픔 - Bottom Left)
      // Sector 4 (252° ~ 324°): angry (😡 분노 - Top Left)
      if (normDeg >= 324 || normDeg < 36) {
        activeEmote = 'joy';
      } else if (normDeg >= 36 && normDeg < 108) {
        activeEmote = 'clap';
      } else if (normDeg >= 108 && normDeg < 180) {
        activeEmote = 'tease';
      } else if (normDeg >= 180 && normDeg < 252) {
        activeEmote = 'sad';
      } else {
        activeEmote = 'angry';
      }
    }

    this.selectedEmote = activeEmote;

    // Update UI active highlights
    const centerNode = wheelEl.querySelector('.emote-center-circle');
    if (centerNode) {
      centerNode.classList.toggle('active', activeEmote === 'cancel');
    }
    const nodes = wheelEl.querySelectorAll('.emote-node');
    nodes.forEach(node => {
      node.classList.toggle('active', node.dataset.emote === activeEmote);
    });
  }

  closeEmoteWheel(cancelOnly = false) {
    if (!this.isEmoteWheelOpen) return;
    this.isEmoteWheelOpen = false;

    const wheelEl = document.getElementById('emote-radial-wheel');
    if (wheelEl) {
      wheelEl.classList.remove('visible');
    }

    if (!cancelOnly && this.selectedEmote && this.selectedEmote !== 'cancel') {
      this.cat.triggerEmote(this.selectedEmote);
      this.sound.playClick();

      // Broadcast emote across room players
      if (this.multiplayer && this.multiplayer.isConnected) {
        this.multiplayer.broadcastEmote(this.selectedEmote);
      }
    }
  }

  handleFishCaught(fish, isPerfect = false) {
    this.sound.playCatch((fish.isBoss || fish.isShiny) ? 'mythic' : fish.data.rarity);
    this.cat.triggerCatch();
    this.camera.shake(fish.isBoss ? 16 : (fish.isShiny ? 10 : 6), 0.55);

    let price = fish.data.basePrice;
    let exp = fish.data.baseExp;

    if (fish.isShiny) {
      price = Math.round(price * 3.0);
      exp = Math.round(exp * 3.0);
    }

    // 🎯 Perfect Catch Bonus (+30% G & EXP)
    const hasRhythmBonus = isPerfect || (this.rod.rhythmRing?.totalHits || 0) > 0;
    if (hasRhythmBonus) {
      price = Math.round(price * 1.30);
      exp = Math.round(exp * 1.30);
    }

    const leveledUp = this.economy.addExp(exp);

    // 🧺 어획 바구니에 물고기 보관 (부두 상인에게 가서 판매하거나 아쿠아리움에 수집!)
    const basketItem = this.economy.addFishToBasket(fish, price, exp);

    const result = this.encyclopedia.recordCatch(fish.data.id, fish.sizeCm, price, fish.isShiny);
    this.hud.showCatchPopup(fish, { ...result, basketPrice: price, hasRhythmBonus });

    if (hasRhythmBonus) {
      this.hud.showNotification(`🎯 퍼펙트 캐치 보너스 달성! (+30% 골드 & 경험치 획득)`, '✨');
      this.hud.triggerCatchFireworks();
    }

    if (fish.isBoss) {
      this.hud.showNotification(`👑 대박! 전설의 보스 [${fish.data.name}] 포획 성공! (+${price} G)`, '🏆');
    } else if (fish.isShiny) {
      this.hud.showNotification(`✨ 이로치 ${fish.data.name} 낚시 성공! 어획 바구니에 보관되었습니다.`, '🌟');
    } else {
      this.hud.showNotification(`🐟 ${fish.data.name}(${fish.sizeCm}cm) 어획 바구니에 쏙! 부두 상인에게 판매/수집하세요.`, '🧺');
    }

    if (leveledUp) {
      this.hud.showNotification(`🎉 레벨 업! Lv.${this.economy.level} 달성!`, '⭐');
    }

    // 🌊 Broadcast fish caught event in multiplayer room
    if (this.multiplayer && this.multiplayer.isConnected) {
      this.multiplayer.broadcastFishCaught({
        fishUid: fish.uid,
        speciesId: fish.data.id,
        speciesName: fish.data.name,
        isShiny: !!fish.isShiny,
        isBoss: !!fish.isBoss
      });
    }

    // Remove caught fish from active ocean list & spawn replacement (Host or Singleplayer spawns)
    const idx = this.fishList.indexOf(fish);
    if (idx !== -1) {
      this.fishList.splice(idx, 1);
    }

    const isClientInMultiplayer = (this.multiplayer && this.multiplayer.isConnected && !this.multiplayer.isHost);
    if (!isClientInMultiplayer) {
      this.spawnSingleFish(false);
    }
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.input.update(dt);
    if (this.tabNametagTimer > 0) {
      this.tabNametagTimer -= dt;
    }
    this.environment.update(dt, this.sound);

    // Notify player on night arrival (Shiny Fever Time!)
    if (this.environment.timeOfDay !== this.prevTimeOfDay) {
      if (this.environment.timeOfDay === 'night') {
        this.hud.showNotification('🌌 밤이 찾아왔습니다! 황금빛 이로치 물고기 출현 확률이 5배 상승합니다! ✨', '🌟');
      }
      this.prevTimeOfDay = this.environment.timeOfDay;
    }

    if (this.aquarium.isOpen) {
      this.aquarium.update(dt);
      if (this.modals) this.modals.updateAquariumBadge();
      return;
    }

    // Normal Fishing Game Loop
    const isReeling = this.input.isReeling();
    if (isReeling && this.rod.state === 'FISHING') {
      this.cat.state = 'REELING';
    } else if (this.cat.state === 'REELING') {
      this.cat.state = 'IDLE';
    }

    // Update Cat & Boat (allow steering only when not charging and not cruise traveling)
    const boatAxis = (!this.isCruiseTraveling && this.rod.state !== 'CHARGING') ? this.input.horizontalAxis : 0;
    this.cat.update(dt, this.environment.waterSurfaceY, boatAxis);

    // Update Rod & Line
    this.rod.update(
      dt,
      this.cat,
      isReeling,
      this.environment.waterSurfaceY,
      (caughtFish) => this.handleFishCaught(caughtFish)
    );

    // Update Mobile Action Button (찌 던지기 ➔ 릴 땡기기)
    this.updateMobileActionButton();

    // 🌟 MapleStory-Style Star Catch Fishing Mini-game Control (Default: OFF)
    const isMinigameEnabled = this.economy ? (this.economy.isMinigameEnabled === true) : false;
    const primaryHookedFish = (this.rod.allHookedFishes && this.rod.allHookedFishes.length > 0) 
      ? this.rod.allHookedFishes[0] 
      : (this.rod.hookedFish || (this.rod.hooks && this.rod.hooks.find(h => h.hookedFish)?.hookedFish));

    if (isMinigameEnabled && this.rod.state === 'FISHING' && primaryHookedFish) {
      if (!this.starCatchMinigame.isActive) {
        this.starCatchMinigame.start(primaryHookedFish, this.economy, this.environment.waterSurfaceY);
      }
      
      const minigameResult = this.starCatchMinigame.update(
        dt, 
        this.input, 
        this.sound, 
        this.rod, 
        this.cat, 
        this.environment.waterSurfaceY
      );

      if (minigameResult) {
        if (minigameResult.status === 'CAUGHT') {
          const caughtFish = minigameResult.fish;
          this.rod.reset(this.cat);
          this.handleFishCaught(caughtFish, minigameResult.isPerfect);
        } else if (minigameResult.status === 'ESCAPED') {
          const escapingFish = minigameResult.fish;
          if (escapingFish) {
            escapingFish.state = 'FLEE';
          }
          this.sound.playSplash();
          this.rod.reset(this.cat);
          this.hud.showNotification('🐟 아쉽다냥! 물고기가 힘차게 빠져나갔습니다냥!', '💨');
        }
      }
    } else {
      if (this.starCatchMinigame.isActive) {
        this.starCatchMinigame.stop();
      }
    }

    // Hook nibble alert
    if (this.rod.hookedFish && this.cat.state !== 'CATCH' && this.cat.state !== 'REELING') {
      this.cat.triggerNibble();
    }

    // Update Ocean Fish population across 0m ~ 750m+ and -800 ~ 32,000px wide
    const oceanBounds = { left: -800, right: 32000, top: 0, bottom: 15800 };
    this.fishList.forEach(fish => fish.update(dt, this.rod, oceanBounds, this.cat));

    // Maintain lively fish population (Host in multiplayer or Singleplayer spawns new fish)
    const isGuestInMultiplayer = (this.multiplayer && this.multiplayer.isConnected && !this.multiplayer.isHost);
    if (!isGuestInMultiplayer) {
      while (this.fishList.length < this.maxFishCount) {
        this.spawnSingleFish();
      }
    }

    // Periodic fish population save (every 2.5s)
    this.fishSaveTimer += dt;
    if (this.fishSaveTimer >= 2.5) {
      this.fishSaveTimer = 0;
      this.saveFishState();
    }

    // Camera Tracking
    if (this.rod.state === 'FISHING' && this.rod.isSubmerged) {
      // Follow the submerged hook deep underwater with dynamic zoom
      const hookDepth = this.rod.hookPos.y;
      const zoom = Math.max(0.60, 1.0 - (hookDepth / 15000) * 0.45);
      this.camera.setTarget(this.rod.hookPos.x, this.rod.hookPos.y + 60, zoom);
    } else {
      // Focus on cat on boat
      this.camera.setTarget(this.cat.pos.x + 80 * this.cat.facing, this.cat.pos.y - 40, 1.0);
    }

    this.camera.update(dt);

    // Update HUD elements
    this.hud.update(dt, this.rod, this.cat, this.environment);

    // Update Realtime Multiplayer Sync & Remote Players
    if (this.multiplayer) {
      this.multiplayer.update(dt, this.cat, this.rod, this.economy);
    }

    // End of Frame Input Buffer Clear
    this.input.clearFrame();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.aquarium.isOpen) {
      // Render Aquarium Mode
      this.renderAquariumMode();
      return;
    }

    // Apply Camera Transform
    this.camera.apply(this.ctx);

    const bounds = this.camera.getVisibleWorldBounds();

    // 1. Draw Sky & Atmosphere
    this.environment.drawSky(this.ctx, bounds);

    // 2. Draw Ocean & Depth Layers & Seabed
    this.environment.drawOcean(this.ctx, bounds);

    // 3. 🏡 Draw Far Left Wooden Pier, Cabin Shack, & Merchant Cat NPC (with [R] interact badge)
    this.environment.drawPierAndCabin(this.ctx, bounds, this.cat.pos.x);

    // 4. Draw Ocean Fish (Viewport frustum culled with 180px buffer for ultra-smooth 60 FPS)
    const margin = 180;
    this.fishList.forEach(fish => {
      if (
        fish.pos.x >= bounds.left - margin &&
        fish.pos.x <= bounds.right + margin &&
        fish.pos.y >= bounds.top - margin &&
        fish.pos.y <= bounds.bottom + margin
      ) {
        fish.draw(this.ctx);
      }
    });

    // 5. Draw Sonar Waves & Detected Fish Markers
    this.drawSonarEffect(this.ctx, bounds);

    // 6. Draw Other Remote Players & Chat Bubbles
    const showMyNametag = this.input.isKeyHeld('Tab') || this.tabNametagTimer > 0;
    if (this.multiplayer) {
      this.multiplayer.draw(this.ctx, this.cat, this.rod, showMyNametag);
    }

    // 7. Draw Local Cat & Boat (Only show local nickname tag when Tab is pressed / active)
    const localPlayerName = this.cloudSave?.currentUser?.displayName 
      || localStorage.getItem('cozy_cat_player_nickname') 
      || (this.multiplayer ? this.multiplayer.playerName : '냥이 집사');
    this.cat.draw(this.ctx, showMyNametag ? localPlayerName : null);

    // 8. Draw Local Fishing Line, Bobber & Hook
    this.rod.draw(this.ctx, this.cat);

    this.camera.restore(this.ctx);

    // 9. Screen Space HUD: Boss Tracking Radar Arrow (for 📡 hat_radar)
    this.drawBossRadarArrow(this.ctx);

    // 🌟 10. Draw Star Catch Mini-Game Screen Overlay
    if (this.starCatchMinigame && this.starCatchMinigame.isActive) {
      this.starCatchMinigame.draw(
        this.ctx, 
        this.canvas.width, 
        this.canvas.height, 
        this.rod, 
        this.environment.waterSurfaceY
      );
    }
  }

  drawSonarEffect(ctx, bounds) {
    const sonarRadius = this.economy.getSonarRadius();
    if (sonarRadius <= 0) return;

    // Origin: Hook if submerged, otherwise cat
    const isSubmerged = (this.rod.state === 'FISHING' && this.rod.isSubmerged);
    const origin = isSubmerged ? this.rod.hookPos : this.cat.pos;

    ctx.save();

    // 1. Draw Sonar Base Range Ring
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, sonarRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Animated Expanding Pulse Waves
    const now = Date.now() / 1000;
    for (let i = 0; i < 2; i++) {
      const phase = (now * 0.65 + i * 0.5) % 1.0;
      const r = phase * sonarRadius;
      const alpha = (1 - phase) * 0.45;
      ctx.strokeStyle = `rgba(0, 245, 212, ${alpha})`;
      ctx.lineWidth = 3.5 - phase * 2;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Highlight Detected Fishes inside radius
    const maxDetectDist = sonarRadius;
    this.fishList.forEach(fish => {
      const dist = origin.dist ? origin.dist(fish.pos) : Math.hypot(origin.x - fish.pos.x, origin.y - fish.pos.y);
      if (dist <= maxDetectDist) {
        // Draw Sonar Ping Marker around fish
        ctx.save();
        ctx.strokeStyle = fish.isBoss ? '#ffd166' : (fish.isShiny ? '#ff007f' : '#00f5d4');
        ctx.fillStyle = fish.isBoss ? 'rgba(255, 209, 102, 0.2)' : 'rgba(0, 245, 212, 0.15)';
        ctx.lineWidth = fish.isBoss ? 2.5 : 1.5;
        
        ctx.beginPath();
        ctx.arc(fish.pos.x, fish.pos.y, 24 * (fish.isBoss ? 2.2 : 1.0), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Depth & distance text tag
        const distM = Math.round(dist / 20);
        const isDiscovered = (this.encyclopedia && typeof this.encyclopedia.isDiscovered === 'function') ? this.encyclopedia.isDiscovered(fish.data.id) : Boolean(this.encyclopedia?.records?.[fish.data.id]?.caughtCount > 0);
        const displayName = isDiscovered ? fish.data.name : '???';

        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = fish.isBoss ? '#ffd166' : '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        const tag = fish.isBoss ? `👑 ${displayName}` : (fish.isShiny ? `✨ ${displayName}` : `${displayName} (${distM}m)`);
        ctx.fillText(tag, fish.pos.x, fish.pos.y - 28 * (fish.isBoss ? 2.0 : 1.0));
        ctx.restore();
      }
    });

    ctx.restore();
  }

  drawBossRadarArrow(ctx) {
    if (this.economy.currentHatId !== 'hat_radar') return;

    // Find any boss in ocean
    const boss = this.fishList.find(f => f.isBoss);
    if (!boss) return;

    // Origin: Hook if submerged, otherwise Cat
    const isSubmerged = (this.rod.state === 'FISHING' && this.rod.isSubmerged);
    const originWorld = isSubmerged ? this.rod.hookPos : this.cat.pos;

    // Distance in meters
    const distWorld = originWorld.dist ? originWorld.dist(boss.pos) : Math.hypot(originWorld.x - boss.pos.x, originWorld.y - boss.pos.y);
    const distM = Math.round(distWorld / 20);

    const isBossDiscovered = (this.encyclopedia && typeof this.encyclopedia.isDiscovered === 'function') ? this.encyclopedia.isDiscovered(boss.data.id) : Boolean(this.encyclopedia?.records?.[boss.data.id]?.caughtCount > 0);
    const bossDisplayName = isBossDiscovered ? boss.data.name : '???';

    // Convert to Screen coordinates
    const originScreenX = (originWorld.x - this.camera.pos.x) * this.camera.zoom + this.canvas.width / 2;
    const originScreenY = (originWorld.y - this.camera.pos.y) * this.camera.zoom + this.canvas.height / 2;
    const bossScreenX = (boss.pos.x - this.camera.pos.x) * this.camera.zoom + this.canvas.width / 2;
    const bossScreenY = (boss.pos.y - this.camera.pos.y) * this.camera.zoom + this.canvas.height / 2;

    const angle = Math.atan2(bossScreenY - originScreenY, bossScreenX - originScreenX);

    // Check if boss is currently visible inside screen viewport
    const margin = 65;
    const isVisibleOnScreen = (
      bossScreenX >= margin && bossScreenX <= this.canvas.width - margin &&
      bossScreenY >= margin && bossScreenY <= this.canvas.height - margin
    );

    ctx.save();

    if (isVisibleOnScreen) {
      // 🎯 Boss is directly on screen: draw animated Lock-on Crosshair
      const pulse = 1.0 + Math.sin(Date.now() / 150) * 0.12;
      ctx.strokeStyle = '#ff0054';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff0054';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(bossScreenX, bossScreenY, 50 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(`🎯 [TARGET: ${bossDisplayName}] ${distM}m`, bossScreenX, bossScreenY - 60 * pulse);
    } else {
      // 🧭 Boss is off-screen: Clamp radar arrow to screen perimeter margin
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      const w = (this.canvas.width - margin * 2) / 2;
      const h = (this.canvas.height - margin * 2) / 2;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      let tX = cosA !== 0 ? (cosA > 0 ? w / cosA : -w / cosA) : Infinity;
      let tY = sinA !== 0 ? (sinA > 0 ? h / sinA : -h / sinA) : Infinity;
      const t = Math.min(Math.abs(tX), Math.abs(tY));

      const arrowX = cx + cosA * t;
      const arrowY = cy + sinA * t;

      // Draw Glowing Radar Badge on screen edge
      ctx.translate(arrowX, arrowY);
      ctx.rotate(angle);

      const pulse = Math.sin(Date.now() / 180) * 3;

      // Neon Pointer Arrow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(24 + pulse, 0);
      ctx.lineTo(-14 + pulse, -14);
      ctx.lineTo(-6 + pulse, 0);
      ctx.lineTo(-14 + pulse, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reset rotation for text label
      ctx.rotate(-angle);

      // Distance & Boss Name Pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 8;

      const label = `👑 ${bossDisplayName} ${distM}m`;
      ctx.font = 'bold 12px sans-serif';
      const textMetrics = ctx.measureText(label);
      const pillW = textMetrics.width + 22;
      const pillH = 26;
      const pillY = (arrowY > this.canvas.height - 75) ? -28 : 28;

      ctx.beginPath();
      ctx.roundRect(-pillW / 2, pillY - pillH / 2, pillW, pillH, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(label, 0, pillY);
    }

    ctx.restore();
  }

  renderAquariumMode() {
    // Dim background
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Aquarium simulation
    this.aquarium.draw(this.ctx, this.canvas.width, this.canvas.height);
  }
}

// Launch Game on Load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
