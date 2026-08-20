/**
 * HUD & In-Game UI Overlay Manager
 */
import { BAITS } from '../systems/Economy.js';
import { getBaitIconSvg } from './BaitIcons.js';

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

    // Floating notifications
    this.notifications = [];
    this.notifContainer = document.getElementById('floating-notifications');

    this.initBaitBar();
    this.initDrawerEvents();
  }

  initDrawerEvents() {
    if (this.btnToggleBaitDrawer) {
      this.btnToggleBaitDrawer.addEventListener('click', (e) => {
        e.stopPropagation();
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

      let count = '';
      if (bait.id === 'bread') count = '무제한';
      else if (bait.isTackle) count = hasStock ? '보유중' : '미보유';
      else count = `x${this.economy.baitInventory[bait.id] || 0}`;

      btn.innerHTML = `
        <span class="bait-key">${index + 1}</span>
        <span class="bait-icon-wrapper">${getBaitIconSvg(bait.id)}</span>
        <span class="bait-info">
          <span class="bait-name">${bait.name}</span>
          <span class="bait-count" id="bait-count-${bait.id}">${count}</span>
        </span>
      `;

      btn.addEventListener('click', () => {
        if (bait.id === 'rocket') {
          this.toggleRocketItem();
        } else if (bait.id === 'bomb') {
          this.sound.playClick();
          this.showNotification('💣 폭탄: 물속에서 마우스 우클릭 시 폭발합니다!', '💡');
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
    if (id === 'multi_hook_2') return this.economy.hookCount === 2;
    if (id === 'multi_hook_3') return this.economy.hookCount === 3;
    return id === this.economy.currentBaitId;
  }

  toggleRocketItem() {
    this.sound.playClick();
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
    if (count === 2 && (this.economy.baitInventory['multi_hook_2'] || 0) < 1) {
      this.showNotification('🪝 2중 바늘 리그가 없습니다! 상점(S)에서 구매하세요.', '⚠️');
      return;
    }
    if (count === 3 && (this.economy.baitInventory['multi_hook_3'] || 0) < 1) {
      this.showNotification('🔱 3중 바늘 리그가 없습니다! 상점(S)에서 구매하세요.', '⚠️');
      return;
    }

    // Toggle back to 1 if already equipped
    if (this.economy.hookCount === count) {
      this.economy.hookCount = 1;
      this.showNotification('🪝 기본 1개 바늘 장착으로 전환되었습니다.', '💡');
    } else {
      this.economy.hookCount = count;
      this.showNotification(count === 2 ? '🪝 2중 바늘 리그 장착 완료! (미끼 2개)' : '🔱 3중 바늘 리그 장착 완료! (미끼 3개)', '✨');
    }
    this.economy.saveToStorage();
    this.updateActiveBaitPill();
  }

  selectBait(baitId) {
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

    // Update active highlight and empty class on drawer buttons
    document.querySelectorAll('.bait-btn').forEach(btn => {
      const bId = btn.dataset.baitId;
      btn.classList.toggle('active', this.isItemActive(bId));
      btn.classList.toggle('empty', !this.economy.hasBait(bId));
    });
  }

  update(dt, rod, cat, environment = this.environment) {
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
        el.innerText = bait.id === 'bread' ? '무제한' : `x${this.economy.baitInventory[bait.id] || 0}`;
      }
    });
    this.updateActiveBaitPill();

    // 3. Update Depth Display (0m ~ 500m+)
    if (this.depthDisplay) {
      if (rod.state === 'FISHING' && rod.isSubmerged) {
        const depthMeters = Math.max(0, Math.round((rod.hookPos.y - rod.waterY) / 20 * 10) / 10);
        let zoneText = '표층 바다 🌊';
        if (depthMeters >= 30 && depthMeters < 100) zoneText = '중층 바다 🐬';
        else if (depthMeters >= 100 && depthMeters < 250) zoneText = '심해 어둠층 🔦';
        else if (depthMeters >= 250 && depthMeters < 400) zoneText = '심연의 해구 🪐';
        else if (depthMeters >= 400) zoneText = '미지의 초심연 👑';

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

    this.catchModal.innerHTML = `
      <div class="catch-modal-content ${isShiny ? 'shiny-modal-content' : ''}">
        ${isShiny ? '<div class="shiny-celebration-banner">✨🌟 대박! 이로치 (Shiny) 물고기 획득! 🌟✨</div>' : '<div class="catch-confetti">✨ 냐앙~! 낚았다냥! ✨</div>'}
        <div class="catch-badge" style="background: ${isShiny ? 'linear-gradient(90deg, #ffd166, #ff007f)' : (rarityBadgeColors[data.rarity] || '#0077b6')}">
          ${isShiny ? '✨ 이로치 (Shiny)' : (rarityKorean[data.rarity] || '어종')}
        </div>
        <h2 class="catch-title" style="${isShiny ? 'color: #ffd166; text-shadow: 0 0 12px #ffd166;' : ''}">${isShiny ? '✨ ' : ''}${data.name}</h2>
        <div class="catch-eng">${data.engName} ${isShiny ? '(Shiny Variant)' : ''}</div>
        
        <div class="catch-stats">
          <div class="stat-box">
            <span class="label">크기</span>
            <span class="val">${size} cm ${catchResult.isNewRecord ? '<span class="new-tag">최대 기록!</span>' : ''}</span>
          </div>
          <div class="stat-box">
            <span class="label">획득 골드 ${isShiny ? '(3배!)' : ''}</span>
            <span class="val gold-text">+${price} G</span>
          </div>
          <div class="stat-box">
            <span class="label">경험치 ${isShiny ? '(3배!)' : ''}</span>
            <span class="val exp-text">+${expGain} EXP</span>
          </div>
        </div>

        <p class="catch-desc">${data.description}</p>
        ${catchResult.isFirstTime ? '<div class="first-caught-banner">🎉 새로운 어종 도감 등록 완료!</div>' : ''}

        <div class="catch-actions">
          <button id="btn-catch-ok" class="btn-primary">확인 (계속 낚시)</button>
        </div>
      </div>
    `;

    this.catchModal.classList.add('visible');

    document.getElementById('btn-catch-ok').addEventListener('click', () => {
      this.sound.playClick();
      this.catchModal.classList.remove('visible');
    });
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
