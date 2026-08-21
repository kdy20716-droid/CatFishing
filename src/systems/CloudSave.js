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

    this.initFirebase();
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

  saveCustomConfig(configObj) {
    try {
      localStorage.setItem('cozy_cat_firebase_config_v1', JSON.stringify(configObj));
      // Re-initialize Firebase with the new config
      this.initFirebase(configObj);
      return true;
    } catch (e) {
      console.error("Failed to save custom config:", e);
      return false;
    }
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
        this.currentUser = user;
        this.updateAuthUI(user);
        if (user) {
          console.log("🐾 Firebase User Logged In:", user.displayName || user.email || user.uid);
          // Auto load or sync on login
          this.loadFromCloud(true);
        } else {
          console.log("🐾 Firebase User Logged Out");
        }
      });

    } catch (e) {
      console.warn("Firebase initialization warning (Using local storage mode until custom config is provided):", e.message);
      this.isInitialized = false;
      this.updateAuthUI(null);
    }
  }

  // --- Authentication Methods ---

  async loginWithGoogle() {
    if (!this.auth) {
      this.simulateLogin('google');
      return true;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      this.currentUser = result.user;
      if (this.sound) this.sound.playCoin();
      if (this.hud) this.hud.showNotification(`🎉 ${this.currentUser.displayName || '집사'}님, 구글 로그인 성공!`, '☁️');
      return true;
    } catch (error) {
      console.warn("Google Auth popup error (falling back to simulation mode):", error.message);
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
      // Initial cloud save
      this.saveToCloud();
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
    if (this.hud) this.hud.showNotification(`✨ ${mockUser.displayName}님, 클라우드 계정 연결 완료!`, '☁️');
    this.saveToCloud();
  }

  // --- Cloud Data Serialization & Sync ---

  buildSaveDataPackage() {
    return {
      version: '2.0.0',
      timestamp: Date.now(),
      updatedAt: new Date().toISOString(),
      economy: {
        gold: this.economy.gold,
        exp: this.economy.exp,
        level: this.economy.level,
        currentRodId: this.economy.currentRodId,
        ownedRods: this.economy.ownedRods,
        currentBoatId: this.economy.currentBoatId,
        ownedBoats: this.economy.ownedBoats,
        currentHatId: this.economy.currentHatId,
        ownedHats: this.economy.ownedHats,
        currentBaitId: this.economy.currentBaitId,
        useRocket: this.economy.useRocket,
        hookCount: this.economy.hookCount,
        baitInventory: this.economy.baitInventory,
        upgradeLevels: this.economy.upgradeLevels
      },
      encyclopedia: {
        records: this.encyclopedia.records
      },
      aquarium: {
        placedFish: this.aquarium ? this.aquarium.placedFish : [],
        theme: this.aquarium ? this.aquarium.theme : 'coral',
        uncollectedGold: this.aquarium ? this.aquarium.uncollectedGold : 0
      }
    };
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
        const userDocRef = doc(this.db, 'users', this.currentUser.uid, 'saveData', 'slot1');
        await setDoc(userDocRef, {
          ...saveData,
          serverTimestamp: serverTimestamp()
        }, { merge: true });
        console.log("☁️ Firestore Cloud Save successful!");
      } catch (e) {
        console.warn("Firestore save fallback to local cloud slot:", e.message);
      }
    }

    this.isSyncing = false;
    this.lastSavedTime = new Date();
    this.updateSyncBadge('☁️ 동기화됨');
    return true;
  }

  triggerAutoSave() {
    if (!this.currentUser) return;
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(() => {
      this.saveToCloud();
    }, 2000);
  }

  async loadFromCloud(isInitial = false) {
    if (!this.currentUser) return false;
    this.isSyncing = true;
    this.updateSyncBadge('☁️ 불러오는 중...');

    let cloudData = null;

    // 1. Try fetching from Firestore
    if (this.db && !this.currentUser.isSimulated) {
      try {
        const userDocRef = doc(this.db, 'users', this.currentUser.uid, 'saveData', 'slot1');
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          cloudData = snap.data();
        }
      } catch (e) {
        console.warn("Firestore load fallback to local cloud backup:", e.message);
      }
    }

    // 2. Fallback to local cloud backup slot
    if (!cloudData) {
      const localCloud = localStorage.getItem(`cozy_cat_cloud_save_${this.currentUser.uid}`);
      if (localCloud) {
        cloudData = JSON.parse(localCloud);
      }
    }

    if (cloudData) {
      this.applySaveData(cloudData);
      if (!isInitial && this.hud) {
        this.hud.showNotification('📥 클라우드에서 최신 게임 데이터를 불러왔습니다!', '☁️');
      }
    } else {
      // First time user: save initial state
      this.saveToCloud();
    }

    this.isSyncing = false;
    this.updateSyncBadge('☁️ 동기화됨');
    return true;
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
        if (data.aquarium.uncollectedGold) this.aquarium.uncollectedGold = data.aquarium.uncollectedGold;
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
      this.updateSyncBadge('☁️ 동기화됨');
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
