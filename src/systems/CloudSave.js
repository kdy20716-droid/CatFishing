/**
 * Firebase Cloud Save & Authentication Manager
 * Multi-device sync, Google Auth, Email Login, Guest Save, and Firestore Cloud Storage
 */

// Import Firebase v10 Modular SDK via ESM CDN
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';

// Production Firebase Configuration
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAnD_1XvSHkOfDU_u5XKBL8g4Y9GFtTOFk",
  authDomain: "catfishing-6bc10.firebaseapp.com",
  databaseURL: "https://catfishing-6bc10-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catfishing-6bc10",
  storageBucket: "catfishing-6bc10.firebasestorage.app",
  messagingSenderId: "727318371793",
  appId: "1:727318371793:web:cbc4059c9fbbe3572254f0",
  measurementId: "G-64NEDC3EY0"
};

export class CloudSave {
  constructor(economy, encyclopedia, aquarium, hud, sound) {
    this.economy = economy;
    this.encyclopedia = encyclopedia;
    this.aquarium = aquarium;
    this.hud = hud;
    this.sound = sound;

    this.app = null;
    this.auth = null;
    this.db = null;
    this.analytics = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.isSyncing = false;
    this.lastSavedTime = null;
    this.lastFirestoreSaveTime = null;
    this.isQuotaExhausted = false;
    this.quotaNotified = false;

    // Periodic 10-minute auto-save timer
    this.autoSaveInterval = null;

    this.initFirebase();
    this.initAutoSaveTimer();
    this.initConflictModalEvents();
  }

  getSavedConfig() {
    try {
      const saved = localStorage.getItem('cozy_cat_firebase_config_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to parse custom firebase config:", e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  initFirebase(customConfig = null) {
    const config = customConfig || this.getSavedConfig();
    try {
      if (getApps().length > 0) {
        this.app = getApp();
      } else {
        this.app = initializeApp(config);
      }

      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.isInitialized = true;

      // Safe Analytics init
      isSupported().then(supported => {
        if (supported) {
          this.analytics = getAnalytics(this.app);
        }
      }).catch(() => {});

      // Listen for Auth state changes
      onAuthStateChanged(this.auth, (user) => {
        const prevUser = this.currentUser;
        this.currentUser = user;
        this.updateAuthUI(user);

        if (user) {
          console.log("🐾 Firebase User Logged In:", user.displayName || user.email || user.uid);
          // When logging in from guest or new session, perform smart sync / conflict check
          if (!prevUser || prevUser.uid !== user.uid) {
            this.syncOnLogin(user);
          }
        } else {
          console.log("🐾 Firebase User Logged Out");
        }
      });

    } catch (e) {
      console.warn("Firebase initialization warning (Using local storage mode):", e.message);
      this.isInitialized = false;
      this.updateAuthUI(null);
    }
  }

  initAutoSaveTimer() {
    // ☁️ Periodic auto-save every 10 minutes (600,000 ms) if logged in
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    this.autoSaveInterval = setInterval(() => {
      if (this.currentUser) {
        this.saveToCloud();
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  // --- Authentication Methods ---

  async loginWithGoogle() {
    if (!this.auth) {
      this.simulateLogin('google');
      return true;
    }
    try {
      const provider = new GoogleAuthProvider();
      // Add prompt to select account
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(this.auth, provider);
      this.currentUser = result.user;
      if (this.sound) this.sound.playCoin();
      if (this.hud) this.hud.showNotification(`🎉 ${this.currentUser.displayName || '집사'}님, 구글 로그인 완료!`, '☁️');
      return true;
    } catch (error) {
      console.error("Google Auth popup error:", error.code, error.message);
      if (error.code === 'auth/unauthorized-domain') {
        if (this.hud) {
          this.hud.showNotification('⚠️ Firebase 콘솔에 현재 접속 도메인 승인이 필요합니다!', '🔒');
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        if (this.hud) {
          this.hud.showNotification('로그인 팝업이 닫혔습니다.', 'ℹ️');
        }
      } else {
        if (this.hud) {
          this.hud.showNotification(`⚠️ 구글 로그인 실패: ${error.code || error.message}`, '❌');
        }
      }
      return false;
    }
  }

  async loginWithEmail(email, password) {
    if (!this.auth) {
      this.simulateLogin('email', email);
      return true;
    }
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      this.currentUser = result.user;
      if (this.sound) this.sound.playCoin();
      if (this.hud) this.hud.showNotification(`🎉 ${this.currentUser.displayName || email}님 로그인 완료!`, '☁️');
      return true;
    } catch (error) {
      console.warn("Email Auth error (falling back to simulation mode):", error.message);
      this.simulateLogin('email', email);
      return true;
    }
  }

  async signUpWithEmail(email, password, displayName = '고양이 집사') {
    if (!this.auth) {
      this.simulateLogin('email', email, displayName);
      return true;
    }
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(result.user, { displayName });
      this.currentUser = result.user;
      if (this.sound) this.sound.playCoin();
      if (this.hud) this.hud.showNotification(`🎉 환영합니다, ${displayName}님! 계정이 생성되었습니다.`, '✨');
      return true;
    } catch (error) {
      console.warn("Sign up error (falling back to simulation mode):", error.message);
      this.simulateLogin('email', email, displayName);
      return true;
    }
  }

  async loginAsGuest() {
    if (!this.auth) {
      this.simulateLogin('guest');
      return true;
    }
    try {
      const result = await signInAnonymously(this.auth);
      this.currentUser = result.user;
      if (this.sound) this.sound.playClick();
      if (this.hud) this.hud.showNotification('🐾 게스트 계정으로 임시 클라우드 연결되었습니다!', '☁️');
      return true;
    } catch (error) {
      this.simulateLogin('guest');
      return true;
    }
  }

  async updateNickname(newName) {
    if (!newName || !newName.trim()) return false;
    const cleanName = newName.trim().substring(0, 10);

    if (this.currentUser) {
      this.currentUser.displayName = cleanName;

      // If Firebase Auth user, update Firebase Auth profile
      if (this.auth && this.auth.currentUser && !this.currentUser.isSimulated) {
        try {
          await updateProfile(this.auth.currentUser, { displayName: cleanName });
          console.log("☁️ Firebase user profile displayName updated:", cleanName);
        } catch (e) {
          console.warn("Failed to update Firebase auth profile:", e);
        }
      } else if (this.currentUser.isSimulated) {
        localStorage.setItem('cozy_cat_simulated_user', JSON.stringify(this.currentUser));
      }

      this.updateAuthUI(this.currentUser);
      await this.saveToCloud();
    }

    // Save custom nickname to local storage as fallback
    localStorage.setItem('cozy_cat_player_nickname', cleanName);

    return cleanName;
  }

  async logout() {
    if (this.auth && this.currentUser) {
      try {
        await signOut(this.auth);
      } catch (e) {
        console.warn("Logout error:", e);
      }
    }
    this.currentUser = null;
    localStorage.removeItem('cozy_cat_simulated_user');
    this.updateAuthUI(null);
    if (this.hud) this.hud.showNotification('🚪 로그아웃되었습니다. 로컬 저장 모드로 전환됩니다.', '💡');
  }

  // --- Offline / Demo Simulation Fallback Mode ---
  simulateLogin(type, email = 'cat_fisher@cozy.com', name = '포근한 고양이 집사') {
    let mockUser = {
      uid: 'demo_user_' + Date.now(),
      email: email,
      displayName: type === 'google' ? '구글 냥이 집사' : (type === 'guest' ? '익명 게스트 냥이' : name),
      photoURL: 'assets/favicon.svg',
      isSimulated: true
    };
    this.currentUser = mockUser;
    localStorage.setItem('cozy_cat_simulated_user', JSON.stringify(mockUser));
    this.updateAuthUI(mockUser);
    if (this.sound) this.sound.playCoin();
    this.syncOnLogin(mockUser);
  }

  // --- Cloud Data Serialization & Sync ---

  buildSaveDataPackage() {
    return {
      version: '2.0.0',
      timestamp: Date.now(),
      updatedAt: new Date().toISOString(),
      economy: {
        gold: Number(this.economy?.gold ?? 50),
        exp: Number(this.economy?.exp ?? 0),
        level: Number(this.economy?.level ?? 1),
        currentRodId: this.economy?.currentRodId || 'rod_twig',
        ownedRods: Array.isArray(this.economy?.ownedRods) ? this.economy.ownedRods : ['rod_twig'],
        currentBoatId: this.economy?.currentBoatId || 'boat_raft',
        ownedBoats: Array.isArray(this.economy?.ownedBoats) ? this.economy.ownedBoats : ['boat_raft'],
        currentHatId: this.economy?.currentHatId || 'hat_none',
        ownedHats: Array.isArray(this.economy?.ownedHats) ? this.economy.ownedHats : ['hat_none'],
        catSkinId: this.economy?.catSkinId || 'skin_orange',
        ownedSkins: Array.isArray(this.economy?.ownedSkins) ? this.economy.ownedSkins : ['skin_orange'],
        currentBaitId: this.economy?.currentBaitId || 'bread',
        useRocket: Boolean(this.economy?.useRocket),
        hookCount: Number(this.economy?.hookCount || 1),
        baitInventory: this.economy?.baitInventory ? { ...this.economy.baitInventory } : {},
        upgradeLevels: this.economy?.upgradeLevels ? { ...this.economy.upgradeLevels } : {},
        caughtFishBasket: Array.isArray(this.economy?.caughtFishBasket) ? this.economy.caughtFishBasket : []
      },
      encyclopedia: {
        records: this.encyclopedia?.records ? { ...this.encyclopedia.records } : {}
      },
      aquarium: {
        placedFish: Array.isArray(this.aquarium?.placedFish) ? this.aquarium.placedFish : [],
        theme: this.aquarium?.theme || 'coral',
        ownedThemes: Array.isArray(this.aquarium?.ownedThemes) ? this.aquarium.ownedThemes : ['coral'],
        vaultGold: typeof this.aquarium?.vaultGold === 'number' ? Math.round(this.aquarium.vaultGold) : 0,
        facilityLevels: this.aquarium?.facilityLevels ? { ...this.aquarium.facilityLevels } : {},
        foodTier: typeof this.aquarium?.foodTier === 'number' ? this.aquarium.foodTier : 1,
        foodLevels: this.aquarium?.foodLevels ? { ...this.aquarium.foodLevels } : {},
        ownedFoodTiers: Array.isArray(this.aquarium?.ownedFoodTiers) ? this.aquarium.ownedFoodTiers : [1],
        lastOfflineTime: typeof this.aquarium?.lastOfflineTime === 'number' ? this.aquarium.lastOfflineTime : Date.now()
      }
    };
  }

  async fetchCloudData(user) {
    if (!user) return null;
    let cloudData = null;

    // 1. Fetch from Firestore if available
    if (this.db && !user.isSimulated) {
      try {
        const userDocRef = doc(this.db, 'users', user.uid, 'saveData', 'slot1');
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          cloudData = snap.data();
        }
      } catch (e) {
        console.warn("Firestore fetch fallback to local storage:", e.message);
      }
    }

    // 2. Fetch from Local Backup slot
    if (!cloudData) {
      const localCloud = localStorage.getItem(`cozy_cat_cloud_save_${user.uid}`);
      if (localCloud) {
        try {
          cloudData = JSON.parse(localCloud);
        } catch (e) {}
      }
    }

    return cloudData;
  }

  /**
   * Smart Sync on Login with Conflict Resolution Prompt
   */
  async syncOnLogin(user) {
    this.updateSyncBadge('☁️ 동기화 확인 중...');

    const currentLocalData = this.buildSaveDataPackage();
    const cloudData = await this.fetchCloudData(user);

    // Evaluate local progress
    const localCaughtCount = Object.values(currentLocalData.encyclopedia.records || {}).filter(r => r.caughtCount > 0).length;
    const hasLocalProgress = (
      currentLocalData.economy.level > 1 || 
      currentLocalData.economy.gold > 50 || 
      localCaughtCount > 0 || 
      currentLocalData.economy.ownedRods.length > 1
    );

    // Evaluate cloud progress
    const cloudCaughtCount = cloudData ? Object.values(cloudData.encyclopedia?.records || {}).filter(r => r.caughtCount > 0).length : 0;
    const hasCloudProgress = cloudData && (
      (cloudData.economy?.level && cloudData.economy.level > 1) || 
      (cloudData.economy?.gold && cloudData.economy.gold > 50) || 
      cloudCaughtCount > 0 || 
      (cloudData.economy?.ownedRods && cloudData.economy.ownedRods.length > 1)
    );

    console.log(`🐾 Sync On Login - hasLocalProgress: ${hasLocalProgress}, hasCloudProgress: ${hasCloudProgress}`);

    if (hasLocalProgress && hasCloudProgress) {
      const cloudTime = cloudData?.timestamp || 0;
      const localTime = currentLocalData?.timestamp || 0;
      // If cloud is equal or newer, load cloud directly without writing
      if (cloudTime >= localTime) {
        this.applySaveData(cloudData);
        this.updateSyncBadge('☁️ 자동 동기화됨');
      } else {
        // Only ask if local has significantly distinct un-synced data
        this.openConflictModal(currentLocalData, cloudData);
      }
    } else if (hasCloudProgress) {
      // Local is brand new, cloud has existing record -> Load cloud data directly (READ only)
      this.applySaveData(cloudData);
      if (this.hud) this.hud.showNotification('📥 클라우드 계정의 기존 낚시 기록을 불러왔습니다!', '☁️');
      this.updateSyncBadge('☁️ 자동 동기화됨');
    } else if (hasLocalProgress && !cloudData) {
      // Brand new account with initial local progress -> save once
      await this.saveToCloud(true);
      if (this.hud) this.hud.showNotification('🎉 지금까지의 플레이 기록이 계정에 자동 연동되었습니다!', '☁️');
      this.updateSyncBadge('☁️ 자동 동기화됨');
    } else {
      this.updateSyncBadge('☁️ 자동 동기화됨');
    }
  }

  openConflictModal(localData, cloudData) {
    const modal = document.getElementById('cloud-conflict-modal');
    if (!modal) {
      // Fallback if modal DOM is missing: prompt confirm
      const useLocal = confirm('클라우드 계정에 이미 저장된 낚시 기록이 있습니다!\n\n[확인]을 누르면 현재 기기 데이터로 덮어쓰고, [취소]를 누르면 클라우드 데이터를 불러옵니다.');
      if (useLocal) {
        this.saveToCloud(true);
      } else {
        this.applySaveData(cloudData);
      }
      return;
    }

    // Populate local stats
    const localCaught = Object.values(localData.encyclopedia?.records || {}).filter(r => r.caughtCount > 0).length;
    const elLocalLevel = document.getElementById('conflict-local-level');
    const elLocalGold = document.getElementById('conflict-local-gold');
    const elLocalFish = document.getElementById('conflict-local-fish');
    if (elLocalLevel) elLocalLevel.textContent = `Lv. ${localData.economy.level}`;
    if (elLocalGold) elLocalGold.textContent = `${localData.economy.gold} G`;
    if (elLocalFish) elLocalFish.textContent = `${localCaught} 종`;

    // Populate cloud stats
    const cloudCaught = Object.values(cloudData.encyclopedia?.records || {}).filter(r => r.caughtCount > 0).length;
    const elCloudLevel = document.getElementById('conflict-cloud-level');
    const elCloudGold = document.getElementById('conflict-cloud-gold');
    const elCloudFish = document.getElementById('conflict-cloud-fish');
    if (elCloudLevel) elCloudLevel.textContent = `Lv. ${cloudData.economy?.level || 1}`;
    if (elCloudGold) elCloudGold.textContent = `${cloudData.economy?.gold || 0} G`;
    if (elCloudFish) elCloudFish.textContent = `${cloudCaught} 종`;

    // Store pending conflict data
    this.pendingConflict = { localData, cloudData };

    modal.classList.add('visible');
  }

  initConflictModalEvents() {
    const btnOverwrite = document.getElementById('btn-conflict-overwrite');
    if (btnOverwrite) {
      btnOverwrite.addEventListener('click', async () => {
        if (this.sound) this.sound.playClick();
        const modal = document.getElementById('cloud-conflict-modal');
        if (modal) modal.classList.remove('visible');

        await this.saveToCloud(true);
        if (this.hud) this.hud.showNotification('☁️ 현재 기기 기록으로 클라우드에 덮어쓰기 완료!', '✅');
        this.pendingConflict = null;
      });
    }

    const btnLoad = document.getElementById('btn-conflict-load');
    if (btnLoad) {
      btnLoad.addEventListener('click', () => {
        if (this.sound) this.sound.playClick();
        const modal = document.getElementById('cloud-conflict-modal');
        if (modal) modal.classList.remove('visible');

        if (this.pendingConflict && this.pendingConflict.cloudData) {
          this.applySaveData(this.pendingConflict.cloudData);
          if (this.hud) this.hud.showNotification('📥 클라우드 계정 기록을 성공적으로 불러왔습니다!', '☁️');
        }
        this.pendingConflict = null;
      });
    }
  }

  async saveToCloud(isManual = false) {
    if (!this.currentUser) return false;

    // 1. Save to local storage backup immediately (Free, instant, 0ms latency)
    const saveData = this.buildSaveDataPackage();
    localStorage.setItem(`cozy_cat_cloud_save_${this.currentUser.uid}`, JSON.stringify(saveData));

    // 2. Strict 10-Minute Firestore Quota Throttling (Unless user explicitly pressed manual backup button)
    const now = Date.now();
    if (!isManual && this.lastFirestoreSaveTime && (now - this.lastFirestoreSaveTime < 10 * 60 * 1000)) {
      this.lastSavedTime = new Date();
      this.updateSyncBadge('☁️ 자동 동기화됨');
      return true;
    }

    this.isSyncing = true;
    this.updateSyncBadge('☁️ 저장 중...');

    // 3. Save to Firestore if online
    if (this.db && !this.currentUser.isSimulated && !this.isQuotaExhausted) {
      try {
        const cleanPayload = JSON.parse(JSON.stringify(saveData));
        const userDocRef = doc(this.db, 'users', this.currentUser.uid, 'saveData', 'slot1');
        await setDoc(userDocRef, {
          ...cleanPayload,
          serverTimestamp: serverTimestamp()
        }, { merge: true });
        this.lastFirestoreSaveTime = Date.now();
        console.log("☁️ Firestore Cloud Save written successfully (10-minute cycle)!");
      } catch (e) {
        if (e.code === 'resource-exhausted' || (e.message && e.message.includes('Quota exceeded'))) {
          this.isQuotaExhausted = true;
          console.warn("⚠️ Firebase Daily Quota Exceeded. Safely operating in Local-Storage mode.");
          if (!this.quotaNotified && this.hud) {
            this.quotaNotified = true;
            this.hud.showNotification('☁️ 일일 Firebase 무료 할당량이 소진되어 로컬 백업 모드로 안전하게 저장 중입니다.', '💾');
          }
        } else {
          console.warn("Firestore save fallback to local cloud slot:", e.message);
        }
      }
    }

    this.isSyncing = false;
    this.lastSavedTime = new Date();
    this.updateSyncBadge('☁️ 자동 동기화됨');
    return true;
  }

  async manualSaveToCloud() {
    if (!this.currentUser) {
      if (this.hud) this.hud.showNotification('로그인이 필요합니다! 먼저 구글 계정을 연동해주세요.', '🔒');
      return false;
    }
    const success = await this.saveToCloud(true);
    if (success) {
      if (this.sound) this.sound.playCoin();
      if (this.hud) this.hud.showNotification('☁️ 현재 기기의 진행 상황이 클라우드 서버에 안전하게 백업되었습니다!', '✨');
    } else {
      if (this.hud) this.hud.showNotification('⚠️ 클라우드 백업 중 오류가 발생했습니다.', '❌');
    }
    return success;
  }

  async manualLoadFromCloud() {
    if (!this.currentUser) {
      if (this.hud) this.hud.showNotification('로그인이 필요합니다! 먼저 구글 계정을 연동해주세요.', '🔒');
      return false;
    }
    this.updateSyncBadge('☁️ 클라우드 조회 중...');
    const cloudData = await this.fetchCloudData(this.currentUser);
    if (cloudData) {
      this.applySaveData(cloudData);
      if (this.sound) this.sound.playCoin();
      if (this.hud) this.hud.showNotification('📥 클라우드 서버의 낚시 기록을 성공적으로 불러왔습니다!', '☁️');
      this.updateSyncBadge('☁️ 자동 동기화됨');
      return true;
    } else {
      if (this.hud) this.hud.showNotification('⚠️ 클라우드 계정에 저장된 기록이 없습니다.', 'ℹ️');
      this.updateSyncBadge('☁️ 동기화 데이터 없음');
      return false;
    }
  }

  triggerAutoSave() {
    // Throttled auto-save wrapper: calls saveToCloud() (which enforces 10-minute rate limit)
    this.saveToCloud(false);
  }

  applySaveData(data) {
    try {
      if (data.economy) {
        Object.assign(this.economy, data.economy);
        this.economy.saveToStorage();
      }
      if (data.encyclopedia && data.encyclopedia.records) {
        this.encyclopedia.records = data.encyclopedia.records;
        this.encyclopedia.saveToStorage();
      }
      if (data.aquarium && this.aquarium) {
        if (data.aquarium.theme) this.aquarium.theme = data.aquarium.theme;
        if (Array.isArray(data.aquarium.ownedThemes)) {
          this.aquarium.ownedThemes = Array.from(new Set([...this.aquarium.ownedThemes, ...data.aquarium.ownedThemes]));
        }
        if (Array.isArray(data.aquarium.placedFish) && data.aquarium.placedFish.length >= this.aquarium.placedFish.length) {
          this.aquarium.placedFish = data.aquarium.placedFish;
        }
        if (typeof data.aquarium.vaultGold === 'number') {
          this.aquarium.vaultGold = Math.max(this.aquarium.vaultGold, data.aquarium.vaultGold);
        }
        if (data.aquarium.facilityLevels && typeof data.aquarium.facilityLevels === 'object') {
          for (const [k, v] of Object.entries(data.aquarium.facilityLevels)) {
            this.aquarium.facilityLevels[k] = Math.max(this.aquarium.facilityLevels[k] || 1, v);
          }
        }
        if (typeof data.aquarium.foodTier === 'number') {
          this.aquarium.foodTier = Math.max(this.aquarium.foodTier, data.aquarium.foodTier);
        }
        if (data.aquarium.foodLevels && typeof data.aquarium.foodLevels === 'object') {
          for (const [k, v] of Object.entries(data.aquarium.foodLevels)) {
            this.aquarium.foodLevels[k] = Math.max(this.aquarium.foodLevels[k] || 1, v);
          }
        }
        if (Array.isArray(data.aquarium.ownedFoodTiers)) {
          this.aquarium.ownedFoodTiers = Array.from(new Set([...this.aquarium.ownedFoodTiers, ...data.aquarium.ownedFoodTiers]));
        }
        if (typeof data.aquarium.lastOfflineTime === 'number') {
          this.aquarium.lastOfflineTime = data.aquarium.lastOfflineTime;
        }
        this.aquarium.saveToStorage();
      }

      if (this.hud) {
        this.hud.initBaitBar();
      }
      console.log("🐾 Cloud Save Data applied successfully!");
    } catch (e) {
      console.error("Failed to apply cloud save data:", e);
    }
  }

  // --- Top-Right Header Auth UI Updates ---

  updateAuthUI(user) {
    const btnAuthOpen = document.getElementById('btn-auth-open');
    const userProfilePill = document.getElementById('user-profile-pill');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    const dropdownSync = document.getElementById('dropdown-sync-status');
    const btnGoogleLink = document.getElementById('btn-dropdown-google-link');

    // Always keep user profile pill visible for quick management & Google linking!
    if (userProfilePill) userProfilePill.classList.remove('hidden');
    if (btnAuthOpen) btnAuthOpen.classList.add('hidden');

    if (user && !user.isAnonymous && !user.isSimulated) {
      // 🌟 Real Logged-in Cloud Account
      const name = user.displayName || user.email?.split('@')[0] || '냥이 집사';
      if (userName) userName.innerText = name;
      if (dropdownEmail) dropdownEmail.innerText = user.email || '구글 계정 연동됨';
      if (dropdownSync) dropdownSync.innerText = '☁️ 구글 클라우드 자동 동기화 켜짐';
      if (btnGoogleLink) btnGoogleLink.classList.add('hidden'); // Already linked!
      if (userAvatar) {
        userAvatar.src = user.photoURL || 'assets/favicon.svg';
      }
      this.updateSyncBadge('☁️ 구글 동기화됨');
    } else {
      // 🐾 Non-member / Guest Mode (Show prominent Google Link button)
      const guestName = (user && user.displayName) ? user.displayName : (localStorage.getItem('cozy_cat_player_name_v1') || '냥이 집사 (비회원)');
      if (userName) userName.innerText = guestName;
      if (dropdownEmail) dropdownEmail.innerText = '비회원 (게스트 모드)';
      if (dropdownSync) dropdownSync.innerText = '💾 로컬 브라우저에 임시 저장 중';
      if (btnGoogleLink) btnGoogleLink.classList.remove('hidden'); // Show Google Link button!
      if (userAvatar) {
        userAvatar.src = 'assets/favicon.svg';
      }
      this.updateSyncBadge('💾 로컬 저장됨');
    }
  }

  updateSyncBadge(text) {
    const badge = document.getElementById('cloud-sync-status');
    if (badge) {
      badge.innerText = text;
      if (text.includes('중')) {
        badge.classList.add('syncing');
      } else {
        badge.classList.remove('syncing');
      }
    }
  }
}
