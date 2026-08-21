/**
 * Interactive Modals (Shop, Fish Encyclopedia, Aquarium Controls, Settings, Guide)
 */
import { RODS, BOATS, BAITS, HATS, PASSIVE_UPGRADES, CAT_SKINS } from '../systems/Economy.js';
import { FISH_SPECIES } from '../systems/Encyclopedia.js';
import { Fish } from '../entities/Fish.js';
import { getBaitIconSvg } from './BaitIcons.js';

export class Modals {
  constructor(economy, encyclopedia, aquarium, soundEngine, hud, cloudSave = null) {
    this.economy = economy;
    this.encyclopedia = encyclopedia;
    this.aquarium = aquarium;
    this.sound = soundEngine;
    this.hud = hud;
    this.cloudSave = cloudSave;

    this.shopModal = document.getElementById('shop-modal');
    this.encyclopediaModal = document.getElementById('encyclopedia-modal');
    this.aquariumUI = document.getElementById('aquarium-controls-ui');
    this.guideModal = document.getElementById('guide-modal');
    this.authModal = document.getElementById('auth-modal');
    this.conflictModal = document.getElementById('cloud-conflict-modal');
    this.multiplayerModal = document.getElementById('multiplayer-modal');
    this.wardrobeModal = document.getElementById('wardrobe-modal');
    this.dockMerchantModal = document.getElementById('dock-merchant-modal');
    this.inventoryModal = document.getElementById('inventory-modal');
    this.userDropdownMenu = document.getElementById('user-dropdown-menu');

    this.currentShopTab = 'rods';
    this.currentEncyclopediaFilter = 'all';
    this.currentWardrobeTab = 'skins';
    this.currentInventoryTab = 'baits';
    this.authMode = 'login'; // 'login' or 'signup'
    this.multiTab = 'create'; // 'create' or 'join'
    this.rod = null;
    this.multiplayer = null;

    this.initEventListeners();
    this.initMultiplayerEvents();
    this.initWardrobeEvents();
    this.initDockMerchantEvents();
    this.initInventoryEvents();
  }

  setRod(rod) {
    this.rod = rod;
  }

  setCloudSave(cloudSave) {
    this.cloudSave = cloudSave;
  }

  setMultiplayer(multiplayer) {
    this.multiplayer = multiplayer;
  }

  canChangeEquipment() {
    if (this.rod && this.rod.state !== 'READY') {
      this.hud.showNotification('찌를 던진 후에는 장비를 변경할 수 없습니다!', '🔒');
      return false;
    }
    return true;
  }

  initEventListeners() {
    // Close modal buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.closeAll();
      });
    });

    const btnInvOpen = document.getElementById('btn-open-inventory');
    if (btnInvOpen) {
      btnInvOpen.addEventListener('click', () => {
        this.sound.playClick();
        this.openInventoryModal();
      });
    }

    // Top-Right Auth Button & User Profile Menu
    const btnAuthOpen = document.getElementById('btn-auth-open');
    if (btnAuthOpen) {
      btnAuthOpen.addEventListener('click', () => {
        this.sound.playClick();
        this.openAuthModal();
      });
    }

    const btnUserMenu = document.getElementById('btn-user-menu');
    if (btnUserMenu) {
      btnUserMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        if (this.userDropdownMenu) {
          this.userDropdownMenu.classList.toggle('hidden');
        }
      });
    }

    window.addEventListener('click', (e) => {
      if (this.userDropdownMenu && !this.userDropdownMenu.contains(e.target) && e.target !== btnUserMenu) {
        this.userDropdownMenu.classList.add('hidden');
      }
    });

    // Cloud Save / Load Manual Buttons
    const btnCloudSaveNow = document.getElementById('btn-cloud-save-now');
    if (btnCloudSaveNow) {
      btnCloudSaveNow.addEventListener('click', async () => {
        this.sound.playCoin();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        if (this.cloudSave) {
          const ok = await this.cloudSave.saveToCloud();
          if (ok) this.hud.showNotification('💾 클라우드에 최신 진행 상태를 안전하게 저장했습니다!', '☁️');
        }
      });
    }

    const btnCloudLoadNow = document.getElementById('btn-cloud-load-now');
    if (btnCloudLoadNow) {
      btnCloudLoadNow.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        if (this.cloudSave) {
          await this.cloudSave.loadFromCloud();
        }
      });
    }

    const btnLogout = document.getElementById('btn-auth-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        this.sound.playClick();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        if (this.cloudSave) this.cloudSave.logout();
      });
    }

    // Google Login
    const btnGoogleLogin = document.getElementById('btn-google-login');
    if (btnGoogleLogin) {
      btnGoogleLogin.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.cloudSave) {
          await this.cloudSave.loginWithGoogle();
          this.closeAll();
        }
      });
    }

    // Guest Anonymous Login
    const btnGuestLogin = document.getElementById('btn-guest-login');
    if (btnGuestLogin) {
      btnGuestLogin.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.cloudSave) {
          await this.cloudSave.loginAsGuest();
          this.closeAll();
        }
      });
    }

    // Email Auth Tabs
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const signupNameGroup = document.getElementById('signup-name-group');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');

    if (tabLogin && tabSignup) {
      tabLogin.addEventListener('click', () => {
        this.sound.playClick();
        this.authMode = 'login';
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        if (signupNameGroup) signupNameGroup.classList.add('hidden');
        if (btnAuthSubmit) btnAuthSubmit.innerText = '로그인하기';
      });

      tabSignup.addEventListener('click', () => {
        this.sound.playClick();
        this.authMode = 'signup';
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        if (signupNameGroup) signupNameGroup.classList.remove('hidden');
        if (btnAuthSubmit) btnAuthSubmit.innerText = '회원가입 & 클라우드 연동';
      });
    }

    // Email Form Submit
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-password').value.trim();
        const name = document.getElementById('auth-name')?.value.trim() || '냥이 집사';

        if (!email || !pass) return;

        if (this.cloudSave) {
          if (this.authMode === 'signup') {
            await this.cloudSave.signUpWithEmail(email, pass, name);
          } else {
            await this.cloudSave.loginWithEmail(email, pass);
          }
          this.closeAll();
        }
      });
    }

    // Firebase Config Modal
    const btnConfigOpen = document.getElementById('btn-firebase-config-open');
    if (btnConfigOpen) {
      btnConfigOpen.addEventListener('click', () => {
        this.sound.playClick();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        this.openFirebaseConfigModal();
      });
    }

    const btnSaveConfig = document.getElementById('btn-save-firebase-config');
    if (btnSaveConfig) {
      btnSaveConfig.addEventListener('click', () => {
        const input = document.getElementById('firebase-config-input');
        if (!input) return;
        try {
          const parsed = JSON.parse(input.value);
          if (this.cloudSave) {
            this.cloudSave.saveCustomConfig(parsed);
            this.hud.showNotification('⚙️ Firebase 프로젝트 구성이 성공적으로 연결되었습니다!', '✨');
            this.closeAll();
          }
        } catch (err) {
          this.hud.showNotification('올바른 JSON 형식의 구성을 입력해주세요.', '⚠️');
        }
      });
    }

    const btnResetConfig = document.getElementById('btn-reset-firebase-config');
    if (btnResetConfig) {
      btnResetConfig.addEventListener('click', () => {
        localStorage.removeItem('cozy_cat_firebase_config_v1');
        if (this.cloudSave) {
          this.cloudSave.initFirebase();
          this.hud.showNotification('기본 데모 구성으로 리셋되었습니다.', '🔄');
          this.closeAll();
        }
      });
    }

    // Shop Tabs
    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.sound.playClick();
        this.currentShopTab = btn.dataset.tab;
        document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderShopContent();
      });
    });

    // Encyclopedia Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.currentEncyclopediaFilter = btn.dataset.zone;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderEncyclopediaContent();
      });
    });

    // Aquarium Controls
    const btnFeed = document.getElementById('btn-aqua-feed');
    if (btnFeed) {
      btnFeed.addEventListener('click', () => {
        const cx = 150 + Math.random() * (this.aquarium.tankWidth - 300);
        this.aquarium.dropFood(cx, 30);
        this.hud.showNotification('맛있는 먹이를 뿌렸습니다! 🐟', '🥐');
      });
    }

    const btnCollect = document.getElementById('btn-aqua-collect');
    if (btnCollect) {
      btnCollect.addEventListener('click', () => {
        const earned = this.aquarium.collectAllCoins();
        if (earned > 0) {
          this.hud.showNotification(`아쿠아리움 힐링 골드 +${earned}G 수거 완료!`, '💰');
        } else {
          this.hud.showNotification('수거할 코인이 아직 없습니다.', '🫧');
        }
      });
    }

    const btnTheme = document.getElementById('aqua-theme-select');
    if (btnTheme) {
      btnTheme.addEventListener('change', (e) => {
        this.sound.playClick();
        this.aquarium.setTheme(e.target.value);
      });
    }

    const btnExitAqua = document.getElementById('btn-aqua-exit');
    if (btnExitAqua) {
      btnExitAqua.addEventListener('click', () => {
        this.sound.playClick();
        this.aquarium.close();
        if (this.aquariumUI) this.aquariumUI.classList.remove('visible');
      });
    }
  }

  initMultiplayerEvents() {
    // Top Bar Open Button
    const btnMultiOpen = document.getElementById('btn-open-multiplayer');
    if (btnMultiOpen) {
      btnMultiOpen.addEventListener('click', () => {
        this.sound.playClick();
        this.openMultiplayerModal();
      });
    }

    // Tabs
    const tabCreate = document.getElementById('multi-tab-create');
    const tabJoin = document.getElementById('multi-tab-join');
    const panelCreate = document.getElementById('multi-panel-create');
    const panelJoin = document.getElementById('multi-panel-join');

    if (tabCreate && tabJoin) {
      tabCreate.addEventListener('click', () => {
        this.sound.playClick();
        this.multiTab = 'create';
        tabCreate.classList.add('active');
        tabJoin.classList.remove('active');
        if (panelCreate) panelCreate.classList.remove('hidden');
        if (panelJoin) panelJoin.classList.add('hidden');
      });

      tabJoin.addEventListener('click', () => {
        this.sound.playClick();
        this.multiTab = 'join';
        tabJoin.classList.add('active');
        tabCreate.classList.remove('active');
        if (panelJoin) panelJoin.classList.remove('hidden');
        if (panelCreate) panelCreate.classList.add('hidden');
      });
    }

    // Gen Code button
    const btnGenCode = document.getElementById('btn-multi-gen-code');
    const inputCreateCode = document.getElementById('multi-create-code');
    if (btnGenCode && inputCreateCode) {
      btnGenCode.addEventListener('click', () => {
        this.sound.playClick();
        if (this.multiplayer) {
          inputCreateCode.value = this.multiplayer.generateRoomCode();
        }
      });
    }

    // Create Room Submit
    const btnCreateSubmit = document.getElementById('btn-multi-create-submit');
    if (btnCreateSubmit) {
      btnCreateSubmit.addEventListener('click', async () => {
        this.sound.playClick();
        const nameInput = document.getElementById('multi-create-name');
        const codeInput = document.getElementById('multi-create-code');
        const name = nameInput ? nameInput.value.trim() : '';
        const code = codeInput ? codeInput.value.trim() : '';

        if (this.multiplayer) {
          const res = await this.multiplayer.createRoom(code, name);
          if (res && res.success) {
            this.closeAll();
          }
        }
      });
    }

    // Join Room Submit
    const btnJoinSubmit = document.getElementById('btn-multi-join-submit');
    if (btnJoinSubmit) {
      btnJoinSubmit.addEventListener('click', async () => {
        this.sound.playClick();
        const nameInput = document.getElementById('multi-join-name');
        const codeInput = document.getElementById('multi-join-code');
        const name = nameInput ? nameInput.value.trim() : '';
        const code = codeInput ? codeInput.value.trim() : '';

        if (!code) {
          this.hud.showNotification('방 번호를 입력해주세요.', '⚠️');
          return;
        }

        if (this.multiplayer) {
          const res = await this.multiplayer.joinRoom(code, name);
          if (res && res.success) {
            this.closeAll();
          }
        }
      });
    }

    // Copy Room Code Button
    const btnCopyCode = document.getElementById('btn-multi-copy-code');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.multiplayer && this.multiplayer.roomId) {
          try {
            await navigator.clipboard.writeText(this.multiplayer.roomId);
            this.hud.showNotification(`📋 방 번호 [${this.multiplayer.roomId}] 복사 완료!`, '✨');
          } catch (e) {
            this.hud.showNotification(`방 번호: ${this.multiplayer.roomId}`, '📋');
          }
        }
      });
    }

    // Leave Room Button
    const btnLeaveRoom = document.getElementById('btn-multi-leave');
    if (btnLeaveRoom) {
      btnLeaveRoom.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.multiplayer) {
          await this.multiplayer.leaveRoom();
        }
      });
    }

    // Wardrobe Button in Top Bar
    const btnWardrobeOpen = document.getElementById('btn-open-wardrobe');
    if (btnWardrobeOpen) {
      btnWardrobeOpen.addEventListener('click', () => {
        this.sound.playClick();
        this.openWardrobeModal();
      });
    }
  }

  initWardrobeEvents() {
    // Wardrobe Tabs
    document.querySelectorAll('.wardrobe-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.currentWardrobeTab = btn.dataset.tab;
        document.querySelectorAll('.wardrobe-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderWardrobeContent();
      });
    });
  }

  closeAll() {
    if (this.shopModal) this.shopModal.classList.remove('visible');
    if (this.encyclopediaModal) this.encyclopediaModal.classList.remove('visible');
    if (this.guideModal) this.guideModal.classList.remove('visible');
    if (this.authModal) this.authModal.classList.remove('visible');
    if (this.conflictModal) this.conflictModal.classList.remove('visible');
    if (this.multiplayerModal) this.multiplayerModal.classList.remove('visible');
    if (this.wardrobeModal) this.wardrobeModal.classList.remove('visible');
    if (this.dockMerchantModal) this.dockMerchantModal.classList.remove('visible');
    if (this.inventoryModal) this.inventoryModal.classList.remove('visible');
    if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
    if (this.aquariumUI && !this.aquarium.isOpen) this.aquariumUI.classList.remove('visible');
  }

  isEncyclopediaOpen() {
    return this.encyclopediaModal && this.encyclopediaModal.classList.contains('visible');
  }

  isDockMerchantOpen() {
    return this.dockMerchantModal && this.dockMerchantModal.classList.contains('visible');
  }

  isInventoryOpen() {
    return this.inventoryModal && this.inventoryModal.classList.contains('visible');
  }

  isMultiplayerOpen() {
    return this.multiplayerModal && this.multiplayerModal.classList.contains('visible');
  }

  toggleEncyclopedia() {
    if (this.isEncyclopediaOpen()) {
      this.closeAll();
    } else {
      this.openEncyclopedia();
    }
  }

  toggleDockMerchant() {
    if (this.isDockMerchantOpen()) {
      this.closeAll();
    } else {
      this.openDockMerchantModal();
    }
  }

  toggleInventory() {
    if (this.isInventoryOpen()) {
      this.closeAll();
    } else {
      this.openInventoryModal();
    }
  }

  toggleMultiplayer() {
    if (this.isMultiplayerOpen()) {
      this.closeAll();
    } else {
      this.openMultiplayerModal();
    }
  }

  openInventoryModal() {
    this.closeAll();
    if (this.inventoryModal) {
      this.sound.playClick();
      this.inventoryModal.classList.add('visible');
      this.renderInventoryContent();
    }
  }

  openDockMerchantModal() {
    this.closeAll();
    if (this.dockMerchantModal) {
      if (this.sound) {
        if (typeof this.sound.playCatMeow === 'function') this.sound.playCatMeow();
        else if (typeof this.sound.playMeow === 'function') this.sound.playMeow();
      }
      const quotes = [
        "어서오라냥, 집사! 오늘 바다 낚시 수확은 좀 어떠냥? 잡은 물고기를 구경시켜주거나 필요한 미끼와 장비를 골라보라냥!",
        "심해 깊은 곳에는 전설의 대어들이 살고 있다냥! 황금 미끼나 야광 루어를 든든히 챙겨가라냥! 🐟✨",
        "아쿠아리움에 물고기들이 모아둔 힐링 골드가 있는지 확인해보고, 더 빠른 보트도 구경해보라냥! ⛵",
        "특별한 빛을 품은 ✨ 이로치 물고기를 잡으면 도감에 영롱한 황금빛 테두리가 생긴다냥! 행운을 빈다냥! 🌟"
      ];
      const quoteEl = document.getElementById('dock-merchant-quote');
      if (quoteEl) {
        quoteEl.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
      }
      this.dockMerchantModal.classList.add('visible');
    }
  }

  initDockMerchantEvents() {
    const btnShop = document.getElementById('dock-btn-open-shop');
    if (btnShop) {
      btnShop.addEventListener('click', () => {
        this.sound.playClick();
        this.openShop();
      });
    }

    const btnEncyclo = document.getElementById('dock-btn-open-encyclo');
    if (btnEncyclo) {
      btnEncyclo.addEventListener('click', () => {
        this.sound.playClick();
        this.openEncyclopedia();
      });
    }

    const btnAqua = document.getElementById('dock-btn-open-aqua');
    if (btnAqua) {
      btnAqua.addEventListener('click', () => {
        this.sound.playClick();
        this.closeAll();
        this.aquarium.open();
        if (this.aquariumUI) this.aquariumUI.classList.add('visible');
      });
    }

    const btnWardrobe = document.getElementById('dock-btn-open-wardrobe');
    if (btnWardrobe) {
      btnWardrobe.addEventListener('click', () => {
        this.sound.playClick();
        this.openWardrobeModal();
      });
    }

    const btnSailOut = document.getElementById('dock-btn-sail-out');
    if (btnSailOut) {
      btnSailOut.addEventListener('click', () => {
        this.sound.playCast();
        this.closeAll();
        this.hud.showNotification('🌊 신나는 바다 낚시를 떠납니다! 좋은 어획되세요!', '⛵');
      });
    }
  }

  initInventoryEvents() {
    document.querySelectorAll('.inv-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.currentInventoryTab = btn.dataset.tab;
        document.querySelectorAll('.inv-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderInventoryContent();
      });
    });
  }

  renderInventoryContent() {
    const container = document.getElementById('inventory-items-container');
    if (!container) return;
    container.innerHTML = '';

    if (this.currentInventoryTab === 'baits') {
      // 1. Baits & Consumables
      BAITS.forEach(bait => {
        const count = (bait.id === 'bread') ? '무제한' : (this.economy.baitInventory[bait.id] || 0);
        const isEquipped = this.economy.currentBaitId === bait.id;
        const hasStock = (bait.id === 'bread') || (this.economy.baitInventory[bait.id] > 0);

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">${bait.icon}</span>
            <div class="card-title-group">
              <div class="card-title">${bait.name}</div>
              <div class="card-subtitle">보유 수량: <strong>${count}</strong></div>
            </div>
          </div>
          <div class="card-desc">${bait.description}</div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">장착 중</span>' 
              : hasStock 
              ? `<button class="btn-secondary btn-equip-bait" data-id="${bait.id}">장착하기</button>` 
              : `<span class="badge-locked">수량 없음 (상점에서 구매)</span>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-bait');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.currentBaitId = bait.id;
            this.economy.saveToStorage();
            this.hud.showNotification(`${bait.name} 장착 완료!`, bait.icon);
            this.renderInventoryContent();
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentInventoryTab === 'equipment') {
      // 2. Equipped & Owned Gear (Rods, Boats, Hats)
      
      // Rods
      RODS.forEach(rod => {
        const isOwned = this.economy.ownedRods.includes(rod.id);
        if (!isOwned) return;
        const isEquipped = this.economy.currentRodId === rod.id;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon" style="color: ${rod.color}">🎣</span>
            <div class="card-title-group">
              <div class="card-title">${rod.name}</div>
              <div class="card-subtitle">Tier ${rod.tier} 낚싯대</div>
            </div>
          </div>
          <div class="card-stats">
            <div>최대 수심: ${(rod.maxLineLength / 20).toFixed(0)}m</div>
            <div>릴링 속도: ${rod.reelSpeed}</div>
          </div>
          <div class="card-desc">${rod.description}</div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">장착 중</span>' 
              : `<button class="btn-secondary btn-equip-rod" data-id="${rod.id}">장착하기</button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-rod');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.equipRod(rod.id);
            this.hud.showNotification(`${rod.name} 장착 완료!`, '🎣');
            this.renderInventoryContent();
          });
        }
        container.appendChild(card);
      });

      // Boats
      BOATS.forEach(boat => {
        const isOwned = this.economy.ownedBoats.includes(boat.id);
        if (!isOwned) return;
        const isEquipped = this.economy.currentBoatId === boat.id;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">⛵</span>
            <div class="card-title-group">
              <div class="card-title">${boat.name}</div>
              <div class="card-subtitle">속도: ${boat.speed}</div>
            </div>
          </div>
          <div class="card-desc">${boat.description}</div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">탑승 중</span>' 
              : `<button class="btn-secondary btn-equip-boat" data-id="${boat.id}">탑승하기</button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-boat');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.equipBoat(boat.id);
            this.hud.showNotification(`${boat.name} 탑승 완료!`, '⛵');
            this.renderInventoryContent();
          });
        }
        container.appendChild(card);
      });

      // Hats
      HATS.forEach(hat => {
        const isOwned = this.economy.ownedHats.includes(hat.id);
        if (!isOwned) return;
        const isEquipped = this.economy.currentHatId === hat.id;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">${hat.icon}</span>
            <div class="card-title-group">
              <div class="card-title">${hat.name}</div>
              <div class="card-subtitle perk-text">${hat.perk}</div>
            </div>
          </div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">착용 중</span>' 
              : `<button class="btn-secondary btn-equip-hat" data-id="${hat.id}">착용하기</button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-hat');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.equipHat(hat.id);
            this.hud.showNotification(`${hat.name} 착용 완료!`, hat.icon);
            this.renderInventoryContent();
          });
        }
        container.appendChild(card);
      });

    } else if (this.currentInventoryTab === 'catches') {
      // 3. Caught Fish Records with Visuals
      const caughtSpecies = FISH_SPECIES.filter(f => {
        const rec = this.encyclopedia.getRecord(f.id);
        return rec.caughtCount > 0;
      });

      if (caughtSpecies.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #8d99ae; font-family: var(--font-cute); font-size: 20px;">
            아직 잡은 물고기가 없습니다냥! 바다로 나가서 낚시를 시작해보라냥! 🎣
          </div>
        `;
      } else {
        caughtSpecies.forEach(species => {
          const rec = this.encyclopedia.getRecord(species.id);
          const hasShiny = (rec.shinyCount || 0) > 0;

          const card = document.createElement('div');
          card.className = `encyclo-card unlocked ${hasShiny ? 'has-shiny' : ''} rarity-${species.rarity}`;
          card.innerHTML = `
            <div class="encyclo-badge-row">
              <span class="encyclo-badge">${species.zone.toUpperCase()}</span>
              ${hasShiny ? '<span class="shiny-star-badge">✨</span>' : ''}
            </div>
            <div class="encyclo-preview-wrapper ${hasShiny ? 'shiny-preview' : ''}">
              <canvas class="inv-fish-canvas" width="140" height="80"></canvas>
            </div>
            <div class="encyclo-title">${species.name}</div>
            <div class="encyclo-details">
              <div>총 어획: <strong>${rec.caughtCount} 회</strong></div>
              <div>최대 크기: <strong>${rec.maxSize} cm</strong></div>
              <div>누적 수익: <strong>${rec.totalEarned || (rec.caughtCount * species.basePrice)} G</strong></div>
            </div>
          `;

          const canvas = card.querySelector('.inv-fish-canvas');
          if (canvas) {
            Fish.drawPreview(canvas, species, true, hasShiny);
          }

          container.appendChild(card);
        });
      }
    }
  }

  openWardrobeModal() {
    this.closeAll();
    if (this.wardrobeModal) {
      this.wardrobeModal.classList.add('visible');
      this.renderWardrobeContent();
    }
  }

  renderWardrobeContent() {
    const container = document.getElementById('wardrobe-items-container');
    if (!container) return;
    container.innerHTML = '';

    if (this.currentWardrobeTab === 'skins') {
      CAT_SKINS.forEach(skin => {
        const isEquipped = this.economy.catSkinId === skin.id;
        const card = document.createElement('div');
        card.className = `shop-card wardrobe-card ${isEquipped ? 'equipped' : ''}`;
        
        // Swatch previews
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon skin-swatch" style="background: ${skin.colors.body}; border: 3px solid ${skin.colors.stripe};">
              ${skin.icon}
            </span>
            <div class="card-title-group">
              <div class="card-title">${skin.name}</div>
              <div class="card-subtitle color-preview-sub">
                <span class="color-dot" style="background:${skin.colors.body}"></span>
                <span class="color-dot" style="background:${skin.colors.stripe}"></span>
                <span class="color-dot" style="background:${skin.colors.belly}"></span>
              </div>
            </div>
          </div>
          <div class="card-desc">${skin.desc}</div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">적용 중</span>' 
              : `<button class="btn-primary btn-equip-skin" data-id="${skin.id}">털 색상 적용하기</button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-skin');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.equipCatSkin(skin.id);
            this.hud.showNotification(`${skin.name} 털 색상이 적용되었습니다!`, skin.icon);
            this.renderWardrobeContent();
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentWardrobeTab === 'hats') {
      HATS.forEach(hat => {
        const isOwned = this.economy.ownedHats.includes(hat.id);
        const isEquipped = this.economy.currentHatId === hat.id;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''} ${!isOwned ? 'locked-item' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">${hat.icon}</span>
            <div class="card-title-group">
              <div class="card-title">${hat.name}</div>
              <div class="card-subtitle perk-text">${hat.perk}</div>
            </div>
          </div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">착용 중</span>' 
              : isOwned 
              ? `<button class="btn-secondary btn-equip-hat" data-id="${hat.id}">착용하기</button>` 
              : `<span class="badge-locked">상점(S)에서 구매 필요</span>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-hat');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.equipHat(hat.id);
            this.hud.showNotification(`${hat.name} 착용 완료!`, hat.icon);
            this.renderWardrobeContent();
          });
        }

        container.appendChild(card);
      });
    }
  }

  openMultiplayerModal() {
    this.closeAll();
    if (this.multiplayerModal) {
      // Pre-fill nickname and default code if empty
      const nameCreate = document.getElementById('multi-create-name');
      const nameJoin = document.getElementById('multi-join-name');
      const codeCreate = document.getElementById('multi-create-code');

      if (this.multiplayer) {
        if (nameCreate && !nameCreate.value) nameCreate.value = this.multiplayer.playerName;
        if (nameJoin && !nameJoin.value) nameJoin.value = this.multiplayer.playerName;
        if (codeCreate && !codeCreate.value) codeCreate.value = this.multiplayer.generateRoomCode();
        this.multiplayer.updateMultiplayerUI();
      }

      this.multiplayerModal.classList.add('visible');
    }
  }

  openAuthModal() {
    this.closeAll();
    if (this.authModal) {
      this.authModal.classList.add('visible');
    }
  }

  openFirebaseConfigModal() {
    this.closeAll();
    if (this.firebaseConfigModal) {
      const input = document.getElementById('firebase-config-input');
      if (input && this.cloudSave) {
        input.value = JSON.stringify(this.cloudSave.getSavedConfig(), null, 2);
      }
      this.firebaseConfigModal.classList.add('visible');
    }
  }

  openShop() {
    this.closeAll();
    if (this.shopModal) {
      this.shopModal.classList.add('visible');
      this.renderShopContent();
    }
  }

  openEncyclopedia() {
    this.closeAll();
    if (this.encyclopediaModal) {
      this.encyclopediaModal.classList.add('visible');
      this.renderEncyclopediaContent();
    }
  }

  openGuide() {
    this.closeAll();
    if (this.guideModal) {
      this.guideModal.classList.add('visible');
    }
  }

  renderShopContent() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    container.innerHTML = '';

    if (this.currentShopTab === 'rods') {
      RODS.forEach(rod => {
        const isOwned = this.economy.ownedRods.includes(rod.id);
        const isEquipped = this.economy.currentRodId === rod.id;
        const canAfford = this.economy.gold >= rod.price;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon" style="color: ${rod.color}">🎣</span>
            <div class="card-title-group">
              <div class="card-title">${rod.name}</div>
              <div class="card-subtitle">Tier ${rod.tier} 낚싯대</div>
            </div>
          </div>
          <div class="card-stats">
            <div>최대 수심: ${(rod.maxLineLength / 20).toFixed(0)}m</div>
            <div>릴링 속도: ${rod.reelSpeed}</div>
            <div>라인 장력 내구도: ${rod.maxTension}</div>
          </div>
          <div class="card-desc">${rod.description}</div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">착용 중</span>' 
              : isOwned 
              ? `<button class="btn-secondary btn-equip" data-id="${rod.id}">장착하기</button>` 
              : `<button class="btn-primary btn-buy ${!canAfford ? 'disabled' : ''}" data-id="${rod.id}">
                  ${rod.price.toLocaleString()} G 구매
                 </button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.equipRod(rod.id);
            this.renderShopContent();
          });
        }

        const btnBuy = card.querySelector('.btn-buy');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyRod(rod.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${rod.name} 구매 완료!`, '🎣');
              this.renderShopContent();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'boats') {
      BOATS.forEach(boat => {
        const isOwned = this.economy.ownedBoats.includes(boat.id);
        const isEquipped = this.economy.currentBoatId === boat.id;
        const canAfford = this.economy.gold >= boat.price;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">⛵</span>
            <div class="card-title-group">
              <div class="card-title">${boat.name}</div>
              <div class="card-subtitle">항해 속도: ${boat.speed}</div>
            </div>
          </div>
          <div class="card-stats">
            <div>최대 이동 반경: ${(boat.maxTravelX / 20).toFixed(0)}m</div>
          </div>
          <div class="card-desc">${boat.description}</div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">탑승 중</span>' 
              : isOwned 
              ? `<button class="btn-secondary btn-equip-boat" data-id="${boat.id}">탑승하기</button>` 
              : `<button class="btn-primary btn-buy-boat ${!canAfford ? 'disabled' : ''}" data-id="${boat.id}">
                  ${boat.price.toLocaleString()} G 구매
                 </button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-boat');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.equipBoat(boat.id);
            this.renderShopContent();
          });
        }

        const btnBuy = card.querySelector('.btn-buy-boat');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyBoat(boat.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${boat.name} 구매 및 탑승 완료!`, '⛵');
              this.renderShopContent();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'baits') {
      BAITS.forEach(bait => {
        const canAfford = this.economy.gold >= bait.price;
        const isOwnedTackle = bait.isTackle && (this.economy.baitInventory[bait.id] || 0) >= 1;
        const isEquippedTackle = (bait.id === 'multi_hook_2' && this.economy.hookCount === 2) || (bait.id === 'multi_hook_3' && this.economy.hookCount === 3);

        let countLabel = '';
        if (bait.id === 'bread') countLabel = '보유량: 무제한';
        else if (bait.isTackle) countLabel = isOwnedTackle ? '영구 해금됨' : '미보유';
        else countLabel = `보유량: ${this.economy.baitInventory[bait.id] || 0}개`;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquippedTackle ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon card-bait-icon-wrapper">${getBaitIconSvg(bait.id)}</span>
            <div class="card-title-group">
              <div class="card-title">${bait.name}</div>
              <div class="card-subtitle">${countLabel}</div>
            </div>
          </div>
          <div class="card-desc">${bait.description}</div>
          <div class="card-footer">
            ${bait.price === 0 
              ? '<span class="badge-free">기본 제공</span>' 
              : isEquippedTackle
              ? '<span class="badge-equipped">장착 중</span>'
              : isOwnedTackle
              ? `<button class="btn-secondary btn-equip-tackle" data-id="${bait.id}">장착하기</button>`
              : `<button class="btn-primary btn-buy-bait ${!canAfford ? 'disabled' : ''}" data-id="${bait.id}">
                  ${bait.price} G ${bait.isTackle ? '영구 구매' : `(+${bait.countPerBuy}개)`}
                 </button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-tackle');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            if (bait.id === 'multi_hook_2') this.hud.selectHookCount(2);
            if (bait.id === 'multi_hook_3') this.hud.selectHookCount(3);
            this.renderShopContent();
          });
        }

        const btnBuy = card.querySelector('.btn-buy-bait');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyBait(bait.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${bait.name} 구매 완료!`, '🎒');
              this.renderShopContent();
              this.hud.initBaitBar();
            } else {
              this.hud.showNotification('골드가 부족하거나 이미 보유 중입니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'hats') {
      HATS.forEach(hat => {
        const isOwned = this.economy.ownedHats.includes(hat.id);
        const isEquipped = this.economy.currentHatId === hat.id;
        const canAfford = this.economy.gold >= hat.price;

        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">${hat.icon}</span>
            <div class="card-title-group">
              <div class="card-title">${hat.name}</div>
              <div class="card-subtitle perk-text">${hat.perk}</div>
            </div>
          </div>
          <div class="card-footer">
            ${isEquipped 
              ? '<span class="badge-equipped">착용 중</span>' 
              : isOwned 
              ? `<button class="btn-secondary btn-equip-hat" data-id="${hat.id}">착용하기</button>` 
              : `<button class="btn-primary btn-buy-hat ${!canAfford ? 'disabled' : ''}" data-id="${hat.id}">
                  ${hat.price.toLocaleString()} G 구매
                 </button>`}
          </div>
        `;

        const btnEquip = card.querySelector('.btn-equip-hat');
        if (btnEquip) {
          btnEquip.addEventListener('click', () => {
            if (!this.canChangeEquipment()) return;
            this.sound.playClick();
            this.economy.equipHat(hat.id);
            this.renderShopContent();
          });
        }

        const btnBuy = card.querySelector('.btn-buy-hat');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyHat(hat.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${hat.name} 구매 및 착용 완료!`, hat.icon);
              this.renderShopContent();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'upgrades') {
      PASSIVE_UPGRADES.forEach(up => {
        const currentLv = this.economy.upgradeLevels[up.id] || 0;
        const isMax = currentLv >= up.maxLevel;
        const cost = this.economy.getUpgradeCost(up.id);
        const canAfford = this.economy.gold >= cost;

        const card = document.createElement('div');
        card.className = `shop-card ${isMax ? 'maxed' : ''}`;
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon">${up.icon}</span>
            <div class="card-title-group">
              <div class="card-title">${up.name}</div>
              <div class="card-subtitle">현재 레벨: Lv.${currentLv} / Lv.${up.maxLevel}</div>
            </div>
          </div>
          <div class="card-desc">${up.description}</div>
          <div class="card-footer">
            ${isMax 
              ? '<span class="badge-max">MAX 강화 완료</span>' 
              : `<button class="btn-primary btn-upgrade ${!canAfford ? 'disabled' : ''}" data-id="${up.id}">
                  ${cost.toLocaleString()} G 강화 (Lv.${currentLv + 1})
                 </button>`}
          </div>
        `;

        const btnUpgrade = card.querySelector('.btn-upgrade');
        if (btnUpgrade) {
          btnUpgrade.addEventListener('click', () => {
            if (this.economy.buyUpgrade(up.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${up.name} Lv.${this.economy.upgradeLevels[up.id]} 강화 성공!`, up.icon);
              this.renderShopContent();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });
    }
  }

  renderEncyclopediaContent() {
    const container = document.getElementById('encyclopedia-grid');
    const statsContainer = document.getElementById('encyclopedia-stats');
    if (!container) return;
    container.innerHTML = '';

    const stats = this.encyclopedia.getCompletionStats();
    if (statsContainer) {
      const showShinyBar = stats.shinyCaught > 0;
      statsContainer.innerHTML = `
        <div class="encyclopedia-stats-flex">
          <div class="encyclopedia-stat-box">
            <div class="encyclopedia-progress-bar">
              <div class="progress-fill" style="width: ${stats.percent}%"></div>
            </div>
            <div class="progress-label">일반 도감 수집율: <strong>${stats.caught} / ${stats.total} (${stats.percent}%)</strong></div>
          </div>
          ${showShinyBar ? `
          <div class="encyclopedia-stat-box shiny-stat-box">
            <div class="encyclopedia-progress-bar shiny-progress-bar">
              <div class="progress-fill shiny-fill" style="width: ${stats.shinyPercent}%"></div>
            </div>
            <div class="progress-label shiny-progress-label">✨ 특별 물고기 수집율: <strong>${stats.shinyCaught} / ${stats.total} (${stats.shinyPercent}%)</strong></div>
          </div>
          ` : ''}
        </div>
      `;
    }

    const filtered = FISH_SPECIES.filter(f => {
      if (this.currentEncyclopediaFilter === 'all') return true;
      return f.zone === this.currentEncyclopediaFilter;
    });

    filtered.forEach(species => {
      const record = this.encyclopedia.getRecord(species.id);
      const isDiscovered = record.caughtCount > 0;
      const hasShiny = (record.shinyCount || 0) > 0;

      const card = document.createElement('div');
      card.className = `encyclo-card ${isDiscovered ? 'unlocked' : 'locked'} ${hasShiny ? 'has-shiny' : ''} rarity-${species.rarity}`;

      if (isDiscovered) {
        card.innerHTML = `
          <div class="encyclo-badge-row">
            <span class="encyclo-badge">${species.zone.toUpperCase()}</span>
            ${hasShiny ? '<span class="shiny-star-badge" title="특별한 빛을 품은 물고기 해금!">✨</span>' : ''}
          </div>
          <div class="encyclo-preview-wrapper ${hasShiny ? 'shiny-preview' : ''}">
            <canvas class="encyclo-fish-canvas" width="140" height="80"></canvas>
          </div>
          <div class="encyclo-title">${species.name}</div>
          <div class="encyclo-eng">${species.engName}</div>
          <div class="encyclo-details">
            <div>서식 수심: <strong>${species.minDepth}m ~ ${species.maxDepth}m</strong></div>
            <div>최대 크기: <strong>${record.maxSize} cm</strong></div>
            <div>잡은 횟수: <strong>${record.caughtCount} 회</strong></div>
            <div>기본 가격: <strong>${species.basePrice} G</strong></div>
          </div>
          <div class="encyclo-desc">${species.description}</div>
        `;
      } else {
        card.innerHTML = `
          <div class="encyclo-badge">${species.zone.toUpperCase()}</div>
          <div class="encyclo-preview-wrapper locked-preview">
            <canvas class="encyclo-fish-canvas" width="140" height="80"></canvas>
          </div>
          <div class="encyclo-title mystery-title">???</div>
          <div class="encyclo-eng">미지의 생명체</div>
          <div class="encyclo-details">
            <div>서식 수심: <strong>${species.minDepth}m ~ ${species.maxDepth}m</strong></div>
            <div>상태: <strong>미발견 🔒</strong></div>
          </div>
          <div class="encyclo-hint">이 수심대에서 적절한 미끼로 낚아보세요!</div>
        `;
      }

      // Draw dynamic fish preview
      const canvas = card.querySelector('.encyclo-fish-canvas');
      if (canvas) {
        Fish.drawPreview(canvas, species, isDiscovered, hasShiny);
      }

      container.appendChild(card);
    });
  }
}
