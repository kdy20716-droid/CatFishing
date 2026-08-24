/**
 * Master Game Controller & Loop
 */
import { Vector2 } from './engine/Vector.js?v=6.2.0';
import { Camera } from './engine/Camera.js?v=6.2.0';
import { Input } from './engine/Input.js?v=6.2.0';
import { SoundEngine } from './audio.js?v=6.2.0';
import { Economy } from './systems/Economy.js?v=6.2.0';
import { Encyclopedia, FISH_SPECIES } from './systems/Encyclopedia.js?v=6.2.0';
import { Environment } from './systems/Environment.js?v=6.2.0';
import { Aquarium } from './systems/Aquarium.js?v=6.2.0';
import { Cat } from './entities/Cat.js?v=6.2.0';
import { Rod } from './entities/Rod.js?v=6.2.0';
import { Fish } from './entities/Fish.js?v=6.2.0';
import { HUD } from './ui/HUD.js?v=6.2.0';
import { Modals } from './ui/Modals.js?v=6.2.0';
import { CloudSave } from './systems/CloudSave.js?v=6.2.0';
import { Multiplayer } from './systems/Multiplayer.js?v=6.2.0';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.lastTime = 0;
    this.maxFishCount = 280; // Dense, lively ocean across entire 32,000px wide & 750m deep waters!
    this.fishList = [];
    this.prevTimeOfDay = 'day';

    // 👑 Boss Director (10~15분 주기 보스 출현 타이머)
    this.bossSpawnTimer = 0;
    this.bossSpawnCooldown = 600 + Math.random() * 300; // 600s ~ 900s (10~15 minutes)

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

    this.hud.setRod(this.rod);
    this.modals.setRod(this.rod);
    this.modals.setMultiplayer(this.multiplayer);
    this.isPaused = false;
    this.modals.onPauseChange = (paused) => {
      this.isPaused = paused;
    };

    this.hasTriggeredDockMerchant = false;
    this.fishSaveTimer = 0;

    // Initial camera placement (focus on cat's persisted position)
    this.camera.pos.set(this.cat.pos.x, this.cat.pos.y);

    // Populate initial ocean fish (or restore previous fish population)
    this.spawnInitialFish();

    // Hook inputs & buttons
    this.initUIButtons();
    this.initInputHandlers();

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
          id: f.data.id,
          x: Math.round(f.pos.x),
          y: Math.round(f.pos.y),
          facing: f.facing,
          sizeCm: f.sizeCm,
          isShiny: f.isShiny,
          minSwimX: f.swimBounds?.minX,
          maxSwimX: f.swimBounds?.maxX
        }));

      localStorage.setItem('cozy_cat_ocean_fish_v1', JSON.stringify(serializableFish));
    } catch (e) {}
  }

  spawnInitialFish() {
    this.fishList = [];
    let loadedFishCount = 0;

    // 1. Try to restore previous fish population
    try {
      const saved = localStorage.getItem('cozy_cat_ocean_fish_v1');
      if (saved) {
        const fishDataList = JSON.parse(saved);
        if (Array.isArray(fishDataList) && fishDataList.length > 0) {
          fishDataList.forEach(item => {
            const species = FISH_SPECIES.find(s => s.id === item.id);
            if (species) {
              let spawnX = item.x;
              let bounds = (typeof item.minSwimX === 'number' && typeof item.maxSwimX === 'number')
                ? { minX: item.minSwimX, maxX: item.maxSwimX }
                : null;

              if (species.isBoss) {
                // 👑 보스 물고기는 최신 원양 서식 구역(minX ~ maxX)으로 엄격 갱신
                const bMin = species.minX || 1600;
                const bMax = species.maxX || 32000;
                bounds = { minX: bMin - 150, maxX: bMax + 150 };
                if (spawnX < bMin || spawnX > bMax) {
                  spawnX = bMin + Math.random() * (bMax - bMin);
                }
              }

              const fish = new Fish(species, new Vector2(spawnX, item.y), !!item.isShiny, bounds);
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

    // 2. Fill the remaining spots up to maxFishCount
    const needed = this.maxFishCount - loadedFishCount;
    for (let i = 0; i < needed; i++) {
      this.spawnSingleFish();
    }
  }

  spawnSingleFish(forceBoss = false) {
    let chosen = null;
    const bossSpecies = FISH_SPECIES.filter(f => f.isBoss);
    const regularSpecies = FISH_SPECIES.filter(f => !f.isBoss);

    const activeBosses = this.fishList.filter(f => f.isBoss);
    const existingBossIds = activeBosses.map(f => f.data.id);
    const availableBossSpecies = bossSpecies.filter(b => !existingBossIds.includes(b.id));

    const bossChance = this.economy.getBossChance(); // 👑 기본 0.1% (0.001) + 행운 배율
    const rollBoss = Math.random();

    // 맵 전체에 보스는 최대 2마리까지만 동시 출현하도록 제어 (과밀 스폰 방지)
    const canSpawnBoss = (forceBoss || rollBoss < bossChance) && availableBossSpecies.length > 0 && activeBosses.length < 2;

    if (canSpawnBoss) {
      // 👑 10대 전설 신화 보스 소환 (현재 없는 보스 중 무작위 선택)
      chosen = availableBossSpecies[Math.floor(Math.random() * availableBossSpecies.length)];
    } else {
      // 🐟 일반/희귀/에픽/전설 물고기 (행운 가중치 적용)
      const luckMult = this.economy.getLuckMultiplier();
      const roll = Math.random();
      let targetRarity = 'common';
      if (roll < 0.03 * luckMult) targetRarity = 'mythic';
      else if (roll < 0.09 * luckMult) targetRarity = 'legendary';
      else if (roll < 0.22 * luckMult) targetRarity = 'epic';
      else if (roll < 0.48 * luckMult) targetRarity = 'rare';
      else if (roll < 0.72) targetRarity = 'uncommon';

      const candidates = regularSpecies.filter(f => f.rarity === targetRarity);
      chosen = candidates.length > 0 
        ? candidates[Math.floor(Math.random() * candidates.length)] 
        : regularSpecies[Math.floor(Math.random() * regularSpecies.length)];
    }

    const speciesIndex = FISH_SPECIES.indexOf(chosen);
    const totalSpecies = Math.max(1, FISH_SPECIES.length - 1);
    const depthProgress = Math.max(0, Math.min(1, speciesIndex / totalSpecies));

    // 🌊 가로 32,000px & 수심 750m(15,000px) 광활한 바다 전역에 골고루 분산 배치!
    let minSpawnX, maxSpawnX;
    let minSwimX, maxSwimX;

    if (chosen.isBoss) {
      // 👑 10대 신화 보스: 배 티어별 원양 서식 구역(minX ~ maxX)에 엄격히 격리되어 부두막 근처 침범 방지!
      minSpawnX = chosen.minX || 1600;
      maxSpawnX = chosen.maxX || 32000;
      minSwimX = Math.max(1200, minSpawnX - 150);
      maxSwimX = Math.min(32000, maxSpawnX + 150);
    } else if (depthProgress < 0.25) {
      // 1. 표층/초근해 (0~30m: 멸치, 구피, 흰동가리, 복어 등)
      minSpawnX = -350;
      maxSpawnX = 31500;
      minSwimX = -600;
      maxSwimX = 32000;
    } else if (depthProgress < 0.50) {
      // 2. 중층 (30~100m: 참돔, 고등어, 꽁치, 날치, 바다거북 등)
      minSpawnX = 200;
      maxSpawnX = 31500;
      minSwimX = 0;
      maxSwimX = 32000;
    } else if (depthProgress < 0.75) {
      // 3. 심해 어둠층 (100~250m: 갈치, 초롱아귀, 문어, 톱상어 등)
      minSpawnX = 600;
      maxSpawnX = 31500;
      minSwimX = 400;
      maxSwimX = 32000;
    } else {
      // 4. 심연 & 초심연 (250~750m: 대왕 산갈치, 덤보문어, 실러캔스, 별빛고래, 크라켄, 레비아탄 등)
      minSpawnX = 1200;
      maxSpawnX = 31500;
      minSwimX = 800;
      maxSwimX = 32000;
    }

    const startX = minSpawnX + Math.random() * (maxSpawnX - minSpawnX);
    const minY = (chosen.minDepth || 1) * 20;
    const maxY = Math.min(15000, (chosen.maxDepth || 750) * 20);
    const startY = minY + Math.random() * (maxY - minY);

    // ✨ Shiny (이로치) check (낮: 1.0%, 밤: 3.0%)
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
      if (this.aquarium.isOpen) return;

      if (this.rod.state === 'READY') {
        this.rod.startCharging();
        this.cat.state = 'CHARGE';
      }
    });

    this.input.on('pointerup', () => {
      if (this.aquarium.isOpen) return;

      if (this.rod.state === 'CHARGING') {
        this.rod.cast(this.cat);
        this.cat.state = 'CAST';
        setTimeout(() => {
          if (this.cat.state === 'CAST') this.cat.state = 'IDLE';
        }, 500);
      }
    });

    // Right-Click & Action Widget Trigger Handling
    this.handleRightClickAction = () => {
      if (this.aquarium.isOpen) return;
      if (this.rod.state === 'FISHING' && this.rod.isSubmerged) {
        // 1. Try triggering Allure Pheromone first if owned
        if ((this.economy.baitInventory['allure'] || 0) > 0) {
          const success = this.rod.triggerAllure(this.fishList);
          if (success) {
            this.camera.shake(8, 0.4);
            this.hud.showNotification('💖 환상의 현혹 페로몬 발동! 주변 모든 물고기가 미끼로 쇄도합니다!', '✨');
            this.hud.initBaitBar();
            return;
          }
        }

        // 2. Otherwise try Depth Charge Bomb
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

        // 3. No special item -> Toggle Depth Lock (STOP / RESUME SINKING)
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

    this.input.on('rightclick', () => this.handleRightClickAction());
    this.hud.onRightActionTrigger = () => this.handleRightClickAction();

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

      if (code === 'KeyH') this.modals.openGuide();
      if (code === 'Escape') {
        if (this.modals.isPauseOpen()) {
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
    });
  }

  handleFishCaught(fish) {
    this.sound.playCatch((fish.isBoss || fish.isShiny) ? 'mythic' : fish.data.rarity);
    this.cat.triggerCatch();
    this.camera.shake(fish.isBoss ? 16 : (fish.isShiny ? 10 : 6), 0.55);

    let price = fish.data.basePrice;
    let exp = fish.data.baseExp;

    if (fish.isShiny) {
      price = Math.round(price * 3.0);
      exp = Math.round(exp * 3.0);
    }

    const leveledUp = this.economy.addExp(exp);

    // 🧺 어획 바구니에 물고기 보관 (부두 상인에게 가서 판매하거나 아쿠아리움에 수집!)
    const basketItem = this.economy.addFishToBasket(fish, price, exp);

    const result = this.encyclopedia.recordCatch(fish.data.id, fish.sizeCm, price, fish.isShiny);
    this.hud.showCatchPopup(fish, { ...result, basketPrice: price });

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

    // Remove caught fish from active ocean list & spawn replacement
    const idx = this.fishList.indexOf(fish);
    if (idx !== -1) {
      this.fishList.splice(idx, 1);
    }
    this.spawnSingleFish(false);

    // Auto-sync progress to cloud
    if (this.cloudSave) {
      this.cloudSave.triggerAutoSave();
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
    this.environment.update(dt, this.sound);

    // Notify player on night arrival (Shiny Fever Time!)
    if (this.environment.timeOfDay !== this.prevTimeOfDay) {
      if (this.environment.timeOfDay === 'night') {
        this.hud.showNotification('🌌 밤이 찾아왔습니다! 황금빛 이로치 물고기 출현 확률이 3%로 대폭 상승합니다! ✨', '🌟');
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

    // Update Cat & Boat (allow steering in READY, FLYING, and FISHING)
    const boatAxis = (this.rod.state !== 'CHARGING') ? this.input.horizontalAxis : 0;
    this.cat.update(dt, this.environment.waterSurfaceY, boatAxis);

    // Update Rod & Line
    this.rod.update(
      dt,
      this.cat,
      isReeling,
      this.environment.waterSurfaceY,
      (caughtFish) => this.handleFishCaught(caughtFish)
    );

    // Hook nibble alert
    if (this.rod.hookedFish && this.cat.state !== 'CATCH' && this.cat.state !== 'REELING') {
      this.cat.triggerNibble();
    }

    // Update Ocean Fish population across 0m ~ 750m+ and -800 ~ 32,000px wide
    const oceanBounds = { left: -800, right: 32000, top: 0, bottom: 15800 };
    this.fishList.forEach(fish => fish.update(dt, this.rod, oceanBounds, this.cat));

    // Maintain lively fish population (0.1% boss chance + luck multiplier on every spawn)
    while (this.fishList.length < this.maxFishCount) {
      this.spawnSingleFish();
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

    // 4. Draw Ocean Fish
    this.fishList.forEach(fish => fish.draw(this.ctx));

    // 5. Draw Sonar Waves & Detected Fish Markers
    this.drawSonarEffect(this.ctx, bounds);

    // 6. Draw Other Remote Players & Chat Bubbles
    if (this.multiplayer) {
      this.multiplayer.draw(this.ctx, this.cat, this.rod);
    }

    // 7. Draw Local Cat & Boat (with active player nickname tag)
    const localPlayerName = this.cloudSave?.currentUser?.displayName 
      || localStorage.getItem('cozy_cat_player_nickname') 
      || (this.multiplayer ? this.multiplayer.playerName : '냥이 집사');
    this.cat.draw(this.ctx, localPlayerName);

    // 8. Draw Local Fishing Line, Bobber & Hook
    this.rod.draw(this.ctx, this.cat);

    this.camera.restore(this.ctx);

    // 9. Screen Space HUD: Boss Tracking Radar Arrow (for 📡 hat_radar)
    this.drawBossRadarArrow(this.ctx);
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
        const isDiscovered = this.encyclopedia.isDiscovered(fish.data.id);
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

    const isBossDiscovered = this.encyclopedia.isDiscovered(boss.data.id);
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
