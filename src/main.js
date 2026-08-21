/**
 * Master Game Controller & Loop
 */
import { Vector2 } from './engine/Vector.js';
import { Camera } from './engine/Camera.js';
import { Input } from './engine/Input.js';
import { SoundEngine } from './audio.js';
import { Economy } from './systems/Economy.js';
import { Encyclopedia, FISH_SPECIES } from './systems/Encyclopedia.js';
import { Environment } from './systems/Environment.js';
import { Aquarium } from './systems/Aquarium.js';
import { Cat } from './entities/Cat.js';
import { Rod } from './entities/Rod.js';
import { Fish } from './entities/Fish.js';
import { HUD } from './ui/HUD.js';
import { Modals } from './ui/Modals.js';
import { CloudSave } from './systems/CloudSave.js';
import { Multiplayer } from './systems/Multiplayer.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.lastTime = 0;
    this.maxFishCount = 65; // Populate entire 0~500m ocean richly
    this.fishList = [];

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

    this.hasTriggeredDockMerchant = false;

    // Initial camera placement
    this.camera.pos.set(this.cat.pos.x, this.cat.pos.y);

    // Populate initial ocean fish
    this.spawnInitialFish();

    // Hook inputs & buttons
    this.initUIButtons();
    this.initInputHandlers();

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

  spawnInitialFish() {
    this.fishList = [];
    for (let i = 0; i < this.maxFishCount; i++) {
      this.spawnSingleFish();
    }
  }

  spawnSingleFish() {
    // Choose species based on weighted rarity and depth
    const luckMult = this.economy.getLuckMultiplier();
    
    // Rarity weights
    const roll = Math.random();
    let targetRarity = 'common';
    if (roll < 0.03 * luckMult) targetRarity = 'mythic';
    else if (roll < 0.09 * luckMult) targetRarity = 'legendary';
    else if (roll < 0.22 * luckMult) targetRarity = 'epic';
    else if (roll < 0.48 * luckMult) targetRarity = 'rare';
    else if (roll < 0.72) targetRarity = 'uncommon';

    const candidates = FISH_SPECIES.filter(f => f.rarity === targetRarity);
    const chosen = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)] 
      : FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)];

    const minY = chosen.minDepth * 20;
    const maxY = chosen.maxDepth * 20;
    const startY = minY + Math.random() * (maxY - minY);
    const startX = -600 + Math.random() * 4800;

    // ✨ Shiny (이로치) check
    const isShiny = Math.random() < this.economy.getShinyChance();

    const fish = new Fish(chosen, new Vector2(startX, startY), isShiny);
    fish.onEscapeCallback = (f) => {
      this.camera.shake(8, 0.4);
      this.hud.showNotification(`⚠️ 너무 오래 방치하여 ${f.isShiny ? '✨ 이로치 ' : ''}${f.data.name}이(가) 도망쳤습니다!`, '💨');
    };

    this.fishList.push(fish);
  }

  initUIButtons() {
    // Sound Toggle
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isMuted = !this.sound.isMuted;
        this.sound.setMute(isMuted);
        btnSound.innerHTML = isMuted ? '🔇 뮤트' : '🎵 소리 ON';
        if (!isMuted && !this.sound.isBgmPlaying) {
          this.sound.startBgm();
        }
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

    // Right-Click: Underwater Depth Charge Bomb Detonation
    this.input.on('rightclick', () => {
      if (this.aquarium.isOpen) return;
      if (this.rod.state === 'FISHING' && this.rod.isSubmerged) {
        const success = this.rod.triggerBomb(this.fishList, (eliminatedFish) => {
          const idx = this.fishList.indexOf(eliminatedFish);
          if (idx !== -1) {
            this.fishList.splice(idx, 1);
            setTimeout(() => this.spawnSingleFish(), 3000);
          }
        });

        if (success) {
          this.camera.shake(12, 0.55);
          this.hud.showNotification('💣 콰앙-! 주변 방해 물고기 퇴치 완료!', '💥');
        } else {
          this.hud.showNotification('💣 어군 폭탄이 없습니다! 상점(S)에서 구매하세요.', '⚠️');
        }
      }
    });

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

      // 🎵 [O] 키: 소리 ON/OFF 음소거 토글
      if (code === 'KeyO') {
        const isMuted = !this.sound.isMuted;
        this.sound.setMute(isMuted);
        const btnSound = document.getElementById('btn-sound-toggle');
        if (btnSound) btnSound.innerHTML = isMuted ? '🔇 뮤트' : '🎵 소리 ON';
        if (!isMuted && !this.sound.isBgmPlaying) {
          this.sound.startBgm();
        }
        this.hud.showNotification(isMuted ? '🔇 배경음 & 효과음 음소거' : '🎵 소리 켜짐', isMuted ? '🔇' : '🎵');
      }

      // 🏪 [R] 키: 고양이 상인 범위 안(x <= 320) 또는 이미 열린 상태일 때만 상인 창 열기 / 닫기 토글
      if (code === 'KeyR') {
        const isNearMerchant = (this.cat.pos.x <= 320);
        if (isNearMerchant || this.modals.isDockMerchantOpen()) {
          this.modals.toggleDockMerchant();
        }
      }

      if (code === 'KeyH') this.modals.openGuide();
      if (code === 'Escape') this.modals.closeAll();
    });
  }

  handleFishCaught(fish) {
    this.sound.playCatch(fish.isShiny ? 'mythic' : fish.data.rarity);
    this.cat.triggerCatch();
    this.camera.shake(fish.isShiny ? 10 : 6, 0.45);

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

    if (fish.isShiny) {
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
    this.spawnSingleFish();

    // Auto-sync progress to cloud
    if (this.cloudSave) {
      this.cloudSave.triggerAutoSave();
    }
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.input.update(dt);
    this.environment.update(dt, this.sound);

    if (this.aquarium.isOpen) {
      this.aquarium.update(dt);
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

    // Update Ocean Fish population across 0m ~ 500m+
    const oceanBounds = { left: -800, right: 4800, top: 0, bottom: 10400 };
    this.fishList.forEach(fish => fish.update(dt, this.rod, oceanBounds, this.cat));

    // Maintain fish count
    while (this.fishList.length < this.maxFishCount) {
      this.spawnSingleFish();
    }

    // Camera Tracking
    if (this.rod.state === 'FISHING' && this.rod.isSubmerged) {
      // Follow the submerged hook deep underwater with dynamic zoom
      const hookDepth = this.rod.hookPos.y;
      const zoom = Math.max(0.65, 1.0 - (hookDepth / 10000) * 0.45);
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

    // 5. Draw Other Remote Players & Chat Bubbles
    if (this.multiplayer) {
      this.multiplayer.draw(this.ctx, this.cat, this.rod);
    }

    // 5. Draw Local Cat & Boat
    this.cat.draw(this.ctx);

    // 6. Draw Local Fishing Line, Bobber & Hook
    this.rod.draw(this.ctx, this.cat);

    this.camera.restore(this.ctx);
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
