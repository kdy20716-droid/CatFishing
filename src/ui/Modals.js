/**
 * Interactive Modals (Shop, Fish Encyclopedia, Aquarium Controls, Settings, Guide)
 */
import { RODS, BOATS, BAITS, HATS, PASSIVE_UPGRADES, CAT_SKINS } from '../systems/Economy.js?v=7.7.0';
import { FISH_SPECIES } from '../systems/Encyclopedia.js?v=7.7.0';
import { Fish } from '../entities/Fish.js?v=7.7.0';
import { getBaitIconSvg } from './BaitIcons.js?v=7.7.0';
import { AQUARIUM_THEMES_INFO, FACILITY_UPGRADES, FOOD_TIERS } from '../systems/Aquarium.js?v=7.8.0';

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
    this.fishDetailModal = document.getElementById('fish-detail-modal');
    this.aquariumUI = document.getElementById('aquarium-controls-ui');
    this.aquariumManageModal = document.getElementById('aquarium-manage-modal');
    this.aquariumThemeModal = document.getElementById('aquarium-theme-modal');
    this.aquariumOfflineModal = document.getElementById('aquarium-offline-modal');
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
    this.couponModal = document.getElementById('coupon-modal');
    this.couponResultModal = document.getElementById('coupon-result-modal');
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
    // Close modal buttons (Global)
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.closeAll();
      });
    });

    // 🐟 Fish detail modal exclusive close (keeps encyclopedia open!)
    const closeFishDetail = (e) => {
      if (e) e.stopPropagation();
      this.sound.playClick();
      if (this.fishDetailModal) {
        this.fishDetailModal.classList.remove('visible');
      }
    };

    document.querySelectorAll('.fish-detail-close-btn, .fish-detail-confirm-btn').forEach(btn => {
      btn.addEventListener('click', closeFishDetail);
    });

    if (this.fishDetailModal) {
      this.fishDetailModal.addEventListener('click', (e) => {
        if (e.target === this.fishDetailModal) {
          closeFishDetail(e);
        }
      });
    }

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

      // 모달창 즉시 닫기
      if (this.nicknameModal) this.nicknameModal.classList.remove('visible');
      if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');

      // 로컬 스토리지 즉시 동기화
      localStorage.setItem('cozy_cat_player_nickname', newName);

      // 멀티플레이어 닉네임 즉시 갱신
      if (this.multiplayer) {
        this.multiplayer.playerName = newName;
        this.multiplayer.updateMultiplayerUI();
      }

      // 우측 상단 프로필 뱃지 닉네임 텍스트 즉시 갱신
      const userNameEl = document.getElementById('user-name');
      if (userNameEl) userNameEl.innerText = newName;

      try {
        if (this.cloudSave) {
          await this.cloudSave.updateNickname(newName);
        }
      } catch (e) {
        console.warn("Cloud nickname sync failed:", e);
      }

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

        // 🎟️ Secret Code / Coupon Modal Listeners (SHA-256 Hash Validation)
    const btnOpenCoupon = document.getElementById('btn-open-coupon-modal');
    const inputCouponCode = document.getElementById('input-coupon-code');
    const btnCouponSubmit = document.getElementById('btn-coupon-submit');
    const btnCouponCancel = document.getElementById('btn-coupon-cancel');
    const couponMsg = document.getElementById('coupon-message');
    const btnResultOk = document.getElementById('btn-coupon-result-ok');

    const showCouponResult = (isSuccess, title, msg, icon = '🎁') => {
      const modal = document.getElementById('coupon-result-modal');
      const headerEl = document.getElementById('coupon-result-header');
      const titleEl = document.getElementById('coupon-result-title');
      const iconEl = document.getElementById('coupon-result-icon');
      const msgEl = document.getElementById('coupon-result-msg');
      const okBtn = document.getElementById('btn-coupon-result-ok');

      if (titleEl) titleEl.innerText = title;
      if (iconEl) iconEl.innerText = icon;
      if (msgEl) msgEl.innerHTML = msg;

      if (headerEl) {
        headerEl.style.background = isSuccess 
          ? 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)' 
          : 'linear-gradient(180deg, #ffe4e6 0%, #fecdd3 100%)';
      }
      if (titleEl) {
        titleEl.style.color = isSuccess ? '#92400e' : '#9f1239';
      }
      if (okBtn) {
        okBtn.style.background = isSuccess 
          ? 'linear-gradient(180deg, #f59e0b, #d97706)' 
          : 'linear-gradient(180deg, #e11d48, #be123c)';
        okBtn.style.borderColor = isSuccess ? '#b45309' : '#9f1239';
        okBtn.style.boxShadow = isSuccess ? '0 4px 0 #b45309' : '0 4px 0 #881337';
      }

      if (modal) modal.classList.add('visible');
    };

    if (btnOpenCoupon) {
      btnOpenCoupon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound?.playClick?.();
        if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        this.openCouponModal();
      });
    }

    const sha256Hex = async (str) => {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        return '';
      }
    };

    const handleCouponSubmit = async () => {
      const inputVal = inputCouponCode ? inputCouponCode.value.trim() : '';
      if (!inputVal) {
        this.sound?.playClick?.();
        if (this.couponModal) this.couponModal.classList.remove('visible');
    const resultModal = document.getElementById('coupon-result-modal');
    if (resultModal) resultModal.classList.remove('visible');
        showCouponResult(false, '⚠️ 코드 미입력', '코드를 입력해주세요!', '📝');
        return;
      }

      // SHA-256 단방향 해시 검증
      const inputHash = await sha256Hex(inputVal);
      const secretHash = 'efa92c0adbbc1f4b33b035b31a3cd6ce219f2ed805f179c3c0807cd860700824';

      if (inputHash === secretHash) {
        if (this.sound) {
          if (typeof this.sound.playLevelUp === 'function') this.sound.playLevelUp();
          else if (typeof this.sound.playCoin === 'function') this.sound.playCoin();
        }
        
        // 💰 7,777만 골드 (77,777,777 G) 즉시 지급!
        const rewardAmount = 77777777;
        this.economy.addGold(rewardAmount);
        this.economy.saveToStorage();

        if (this.couponModal) this.couponModal.classList.remove('visible');
        if (inputCouponCode) inputCouponCode.value = '';
        if (couponMsg) couponMsg.style.display = 'none';

        // 🎉 성공 모달 띄우기!
        showCouponResult(
          true, 
          '🎉 보상 지급 완료!', 
          `대박 선물!<br><strong style="color: #d97706; font-size: 20px;">${rewardAmount.toLocaleString()} G</strong> 골드가 지급되었습니다! 🪙✨`, 
          '💰'
        );

        if (this.hud) {
          this.hud.showNotification(`🎉 [코드 보상] ${rewardAmount.toLocaleString()} G 골드가 지급되었습니다! 🪙✨`, '🎁');
        }
      } else {
        this.sound?.playClick?.();
        if (this.couponModal) this.couponModal.classList.remove('visible');
        if (inputCouponCode) inputCouponCode.value = '';
        if (couponMsg) couponMsg.style.display = 'none';

        // ❌ 실패 모달 띄우기!
        showCouponResult(
          false, 
          '❌ 잘못된 코드입니다', 
          '입력하신 코드가 올바르지 않습니다.<br>선물 코드를 다시 확인해주세요!', 
          '⚠️'
        );
      }
    };

    if (btnCouponSubmit) btnCouponSubmit.addEventListener('click', handleCouponSubmit);
    if (inputCouponCode) {
      inputCouponCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleCouponSubmit();
      });
    }
    if (btnCouponCancel) {
      btnCouponCancel.addEventListener('click', () => {
        this.sound?.playClick?.();
        if (this.couponModal) this.couponModal.classList.remove('visible');
      });
    }
    if (btnResultOk) {
      btnResultOk.addEventListener('click', () => {
        this.sound?.playClick?.();
        const modal = document.getElementById('coupon-result-modal');
        if (modal) modal.classList.remove('visible');
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

    // Aquarium Idle Tycoon Controls
    const btnFeed = document.getElementById('btn-aqua-feed');
    if (btnFeed) {
      btnFeed.addEventListener('click', () => {
        const cx = 150 + Math.random() * (this.aquarium.tankWidth - 300);
        const res = this.aquarium.dropFood(cx, 30);
        if (res && res.givesReward) {
          this.hud.showNotification('💰 밥주기 보상: 물고기들이 기뻐하며 힐링 골드를 선물했습니다!', '✨');
        } else if (res) {
          const remMs = this.aquarium.getFeedRewardRemainingMs();
          const mins = Math.floor(remMs / 60000);
          const secs = Math.floor((remMs % 60000) / 1000);
          this.hud.showNotification(`🥐 냠냠 먹이를 주었습니다! (다음 골드 보상까지: ${mins}분 ${secs}초)`, '🐟');
        }
        this.updateAquariumBadge();
      });
    }

    // Vault Claim
    const btnClaimVault = document.getElementById('btn-aqua-claim-vault');
    if (btnClaimVault) {
      btnClaimVault.addEventListener('click', () => {
        const earned = this.aquarium.claimVaultGold();
        if (earned > 0) {
          this.hud.showNotification(`💰 코인 금고에서 +${earned.toLocaleString()} G 수령 완료!`, '🪙');
        } else {
          this.hud.showNotification('금고에 보관된 골드가 없습니다.', '🫧');
        }
        this.updateAquariumBadge();
      });
    }

    // Tabs Switcher
    const tabBtns = document.querySelectorAll('.aqua-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.sound.playClick();
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabKey = btn.dataset.tab;
        document.querySelectorAll('.aqua-tab-pane').forEach(p => p.classList.remove('active'));
        const activePane = document.getElementById(`aqua-tab-${tabKey}`);
        if (activePane) activePane.classList.add('active');
        this.renderAquariumPanels();
      });
    });

    // Vault Upgrade Button
    const btnUpVault = document.getElementById('btn-up-vault');
    if (btnUpVault) {
      btnUpVault.addEventListener('click', () => {
        const res = this.aquarium.upgradeVault();
        this.hud.showNotification(res.message, res.success ? '🏦' : '⚠️');
        this.renderAquariumPanels();
      });
    }

    // Filter Upgrade Button
    const btnUpFilter = document.getElementById('btn-up-filter');
    if (btnUpFilter) {
      btnUpFilter.addEventListener('click', () => {
        const res = this.aquarium.upgradeFilter();
        this.hud.showNotification(res.message, res.success ? '💧' : '⚠️');
        this.renderAquariumPanels();
      });
    }

    // Sell All Tab Button
    const btnSellAllTab = document.getElementById('btn-aqua-sell-all-tab');
    if (btnSellAllTab) {
      btnSellAllTab.addEventListener('click', () => {
        const res = this.aquarium.sellAllFishFromAquarium();
        if (res.count > 0) {
          this.hud.showNotification(`🐟 수조 물고기 ${res.count}마리 판매 (+ ${res.totalGold.toLocaleString()} G)`, '💰');
        } else {
          this.hud.showNotification('수조에 판매할 물고기가 없습니다.', '🫧');
        }
        this.renderAquariumPanels();
      });
    }

    // Offline Claim Modal Button
    const btnClaimOffline = document.getElementById('btn-claim-aqua-offline');
    if (btnClaimOffline) {
      btnClaimOffline.addEventListener('click', () => {
        const res = this.aquarium.claimOfflineEarnings();
        if (this.aquariumOfflineModal) this.aquariumOfflineModal.classList.remove('visible');
        if (res.earnings > 0) {
          this.hud.showNotification(`🎉 오프라인 방치 수익 +${res.earnings.toLocaleString()} G 수령 완료!`, '💰');
        }
        this.updateAquariumBadge();
      });
    }

    // Exit Button
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
    if (this.fishDetailModal) this.fishDetailModal.classList.remove('visible');
    if (this.guideModal) this.guideModal.classList.remove('visible');
    if (this.authModal) this.authModal.classList.remove('visible');
    if (this.conflictModal) this.conflictModal.classList.remove('visible');
    if (this.multiplayerModal) this.multiplayerModal.classList.remove('visible');
    if (this.wardrobeModal) this.wardrobeModal.classList.remove('visible');
    if (this.dockMerchantModal) this.dockMerchantModal.classList.remove('visible');
    if (this.merchantGuideModal) this.merchantGuideModal.classList.remove('visible');
    if (this.fishMarketModal) this.fishMarketModal.classList.remove('visible');
    if (this.nicknameModal) this.nicknameModal.classList.remove('visible');
    if (this.couponModal) this.couponModal.classList.remove('visible');
    if (this.inventoryModal) this.inventoryModal.classList.remove('visible');
    if (this.pauseModal) this.pauseModal.classList.remove('visible');
    if (this.aquariumManageModal) this.aquariumManageModal.classList.remove('visible');
    if (this.aquariumThemeModal) this.aquariumThemeModal.classList.remove('visible');
    if (this.aquariumOfflineModal) this.aquariumOfflineModal.classList.remove('visible');
    if (this.soundModal) this.soundModal.classList.remove('visible');
    if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
    if (this.aquariumUI && !this.aquarium.isOpen) this.aquariumUI.classList.remove('visible');
    if (this.onPauseChange) this.onPauseChange(false);
  }

  hasAnyModalOpen() {
    return (
      (this.shopModal && this.shopModal.classList.contains('visible')) ||
      (this.encyclopediaModal && this.encyclopediaModal.classList.contains('visible')) ||
      (this.fishDetailModal && this.fishDetailModal.classList.contains('visible')) ||
      (this.guideModal && this.guideModal.classList.contains('visible')) ||
      (this.authModal && this.authModal.classList.contains('visible')) ||
      (this.conflictModal && this.conflictModal.classList.contains('visible')) ||
      (this.multiplayerModal && this.multiplayerModal.classList.contains('visible')) ||
      (this.wardrobeModal && this.wardrobeModal.classList.contains('visible')) ||
      (this.dockMerchantModal && this.dockMerchantModal.classList.contains('visible')) ||
      (this.merchantGuideModal && this.merchantGuideModal.classList.contains('visible')) ||
      (this.fishMarketModal && this.fishMarketModal.classList.contains('visible')) ||
      (this.nicknameModal && this.nicknameModal.classList.contains('visible')) ||
      (this.couponModal && this.couponModal.classList.contains('visible')) ||
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

    // Mini-game Setting Toggle in ESC Menu
    const btnMinigame = document.getElementById('btn-minigame-toggle');
    const minigameText = document.getElementById('minigame-toggle-text');
    const minigameDesc = document.getElementById('minigame-pause-desc');
    const isMinigameOn = (this.economy && this.economy.isMinigameEnabled === true);

    if (btnMinigame) {
      btnMinigame.classList.toggle('active', isMinigameOn);
      btnMinigame.classList.toggle('muted', !isMinigameOn);
    }
    if (minigameText) {
      minigameText.textContent = isMinigameOn ? 'ON' : 'OFF';
    }
    if (minigameDesc) {
      minigameDesc.textContent = isMinigameOn
        ? '입질 시 별이 타겟에 왔을 때 스페이스바/클릭을 누르는 타이밍 미니게임'
        : '미니게임 없이 조용하고 편안하게 릴링하는 클래식 모드';
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

    // 2. Save progress button (Manual save button)
    const btnSave = document.getElementById('btn-pause-save');
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        if (this.cloudSave) {
          await this.cloudSave.manualSaveToCloud();
        } else {
          this.sound.playCoin();
          this.hud.showNotification('💾 게임 진행 상황이 로컬에 안전하게 저장되었습니다!', '✨');
        }
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

    // 6. Mini-game ON/OFF Toggle in ESC Menu
    const btnMinigameToggle = document.getElementById('btn-minigame-toggle');
    if (btnMinigameToggle) {
      btnMinigameToggle.addEventListener('click', () => {
        const isEnabled = this.economy ? (this.economy.isMinigameEnabled === true) : false;
        const nextState = !isEnabled;
        if (this.economy) this.economy.isMinigameEnabled = nextState;
        localStorage.setItem('cozy_cat_minigame_enabled', nextState ? 'true' : 'false');
        this.sound.playClick();
        this.updatePauseModalUI();
        this.hud.showNotification(
          nextState 
            ? '⭐ 낚시 미니게임이 활성화되었습니다!' 
            : '💡 낚시 미니게임이 비활성화되었습니다 (클래식 모드)',
          '🎮'
        );
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
        this.renderAquariumPanels();
        if (this.aquariumUI) this.aquariumUI.classList.add('visible');
        this.checkAquariumOfflineReward();
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

  openCouponModal() {
    this.closeAll();
    if (!this.couponModal) {
      this.couponModal = document.getElementById('coupon-modal');
    this.couponResultModal = document.getElementById('coupon-result-modal');
    }
    if (this.couponModal) {
      this.sound.playClick();
      const input = document.getElementById('input-coupon-code');
      const msg = document.getElementById('coupon-message');
      if (input) input.value = '';
      if (msg) msg.style.display = 'none';
      this.couponModal.classList.add('visible');
      setTimeout(() => input?.focus(), 50);
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
    if (!this.aquarium) return;

    // Theme Tag
    const themeTag = document.getElementById('aqua-current-theme-tag');
    if (themeTag) {
      const tInfo = this.aquarium.getThemeInfo();
      themeTag.innerText = `${tInfo.icon} ${tInfo.name}`;
    }

    // Fish Count
    const countEl = document.getElementById('aqua-fish-count');
    const maxCountEl = document.getElementById('aqua-max-count');
    if (countEl) countEl.innerText = this.aquarium.placedFish.length;
    if (maxCountEl) maxCountEl.innerText = this.aquarium.getMaxCapacity();

    // GPS Rate
    const gpsEl = document.getElementById('aqua-gps-val');
    if (gpsEl) {
      const gpm = this.aquarium.getGPM();
      gpsEl.innerText = `+${gpm.toLocaleString()} G/분`;
    }

    // Vault Progress & Text
    const vaultText = document.getElementById('aqua-vault-text');
    const vaultBar = document.getElementById('aqua-vault-bar');
    const maxVault = this.aquarium.getVaultMaxCapacity();
    const curVault = Math.round(this.aquarium.vaultGold);
    if (vaultText) {
      vaultText.innerText = `${curVault.toLocaleString()} / ${maxVault.toLocaleString()} G`;
    }
    if (vaultBar) {
      const pct = Math.min(100, Math.max(0, (curVault / Math.max(1, maxVault)) * 100));
      vaultBar.style.width = `${pct}%`;
    }

    // Feed Badge
    const feedBadge = document.getElementById('aqua-feed-badge');
    if (feedBadge) {
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

  renderAquariumPanels() {
    if (!this.aquarium) return;
    this.updateAquariumBadge();

    // 1. Render Tab 1: 8 Facility Upgrades (수조 & 시설 업그레이드)
    const facilityContainer = document.getElementById('aqua-facility-upgrade-list');
    if (facilityContainer) {
      facilityContainer.innerHTML = '';
      FACILITY_UPGRADES.forEach(fac => {
        const curLv = this.aquarium.facilityLevels[fac.id] || (fac.id === 'auto_feeder' ? 0 : 1);
        const isMax = curLv >= fac.maxLevel;
        const costIdx = curLv - (fac.id === 'auto_feeder' ? 0 : 1);
        const cost = isMax ? 0 : fac.costs[costIdx];
        const canAfford = this.economy.gold >= cost;

        let curVal, nextVal;
        if (fac.caps) {
          curVal = fac.caps[curLv - 1];
          nextVal = isMax ? null : fac.caps[curLv];
        } else {
          curVal = fac.bonuses[curLv - (fac.id === 'auto_feeder' ? 0 : 1)];
          nextVal = isMax ? undefined : fac.bonuses[curLv - (fac.id === 'auto_feeder' ? 0 : 1) + 1];
        }

        const descText = fac.desc(curVal, nextVal);

        const card = document.createElement('div');
        card.className = 'aqua-up-card';
        card.innerHTML = `
          <div class="up-card-icon">${fac.icon}</div>
          <div class="up-card-details">
            <div class="up-card-title">${fac.name} <span class="up-lv">Lv.${curLv}</span></div>
            <div class="up-card-desc">${descText}</div>
          </div>
          <button class="btn-primary btn-upgrade-action ${isMax ? 'disabled' : !canAfford ? 'disabled' : ''}" data-fac="${fac.id}">
            ${isMax ? 'MAX' : '💰 ' + cost.toLocaleString() + ' G'}
          </button>
        `;

        const btnUp = card.querySelector('.btn-upgrade-action');
        if (btnUp && !isMax) {
          btnUp.addEventListener('click', () => {
            const res = this.aquarium.upgradeFacility(fac.id);
            this.hud.showNotification(res.message, res.success ? fac.icon : '⚠️');
            this.renderAquariumPanels();
          });
        }

        facilityContainer.appendChild(card);
      });
    }

    // 2. Render Tab 2: Food Tiers & Progressive Leveling (사료 육성 및 해금)
    const foodContainer = document.getElementById('aqua-food-tier-list');
    if (foodContainer) {
      foodContainer.innerHTML = '';
      FOOD_TIERS.forEach(food => {
        const isEquipped = this.aquarium.foodTier === food.tier;
        const isOwned = this.aquarium.ownedFoodTiers.includes(food.tier);
        const foodLv = this.aquarium.getFoodLevel(food.tier);
        const lvCost = this.aquarium.getFoodUpgradeCost(food.tier);
        const canAffordLv = this.economy.gold >= lvCost;
        const canAffordBuy = this.economy.gold >= food.price;

        let lockMsg = '';
        let isLocked = false;
        if (!isOwned && food.reqTier) {
          const reqLv = this.aquarium.getFoodLevel(food.reqTier);
          if (reqLv < food.reqLevel) {
            isLocked = true;
            lockMsg = `🔒 ${food.reqTierName} 달성 시 해금 (현재: Lv.${reqLv})`;
          }
        }

        const card = document.createElement('div');
        card.className = `aqua-food-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="food-card-icon">${food.icon}</div>
          <div class="food-card-body">
            <div class="food-card-title-row">
              <span class="food-card-title">${food.name}</span>
              ${isOwned ? `<span class="up-lv">Lv.${foodLv}</span>` : ''}
            </div>
            <div class="food-card-desc">${food.desc}</div>
            ${isLocked ? `<div class="food-card-lock">${lockMsg}</div>` : ''}
          </div>
          <div class="food-card-actions">
            ${isOwned ? `
              <button class="btn-food-lvup ${!canAffordLv ? 'disabled' : ''}" data-tier="${food.tier}">
                ⬆️ Lv업 (${lvCost.toLocaleString()}G)
              </button>
              ${isEquipped
                ? '<span class="badge-equipped">사용 중</span>'
                : `<button class="btn-secondary btn-select-food" data-tier="${food.tier}">장착</button>`}
            ` : isLocked ? `
              <button class="btn-primary btn-buy-food disabled">
                🔒 잠김
              </button>
            ` : `
              <button class="btn-primary btn-buy-food ${!canAffordBuy ? 'disabled' : ''}" data-tier="${food.tier}">
                💰 ${food.price.toLocaleString()} G 구매
              </button>
            `}
          </div>
        `;

        const btnLv = card.querySelector('.btn-food-lvup');
        if (btnLv) {
          btnLv.addEventListener('click', () => {
            const res = this.aquarium.levelUpFood(food.tier);
            this.hud.showNotification(res.message, res.success ? '✨' : '⚠️');
            this.renderAquariumPanels();
          });
        }

        const btnSel = card.querySelector('.btn-select-food');
        if (btnSel) {
          btnSel.addEventListener('click', () => {
            this.sound.playClick();
            this.aquarium.foodTier = food.tier;
            this.aquarium.saveToStorage();
            this.renderAquariumPanels();
            this.hud.showNotification(`${food.name} 사료를 장착했습니다.`, food.icon);
          });
        }

        const btnBuy = card.querySelector('.btn-buy-food');
        if (btnBuy && !isLocked) {
          btnBuy.addEventListener('click', () => {
            const res = this.aquarium.buyFoodTier(food.tier);
            this.hud.showNotification(res.message, res.success ? food.icon : '⚠️');
            this.renderAquariumPanels();
          });
        }

        foodContainer.appendChild(card);
      });
    }

    // 3. Render Tab 3: Fish Level Up & Manage
    const fishContainer = document.getElementById('aqua-fish-cards-list');
    if (fishContainer) {
      fishContainer.innerHTML = '';
      if (this.aquarium.placedFish.length === 0) {
        fishContainer.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px; font-size:12px;">수조에 물고기가 없습니다.<br>낚시터에서 물고기를 잡아 수조에 넣어보세요!</div>';
      } else {
        this.aquarium.placedFish.forEach(fishItem => {
          const species = this.encyclopedia.getFishData(fishItem.speciesId);
          const lv = fishItem.level || 1;
          const gps = Math.round(this.aquarium.calculateFishGPS(fishItem) * 10) / 10;
          const cost = this.aquarium.getFishUpgradeCost(fishItem);
          const canAfford = this.economy.gold >= cost;

          const card = document.createElement('div');
          card.className = 'aqua-fish-item-card';
          card.innerHTML = `
            <div class="fish-item-info">
              <div class="fish-item-name">${fishItem.isShiny ? '✨ ' : ''}${fishItem.name} <span class="up-lv">Lv.${lv}</span></div>
              <div class="fish-item-stats">⚡ +${this.aquarium.calculateFishGPM(fishItem).toLocaleString()} G/분 (${fishItem.sizeCm}cm)</div>
            </div>
            <div class="fish-item-actions">
              <button class="btn-fish-lvup ${!canAfford ? 'disabled' : ''}" data-id="${fishItem.instanceId}">
                ⬆️ Lv업 (${cost.toLocaleString()}G)
              </button>
              <button class="btn-fish-sell" data-id="${fishItem.instanceId}">
                판매
              </button>
            </div>
          `;

          const btnLv = card.querySelector('.btn-fish-lvup');
          if (btnLv) {
            btnLv.addEventListener('click', () => {
              const res = this.aquarium.levelUpFish(fishItem.instanceId);
              this.hud.showNotification(res.message, res.success ? '✨' : '⚠️');
              this.renderAquariumPanels();
            });
          }

          const btnSell = card.querySelector('.btn-fish-sell');
          if (btnSell) {
            btnSell.addEventListener('click', () => {
              const removed = this.aquarium.sellFishFromAquarium(fishItem.instanceId);
              if (removed) {
                this.sound.playCoin();
                this.hud.showNotification(`${removed.name}을(를) 판매했습니다.`, '💰');
              }
              this.renderAquariumPanels();
            });
          }

          fishContainer.appendChild(card);
        });
      }
    }

    // 4. Render Tab 4: Theme Shop
    const themesContainer = document.getElementById('aqua-theme-cards-list');
    if (themesContainer) {
      themesContainer.innerHTML = '';
      AQUARIUM_THEMES_INFO.forEach(theme => {
        const isOwned = this.aquarium.ownedThemes.includes(theme.id);
        const isEquipped = this.aquarium.theme === theme.id;
        const canAfford = this.economy.gold >= theme.price;

        const card = document.createElement('div');
        card.className = `aqua-theme-item-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <img class="theme-item-preview" src="${theme.image}" alt="${theme.name}" onerror="this.style.display='none'">
          <div class="theme-item-body">
            <div class="theme-item-title-row">
              <span class="theme-item-title">${theme.icon} ${theme.name}</span>
              <span class="theme-card-badge">${theme.badge}</span>
            </div>
            <div class="theme-item-perk">✨ ${theme.perk}</div>
            <div class="theme-item-footer">
              <span class="theme-card-capacity">🏠 수용: ${theme.capacity}마리</span>
              <div>
                ${isEquipped
                  ? '<span class="badge-equipped">적용 중</span>'
                  : isOwned
                  ? `<button class="btn-secondary btn-apply-theme" data-id="${theme.id}">적용하기</button>`
                  : `<button class="btn-primary btn-buy-theme ${!canAfford ? 'disabled' : ''}" data-id="${theme.id}">
                      💰 ${theme.price.toLocaleString()} G
                     </button>`}
              </div>
            </div>
          </div>
        `;

        const btnApply = card.querySelector('.btn-apply-theme');
        if (btnApply) {
          btnApply.addEventListener('click', () => {
            this.sound.playClick();
            this.aquarium.setTheme(theme.id);
            this.renderAquariumPanels();
            this.hud.showNotification(`${theme.name} 테마가 적용되었습니다!`, theme.icon);
          });
        }

        const btnBuy = card.querySelector('.btn-buy-theme');
        if (btnBuy) {
          btnBuy.addEventListener('click', () => {
            const res = this.aquarium.buyTheme(theme.id);
            this.hud.showNotification(res.message, res.success ? theme.icon : '⚠️');
            this.renderAquariumPanels();
          });
        }

        themesContainer.appendChild(card);
      });
    }
  }

  checkAquariumOfflineReward() {
    if (!this.aquarium || !this.aquariumOfflineModal) return;
    const off = this.aquarium.calculateOfflineEarnings();
    if (off.earnings > 0 && off.elapsedSeconds >= 60) {
      const timeEl = document.getElementById('aqua-offline-time');
      const goldEl = document.getElementById('aqua-offline-gold');
      if (timeEl) {
        if (off.hours > 0) {
          timeEl.innerText = `${off.hours}시간 ${off.minutes}분`;
        } else {
          timeEl.innerText = `${off.minutes}분`;
        }
      }
      if (goldEl) {
        goldEl.innerText = `+${off.earnings.toLocaleString()} G`;
      }
      this.aquariumOfflineModal.classList.add('visible');
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
      const lv = item.level || 1;
      const gpm = this.aquarium.calculateFishGPM(item);
      let basePrice = species ? species.basePrice : 50;
      if (item.isShiny) basePrice = Math.round(basePrice * 2.5);
      const price = Math.round(basePrice * (1 + (lv - 1) * 0.25));

      const card = document.createElement('div');
      card.className = `aqua-fish-card ${item.isShiny ? 'is-shiny' : ''}`;
      card.innerHTML = `
        <div class="aqua-card-preview-box">
          <canvas class="aqua-card-preview" width="64" height="42"></canvas>
          ${item.isShiny ? '<span class="shiny-tag">✨</span>' : ''}
        </div>
        <div class="aqua-card-info">
          <div class="aqua-card-title-row">
            <span class="aqua-card-name">${item.name}</span>
            <span class="up-lv">Lv.${lv}</span>
          </div>
          <div class="aqua-card-sub">${item.sizeCm.toFixed(1)} cm • ⚡ +${gpm.toLocaleString()} G/분</div>
        </div>
        <div class="aqua-card-actions">
          <button class="btn-aqua-sell-fish" data-instance-id="${item.instanceId}">
            💰 +${price.toLocaleString()} G 판매
          </button>
        </div>
      `;

      const canvas = card.querySelector('.aqua-card-preview');
      if (canvas && species) {
        Fish.drawPreview(canvas, species, true, item.isShiny);
      }

      const btnSell = card.querySelector('.btn-aqua-sell-fish');
      if (btnSell) {
        btnSell.addEventListener('click', () => {
          this.sound.playCoin();
          const result = this.aquarium.sellFishFromAquarium(item.instanceId);
          if (result && result.fish) {
            this.hud.showNotification(`💰 [${result.fish.name}] 판매 완료 (+ ${result.price.toLocaleString()} G)`, '🪙');
          }
          this.renderAquariumManageContent();
          this.renderAquariumPanels();
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
    const goldEl = document.getElementById('shop-gold-amount');
    if (goldEl) {
      goldEl.innerText = `${this.economy.gold.toLocaleString()} G`;
    }
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

    const zoneNames = {
      shallow: '표층',
      mid: '중층',
      deep: '심해',
      abyss: '심연',
      hadal: '초심연'
    };

    filtered.forEach(species => {
      const record = this.encyclopedia.getRecord(species.id);
      const isDiscovered = record.caughtCount > 0;
      const hasShiny = (record.shinyCount || 0) > 0;
      const zoneTag = zoneNames[species.zone] || species.zone.toUpperCase();

      const card = document.createElement('div');
      card.className = `encyclo-card ${isDiscovered ? 'unlocked' : 'locked'} ${hasShiny ? 'has-shiny' : ''} rarity-${species.rarity}`;
      card.title = isDiscovered ? `${species.name} (클릭하여 상세 정보 보기)` : `미발견 어종 (클릭하여 서식 정보 보기)`;

      if (isDiscovered) {
        card.innerHTML = `
          <div class="encyclo-badge-row">
            <span class="encyclo-badge zone-${species.zone}">${zoneTag}</span>
            <div class="encyclo-icon-badges">
              ${species.isBoss ? '<span class="boss-crown-badge" title="보스 물고기">👑</span>' : ''}
              ${hasShiny ? '<span class="shiny-star-badge" title="특별한 빛을 품은 물고기 해금!">✨</span>' : ''}
            </div>
          </div>
          <div class="encyclo-preview-wrapper ${hasShiny ? 'shiny-preview' : ''}">
            <canvas class="encyclo-fish-canvas" width="130" height="74"></canvas>
          </div>
          <div class="encyclo-title">${species.name}</div>
          <div class="encyclo-sub-tag">${species.engName}</div>
        `;
      } else {
        card.innerHTML = `
          <div class="encyclo-badge-row">
            <span class="encyclo-badge zone-${species.zone} locked-badge">${zoneTag}</span>
            <span class="locked-lock-icon">🔒</span>
          </div>
          <div class="encyclo-preview-wrapper locked-preview">
            <canvas class="encyclo-fish-canvas" width="130" height="74"></canvas>
          </div>
          <div class="encyclo-title mystery-title">???</div>
          <div class="encyclo-sub-tag locked-sub">미발견</div>
        `;
      }

      // Draw dynamic fish preview
      const canvas = card.querySelector('.encyclo-fish-canvas');
      if (canvas) {
        Fish.drawPreview(canvas, species, isDiscovered, hasShiny);
      }

      // Click card to open full detailed modal
      card.addEventListener('click', () => {
        this.sound.playClick();
        this.openFishDetailModal(species);
      });

      container.appendChild(card);
    });
  }

  openFishDetailModal(species) {
    if (!this.fishDetailModal) return;
    const content = document.getElementById('fish-detail-content');
    const headerTitle = document.getElementById('fish-detail-header-title');
    if (!content) return;

    const record = this.encyclopedia.getRecord(species.id);
    const isDiscovered = record.caughtCount > 0;
    const hasShiny = (record.shinyCount || 0) > 0;

    const zoneNames = {
      shallow: '🌊 표층 바다 (0m ~ 30m)',
      mid: '🐟 중층 바다 (30m ~ 100m)',
      deep: '⚓ 심해층 (100m ~ 250m)',
      abyss: '🌌 심연의 바다 (250m ~ 400m)',
      hadal: '👑 초심연 해구 (400m ~ 500m+)'
    };

    const rarityNames = {
      common: '일반 (Common)',
      uncommon: '고급 (Uncommon)',
      rare: '희귀 (Rare)',
      epic: '영웅 (Epic)',
      legendary: '전설 (Legendary)',
      mythic: '신화 (Mythic)'
    };

    const baitMap = {
      bread: '🍞 식빵',
      worm: '🪱 갯지렁이',
      shrimp: '🦐 싱싱한 크릴새우',
      squid_bait: '🦑 쫄깃 오징어',
      golden: '✨ 황금 지렁이',
      allure: '💖 현혹 페로몬',
      bomb: '💣 어군 폭탄'
    };

    const favBaitsStr = (species.favBait && species.favBait.length > 0)
      ? species.favBait.map(b => baitMap[b] || b).join(', ')
      : '모든 미끼';

    if (headerTitle) {
      headerTitle.innerHTML = isDiscovered
        ? `${species.isBoss ? '👑 [보스] ' : ''}📖 ${species.name} <span class="header-eng-sub">${species.engName}</span>`
        : '📖 미발견 물고기 정보';
    }

    if (isDiscovered) {
      content.innerHTML = `
        <div class="fish-detail-hero-box ${hasShiny ? 'shiny-hero' : ''}">
          <div class="fish-detail-canvas-wrap">
            <canvas id="fish-detail-large-canvas" width="220" height="120"></canvas>
            ${hasShiny ? '<div class="detail-shiny-tag">✨ 특별한 빛을 품은 물고기 발견!</div>' : ''}
          </div>
          <div class="fish-detail-header-info">
            <div class="detail-badge-pill-row">
              <span class="detail-rarity-pill rarity-${species.rarity}">${rarityNames[species.rarity] || species.rarity.toUpperCase()}</span>
              <span class="detail-zone-pill">${zoneNames[species.zone] || species.zone}</span>
              ${species.isBoss ? '<span class="detail-boss-pill">👑 바다의 제왕 (보스)</span>' : ''}
            </div>
            <div class="detail-name-large">${species.name}</div>
            <div class="detail-eng-large">${species.engName}</div>
          </div>
        </div>

        <div class="fish-detail-grid-section">
          <!-- 1. 생태 & 가치 스펙 -->
          <div class="detail-spec-card">
            <div class="spec-card-title">🌊 생태 & 서식 정보</div>
            <div class="spec-card-rows">
              <div class="spec-row">
                <span class="spec-label">서식 수심</span>
                <span class="spec-val highlight-cyan">${species.minDepth}m ~ ${species.maxDepth}m</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">자연 크기</span>
                <span class="spec-val">${species.sizeRange[0]}cm ~ ${species.sizeRange[1]}cm</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">추천 미끼</span>
                <span class="spec-val highlight-bait">${favBaitsStr}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">기본 가치</span>
                <span class="spec-val highlight-gold">💰 ${species.basePrice} G / ⭐ ${species.baseExp} EXP</span>
              </div>
            </div>
          </div>

          <!-- 2. 나의 어획 기록 -->
          <div class="detail-spec-card record-card">
            <div class="spec-card-title">🏆 나의 어획 기록</div>
            <div class="spec-card-rows">
              <div class="spec-row">
                <span class="spec-label">최대 크기 기록</span>
                <span class="spec-val highlight-gold">${record.maxSize > 0 ? record.maxSize + ' cm' : '기록 없음'}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">총 포획 횟수</span>
                <span class="spec-val">${record.caughtCount} 회</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">이로치 발견 횟수</span>
                <span class="spec-val ${hasShiny ? 'highlight-amber' : ''}">${record.shinyCount || 0} 회</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 상세 설명 / 생태 도감 스토리 -->
        <div class="fish-detail-desc-box">
          <div class="desc-box-title">📜 생태 도감 설명</div>
          <div class="desc-box-content">${species.description}</div>
        </div>
      `;

      // Render big fish preview
      setTimeout(() => {
        const largeCanvas = document.getElementById('fish-detail-large-canvas');
        if (largeCanvas) {
          Fish.drawPreview(largeCanvas, species, true, hasShiny);
        }
      }, 30);
    } else {
      // Locked Mystery Fish View
      content.innerHTML = `
        <div class="fish-detail-hero-box locked-hero">
          <div class="fish-detail-canvas-wrap locked-canvas-wrap">
            <canvas id="fish-detail-large-canvas" width="220" height="120"></canvas>
            <div class="detail-locked-tag">🔒 미발견 신비의 어종</div>
          </div>
          <div class="fish-detail-header-info">
            <div class="detail-badge-pill-row">
              <span class="detail-zone-pill">${zoneNames[species.zone] || species.zone}</span>
            </div>
            <div class="detail-name-large mystery-text">???</div>
            <div class="detail-eng-large">Mystery Species</div>
          </div>
        </div>

        <div class="fish-detail-grid-section">
          <div class="detail-spec-card" style="width: 100%;">
            <div class="spec-card-title">🔍 어종 탐사 힌트</div>
            <div class="spec-card-rows">
              <div class="spec-row">
                <span class="spec-label">추정 서식 수심</span>
                <span class="spec-val highlight-cyan">${species.minDepth}m ~ ${species.maxDepth}m</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">도감 상태</span>
                <span class="spec-val text-muted">아직 낚아올리지 못한 미지의 물고기입니다.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="fish-detail-desc-box locked-hint-box">
          <div class="desc-box-title">💡 낚시 힌트</div>
          <div class="desc-box-content">
            ${zoneNames[species.zone] || species.zone} 수심대에서 적절한 미끼를 끼우고 찌를 깊숙이 내려 탐사해 보세요!
          </div>
        </div>
      `;

      setTimeout(() => {
        const largeCanvas = document.getElementById('fish-detail-large-canvas');
        if (largeCanvas) {
          Fish.drawPreview(largeCanvas, species, false, false);
        }
      }, 30);
    }

    this.fishDetailModal.classList.add('visible');
  }
}
