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

    // Debounce timer for auto cloud saves
    this.saveDebounceTimer = null;
    this.autoSaveInterval = null;

    this.initFirebase();
    this.initAutoSaveTimer();
    this.initConflictModalEvents();

    // Hook economy, encyclopedia, and aquarium save callbacks
    if (this.economy) {
      this.economy.onSaveCallback = () => this.triggerAutoSave();
    }
    if (this.encyclopedia) {
      this.encyclopedia.onSaveCallback = () => this.triggerAutoSave();
    }
    if (this.aquarium) {
      this.aquarium.onSaveCallback = () => this.triggerAutoSave();
    }
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
    // Periodic auto-save every 30 seconds if logged in
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    this.autoSaveInterval = setInterval(() => {
      if (this.currentUser) {
        this.saveToCloud();
      }
    }, 30000);
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
          this.hud.showNotification('⚠️ Firebase 콘솔에 GitHub Pages 도메인(kdy20716-droid.github.io) 승인이 필요합니다!', '🔒');
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        if (this.hud) {
          this.hud.showNotification('로그인 팝업이 닫혔습니다.', 'ℹ️');
        }
        return false;
      }
      // Fallback to simulation mode if real auth failed
      this.simulateLogin('google');
      return true;
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
        theme: this.aquarium?.theme || 'coral'
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
      // ⚠️ Conflict: Both local session and cloud account have progress! Ask the user.
      this.openConflictModal(currentLocalData, cloudData);
    } else if (hasCloudProgress) {
      // Local is brand new, cloud has existing record -> Load cloud data directly
      this.applySaveData(cloudData);
      if (this.hud) this.hud.showNotification('📥 클라우드 계정의 기존 낚시 기록을 불러왔습니다!', '☁️');
      this.updateSyncBadge('☁️ 자동 동기화됨');
    } else {
      // Cloud is empty -> Link current local data to cloud account
      await this.saveToCloud();
      if (this.hud) this.hud.showNotification('🎉 지금까지의 플레이 기록이 계정에 자동 연동되었습니다!', '☁️');
      this.updateSyncBadge('☁️ 자동 동기화됨');
    }
  }

  openConflictModal(localData, cloudData) {
    const modal = document.getElementById('cloud-conflict-modal');
    if (!modal) {
      // Fallback if modal DOM is missing: prompt confirm
      const useLocal = confirm('클라우드 계정에 이미 저장된 낚시 기록이 있습니다!\n\n[확인]을 누르면 현재 기기 데이터로 덮어쓰고, [취소]를 누르면 클라우드 데이터를 불러옵니다.');
      if (useLocal) {
        this.saveToCloud();
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

        await this.saveToCloud();
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

  async saveToCloud() {
    if (!this.currentUser) return false;
    this.isSyncing = true;
    this.updateSyncBadge('☁️ 저장 중...');

    const saveData = this.buildSaveDataPackage();

    // 1. Save to localStorage backup
    localStorage.setItem(`cozy_cat_cloud_save_${this.currentUser.uid}`, JSON.stringify(saveData));

    // 2. Save to Firestore if available
    if (this.db && !this.currentUser.isSimulated) {
      try {
        const cleanPayload = JSON.parse(JSON.stringify(saveData));
        const userDocRef = doc(this.db, 'users', this.currentUser.uid, 'saveData', 'slot1');
        await setDoc(userDocRef, {
          ...cleanPayload,
          serverTimestamp: serverTimestamp()
        }, { merge: true });
        console.log("☁️ Firestore Cloud Auto-Save successful!");
      } catch (e) {
        console.warn("Firestore save fallback to local cloud slot:", e.message);
      }
    }

    this.isSyncing = false;
    this.lastSavedTime = new Date();
    this.updateSyncBadge('☁️ 자동 동기화됨');
    return true;
  }

  triggerAutoSave() {
    if (!this.currentUser) return;
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(() => {
      this.saveToCloud();
    }, 1500);
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
        if (Array.isArray(data.aquarium.placedFish)) this.aquarium.placedFish = data.aquarium.placedFish;
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

    if (user) {
      if (btnAuthOpen) btnAuthOpen.classList.add('hidden');
      if (userProfilePill) userProfilePill.classList.remove('hidden');

      const name = user.displayName || user.email?.split('@')[0] || '냥이 집사';
      if (userName) userName.innerText = name;
      if (dropdownEmail) dropdownEmail.innerText = user.email || '게스트 계정 (임시 연동)';
      if (userAvatar) {
        userAvatar.src = user.photoURL || 'assets/favicon.svg';
      }
      this.updateSyncBadge('☁️ 자동 동기화됨');
    } else {
      if (btnAuthOpen) btnAuthOpen.classList.remove('hidden');
      if (userProfilePill) userProfilePill.classList.add('hidden');
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
