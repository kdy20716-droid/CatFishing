/**
 * Interactive Modals (Shop, Fish Encyclopedia, Aquarium Controls, Settings, Guide)
 */
import { RODS, BOATS, BAITS, HATS, PASSIVE_UPGRADES, CAT_SKINS } from '../systems/Economy.js?v=5.9.0';
import { FISH_SPECIES } from '../systems/Encyclopedia.js?v=5.9.0';
import { Fish } from '../entities/Fish.js?v=5.9.0';
import { getBaitIconSvg } from './BaitIcons.js?v=5.9.0';

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
    this.aquariumManageModal = document.getElementById('aquarium-manage-modal');
    this.soundModal = document.getElementById('sound-modal');
    this.guideModal = document.getElementById('guide-modal');
    this.authModal = document.getElementById('auth-modal');
    this.conflictModal = document.getElementById('cloud-conflict-modal');
    this.multiplayerModal = document.getElementById('multiplayer-modal');
    this.wardrobeModal = document.getElementById('wardrobe-modal');
    this.dockMerchantModal = document.getElementById('dock-merchant-modal');
    this.merchantGuideModal = document.getElementById('merchant-guide-modal');
    this.fishMarketModal = document.getElementById('fish-market-modal');
    this.nicknameModal = document.getElementById('nickname-modal');
    this.inventoryModal = document.getElementById('inventory-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.userDropdownMenu = document.getElementById('user-dropdown-menu');

    this.currentShopTab = 'rods';
    this.currentEncyclopediaFilter = 'all';
    this.currentWardrobeTab = 'skins';
    this.currentInventoryTab = 'baits';
    this.authMode = 'login'; // 'login' or 'signup'
    this.multiTab = 'create'; // 'create' or 'join'
    this.rod = null;
    this.multiplayer = null;
    this.onPauseChange = null;

    this.initEventListeners();
    this.initSoundModalEvents();
    this.initMultiplayerEvents();
    this.initWardrobeEvents();
    this.initDockMerchantEvents();
    this.initInventoryEvents();
    this.initFishMarketEvents();
    this.initPauseEvents();
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

    // Toggle Dropdown when clicking anywhere on User Profile Pill
    const userProfilePill = document.getElementById('user-profile-pill');
    if (userProfilePill) {
      userProfilePill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        if (this.userDropdownMenu) {
          this.userDropdownMenu.classList.toggle('hidden');
        }
      });
    }

    // Close dropdown on outside click
    window.addEventListener('click', (e) => {
      if (this.userDropdownMenu && !this.userDropdownMenu.classList.contains('hidden')) {
        if (!this.userDropdownMenu.contains(e.target) && (!userProfilePill || !userProfilePill.contains(e.target))) {
          this.userDropdownMenu.classList.add('hidden');
        }
      }
    });

    // Nickname Change Button & Modal
    const btnChangeNickname = document.getElementById('btn-change-nickname');
    const inputNicknameNew = document.getElementById('input-nickname-new');
    const btnNicknameSave = document.getElementById('btn-nickname-save');
    const btnNicknameCancel = document.getElementById('btn-nickname-cancel');

    if (btnChangeNickname) {
      btnChangeNickname.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        this.openNicknameModal();
      });
    }

    const handleSaveNickname = async () => {
      const newName = inputNicknameNew ? inputNicknameNew.value.trim() : '';
      if (!newName) {
        this.hud.showNotification('닉네임을 1자 이상 입력해주세요.', '⚠️');
        return;
      }
      this.sound.playCoin();
      if (this.cloudSave) {
        await this.cloudSave.updateNickname(newName);
      }
      if (this.multiplayer) {
        this.multiplayer.playerName = newName;
        this.multiplayer.updateMultiplayerUI();
      }
      if (this.nicknameModal) this.nicknameModal.classList.remove('visible');
      this.hud.showNotification(`🎉 닉네임이 [${newName}] (으)로 변경되었습니다!`, '✏️');
    };

    if (btnNicknameSave) {
      btnNicknameSave.addEventListener('click', handleSaveNickname);
    }
    if (inputNicknameNew) {
      inputNicknameNew.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveNickname();
      });
    }
    if (btnNicknameCancel) {
      btnNicknameCancel.addEventListener('click', () => {
        this.sound.playClick();
        if (this.nicknameModal) this.nicknameModal.classList.remove('visible');
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

    // Google Login & Profile Link
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

    const btnDropdownGoogleLink = document.getElementById('btn-dropdown-google-link');
    if (btnDropdownGoogleLink) {
      btnDropdownGoogleLink.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        if (this.cloudSave) {
          await this.cloudSave.loginWithGoogle();
        }
      });
    }

    // Manual Cloud Save & Load from Profile Dropdown
    const btnManualSave = document.getElementById('btn-cloud-manual-save');
    if (btnManualSave) {
      btnManualSave.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        if (this.cloudSave) {
          await this.cloudSave.manualSaveToCloud();
        }
      });
    }

    const btnManualLoad = document.getElementById('btn-cloud-manual-load');
    if (btnManualLoad) {
      btnManualLoad.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        if (this.cloudSave) {
          await this.cloudSave.manualLoadFromCloud();
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
        const res = this.aquarium.dropFood(cx, 30);
        if (res && res.rewardGranted) {
          this.hud.showNotification('💰 10분 밥주기 보상: 물고기들이 기뻐하며 힐링 골드를 선물했습니다!', '✨');
        } else if (res) {
          const mins = Math.floor(res.remainingMs / 60000);
          const secs = Math.floor((res.remainingMs % 60000) / 1000);
          this.hud.showNotification(`🥐 냠냠 먹이를 주었습니다! (다음 골드 보상까지: ${mins}분 ${secs}초)`, '🐟');
        }
        this.updateAquariumBadge();
      });
    }

    const btnManageAqua = document.getElementById('btn-aqua-manage');
    if (btnManageAqua) {
      btnManageAqua.addEventListener('click', () => {
        this.sound.playClick();
        this.openAquariumManageModal();
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
    // Top Bar Open Button & Active Room Badge
    const btnMultiOpen = document.getElementById('btn-open-multiplayer');
    if (btnMultiOpen) {
      btnMultiOpen.addEventListener('click', () => {
        this.sound.playClick();
        this.openMultiplayerModal();
      });
    }

    const topBarMultiBadge = document.getElementById('topbar-multi-badge');
    if (topBarMultiBadge) {
      topBarMultiBadge.addEventListener('click', async () => {
        this.sound.playClick();
        if (this.multiplayer && this.multiplayer.roomId) {
          try {
            await navigator.clipboard.writeText(this.multiplayer.roomId);
            this.hud.showNotification(`📋 방 번호 [${this.multiplayer.roomId}] 복사 완료!`, '✨');
          } catch (e) {}
        }
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
    const inputCreateName = document.getElementById('multi-create-name');

    const handleCreateRoom = async () => {
      this.sound.playClick();
      const name = inputCreateName ? inputCreateName.value.trim() : '';
      const code = inputCreateCode ? inputCreateCode.value.trim() : '';

      if (this.multiplayer && btnCreateSubmit) {
        btnCreateSubmit.disabled = true;
        const origText = btnCreateSubmit.textContent;
        btnCreateSubmit.textContent = '방 개설 중... ⏳';

        const res = await this.multiplayer.createRoom(code, name);
        btnCreateSubmit.disabled = false;
        btnCreateSubmit.textContent = origText;

        if (res && res.success) {
          this.closeAll();
        }
      }
    };

    if (btnCreateSubmit) {
      btnCreateSubmit.addEventListener('click', handleCreateRoom);
    }
    if (inputCreateCode) {
      inputCreateCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleCreateRoom();
      });
    }

    // Join Room Submit
    const btnJoinSubmit = document.getElementById('btn-multi-join-submit');
    const inputJoinCode = document.getElementById('multi-join-code');
    const inputJoinName = document.getElementById('multi-join-name');

    const handleJoinRoom = async () => {
      this.sound.playClick();
      const name = inputJoinName ? inputJoinName.value.trim() : '';
      const code = inputJoinCode ? inputJoinCode.value.trim() : '';

      if (!code) {
        this.hud.showNotification('방 번호를 입력해주세요.', '⚠️');
        return;
      }

      if (this.multiplayer && btnJoinSubmit) {
        btnJoinSubmit.disabled = true;
        const origText = btnJoinSubmit.textContent;
        btnJoinSubmit.textContent = '방 입장 중... ⏳';

        const res = await this.multiplayer.joinRoom(code, name);
        btnJoinSubmit.disabled = false;
        btnJoinSubmit.textContent = origText;

        if (res && res.success) {
          this.closeAll();
        }
      }
    };

    if (btnJoinSubmit) {
      btnJoinSubmit.addEventListener('click', handleJoinRoom);
    }
    if (inputJoinCode) {
      inputJoinCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleJoinRoom();
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
    if (this.merchantGuideModal) this.merchantGuideModal.classList.remove('visible');
    if (this.fishMarketModal) this.fishMarketModal.classList.remove('visible');
    if (this.nicknameModal) this.nicknameModal.classList.remove('visible');
    if (this.inventoryModal) this.inventoryModal.classList.remove('visible');
    if (this.pauseModal) this.pauseModal.classList.remove('visible');
    if (this.aquariumManageModal) this.aquariumManageModal.classList.remove('visible');
    if (this.soundModal) this.soundModal.classList.remove('visible');
    if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
    if (this.aquariumUI && !this.aquarium.isOpen) this.aquariumUI.classList.remove('visible');
    if (this.onPauseChange) this.onPauseChange(false);
  }

  hasAnyModalOpen() {
    return (
      (this.shopModal && this.shopModal.classList.contains('visible')) ||
      (this.encyclopediaModal && this.encyclopediaModal.classList.contains('visible')) ||
      (this.guideModal && this.guideModal.classList.contains('visible')) ||
      (this.authModal && this.authModal.classList.contains('visible')) ||
      (this.conflictModal && this.conflictModal.classList.contains('visible')) ||
      (this.multiplayerModal && this.multiplayerModal.classList.contains('visible')) ||
      (this.wardrobeModal && this.wardrobeModal.classList.contains('visible')) ||
      (this.dockMerchantModal && this.dockMerchantModal.classList.contains('visible')) ||
      (this.merchantGuideModal && this.merchantGuideModal.classList.contains('visible')) ||
      (this.fishMarketModal && this.fishMarketModal.classList.contains('visible')) ||
      (this.nicknameModal && this.nicknameModal.classList.contains('visible')) ||
      (this.inventoryModal && this.inventoryModal.classList.contains('visible')) ||
      (this.pauseModal && this.pauseModal.classList.contains('visible')) ||
      (this.aquariumManageModal && this.aquariumManageModal.classList.contains('visible')) ||
      (this.soundModal && this.soundModal.classList.contains('visible')) ||
      (this.userDropdownMenu && !this.userDropdownMenu.classList.contains('hidden'))
    );
  }

  isPauseOpen() {
    return this.pauseModal && this.pauseModal.classList.contains('visible');
  }

  openPauseModal() {
    this.closeAll();
    if (this.pauseModal) {
      this.pauseModal.classList.add('visible');
      this.updatePauseModalUI();
    }
  }

  updatePauseModalUI() {
    const soundText = document.getElementById('pause-sound-text');
    if (soundText && this.sound) {
      soundText.innerText = this.sound.isMuted ? '🎵 사운드 켜기 (현재 음소거)' : '🔇 사운드 끄기 (현재 소리 켜짐)';
    }
  }

  initPauseEvents() {
    // 1. Resume button
    const btnResume = document.getElementById('btn-pause-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.sound.playClick();
        this.closeAll();
        if (this.onPauseChange) this.onPauseChange(false);
      });
    }

    // 2. Save progress button
    const btnSave = document.getElementById('btn-pause-save');
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        this.sound.playCoin();
        if (this.cloudSave) {
          await this.cloudSave.triggerAutoSave();
        }
        this.hud.showNotification('💾 게임 진행 상황이 로컬 및 클라우드에 즉시 저장되었습니다!', '✨');
      });
    }

    // 3. Sound Settings button
    const btnSound = document.getElementById('btn-pause-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        this.sound.playClick();
        this.openSoundModal();
      });
    }

    // 4. Guide button
    const btnGuide = document.getElementById('btn-pause-guide');
    if (btnGuide) {
      btnGuide.addEventListener('click', () => {
        this.sound.playClick();
        this.openGuide();
      });
    }

    // 5. Cloud/Auth button
    const btnCloud = document.getElementById('btn-pause-cloud');
    if (btnCloud) {
      btnCloud.addEventListener('click', () => {
        this.sound.playClick();
        this.openAuthModal();
      });
    }
  }

  isEncyclopediaOpen() {
    return this.encyclopediaModal && this.encyclopediaModal.classList.contains('visible');
  }

  isDockMerchantOpen() {
    return this.dockMerchantModal && this.dockMerchantModal.classList.contains('visible');
  }

  isMerchantGuideOpen() {
    return this.merchantGuideModal && this.merchantGuideModal.classList.contains('visible');
  }

  isFishMarketOpen() {
    return this.fishMarketModal && this.fishMarketModal.classList.contains('visible');
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
    if (this.isDockMerchantOpen() || this.isFishMarketOpen() || this.isMerchantGuideOpen()) {
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

  initSoundModalEvents() {
    // 1. Top HUD sound button
    const btnSoundOpen = document.getElementById('btn-sound-modal-open');
    if (btnSoundOpen) {
      btnSoundOpen.addEventListener('click', () => {
        this.sound.playClick();
        this.openSoundModal();
      });
    }

    // 2. Master Mute Toggle Card
    const btnMasterMute = document.getElementById('btn-master-mute-toggle');
    if (btnMasterMute) {
      btnMasterMute.addEventListener('click', () => {
        const isMuted = !this.sound.isMuted;
        this.sound.setMute(isMuted);
        if (!isMuted && !this.sound.isBgmPlaying) {
          this.sound.startBgm();
        }
        this.sound.playClick();
        this.updateSoundModalUI();
        this.hud.showNotification(isMuted ? '🔇 마스터 사운드 음소거' : '🔊 마스터 사운드 켜짐', isMuted ? '🔇' : '🔊');
      });
    }

    // 3. BGM Volume Slider
    const sliderBgm = document.getElementById('slider-bgm-volume');
    if (sliderBgm) {
      sliderBgm.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.sound.setBgmVolume(val / 100);
        if (!this.sound.isBgmPlaying && val > 0) {
          this.sound.startBgm();
        }
        const valText = document.getElementById('val-bgm-volume');
        if (valText) valText.textContent = `${val}%`;
      });
    }

    // 4. SFX Volume Slider
    const sliderSfx = document.getElementById('slider-sfx-volume');
    if (sliderSfx) {
      sliderSfx.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.sound.setSfxVolume(val / 100);
        const valText = document.getElementById('val-sfx-volume');
        if (valText) valText.textContent = `${val}%`;
      });
    }

    // 5. Ambient Volume Slider
    const sliderAmbient = document.getElementById('slider-ambient-volume');
    if (sliderAmbient) {
      sliderAmbient.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.sound.setAmbientVolume(val / 100);
        const valText = document.getElementById('val-ambient-volume');
        if (valText) valText.textContent = `${val}%`;
      });
    }

    // 6. SFX Test Buttons
    document.querySelectorAll('.btn-sfx-test').forEach(btn => {
      btn.addEventListener('click', () => {
        const sfxType = btn.dataset.sfx;
        this.sound.playTestSfx(sfxType);
      });
    });

    // 7. BGM Theme Selector
    document.querySelectorAll('.btn-bgm-theme').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        const theme = btn.dataset.theme;
        this.sound.setBgmTheme(theme);
        if (!this.sound.isBgmPlaying) {
          this.sound.startBgm();
        }
        this.updateSoundModalUI();
      });
    });
  }

  isSoundModalOpen() {
    return this.soundModal && this.soundModal.classList.contains('visible');
  }

  openSoundModal() {
    this.closeAll();
    if (this.soundModal) {
      this.sound.ensureRunning();
      if (!this.sound.isBgmPlaying && !this.sound.isMuted) {
        this.sound.startBgm();
      }
      this.updateSoundModalUI();
      this.soundModal.classList.add('visible');
    }
  }

  toggleSoundModal() {
    if (this.isSoundModalOpen()) {
      this.closeAll();
    } else {
      this.openSoundModal();
    }
  }

  updateSoundModalUI() {
    if (!this.sound) return;

    // Master Mute Badge
    const btnMasterMute = document.getElementById('btn-master-mute-toggle');
    const masterBadgeText = document.getElementById('master-mute-badge-text');
    const masterIcon = document.getElementById('sound-master-icon');
    const masterDesc = document.getElementById('sound-master-desc');
    const topSoundBtn = document.getElementById('btn-sound-modal-open');

    const isMuted = this.sound.isMuted;
    if (btnMasterMute) {
      btnMasterMute.classList.toggle('active', !isMuted);
      btnMasterMute.classList.toggle('muted', isMuted);
    }
    if (masterBadgeText) {
      masterBadgeText.textContent = isMuted ? 'MUTE' : 'ON';
    }
    if (masterIcon) {
      masterIcon.textContent = isMuted ? '🔇' : '🔊';
    }
    if (masterDesc) {
      masterDesc.textContent = isMuted ? '현재 모든 사운드가 음소거 상태입니다.' : '게임의 모든 소리가 정상 출력 중입니다.';
    }
    if (topSoundBtn) {
      topSoundBtn.textContent = isMuted ? '🔇 사운드' : '🔊 사운드';
    }

    // Sliders
    const sliderBgm = document.getElementById('slider-bgm-volume');
    const valBgm = document.getElementById('val-bgm-volume');
    if (sliderBgm) {
      const bgmVal = Math.round((this.sound.bgmVolume ?? 0.5) * 100);
      sliderBgm.value = bgmVal;
      if (valBgm) valBgm.textContent = `${bgmVal}%`;
    }

    const sliderSfx = document.getElementById('slider-sfx-volume');
    const valSfx = document.getElementById('val-sfx-volume');
    if (sliderSfx) {
      const sfxVal = Math.round((this.sound.sfxVolume ?? 0.7) * 100);
      sliderSfx.value = sfxVal;
      if (valSfx) valSfx.textContent = `${sfxVal}%`;
    }

    const sliderAmbient = document.getElementById('slider-ambient-volume');
    const valAmbient = document.getElementById('val-ambient-volume');
    if (sliderAmbient) {
      const ambVal = Math.round((this.sound.ambientVolume ?? 0.35) * 100);
      sliderAmbient.value = ambVal;
      if (valAmbient) valAmbient.textContent = `${ambVal}%`;
    }

    // Themes
    const currentTheme = this.sound.forcedTheme || 'auto';
    document.querySelectorAll('.btn-bgm-theme').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
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

      // Update basket count pill on dock hub
      const basketCountEl = document.getElementById('dock-basket-count');
      if (basketCountEl && this.economy) {
        basketCountEl.textContent = (this.economy.caughtFishBasket || []).length;
      }

      const quotes = [
        "어서오라냥, 집사! 오늘 바다 낚시 수확은 좀 어떠냥? 잡은 물고기를 어시장에서 판매하거나 아쿠아리움에 데려가라냥! 🐟✨",
        "심해 깊은 곳에는 전설의 대어들이 살고 있다냥! 황금 미끼나 야광 루어를 든든히 챙겨가라냥! 🌟",
        "아쿠아리움에 물고기들을 수집해두면 매 순간마다 힐링 골드를 모아준다냥! ⛵🐠",
        "특별한 빛을 품은 ✨ 이로치 물고기를 잡으면 3배의 골드를 받을 수 있다냥! 행운을 빈다냥! 👑"
      ];
      const quoteEl = document.getElementById('dock-merchant-quote');
      if (quoteEl) {
        quoteEl.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
      }
      this.dockMerchantModal.classList.add('visible');
    }
  }

  initDockMerchantEvents() {
    const btnMarket = document.getElementById('dock-btn-open-market');
    if (btnMarket) {
      btnMarket.addEventListener('click', () => {
        this.sound.playClick();
        this.openFishMarketModal();
      });
    }

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
        this.updateAquariumBadge();
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

    const btnTips = document.getElementById('dock-btn-open-tips');
    const btnTipsAction = document.getElementById('btn-tips-action');
    if (btnTips) {
      btnTips.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        this.openMerchantGuideModal();
      });
    }
    if (btnTipsAction) {
      btnTipsAction.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        this.openMerchantGuideModal();
      });
    }

    const btnSailOut = document.getElementById('dock-btn-sail-out');
    if (btnSailOut) {
      btnSailOut.addEventListener('click', () => {
        this.closeAll();
        this.hud.showNotification('🌊 신나는 바다 낚시를 떠납니다! 좋은 어획되세요!', '⛵');
      });
    }
  }

  openMerchantGuideModal() {
    this.closeAll();
    if (!this.merchantGuideModal) {
      this.merchantGuideModal = document.getElementById('merchant-guide-modal');
    }
    if (this.merchantGuideModal) {
      this.sound.playClick();
      this.merchantGuideModal.classList.add('visible');
    }
  }

  openNicknameModal() {
    this.closeAll();
    if (this.nicknameModal) {
      this.sound.playClick();
      const inputNicknameNew = document.getElementById('input-nickname-new');
      const currentName = this.cloudSave?.currentUser?.displayName 
        || localStorage.getItem('cozy_cat_player_nickname') 
        || (this.multiplayer ? this.multiplayer.playerName : '냥이 집사');
      if (inputNicknameNew) {
        inputNicknameNew.value = currentName;
      }
      this.nicknameModal.classList.add('visible');
      setTimeout(() => inputNicknameNew?.focus(), 50);
    }
  }

  openFishMarketModal() {
    this.closeAll();
    if (this.fishMarketModal) {
      this.sound.playClick();
      this.fishMarketModal.classList.add('visible');
      this.renderFishMarketContent();
    }
  }

  initFishMarketEvents() {
    const btnSellAll = document.getElementById('btn-market-sell-all');
    if (btnSellAll) {
      btnSellAll.addEventListener('click', () => {
        if (!this.economy) return;
        const basket = this.economy.caughtFishBasket || [];
        if (basket.length === 0) {
          this.hud.showNotification('판매할 어획물이 없습니다!', 'ℹ️');
          return;
        }

        this.sound.playCoin();
        const result = this.economy.sellAllFish();
        this.hud.showNotification(`🎉 물고기 ${result.count}마리 모두 판매 완료! (+${result.totalGold} G)`, '💰');
        this.renderFishMarketContent();
      });
    }
  }

  renderFishMarketContent() {
    const container = document.getElementById('market-fish-list');
    const totalCountEl = document.getElementById('market-total-count');
    const totalPriceEl = document.getElementById('market-total-price');
    if (!container) return;
    container.innerHTML = '';

    const basket = this.economy ? (this.economy.caughtFishBasket || []) : [];
    let totalPrice = 0;
    basket.forEach(f => { totalPrice += f.price; });

    if (totalCountEl) totalCountEl.textContent = basket.length;
    if (totalPriceEl) totalPriceEl.textContent = totalPrice.toLocaleString();

    if (basket.length === 0) {
      container.innerHTML = `
        <div class="market-empty-msg">
          🧺 현재 어획 바구니가 비어있습니다냥!<br>
          바다로 나가서 물고기를 낚아오면 여기서 골드로 판매하거나 아쿠아리움에 전시할 수 있다냥! 🎣✨
        </div>
      `;
      return;
    }

    basket.forEach(item => {
      const species = this.encyclopedia.getFishData(item.speciesId);
      const card = document.createElement('div');
      card.className = `market-card ${item.isShiny ? 'is-shiny' : ''}`;
      card.innerHTML = `
        <canvas class="market-card-preview" width="90" height="60"></canvas>
        <div class="market-card-title">${item.isShiny ? '✨ ' : ''}${item.name}</div>
        <div class="market-card-sub">${item.sizeCm} cm | ${species ? species.zone.toUpperCase() : '바다'}</div>
        <div class="market-card-price">💰 ${item.price.toLocaleString()} G</div>
        <div class="market-card-actions">
          <button class="market-btn-sell" data-basket-id="${item.basketId}">💰 판매</button>
          <button class="market-btn-aqua" data-basket-id="${item.basketId}">🏠 수집</button>
        </div>
      `;

      // Render fish preview canvas
      const canvas = card.querySelector('.market-card-preview');
      if (canvas && species) {
        Fish.drawPreview(canvas, species, true, item.isShiny);
      }

      // Sell Button
      const btnSell = card.querySelector('.market-btn-sell');
      if (btnSell) {
        btnSell.addEventListener('click', () => {
          this.sound.playCoin();
          const sold = this.economy.sellFish(item.basketId);
          if (sold) {
            this.hud.showNotification(`💰 ${sold.name} 판매 완료! (+${sold.price} G)`, '🪙');
            this.renderFishMarketContent();
          }
        });
      }

      // Aquarium Collect Button
      const btnAqua = card.querySelector('.market-btn-aqua');
      if (btnAqua) {
        const isAquaFull = this.aquarium.placedFish.length >= (this.aquarium.maxCapacity || 20);
        if (isAquaFull) {
          btnAqua.classList.add('disabled');
          btnAqua.title = '아쿠아리움이 가득 찼습니다 (최대 20마리)';
        }
        btnAqua.addEventListener('click', () => {
          if (this.aquarium.placedFish.length >= (this.aquarium.maxCapacity || 20)) {
            this.hud.showNotification('⚠️ 아쿠아리움이 가득 찼습니다! (최대 20마리)', '🐠');
            return;
          }
          if (this.sound && typeof this.sound.playBubble === 'function') this.sound.playBubble();
          const collected = this.economy.removeFishFromBasket(item.basketId);
          if (collected) {
            this.aquarium.addFishToAquarium(collected);
            this.hud.showNotification(`🐠 ${collected.name}을(를) 아쿠아리움에 수집했습니다! (${this.aquarium.placedFish.length}/20)`, '🏠');
            this.renderFishMarketContent();
          }
        });
      }

      container.appendChild(card);
    });
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

    } else if (this.currentInventoryTab === 'basket') {
      // 3. Caught Fish Basket (현재 보관 중인 어획물)
      const basket = this.economy ? (this.economy.caughtFishBasket || []) : [];
      if (basket.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #8d99ae; font-family: var(--font-cute); font-size: 20px;">
            🧺 현재 바구니에 보관 중인 물고기가 없습니다냥!<br>
            바다로 나가서 물고기를 낚아보라냥! (부두 상인에게 가면 판매/수집 가능) 🎣
          </div>
        `;
      } else {
        basket.forEach(item => {
          const species = this.encyclopedia.getFishData(item.speciesId);
          const card = document.createElement('div');
          card.className = `market-card ${item.isShiny ? 'is-shiny' : ''}`;
          card.innerHTML = `
            <canvas class="market-card-preview" width="90" height="60"></canvas>
            <div class="market-card-title">${item.isShiny ? '✨ ' : ''}${item.name}</div>
            <div class="market-card-sub">${item.sizeCm} cm | ${species ? species.zone.toUpperCase() : '바다'}</div>
            <div class="market-card-price">예상 가치: 💰 ${item.price.toLocaleString()} G</div>
            <div class="card-hint-text" style="font-size: 11px; color: #64748b; margin-top: 4px;">부두 상인에게 판매/수집 가능</div>
          `;

          const canvas = card.querySelector('.market-card-preview');
          if (canvas && species) {
            Fish.drawPreview(canvas, species, true, item.isShiny);
          }
          container.appendChild(card);
        });
      }

    } else if (this.currentInventoryTab === 'catches') {
      // 4. Caught Fish Cumulative Records with Visuals
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

  openAquariumManageModal() {
    if (this.aquariumManageModal) {
      this.renderAquariumManageContent();
      this.aquariumManageModal.classList.add('visible');
    }
  }

  updateAquariumBadge() {
    const countEl = document.getElementById('aqua-fish-count');
    if (countEl && this.aquarium) {
      countEl.innerText = this.aquarium.placedFish.length;
    }

    const feedBadge = document.getElementById('aqua-feed-badge');
    if (feedBadge && this.aquarium) {
      if (this.aquarium.canGetFeedReward()) {
        feedBadge.className = 'feed-badge ready';
        feedBadge.innerText = '💰 골드 가능!';
      } else {
        const remMs = this.aquarium.getFeedRewardRemainingMs();
        const mins = Math.floor(remMs / 60000);
        const secs = Math.floor((remMs % 60000) / 1000);
        feedBadge.className = 'feed-badge cooldown';
        feedBadge.innerText = `⏳ ${mins}분 ${secs}초`;
      }
    }
  }

  renderAquariumManageContent() {
    const container = document.getElementById('aqua-manage-fish-list');
    const countEl = document.getElementById('aqua-manage-count');
    const btnSellAll = document.getElementById('btn-aqua-sell-all');
    if (!container) return;

    container.innerHTML = '';
    const fishList = this.aquarium.placedFish;
    if (countEl) countEl.innerText = fishList.length;

    this.updateAquariumBadge();

    // Setup Sell All Button
    if (btnSellAll) {
      let totalValue = 0;
      fishList.forEach(f => {
        const sp = this.encyclopedia.getFishData(f.speciesId);
        if (sp) totalValue += Math.round(sp.basePrice * (f.isShiny ? 3.0 : 1.0));
      });

      btnSellAll.innerText = `💰 수조 물고기 모두 판매 (+${totalValue.toLocaleString()} G)`;
      btnSellAll.disabled = fishList.length === 0;

      // Replace click handler cleanly
      btnSellAll.onclick = () => {
        if (fishList.length === 0) return;
        this.sound.playCoin();
        const res = this.aquarium.sellAllFishFromAquarium();
        if (res && res.count > 0) {
          this.hud.showNotification(`💰 수조의 물고기 ${res.count}마리를 모두 판매하여 +${res.totalGold.toLocaleString()} G를 획득했습니다!`, '🪙');
          this.renderAquariumManageContent();
        }
      };
    }

    if (fishList.length === 0) {
      container.innerHTML = `
        <div class="aqua-empty-state">
          <div class="empty-icon">🐠</div>
          <div class="empty-title">수조가 비어있습니다.</div>
          <div class="empty-sub">부두막 어시장(🐟)에서 잡은 물고기를 아쿠아리움에 전시해보세요! (최대 20마리)</div>
        </div>
      `;
      return;
    }

    fishList.forEach(item => {
      const species = this.encyclopedia.getFishData(item.speciesId);
      const price = species ? Math.round(species.basePrice * (item.isShiny ? 3.0 : 1.0)) : 100;
      const card = document.createElement('div');
      card.className = `aqua-fish-card ${item.isShiny ? 'is-shiny' : ''}`;
      card.innerHTML = `
        <div class="aqua-card-preview-box">
          <canvas class="aqua-card-preview" width="90" height="60"></canvas>
          ${item.isShiny ? '<span class="shiny-tag">✨ 이로치</span>' : ''}
        </div>
        <div class="aqua-card-info">
          <div class="aqua-card-name">${item.name}</div>
          <div class="aqua-card-size">크기: <strong>${item.sizeCm.toFixed(1)} cm</strong></div>
          <div class="aqua-card-rarity">${species ? species.rarity.toUpperCase() : 'FISH'}</div>
          <div class="aqua-card-price">판매가: <strong>+${price.toLocaleString()} G</strong></div>
        </div>
        <div class="aqua-card-actions">
          <button class="btn-aqua-sell-fish" data-instance-id="${item.instanceId}" title="수조에서 이 물고기를 즉시 판매하여 골드를 획득합니다.">
            💰 바로 판매 (+${price.toLocaleString()} G)
          </button>
        </div>
      `;

      // Draw fish preview canvas
      const canvas = card.querySelector('.aqua-card-preview');
      if (canvas && species) {
        Fish.drawPreview(canvas, species, true, item.isShiny);
      }

      // Sell Fish Button
      const btnSell = card.querySelector('.btn-aqua-sell-fish');
      if (btnSell) {
        btnSell.addEventListener('click', () => {
          this.sound.playCoin();
          const result = this.aquarium.sellFishFromAquarium(item.instanceId);
          if (result) {
            this.hud.showNotification(`💰 [${result.fish.name}]을(를) 즉시 판매하여 +${result.price.toLocaleString()} G를 획득했습니다!`, '🪙');
            this.renderAquariumManageContent();
          }
        });
      }

      container.appendChild(card);
    });
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

    const discount = this.economy.getShopDiscountMultiplier();
    const isDiscountActive = discount < 1.0;

    if (this.currentShopTab === 'rods') {
      RODS.forEach(rod => {
        const isOwned = this.economy.ownedRods.includes(rod.id);
        const isEquipped = this.economy.currentRodId === rod.id;
        const finalPrice = Math.round(rod.price * discount);
        const canAfford = this.economy.gold >= finalPrice;

        const priceLabel = isDiscountActive && rod.price > 0
          ? `<span style="text-decoration:line-through; opacity:0.6; font-size:11px; margin-right:4px;">${rod.price.toLocaleString()}G</span> ${finalPrice.toLocaleString()} G <span style="font-size:11px; background:#fef08a; color:#854d0e; padding:1px 4px; border-radius:4px; font-weight:800;">👑 20% SALE</span>`
          : `${rod.price.toLocaleString()} G 구매`;

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
                  ${priceLabel}
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
        const finalPrice = Math.round(boat.price * discount);
        const canAfford = this.economy.gold >= finalPrice;

        const priceLabel = isDiscountActive && boat.price > 0
          ? `<span style="text-decoration:line-through; opacity:0.6; font-size:11px; margin-right:4px;">${boat.price.toLocaleString()}G</span> ${finalPrice.toLocaleString()} G <span style="font-size:11px; background:#fef08a; color:#854d0e; padding:1px 4px; border-radius:4px; font-weight:800;">👑 20% SALE</span>`
          : `${boat.price.toLocaleString()} G 구매`;

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
                  ${priceLabel}
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
        const finalPrice = Math.round(bait.price * discount);
        const canAfford = this.economy.gold >= finalPrice;
        const count = this.economy.baitInventory[bait.id] || 0;
        const isTackle = !!bait.isTackle;

        let countLabel = '';
        if (bait.id === 'bread') countLabel = '보유량: 무제한';
        else if (isTackle) countLabel = `보유 수량: ${count}개 (세트 소모품)`;
        else countLabel = `보유량: ${count}개`;

        const depthBadge = bait.maxDepth ? `<span style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-left: 6px;">유효 수심 ~${bait.maxDepth}m</span>` : '';

        const priceLabel = isDiscountActive && bait.price > 0
          ? `<span style="text-decoration:line-through; opacity:0.6; font-size:11px; margin-right:4px;">${bait.price.toLocaleString()}G</span> ${finalPrice.toLocaleString()} G (+${bait.countPerBuy}개) <span style="font-size:11px; background:#fef08a; color:#854d0e; padding:1px 4px; border-radius:4px; font-weight:800;">👑 20%</span>`
          : `${bait.price.toLocaleString()} G (+${bait.countPerBuy}개 구매)`;

        const card = document.createElement('div');
        card.className = 'shop-card';
        card.innerHTML = `
          <div class="shop-card-header">
            <span class="card-icon card-bait-icon-wrapper">${getBaitIconSvg(bait.id)}</span>
            <div class="card-title-group">
              <div class="card-title">${bait.name} ${depthBadge}</div>
              <div class="card-subtitle">${countLabel}</div>
            </div>
          </div>
          <div class="card-desc">${bait.description}</div>
          <div class="card-footer">
            ${bait.price === 0 
              ? '<span class="badge-free">기본 제공</span>' 
              : `
                <button class="btn-primary btn-buy-bait ${!canAfford ? 'disabled' : ''}" data-id="${bait.id}">
                  ${priceLabel}
                </button>
              `}
          </div>
        `;

        const btnBuy = card.querySelector('.btn-buy-bait');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            if (this.economy.buyBait(bait.id)) {
              this.sound.playCoin();
              this.hud.showNotification(`${bait.name} (+${bait.countPerBuy}개) 구매 완료!`, '🎒');
              this.renderShopContent();
              this.hud.initBaitBar();
            } else {
              this.hud.showNotification('골드가 부족합니다!', '⚠️');
            }
          });
        }

        container.appendChild(card);
      });

    } else if (this.currentShopTab === 'hats') {
      HATS.forEach(hat => {
        const isOwned = this.economy.ownedHats.includes(hat.id);
        const isEquipped = this.economy.currentHatId === hat.id;
        const finalPrice = Math.round(hat.price * discount);
        const canAfford = this.economy.gold >= finalPrice;

        const priceLabel = isDiscountActive && hat.price > 0
          ? `<span style="text-decoration:line-through; opacity:0.6; font-size:11px; margin-right:4px;">${hat.price.toLocaleString()}G</span> ${finalPrice.toLocaleString()} G <span style="font-size:11px; background:#fef08a; color:#854d0e; padding:1px 4px; border-radius:4px; font-weight:800;">👑 20% SALE</span>`
          : `${hat.price.toLocaleString()} G 구매`;

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
                  ${priceLabel}
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

        const priceLabel = isDiscountActive && cost > 0
          ? `${cost.toLocaleString()} G 강화 (Lv.${currentLv + 1}) <span style="font-size:11px; background:#fef08a; color:#854d0e; padding:1px 4px; border-radius:4px; font-weight:800;">👑 20% SALE</span>`
          : `${cost.toLocaleString()} G 강화 (Lv.${currentLv + 1})`;

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
                  ${priceLabel}
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
