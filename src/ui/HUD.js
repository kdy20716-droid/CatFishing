/**
 * HUD & In-Game UI Overlay Manager
 */
import { BAITS } from '../systems/Economy.js?v=7.3.0';
import { Fish } from '../entities/Fish.js?v=7.3.0';
import { getBaitIconSvg } from './BaitIcons.js?v=7.3.0';

export class HUD {
  constructor(economy, encyclopedia, soundEngine, environment = null) {
    this.economy = economy;
    this.encyclopedia = encyclopedia;
    this.sound = soundEngine;
    this.environment = environment;

    // Elements
    this.goldDisplay = document.getElementById('hud-gold');
    this.levelDisplay = document.getElementById('hud-level');
    this.expFill = document.getElementById('hud-exp-fill');
    this.depthDisplay = document.getElementById('hud-depth');
    this.baitContainer = document.getElementById('hud-baits');
    this.baitDrawer = document.getElementById('bait-drawer');
    this.btnToggleBaitDrawer = document.getElementById('btn-toggle-bait-drawer');
    this.btnCloseBaitDrawer = document.getElementById('btn-close-bait-drawer');
    this.activeBaitIcon = document.getElementById('active-bait-icon');
    this.activeBaitName = document.getElementById('active-bait-name');
    this.activeBaitCount = document.getElementById('active-bait-count');
    this.tensionContainer = document.getElementById('hud-tension-container');
    this.tensionFill = document.getElementById('hud-tension-fill');
    this.tensionWarning = document.getElementById('hud-tension-warning');
    this.chargeBarContainer = document.getElementById('hud-charge-container');
    this.chargeFill = document.getElementById('hud-charge-fill');
    this.catchModal = document.getElementById('catch-modal');

    // 🛑 / 💖 / 💣 Right-Bottom Floating Action Widget
    this.rightActionWidget = document.getElementById('right-action-widget');
    this.rightActionBtn = document.getElementById('right-action-btn');
    this.rightActionIcon = document.getElementById('right-action-icon');
    this.rightActionLabel = document.getElementById('right-action-label');
    this.rightActionCount = document.getElementById('right-action-count');
    this.onRightActionTrigger = null;

    // Floating notifications
    this.notifications = [];
    this.notifContainer = document.getElementById('floating-notifications');
    this.rod = null;

    this.initBaitBar();
    this.initDrawerEvents();
    this.initRightActionWidget();
  }

  initRightActionWidget() {
    if (this.rightActionBtn) {
      this.rightActionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.onRightActionTrigger) {
          this.onRightActionTrigger();
        }
      });
      this.rightActionBtn.addEventListener('contextmenu', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.onRightActionTrigger) {
          this.onRightActionTrigger();
        }
      });
    }
  }

  setRod(rod) {
    this.rod = rod;
  }

  canChangeBaitOrItem() {
    if (this.rod && this.rod.state !== 'READY') {
      return false;
    }
    return true;
  }

  initDrawerEvents() {
    if (this.btnToggleBaitDrawer) {
      this.btnToggleBaitDrawer.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.canChangeBaitOrItem()) {
          this.sound.playClick();
          this.showNotification('찌를 던진 후에는 미끼와 아이템을 변경할 수 없습니다!', '🔒');
          return;
        }
        this.sound.playClick();
        this.toggleBaitDrawer();
      });
    }

    if (this.btnCloseBaitDrawer) {
      this.btnCloseBaitDrawer.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        this.toggleBaitDrawer(false);
      });
    }

    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
      if (this.baitDrawer && this.baitDrawer.classList.contains('open')) {
        if (!this.baitDrawer.contains(e.target) && !this.btnToggleBaitDrawer.contains(e.target)) {
          this.toggleBaitDrawer(false);
        }
      }
    });
  }

  toggleBaitDrawer(forceState = null) {
    if (!this.baitDrawer) return;
    const shouldOpen = forceState !== null ? forceState : !this.baitDrawer.classList.contains('open');
    if (shouldOpen && !this.canChangeBaitOrItem()) {
      this.showNotification('찌를 던진 후에는 미끼와 아이템을 변경할 수 없습니다!', '🔒');
      return;
    }
    this.baitDrawer.classList.toggle('open', shouldOpen);
  }

  initBaitBar() {
    if (!this.baitContainer) return;
    this.baitContainer.innerHTML = '';

    BAITS.forEach((bait, index) => {
      const hasStock = this.economy.hasBait(bait.id);
      const btn = document.createElement('button');
      btn.className = `bait-btn ${this.isItemActive(bait.id) ? 'active' : ''} ${!hasStock ? 'empty' : ''}`;
      btn.dataset.baitId = bait.id;
      btn.title = `${bait.name} ${bait.maxDepth ? `(유효 수심: ~${bait.maxDepth}m)` : ''} - ${bait.description}`;
      btn.dataset.tooltip = `${bait.name} [${index + 1}]`;

      let count = '';
      if (bait.id === 'bread') count = '∞';
      else count = `x${this.economy.baitInventory[bait.id] || 0}`;

      btn.innerHTML = `
        <span class="bait-key">${index + 1}</span>
        <span class="bait-icon-wrapper">${getBaitIconSvg(bait.id)}</span>
        <span class="bait-count" id="bait-count-${bait.id}">${count}</span>
      `;

      btn.addEventListener('click', () => {
        if (bait.id === 'rocket') {
          this.toggleRocketItem();
        } else if (bait.id === 'allure') {
          this.sound.playClick();
          this.showNotification('💖 현혹 페로몬: 물속에서 마우스 우클릭 시 주변 모든 물고기가 미끼로 쇄도합니다!', '💡');
        } else if (bait.id === 'bomb') {
          this.sound.playClick();
          this.showNotification('💣 폭탄: 물속에서 마우스 우클릭 시 주변 방해 물고기를 퇴치합니다!', '💡');
        } else if (bait.id === 'multi_hook_2') {
          this.selectHookCount(2);
        } else if (bait.id === 'multi_hook_3') {
          this.selectHookCount(3);
        } else {
          const success = this.selectBait(bait.id);
          if (success) {
            this.sound.playClick();
            this.toggleBaitDrawer(false);
          }
        }
      });

      this.baitContainer.appendChild(btn);
    });

    this.updateActiveBaitPill();
  }

  isItemActive(id) {
    if (id === 'rocket') return this.economy.useRocket;
    if (id === 'multi_hook_2') return this.economy.hookMode === 2 && (this.economy.baitInventory['multi_hook_2'] || 0) > 0;
    if (id === 'multi_hook_3') return this.economy.hookMode === 3 && (this.economy.baitInventory['multi_hook_3'] || 0) > 0;
    return id === this.economy.currentBaitId;
  }

  toggleRocketItem() {
    this.sound.playClick();
    if (!this.canChangeBaitOrItem()) {
      this.showNotification('찌를 던진 후에는 로켓을 변경할 수 없습니다!', '🔒');
      return;
    }
    if (!this.economy.useRocket && (this.economy.baitInventory['rocket'] || 0) <= 0) {
      this.showNotification('🚀 로켓 폭죽이 없습니다! 상점(S)에서 구매하세요.', '⚠️');
      return;
    }
    this.economy.useRocket = !this.economy.useRocket;
    this.economy.saveToStorage();
    if (this.economy.useRocket) {
      this.showNotification('🚀 냥냥 로켓 폭죽 장착 완료! (다음 캐스팅 시 초원거리 발사)', '✨');
    } else {
      this.showNotification('🚀 로켓 폭죽 장착 해제 (일반 캐스팅)', '💡');
    }
    this.updateActiveBaitPill();
  }

  selectHookCount(count) {
    this.sound.playClick();
    if (!this.canChangeBaitOrItem()) {
      this.showNotification('찌를 던진 후에는 바늘 리그를 변경할 수 없습니다!', '🔒');
      return;
    }
    if (count === 2 && (this.economy.baitInventory['multi_hook_2'] || 0) < 1) {
      this.showNotification('🪝 2중 바늘 리그 채비가 없습니다! 상점(S)에서 구매하세요.', '⚠️');
      return;
    }
    if (count === 3 && (this.economy.baitInventory['multi_hook_3'] || 0) < 1) {
      this.showNotification('🔱 3중 바늘 리그 채비가 없습니다! 상점(S)에서 구매하세요.', '⚠️');
      return;
    }

    // Toggle back to 1 if already equipped
    if (this.economy.hookMode === count) {
      this.economy.setHookMode(1);
      this.showNotification('🪝 기본 1개 바늘 장착으로 전환되었습니다.', '💡');
    } else {
      this.economy.setHookMode(count);
      this.showNotification(count === 2 ? '🪝 2중 바늘 리그 채비 장착 완료! (미끼 2개 동시 낚기)' : '🔱 3중 바늘 리그 채비 장착 완료! (미끼 3개 동시 낚기)', '✨');
    }
    this.initBaitBar();
  }

  selectBait(baitId) {
    if (!this.canChangeBaitOrItem()) {
      this.sound.playClick();
      this.showNotification('찌를 던진 후에는 미끼를 변경할 수 없습니다!', '🔒');
      return false;
    }

    if (baitId !== 'bread' && !this.economy.hasBait(baitId)) {
      this.sound.playClick();
      this.showNotification('미끼가 부족합니다! 상점(S)에서 구매하세요.', '⚠️');
      this.updateActiveBaitPill();
      return false;
    }

    this.economy.currentBaitId = baitId;
    this.updateActiveBaitPill();
    return true;
  }

  updateActiveBaitPill() {
    // If currently selected bait has run out, fallback to bread
    if (!this.economy.hasBait(this.economy.currentBaitId)) {
      this.economy.currentBaitId = 'bread';
    }

    const bait = BAITS.find(b => b.id === this.economy.currentBaitId) || BAITS[0];
    const count = bait.id === 'bread' ? '무제한' : `x${this.economy.baitInventory[bait.id] || 0}`;

    let gadgetBadge = '';
    if (this.economy.useRocket) gadgetBadge += ' 🚀';
    if (this.economy.hookCount === 2) gadgetBadge += ' 🪝x2';
    if (this.economy.hookCount === 3) gadgetBadge += ' 🔱x3';

    if (this.activeBaitIcon) this.activeBaitIcon.innerHTML = getBaitIconSvg(bait.id);
    if (this.activeBaitName) this.activeBaitName.innerText = `${bait.name}${gadgetBadge}`;
    if (this.activeBaitCount) this.activeBaitCount.innerText = `(${count})`;

    const isLocked = this.rod && this.rod.state !== 'READY';

    if (this.btnToggleBaitDrawer) {
      this.btnToggleBaitDrawer.classList.toggle('locked', isLocked);
      const arrowEl = this.btnToggleBaitDrawer.querySelector('.bait-pill-arrow');
      if (arrowEl) {
        arrowEl.innerText = isLocked ? '🔒 낚시 중 잠김' : '▲ 미끼/아이템';
      }
    }

    // Update active highlight and empty class on drawer buttons
    document.querySelectorAll('.bait-btn').forEach(btn => {
      const bId = btn.dataset.baitId;
      btn.classList.toggle('active', this.isItemActive(bId));
      btn.classList.toggle('empty', !this.economy.hasBait(bId));
      btn.classList.toggle('locked', isLocked);
    });
  }

  update(dt, rod, cat, environment = this.environment) {
    this.rod = rod;

    // Automatically close bait drawer if fishing is ongoing
    if (rod.state !== 'READY' && this.baitDrawer && this.baitDrawer.classList.contains('open')) {
      this.baitDrawer.classList.remove('open');
    }
    // 1. Update Gold & Level
    if (this.goldDisplay) {
      this.goldDisplay.innerText = this.economy.gold.toLocaleString() + ' G';
    }
    if (this.levelDisplay) {
      this.levelDisplay.innerText = `Lv. ${this.economy.level}`;
    }
    if (this.expFill) {
      const needed = this.economy.getExpForNextLevel();
      const pct = Math.min(100, Math.round((this.economy.exp / needed) * 100));
      this.expFill.style.width = `${pct}%`;
    }

    // 2. Update Bait Inventory counts
    BAITS.forEach(bait => {
      const el = document.getElementById(`bait-count-${bait.id}`);
      if (el) {
        const hasStock = this.economy.hasBait(bait.id);
        if (bait.id === 'bread') el.innerText = '∞';
        else if (bait.isTackle) el.innerText = hasStock ? '보유' : '0';
        else el.innerText = `x${this.economy.baitInventory[bait.id] || 0}`;
      }
    });
    this.updateActiveBaitPill();

    // 3. Update Depth Display (0m ~ 750m)
    if (this.depthDisplay) {
      if (rod.state === 'FISHING' && rod.isSubmerged) {
        const depthMeters = Math.max(0, Math.round((rod.hookPos.y - rod.waterY) / 20 * 10) / 10);
        let zoneText = '표층 바다 🌊';
        if (depthMeters >= 30 && depthMeters < 100) zoneText = '중층 바다 🐬';
        else if (depthMeters >= 100 && depthMeters < 250) zoneText = '심해 어둠층 🔦';
        else if (depthMeters >= 250 && depthMeters < 450) zoneText = '심연의 해구 🪐';
        else if (depthMeters >= 450 && depthMeters < 650) zoneText = '미지의 초심연 🌌';
        else if (depthMeters >= 650) zoneText = '태초의 해저 바닥 👑';

        this.depthDisplay.innerHTML = `수심 <strong>${depthMeters.toFixed(1)}m</strong> <small>(${zoneText})</small>`;
        this.depthDisplay.classList.add('visible');
      } else {
        this.depthDisplay.classList.remove('visible');
      }
    }

    // 4. Update Tension Gauge
    if (this.tensionContainer) {
      if (rod.hookedFish && rod.state === 'FISHING') {
        this.tensionContainer.classList.add('visible');
        if (this.tensionFill) {
          this.tensionFill.style.width = `${rod.tension}%`;
          if (rod.tension > 75) {
            this.tensionFill.style.background = 'linear-gradient(90deg, #ff9e00, #d90429)';
            if (this.tensionWarning) this.tensionWarning.classList.add('blink');
          } else {
            this.tensionFill.style.background = 'linear-gradient(90deg, #06d6a0, #ffd166)';
            if (this.tensionWarning) this.tensionWarning.classList.remove('blink');
          }
        }
      } else {
        this.tensionContainer.classList.remove('visible');
      }
    }

    // 5. Update Cast Power Charge Bar
    if (this.chargeBarContainer) {
      if (rod.state === 'CHARGING') {
        this.chargeBarContainer.classList.add('visible');
        if (this.chargeFill) {
          this.chargeFill.style.width = `${Math.round(rod.castCharge * 100)}%`;
        }
      } else {
        this.chargeBarContainer.classList.remove('visible');
      }
    }

    // 6. Update Time Dial Widget
    if (environment) {
      const timeInfo = environment.getTimeInfo();
      const timeIconEl = document.getElementById('hud-time-icon');
      const timeTextEl = document.getElementById('hud-time-text');
      if (timeIconEl) timeIconEl.innerText = timeInfo.icon;
      if (timeTextEl) timeTextEl.innerText = timeInfo.phase;
    }

    // 7. ⬅️ Update Dock Distance Indicator (부두막 방향 & 거리 알림: 50m 초과 시 표시, 50m 이내 접근 시 숨김)
    const dockDistEl = document.getElementById('dock-distance-indicator');
    if (dockDistEl && cat) {
      const dockX = 200; // Dock wooden pier center
      const distM = Math.max(0, Math.round((cat.pos.x - dockX) / 20));
      if (distM > 50) {
        dockDistEl.classList.remove('hidden');
        const textEl = dockDistEl.querySelector('.dock-dist-text');
        if (textEl) textEl.innerHTML = `부두막 <b>${distM.toLocaleString()}m</b>`;
      } else {
        dockDistEl.classList.add('hidden');
      }
    }

    // 8. 🛑 / 💖 / 💣 Update Right-Bottom Floating Action Widget
    if (this.rightActionWidget && this.rightActionBtn) {
      if (rod.state === 'FISHING' && rod.isSubmerged) {
        this.rightActionWidget.classList.remove('hidden');

        const allureCount = this.economy.baitInventory['allure'] || 0;
        const bombCount = this.economy.baitInventory['bomb'] || 0;

        this.rightActionBtn.className = 'right-action-btn';

        if (allureCount > 0) {
          // Case A-1: Allure Pheromone available
          this.rightActionBtn.classList.add('mode-allure');
          if (this.rightActionIcon) this.rightActionIcon.innerHTML = getBaitIconSvg('allure');
          if (this.rightActionLabel) this.rightActionLabel.innerText = '현혹 페로몬';
          if (this.rightActionCount) {
            this.rightActionCount.classList.remove('hidden');
            this.rightActionCount.innerText = `x${allureCount}`;
          }
        } else if (bombCount > 0) {
          // Case A-2: Depth Bomb available
          this.rightActionBtn.classList.add('mode-bomb');
          if (this.rightActionIcon) this.rightActionIcon.innerHTML = getBaitIconSvg('bomb');
          if (this.rightActionLabel) this.rightActionLabel.innerText = '어군 폭탄';
          if (this.rightActionCount) {
            this.rightActionCount.classList.remove('hidden');
            this.rightActionCount.innerText = `x${bombCount}`;
          }
        } else {
          // Case B: No special items -> Depth Lock (STOP / SINK)
          if (this.rightActionCount) this.rightActionCount.classList.add('hidden');
          if (rod.isDepthLocked) {
            this.rightActionBtn.classList.add('mode-locked');
            if (this.rightActionIcon) this.rightActionIcon.innerText = '▶️';
            if (this.rightActionLabel) this.rightActionLabel.innerText = 'SINK';
          } else {
            this.rightActionBtn.classList.add('mode-stop');
            if (this.rightActionIcon) this.rightActionIcon.innerText = '🛑';
            if (this.rightActionLabel) this.rightActionLabel.innerText = 'STOP';
          }
        }
      } else {
        this.rightActionWidget.classList.add('hidden');
      }
    }
  }

  showCatchPopup(fishInstance, catchResult) {
    if (!this.catchModal) return;

    const data = fishInstance.data;
    const size = fishInstance.sizeCm;
    const isShiny = fishInstance.isShiny;

    let price = data.basePrice;
    let expGain = data.baseExp;
    if (isShiny) {
      price = Math.round(price * 3.0);
      expGain = Math.round(expGain * 3.0);
    }

    const rarityBadgeColors = {
      common: '#adb5bd',
      uncommon: '#52b788',
      rare: '#0077b6',
      epic: '#7b2cbf',
      legendary: '#ffb703',
      mythic: '#ff006e'
    };

    const rarityKorean = {
      common: '일반 어종',
      uncommon: '우수 어종',
      rare: '희귀 어종 💎',
      epic: '에픽 심해어 🌟',
      legendary: '전설의 어종 👑',
      mythic: '신화급 해양신 🦄'
    };

    const isBoss = !!fishInstance.isBoss;
    const isFirstTime = !!catchResult.isFirstTime;

    let bannerHtml = '<div class="catch-confetti">✨ 냐앙~! 낚았다냥! ✨</div>';
    if (isBoss) {
      bannerHtml = '<div class="shiny-celebration-banner" style="background: linear-gradient(90deg, #ff0054, #ffd166, #ff0054); animation: pulse 1s infinite;">👑⚡ 대격돌 승리! 초대형 신화 보스 포획 성공! ⚡👑</div>';
    } else if (isFirstTime) {
      bannerHtml = '<div class="shiny-celebration-banner" style="background: linear-gradient(90deg, #ffd166, #06d6a0, #ffd166);">🌟🎉 [NEW DISCOVERY!] 새로운 어종 최초 발견! 🎉🌟</div>';
    } else if (isShiny) {
      bannerHtml = '<div class="shiny-celebration-banner">✨🌟 대박! 이로치 (Shiny) 물고기 획득! 🌟✨</div>';
    }

    let badgeText = rarityKorean[data.rarity] || '어종';
    if (isBoss) badgeText = '👑 초대형 신화 보스';
    else if (isShiny) badgeText = '✨ 이로치 (Shiny)';

    let badgeBg = rarityBadgeColors[data.rarity] || '#0077b6';
    if (isBoss) badgeBg = 'linear-gradient(90deg, #ff0054, #7b2cbf)';
    else if (isShiny) badgeBg = 'linear-gradient(90deg, #ffd166, #ff007f)';

    this.catchModal.innerHTML = `
      <div class="catch-modal-content ${(isShiny || isBoss) ? 'shiny-modal-content' : ''}">
        ${bannerHtml}
        
        <div class="catch-badge" style="background: ${badgeBg}">
          ${badgeText}
        </div>
        
        <h2 class="catch-title" style="${(isShiny || isBoss || isFirstTime) ? 'color: #ffd166; text-shadow: 0 0 14px #ffd166;' : ''}">${isBoss ? '👑 ' : (isShiny ? '✨ ' : '')}${data.name}</h2>
        <div class="catch-eng">${data.engName} ${isBoss ? '(Mythic Boss)' : (isShiny ? '(Shiny Variant)' : '')}</div>

        <!-- 🌟 Dark Showcase Box with Rotating Sunburst for First Catch -->
        <div class="catch-showcase-box ${isFirstTime ? 'has-sunburst' : ''}">
          ${isFirstTime ? '<div class="catch-sunburst"></div>' : ''}
          <canvas id="catch-fish-canvas" class="catch-showcase-canvas" width="240" height="130"></canvas>
        </div>
        
        <div class="catch-stats">
          <div class="stat-box">
            <span class="label">크기</span>
            <span class="val">${size} cm ${catchResult.isNewRecord ? '<span class="new-tag">최대 기록!</span>' : ''}</span>
          </div>
          <div class="stat-box">
            <span class="label">예상 판매가 ${isShiny ? '(3배!)' : ''}</span>
            <span class="val gold-text">${price.toLocaleString()} G</span>
          </div>
          <div class="stat-box">
            <span class="label">획득 경험치 ${isShiny ? '(3배!)' : ''}</span>
            <span class="val exp-text">+${expGain} EXP</span>
          </div>
        </div>

        <p class="catch-desc">${data.description}</p>
        <div class="basket-stored-banner" style="font-size: 12px; color: #94a3b8; margin: 2px 0;">🧺 어획 바구니에 보관되었습니다. (부두 상인에게 판매/수집 가능)</div>
        ${isFirstTime ? '<div class="first-caught-banner">📖 새로운 어종 도감 등록 완료! ✨</div>' : ''}

        <div class="catch-actions">
          <button id="btn-catch-ok" class="btn-primary">확인 (계속 낚시)</button>
        </div>
      </div>
    `;

    // Render Fish Visual on Canvas
    const canvas = document.getElementById('catch-fish-canvas');
    if (canvas) {
      Fish.drawPreview(canvas, data, true, isShiny);
    }

    // 🎆 Fire 3 Celebratory Fireworks if New Discovery
    if (isFirstTime) {
      this.triggerCatchFireworks();
    }

    this.catchModal.classList.add('visible');

    document.getElementById('btn-catch-ok').addEventListener('click', () => {
      this.sound.playClick();
      this.catchModal.classList.remove('visible');
    });
  }

  triggerCatchFireworks() {
    let canvas = document.getElementById('catch-fireworks-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'catch-fireworks-canvas';
      document.body.appendChild(canvas);
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const particles = [];
    const colors = ['#ffd166', '#ff0054', '#06d6a0', '#118ab2', '#70e000', '#f72585', '#4cc9f0', '#ffffff'];

    const createFirework = (originX, originY) => {
      for (let i = 0; i < 42; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0,
          decay: 0.012 + Math.random() * 0.015,
          size: 2.5 + Math.random() * 3.5
        });
      }
    };

    const w = canvas.width;
    const h = canvas.height;

    // 💥 3 Explosions in Sequence (Left, Right, Center)
    createFirework(w * 0.28, h * 0.32);
    setTimeout(() => createFirework(w * 0.72, h * 0.28), 240);
    setTimeout(() => createFirework(w * 0.50, h * 0.20), 480);

    let animId;
    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(renderLoop);
      } else {
        cancelAnimationFrame(animId);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };

    renderLoop();
  }

  showNotification(text, icon = '✨') {
    if (!this.notifContainer) return;
    const notif = document.createElement('div');
    notif.className = 'notif-toast';
    notif.innerHTML = `<span class="notif-icon">${icon}</span> <span>${text}</span>`;
    this.notifContainer.appendChild(notif);

    setTimeout(() => {
      notif.classList.add('fade-out');
      setTimeout(() => notif.remove(), 400);
    }, 2500);
  }
}
