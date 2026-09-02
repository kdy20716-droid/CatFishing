/**
 * Firebase Firestore-based Realtime Multiplayer Room, In-Game Chat, and Remote Player Synchronization
 */
import { 
  signInAnonymously 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  addDoc,
  onSnapshot, 
  query,
  orderBy,
  limit,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { Cat } from '../entities/Cat.js?v=5.0.0';
import { CAT_SKINS, HATS, BOATS, RODS } from './Economy.js?v=5.0.0';

export class Multiplayer {
  constructor(economy, sound, hud, cloudSave) {
    this.economy = economy;
    this.sound = sound;
    this.hud = hud;
    this.cloudSave = cloudSave;

    this.roomId = null;
    this.playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    this.playerName = '냥이_' + Math.floor(Math.random() * 900 + 100);
    this.isHost = false;
    this.isConnected = false;

    this.otherPlayers = new Map(); // id -> { data, remoteCat, lastSeen, chatBubble }
    this.unsubscribeRoom = null;
    this.unsubscribePlayers = null;
    this.unsubscribeMessages = null;

    // Local Cross-Tab Channel Backup
    this.broadcastChannel = null;
    try {
      this.broadcastChannel = new BroadcastChannel('cozy_cat_multiplayer_sync');
      this.broadcastChannel.onmessage = (e) => this.handleBroadcastMessage(e.data);
    } catch (e) {}

    // Ocean World & Fish Synchronization Callbacks
    this.onSyncOceanWorld = null;    // (fishList, envData) => void
    this.onRemoteFishCaught = null;   // (event) => void
    this.onRemoteFishSpawned = null;  // (fishData) => void
    this.getOceanWorldState = null;   // (envOnly) => { fishList, timeOfDay, timeProgress, season, seasonProgress }

    this.unsubscribeEvents = null;
    this.unsubscribeWorld = null;

    // Periodic host synchronization timers
    this.hostWorldSyncTimer = 0;
    this.hostFirestoreSyncTimer = 0;

    // Chat
    this.messages = [];
    this.myChatBubble = { text: '', timer: 0 };

    // Sync throttle & Quota saving
    this.lastSyncTime = 0;
    this.syncInterval = 0.35; // Send updates every 350ms (optimized for Spark quota)
    this.isQuotaExhausted = false;
    this.lastSentPayload = '';

    this.initChatWidget();

    // Clean up on window unload
    window.addEventListener('beforeunload', () => {
      if (this.isConnected) {
        this.leaveRoom(true);
      }
    });
  }

  getDb() {
    return this.cloudSave ? this.cloudSave.db : null;
  }

  getAuth() {
    return this.cloudSave ? this.cloudSave.auth : null;
  }

  /**
   * Ensure user is authenticated (Google, Email, or Anonymous)
   * This guarantees that non-logged-in users can also join/create rooms without permission-denied errors!
   */
  async ensureAuth() {
    const auth = this.getAuth();
    if (!auth) return false;

    if (auth.currentUser) {
      return true;
    }

    try {
      console.log("🐾 Multiplayer: Authenticating guest player anonymously for Firestore access...");
      const result = await signInAnonymously(auth);
      if (this.cloudSave) {
        this.cloudSave.currentUser = result.user;
      }
      return true;
    } catch (err) {
      console.warn("Multiplayer anonymous auth warning (falling back to open mode):", err.message);
      return false;
    }
  }

  initChatWidget() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
          this.sendMessage(text);
          chatInput.value = '';
          chatInput.blur();
        }
      });
    }

    // Press Enter to focus chat input
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          return;
        }
        if (chatInput) {
          e.preventDefault();
          chatInput.focus();
        }
      }
    });
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createRoom(customCode, playerName) {
    await this.ensureAuth();
    const db = this.getDb();

    const cleanCode = (customCode || this.generateRoomCode()).replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase();
    if (!cleanCode) return { success: false, error: 'NO_CODE' };

    if (playerName && playerName.trim()) {
      this.playerName = playerName.trim();
    } else if (this.cloudSave && this.cloudSave.currentUser && this.cloudSave.currentUser.displayName) {
      this.playerName = this.cloudSave.currentUser.displayName;
    }

    this.roomId = cleanCode;
    this.isHost = true;
    this.isConnected = true;

    // 🌊 Host: Export initial ocean fish state to share with guests
    const worldData = (typeof this.getOceanWorldState === 'function') ? this.getOceanWorldState() : null;

    if (db) {
      try {
        const roomRef = doc(db, 'cozy_fishing_rooms', cleanCode);
        await setDoc(roomRef, {
          roomId: cleanCode,
          hostId: this.playerId,
          hostName: this.playerName,
          createdAt: serverTimestamp(),
          lastActivity: Date.now()
        }, { merge: true });

        // Save shared ocean world state in room
        if (worldData && Array.isArray(worldData.fishList)) {
          const worldRef = doc(db, 'cozy_fishing_rooms', cleanCode, 'world', 'ocean');
          await setDoc(worldRef, {
            fishList: worldData.fishList,
            timeOfDay: worldData.timeOfDay || 'day',
            timeProgress: worldData.timeProgress || 0,
            hostId: this.playerId,
            hostName: this.playerName,
            updatedAt: serverTimestamp()
          });
        }

        await this.joinPlayerToRoom(cleanCode);
        this.startListening(cleanCode);
      } catch (err) {
        console.warn("Firestore room create error, using broadcast fallback:", err);
      }
    }

    // Broadcast across tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'ROOM_CREATED',
        roomId: cleanCode,
        hostId: this.playerId,
        hostName: this.playerName,
        worldData: worldData
      });
    }

    this.updateMultiplayerUI();
    this.hud.showNotification(`🎉 방 [${cleanCode}] 개설 완료! 같은 바다를 공유합니다.`, '🌊');
    this.appendSystemChatMessage(`방 [${cleanCode}]이 개설되었습니다! 친구를 초대해보세요.`);
    return { success: true, roomId: cleanCode };
  }

  async joinRoom(roomIdInput, playerName) {
    await this.ensureAuth();
    const db = this.getDb();

    const cleanCode = roomIdInput ? roomIdInput.replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase() : '';
    if (!cleanCode) {
      this.hud.showNotification('방 코드를 입력해주세요.', '⚠️');
      return { success: false, error: 'EMPTY_CODE' };
    }

    if (playerName && playerName.trim()) {
      this.playerName = playerName.trim();
    } else if (this.cloudSave && this.cloudSave.currentUser && this.cloudSave.currentUser.displayName) {
      this.playerName = this.cloudSave.currentUser.displayName;
    }

    let found = false;

    if (db) {
      try {
        const roomRef = doc(db, 'cozy_fishing_rooms', cleanCode);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          found = true;
          this.roomId = cleanCode;
          this.isHost = (roomSnap.data().hostId === this.playerId);
          this.isConnected = true;

          // 🌊 Guest: Fetch Host's shared ocean fish population & atmosphere
          try {
            const worldRef = doc(db, 'cozy_fishing_rooms', cleanCode, 'world', 'ocean');
            const worldSnap = await getDoc(worldRef);
            if (worldSnap.exists()) {
              const sharedWorld = worldSnap.data();
              if (sharedWorld && Array.isArray(sharedWorld.fishList) && sharedWorld.fishList.length > 0) {
                if (typeof this.onSyncOceanWorld === 'function') {
                  this.onSyncOceanWorld(sharedWorld.fishList, sharedWorld);
                }
              }
            }
          } catch (worldErr) {
            console.warn("Could not fetch shared ocean world:", worldErr);
          }

          await this.joinPlayerToRoom(cleanCode);
          this.startListening(cleanCode);
        }
      } catch (err) {
        console.warn("Firestore join room check error:", err);
      }
    }

    // If not found in firestore or firestore offline, check cross-tab broadcast
    if (!found) {
      // Direct join optimistic connection
      this.roomId = cleanCode;
      this.isHost = false;
      this.isConnected = true;

      if (db) {
        try {
          await this.joinPlayerToRoom(cleanCode);
          this.startListening(cleanCode);
          found = true;
        } catch (e) {}
      }
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'PLAYER_JOINED',
        roomId: cleanCode,
        playerId: this.playerId,
        playerName: this.playerName
      });
    }

    this.updateMultiplayerUI();
    this.hud.showNotification(`🚀 방 [${cleanCode}] 입장 성공! 같은 바다에서 낚시합니다!`, '🌊');
    this.appendSystemChatMessage(`방 [${cleanCode}]에 입장했습니다! 방장과 같은 바다를 공유합니다.`);
    return { success: true, roomId: cleanCode };
  }

  async joinPlayerToRoom(roomId) {
    const db = this.getDb();
    if (!db) return;

    const spawnX = 240 + Math.floor(Math.random() * 35);
    const playerRef = doc(db, 'cozy_fishing_rooms', roomId, 'players', this.playerId);
    await setDoc(playerRef, {
      id: this.playerId,
      name: this.playerName,
      joinedAt: serverTimestamp(),
      lastSeen: Date.now(),
      x: spawnX,
      y: 0,
      facing: 1,
      state: 'IDLE',
      rodId: this.economy.currentRodId,
      boatId: this.economy.currentBoatId,
      hatId: this.economy.currentHatId,
      catSkinId: this.economy.catSkinId,
      hookCount: this.economy.hookCount,
      hookPos: null,
      bobberPos: null,
      rodState: 'READY',
      isSubmerged: false,
      currentBaitId: this.economy.currentBaitId
    });
  }

  startListening(roomId) {
    const db = this.getDb();
    if (!db) return;

    this.stopListening();

    // 1. Listen for active players
    const playersRef = collection(db, 'cozy_fishing_rooms', roomId, 'players');
    this.unsubscribePlayers = onSnapshot(playersRef, (snapshot) => {
      const activeIds = new Set();

      snapshot.forEach((docSnap) => {
        const pData = docSnap.data();
        if (pData.id === this.playerId) return; // Skip self

        activeIds.add(pData.id);

        let pEntry = this.otherPlayers.get(pData.id);
        if (!pEntry) {
          // Create fake economy with dynamic skin, hat, rod & boat support
          const fakeEconomy = {
            getCurrentBoat: () => {
              return BOATS.find(b => b.id === pData.boatId) || BOATS[0] || { drawType: 'raft', speed: 80, maxTravelX: 1600 };
            },
            getCurrentRod: () => {
              return RODS.find(r => r.id === pData.rodId) || RODS[0] || { color: '#faedcd' };
            },
            getCurrentCatSkin: () => {
              const sId = pData.catSkinId || 'skin_orange';
              return CAT_SKINS.find(s => s.id === sId) || CAT_SKINS[0];
            },
            getCurrentHat: () => {
              const hId = pData.hatId || 'hat_none';
              return HATS.find(h => h.id === hId) || HATS[0] || { drawType: 'none' };
            },
            currentHatId: pData.hatId || 'hat_none',
            currentRodId: pData.rodId || 'rod_twig',
            currentBoatId: pData.boatId || 'boat_raft',
            catSkinId: pData.catSkinId || 'skin_orange'
          };

          const remoteCat = new Cat(fakeEconomy);
          pEntry = {
            data: pData,
            remoteCat: remoteCat,
            targetX: pData.x || 200,
            targetY: pData.y || 0,
            lastSeen: Date.now(),
            chatBubble: { text: '', timer: 0 }
          };
          this.otherPlayers.set(pData.id, pEntry);
          this.hud.showNotification(`🐾 [${pData.name}] 님이 바다에 합류했습니다!`, '👋');
          this.appendSystemChatMessage(`🐾 [${pData.name}] 님이 방에 입장했습니다.`);
        } else {
          // Update player data
          pEntry.data = pData;
          pEntry.targetX = pData.x;
          pEntry.targetY = pData.y;
          pEntry.lastSeen = Date.now();

          // Update remote cat state
          pEntry.remoteCat.economy.currentHatId = pData.hatId;
          pEntry.remoteCat.economy.currentRodId = pData.rodId;
          pEntry.remoteCat.economy.catSkinId = pData.catSkinId || 'skin_orange';
          pEntry.remoteCat.state = pData.state || 'IDLE';
          pEntry.remoteCat.facing = pData.facing || 1;
        }
      });

      // Handle leaving players
      for (const [id, entry] of this.otherPlayers.entries()) {
        if (!activeIds.has(id)) {
          this.hud.showNotification(`🐾 [${entry.data.name}] 님이 방을 나갔습니다.`, '💨');
          this.appendSystemChatMessage(`🐾 [${entry.data.name}] 님이 퇴장했습니다.`);
          this.otherPlayers.delete(id);
        }
      }

      this.updateMultiplayerUI();
    }, (error) => {
      console.warn("Multiplayer players snapshot error:", error);
    });

    // 2. Listen for Realtime In-Game Chat Messages
    const messagesRef = collection(db, 'cozy_fishing_rooms', roomId, 'messages');
    const msgQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(25));
    
    let isFirstLoad = true;
    this.unsubscribeMessages = onSnapshot(msgQuery, (snapshot) => {
      if (isFirstLoad) {
        // Initial load of history messages
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            this.appendChatMessage(msg.senderName, msg.text, msg.senderId === this.playerId, false);
          }
        });
        isFirstLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const msg = change.doc.data();
          const isMe = msg.senderId === this.playerId;
          this.appendChatMessage(msg.senderName, msg.text, isMe, true);

          // Show floating chat bubble over cat
          if (isMe) {
            this.myChatBubble = { text: msg.text, timer: 5.0 };
          } else {
            const pEntry = this.otherPlayers.get(msg.senderId);
            if (pEntry) {
              pEntry.chatBubble = { text: msg.text, timer: 5.0 };
            }
          }
        }
      });
    }, (error) => {
      console.warn("Multiplayer messages snapshot error:", error);
    });

    // 3. 🌊 Listen for Realtime Shared Ocean Fish Events (Fish Caught & Fish Spawned)
    const eventsRef = collection(db, 'cozy_fishing_rooms', roomId, 'events');
    const evQuery = query(eventsRef, orderBy('createdAt', 'desc'), limit(15));
    let isFirstEvLoad = true;

    this.unsubscribeEvents = onSnapshot(evQuery, (snapshot) => {
      if (isFirstEvLoad) {
        isFirstEvLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const ev = change.doc.data();
          if (ev.senderId === this.playerId || ev.caughtById === this.playerId) return;

          if (ev.type === 'FISH_CAUGHT') {
            if (typeof this.onRemoteFishCaught === 'function') {
              this.onRemoteFishCaught(ev);
            }
            this.hud.showNotification(`🎉 [${ev.caughtBy}]님이 ${ev.isBoss ? '👑 보스 ' : (ev.isShiny ? '✨ 이로치 ' : '')}[${ev.speciesName}]을(를) 낚았습니다냥!`, '🎣');
            this.appendSystemChatMessage(`🎣 [${ev.caughtBy}]님이 [${ev.speciesName}] 획득!`);
            this.sound.playCoin();
          } else if (ev.type === 'FISH_SPAWNED' && !this.isHost) {
            if (typeof this.onRemoteFishSpawned === 'function' && ev.fishData) {
              this.onRemoteFishSpawned(ev.fishData);
            }
          } else if (ev.type === 'EMOTE') {
            const pEntry = this.otherPlayers.get(ev.senderId);
            if (pEntry && pEntry.remoteCat) {
              pEntry.remoteCat.triggerEmote(ev.emote);
            }
          }
        }
      });
    }, (error) => {
      console.warn("Multiplayer events snapshot error:", error);
    });

    // 4. 🌊 Guest: Real-time Ocean World & Environment Synchronization
    if (!this.isHost) {
      try {
        const worldDocRef = doc(db, 'cozy_fishing_rooms', roomId, 'world', 'ocean');
        this.unsubscribeWorld = onSnapshot(worldDocRef, (snap) => {
          if (snap.exists()) {
            const worldData = snap.data();
            if (worldData && Array.isArray(worldData.fishList)) {
              if (typeof this.onSyncOceanWorld === 'function') {
                this.onSyncOceanWorld(worldData.fishList, worldData);
              }
            }
          }
        }, (err) => {
          console.warn("Multiplayer world snapshot error:", err);
        });
      } catch (err) {
        console.warn("Could not attach world listener:", err);
      }
    }

    // Show Chat Widget UI
    const chatWidget = document.getElementById('ingame-chat-container');
    if (chatWidget) chatWidget.classList.add('visible');
  }

  handleBroadcastMessage(msg) {
    if (!msg || msg.roomId !== this.roomId) return;
    if (msg.senderId === this.playerId || msg.playerId === this.playerId) return;

    if (msg.type === 'PLAYER_JOINED') {
      // 🌊 Host: Immediately broadcast current ocean fish and atmosphere to newly joined player
      if (this.isHost && this.broadcastChannel && typeof this.getOceanWorldState === 'function') {
        const worldData = this.getOceanWorldState();
        if (worldData) {
          this.broadcastChannel.postMessage({
            type: 'OCEAN_SYNC',
            roomId: this.roomId,
            senderId: this.playerId,
            fishList: worldData.fishList,
            timeOfDay: worldData.timeOfDay,
            timeProgress: worldData.timeProgress,
            season: worldData.season,
            seasonProgress: worldData.seasonProgress,
            timestamp: Date.now()
          });
        }
      }
    } else if (msg.type === 'CHAT') {
      this.appendChatMessage(msg.senderName, msg.text, false, true);
      const pEntry = this.otherPlayers.get(msg.senderId);
      if (pEntry) {
        pEntry.chatBubble = { text: msg.text, timer: 5.0 };
      }
    } else if (msg.type === 'EMOTE') {
      const pEntry = this.otherPlayers.get(msg.senderId);
      if (pEntry && pEntry.remoteCat) {
        pEntry.remoteCat.triggerEmote(msg.emote);
      }
    } else if (msg.type === 'OCEAN_SYNC' && !this.isHost) {
      if (typeof this.onSyncOceanWorld === 'function' && Array.isArray(msg.fishList)) {
        this.onSyncOceanWorld(msg.fishList, msg);
      }
    } else if (msg.type === 'FISH_CAUGHT') {
      if (typeof this.onRemoteFishCaught === 'function') {
        this.onRemoteFishCaught(msg);
      }
      this.hud.showNotification(`🎉 [${msg.caughtBy}]님이 ${msg.isBoss ? '👑 보스 ' : (msg.isShiny ? '✨ 이로치 ' : '')}[${msg.speciesName}]을(를) 낚았습니다냥!`, '🎣');
      this.appendSystemChatMessage(`🎣 [${msg.caughtBy}]님이 [${msg.speciesName}] 획득!`);
      this.sound.playCoin();
    } else if (msg.type === 'FISH_SPAWNED' && !this.isHost) {
      if (typeof this.onRemoteFishSpawned === 'function' && msg.fishData) {
        this.onRemoteFishSpawned(msg.fishData);
      }
    } else if (msg.type === 'PLAYER_STATE' && msg.playerData) {
      const pData = msg.playerData;
      if (pData.id === this.playerId) return;

      // Sync master environment from host player state if present
      if (pData.worldEnv && !this.isHost && typeof this.onSyncOceanWorld === 'function') {
        this.onSyncOceanWorld(null, pData.worldEnv);
      }

      let pEntry = this.otherPlayers.get(pData.id);
      if (!pEntry) {
        const fakeEconomy = {
          getCurrentBoat: () => BOATS.find(b => b.id === pData.boatId) || BOATS[0] || { drawType: 'raft', speed: 80, maxTravelX: 1600 },
          getCurrentRod: () => RODS.find(r => r.id === pData.rodId) || RODS[0] || { color: '#faedcd' },
          getCurrentCatSkin: () => CAT_SKINS.find(s => s.id === (pData.catSkinId || 'skin_orange')) || CAT_SKINS[0],
          getCurrentHat: () => HATS.find(h => h.id === (pData.hatId || 'hat_none')) || HATS[0] || { drawType: 'none' }
        };
        const rCat = new Cat(fakeEconomy);
        rCat.pos.set(pData.x || 250, pData.y || 0);
        pEntry = {
          data: pData,
          remoteCat: rCat,
          targetX: pData.x || 250,
          targetY: pData.y || 0,
          lastSeen: Date.now(),
          chatBubble: { text: '', timer: 0 }
        };
        this.otherPlayers.set(pData.id, pEntry);
      } else {
        pEntry.data = pData;
        pEntry.targetX = pData.x || 250;
        pEntry.targetY = pData.y || 0;
        pEntry.lastSeen = Date.now();
      }
    }
  }

  async broadcastEmote(emoteId) {
    if (!this.isConnected || !this.roomId) return;
    const payload = {
      type: 'EMOTE',
      roomId: this.roomId,
      senderId: this.playerId,
      senderName: this.playerName,
      emote: emoteId,
      timestamp: Date.now()
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(payload);
    }

    const db = this.getDb();
    if (db) {
      try {
        const eventsRef = collection(db, 'cozy_fishing_rooms', this.roomId, 'events');
        await addDoc(eventsRef, { ...payload, createdAt: serverTimestamp() });
      } catch (e) {}
    }
  }

  async broadcastFishCaught(event) {
    if (!this.isConnected || !this.roomId) return;
    const payload = {
      type: 'FISH_CAUGHT',
      roomId: this.roomId,
      senderId: this.playerId,
      caughtById: this.playerId,
      caughtBy: this.playerName,
      ...event,
      timestamp: Date.now()
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(payload);
    }

    const db = this.getDb();
    if (db) {
      try {
        const eventsRef = collection(db, 'cozy_fishing_rooms', this.roomId, 'events');
        await addDoc(eventsRef, { ...payload, createdAt: serverTimestamp() });
      } catch (e) {
        console.warn("Failed to broadcast fish caught to firestore:", e);
      }
    }
  }

  async broadcastFishSpawned(fishData) {
    if (!this.isConnected || !this.roomId || !this.isHost) return;
    const payload = {
      type: 'FISH_SPAWNED',
      roomId: this.roomId,
      senderId: this.playerId,
      fishData: fishData,
      timestamp: Date.now()
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(payload);
    }

    const db = this.getDb();
    if (db) {
      try {
        const eventsRef = collection(db, 'cozy_fishing_rooms', this.roomId, 'events');
        await addDoc(eventsRef, { ...payload, createdAt: serverTimestamp() });
      } catch (e) {}
    }
  }

  async sendMessage(text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    if (!this.isConnected || !this.roomId) {
      // Local single player chat
      this.myChatBubble = { text: cleanText, timer: 4.5 };
      this.appendChatMessage(this.playerName, cleanText, true, true);
      return;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'CHAT',
        roomId: this.roomId,
        senderId: this.playerId,
        senderName: this.playerName,
        text: cleanText
      });
    }

    const db = this.getDb();
    if (!db) {
      this.myChatBubble = { text: cleanText, timer: 4.5 };
      this.appendChatMessage(this.playerName, cleanText, true, true);
      return;
    }

    try {
      const messagesRef = collection(db, 'cozy_fishing_rooms', this.roomId, 'messages');
      await addDoc(messagesRef, {
        roomId: this.roomId,
        senderId: this.playerId,
        senderName: this.playerName,
        text: cleanText,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to send firestore message (using broadcast):", e);
    }
  }

  appendChatMessage(senderName, text, isMe = false, playSound = false) {
    const listEl = document.getElementById('chat-messages');
    if (!listEl) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${isMe ? 'is-me' : ''}`;
    msgEl.innerHTML = `
      <span class="chat-author ${isMe ? 'author-me' : ''}">${senderName}:</span>
      <span class="chat-text">${this.escapeHtml(text)}</span>
    `;
    listEl.appendChild(msgEl);
    listEl.scrollTop = listEl.scrollHeight;

    // Expand chat widget temporarily to show incoming message
    const chatWidget = document.getElementById('ingame-chat-container');
    if (chatWidget) {
      chatWidget.classList.add('expanded');
      if (this.chatExpandTimeout) clearTimeout(this.chatExpandTimeout);
      this.chatExpandTimeout = setTimeout(() => {
        chatWidget.classList.remove('expanded');
      }, 4500);
    }

    if (playSound && !isMe) {
      this.sound.playClick();
    }
  }

  appendSystemChatMessage(text) {
    const listEl = document.getElementById('chat-messages');
    if (!listEl) return;

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg chat-system';
    msgEl.innerHTML = `<span>📢 ${this.escapeHtml(text)}</span>`;
    listEl.appendChild(msgEl);
    listEl.scrollTop = listEl.scrollHeight;
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  stopListening() {
    if (this.unsubscribePlayers) {
      this.unsubscribePlayers();
      this.unsubscribePlayers = null;
    }
    if (this.unsubscribeMessages) {
      this.unsubscribeMessages();
      this.unsubscribeMessages = null;
    }
    if (this.unsubscribeEvents) {
      this.unsubscribeEvents();
      this.unsubscribeEvents = null;
    }
    if (this.unsubscribeWorld) {
      this.unsubscribeWorld();
      this.unsubscribeWorld = null;
    }
  }

  async leaveRoom(isSyncBeacon = false) {
    if (!this.roomId || !this.isConnected) return;

    const db = this.getDb();
    const curRoomId = this.roomId;
    const myId = this.playerId;

    this.stopListening();
    this.otherPlayers.clear();
    this.roomId = null;
    this.isConnected = false;
    this.isHost = false;

    if (db) {
      try {
        const playerRef = doc(db, 'cozy_fishing_rooms', curRoomId, 'players', myId);
        await deleteDoc(playerRef);
      } catch (e) {
        console.warn("Error deleting player on leave:", e);
      }
    }

    this.updateMultiplayerUI();
    this.hud.showNotification('멀티플레이 방에서 퇴장했습니다.', '🚪');
    this.appendSystemChatMessage('싱글 플레이 모드로 전환되었습니다.');
  }

  update(dt, cat, rod, economy) {
    // Update local chat bubble timer
    if (this.myChatBubble && this.myChatBubble.timer > 0) {
      this.myChatBubble.timer -= dt;
    }

    if (!this.isConnected || !this.roomId) return;

    const now = performance.now() / 1000;

    // Send my state to Firestore & Broadcast throttled
    if (now - this.lastSyncTime >= this.syncInterval) {
      this.lastSyncTime = now;
      this.syncMyState(cat, rod, economy);
    }

    // 🌊 Host: Periodic full Ocean World State broadcast
    if (this.isHost) {
      // 1. Cross-tab fast broadcast every 0.5s (0ms latency, zero quota)
      this.hostWorldSyncTimer = (this.hostWorldSyncTimer || 0) + dt;
      if (this.hostWorldSyncTimer >= 0.5) {
        this.hostWorldSyncTimer = 0;
        if (this.broadcastChannel && typeof this.getOceanWorldState === 'function') {
          const world = this.getOceanWorldState(false);
          if (world && Array.isArray(world.fishList)) {
            this.broadcastChannel.postMessage({
              type: 'OCEAN_SYNC',
              roomId: this.roomId,
              senderId: this.playerId,
              fishList: world.fishList,
              timeOfDay: world.timeOfDay,
              timeProgress: world.timeProgress,
              season: world.season,
              seasonProgress: world.seasonProgress,
              timestamp: Date.now()
            });
          }
        }
      }

      // 2. Firestore cloud room sync every 3.5s (Rate-limited for Spark daily quota)
      this.hostFirestoreSyncTimer = (this.hostFirestoreSyncTimer || 0) + dt;
      if (this.hostFirestoreSyncTimer >= 3.5 && !this.isQuotaExhausted) {
        this.hostFirestoreSyncTimer = 0;
        const db = this.getDb();
        if (db && typeof this.getOceanWorldState === 'function') {
          const world = this.getOceanWorldState(false);
          if (world && Array.isArray(world.fishList)) {
            const worldDocRef = doc(db, 'cozy_fishing_rooms', this.roomId, 'world', 'ocean');
            setDoc(worldDocRef, {
              fishList: world.fishList,
              timeOfDay: world.timeOfDay || 'day',
              timeProgress: world.timeProgress || 0,
              season: world.season || 'spring',
              seasonProgress: world.seasonProgress || 0,
              hostId: this.playerId,
              hostName: this.playerName,
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(e => {
              if (e.code === 'resource-exhausted') this.isQuotaExhausted = true;
            });
          }
        }
      }
    }

    // Update and interpolate other players
    this.otherPlayers.forEach((pEntry) => {
      const rCat = pEntry.remoteCat;
      rCat.animTime += dt;

      // Smooth lerp positions
      rCat.pos.x += (pEntry.targetX - rCat.pos.x) * 0.18;
      rCat.pos.y += (pEntry.targetY - rCat.pos.y) * 0.18;
      rCat.waterY = cat.waterY;
      rCat.facing = pEntry.data.facing || 1;
      rCat.state = pEntry.data.state || 'IDLE';

      if (pEntry.data.exclamation === true || pEntry.data.state === 'WAITING') {
        rCat.exclamationTimer = 0.5;
      }

      // Keep boat floating physics
      const waveFreq = 1.8;
      rCat.bobOffset = Math.sin(rCat.animTime * waveFreq + rCat.pos.x * 0.01) * 4;
      rCat.bobAngle = Math.cos(rCat.animTime * waveFreq + rCat.pos.x * 0.01) * 0.04;

      // Update chat bubble timer
      if (pEntry.chatBubble && pEntry.chatBubble.timer > 0) {
        pEntry.chatBubble.timer -= dt;
      }
    });
  }

  async syncMyState(cat, rod, economy) {
    if (!this.roomId || !this.isConnected) return;

    // Collect all currently hooked fish uids
    const hookedFishUid = rod.hookedFish ? rod.hookedFish.uid : (rod.hooks && rod.hooks.find(h => h.hookedFish)?.hookedFish?.uid) || null;
    const allHookedUids = (rod.allHookedFishes && rod.allHookedFishes.length > 0) 
      ? rod.allHookedFishes.map(f => f.uid) 
      : (hookedFishUid ? [hookedFishUid] : []);

    const payloadObj = {
      id: this.playerId,
      name: this.playerName,
      lastSeen: Date.now(),
      x: Math.round(cat.pos.x * 10) / 10,
      y: Math.round(cat.pos.y * 10) / 10,
      facing: cat.facing,
      state: cat.state,
      exclamation: (cat.exclamationTimer > 0 || cat.state === 'WAITING'),
      rodId: economy.currentRodId,
      boatId: economy.currentBoatId,
      hatId: economy.currentHatId,
      catSkinId: economy.catSkinId,
      hookCount: economy.hookCount,
      rodState: rod.state,
      isSubmerged: rod.isSubmerged,
      hookPos: rod.state !== 'READY' ? { x: Math.round(rod.hookPos.x), y: Math.round(rod.hookPos.y) } : null,
      bobberPos: rod.state === 'FISHING' ? { x: Math.round(rod.bobberPos.x), y: Math.round(rod.bobberPos.y) } : null,
      currentBaitId: rod.currentBaitId,
      hookedFishUid: hookedFishUid,
      allHookedFishUids: allHookedUids
    };

    // Include master environment in state if host
    if (this.isHost && typeof this.getOceanWorldState === 'function') {
      const wEnv = this.getOceanWorldState(true);
      if (wEnv) {
        payloadObj.worldEnv = {
          timeOfDay: wEnv.timeOfDay,
          timeProgress: wEnv.timeProgress,
          season: wEnv.season,
          seasonProgress: wEnv.seasonProgress
        };
      }
    }

    // Always send over local BroadcastChannel for zero-latency local tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'PLAYER_STATE',
        roomId: this.roomId,
        playerData: payloadObj
      });
    }

    // Skip Firestore write if quota exceeded
    if (this.isQuotaExhausted) return;

    // Dirty check: only send to Firestore if something meaningful changed
    const payloadSignature = `${payloadObj.x}_${payloadObj.y}_${payloadObj.state}_${payloadObj.rodState}_${payloadObj.isSubmerged}_${payloadObj.hookedFishUid}`;
    if (payloadSignature === this.lastSentPayload) return;
    this.lastSentPayload = payloadSignature;

    const db = this.getDb();
    if (!db) return;

    try {
      const playerRef = doc(db, 'cozy_fishing_rooms', this.roomId, 'players', this.playerId);
      await setDoc(playerRef, payloadObj, { merge: true });
    } catch (e) {
      if (e.code === 'resource-exhausted' || (e.message && e.message.includes('Quota exceeded'))) {
        this.isQuotaExhausted = true;
      }
    }
  }

  /** Expose remote player active submerged hooks for ocean fish bait interest */
  getRemoteHooks() {
    if (!this.isConnected || !this.roomId) return [];
    const hooks = [];
    this.otherPlayers.forEach((pEntry) => {
      const p = pEntry.data;
      if (p.rodState && p.rodState !== 'READY' && p.isSubmerged && p.hookPos) {
        hooks.push({
          isSubmerged: true,
          hookPos: { x: p.hookPos.x, y: p.hookPos.y },
          pos: { x: p.hookPos.x, y: p.hookPos.y },
          hookVel: { x: 0, y: 0 },
          isLiveBait: false,
          currentBaitId: p.currentBaitId || 'bread',
          isAllureActive: false,
          attractionBonus: 1.0,
          playerId: p.id,
          playerName: p.name,
          hookedFishUid: p.hookedFishUid || null,
          attachFish: (fish) => {
            fish.remoteHookedBy = p.id;
            fish.remoteHookPos = { x: p.hookPos.x, y: p.hookPos.y };
            fish.remoteHookFacing = p.facing || 1;
            return true;
          }
        });
      }
    });
    return hooks;
  }

  draw(ctx, localCat = null, localRod = null, showMyNametag = false) {
    // 1. Draw My Chat Bubble if active
    if (localCat && this.myChatBubble && this.myChatBubble.timer > 0) {
      this.drawChatBubble(ctx, localCat.pos.x, localCat.pos.y - 75, this.myChatBubble.text, true);
    }

    if (!this.isConnected || !this.roomId) return;

    // 2. Draw Other Players
    this.otherPlayers.forEach((pEntry) => {
      const p = pEntry.data;
      const rCat = pEntry.remoteCat;

      // Draw Remote Player's Boat, Cat, and Hat
      rCat.draw(ctx);

      // Draw Remote Player's Fishing Line & Hook if cast
      if (p.rodState && p.rodState !== 'READY' && p.hookPos) {
        const rodTip = rCat.getRodTipPos();

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 200, 221, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rodTip.x, rodTip.y);

        if (p.bobberPos && p.rodState === 'FISHING') {
          const midX = (rodTip.x + p.bobberPos.x) / 2;
          const sagY = Math.max(rodTip.y, p.bobberPos.y) + 12;
          ctx.quadraticCurveTo(midX, sagY, p.bobberPos.x, p.bobberPos.y);
          ctx.lineTo(p.hookPos.x, p.hookPos.y);
        } else {
          ctx.lineTo(p.hookPos.x, p.hookPos.y);
        }
        ctx.stroke();

        // Draw remote bobber
        if (p.bobberPos && p.rodState === 'FISHING') {
          ctx.save();
          ctx.translate(p.bobberPos.x, p.bobberPos.y);
          ctx.fillStyle = '#ff006e';
          ctx.beginPath();
          ctx.arc(0, -2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw remote hook
        ctx.save();
        ctx.translate(p.hookPos.x, p.hookPos.y);
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();

        // 🪝 Underwater Hook Name Tag when depth >= 25m (Multiplayer only)
        const remoteDepthMeters = (p.hookPos.y - rCat.waterY) / 20;
        if (remoteDepthMeters >= 25) {
          this.drawHookNameTag(ctx, p.hookPos.x, p.hookPos.y - 12, p.name, false);
        }
      }

      // Draw Player Name Tag & Avatar Badge above Cat
      ctx.save();
      const tagX = rCat.pos.x;
      const tagY = rCat.pos.y - 70;

      ctx.font = 'bold 12px "Pretendard", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(p.name).width;

      // Background Bubble
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(tagX - (textWidth + 24) / 2, tagY - 14, textWidth + 24, 20, 10);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Online Friend Dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(tagX - textWidth / 2 - 3, tagY - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Name Text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(p.name, tagX + 5, tagY);
      ctx.restore();

      // Draw Chat Bubble if any
      if (pEntry.chatBubble && pEntry.chatBubble.timer > 0) {
        this.drawChatBubble(ctx, rCat.pos.x, tagY - 24, pEntry.chatBubble.text, false);
      }
    });

    // 3. Draw My Hook Name Tag when depth >= 25m (Only when Tab key / nametag timer is active)
    if (showMyNametag && localCat && localRod && localRod.state === 'FISHING' && localRod.isSubmerged) {
      const myDepthMeters = (localRod.hookPos.y - localCat.waterY) / 20;
      if (myDepthMeters >= 25) {
        this.drawHookNameTag(ctx, localRod.hookPos.x, localRod.hookPos.y - 12, `${this.playerName} (나)`, true);
      }
    }
  }

  drawHookNameTag(ctx, x, y, name, isMe = false) {
    ctx.save();
    ctx.font = 'bold 10px "Pretendard", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = name;
    const textWidth = ctx.measureText(text).width;
    const tagWidth = textWidth + 12;
    const tagHeight = 16;

    ctx.translate(x, y);

    // Mini Tag Background
    ctx.fillStyle = isMe ? 'rgba(5, 150, 105, 0.85)' : 'rgba(2, 132, 199, 0.85)';
    ctx.strokeStyle = isMe ? '#34d399' : '#7dd3fc';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.roundRect(-tagWidth / 2, -tagHeight / 2, tagWidth, tagHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  drawChatBubble(ctx, x, y, text, isMe = false) {
    ctx.save();
    ctx.font = 'bold 13px "Pretendard", "Segoe UI", sans-serif';
    const textMetrics = ctx.measureText(text);
    const bubbleWidth = Math.min(220, Math.max(50, textMetrics.width + 20));
    const bubbleHeight = 26;

    ctx.translate(x, y);

    // Bubble Body
    ctx.fillStyle = isMe ? '#fef08a' : '#ffffff';
    ctx.strokeStyle = isMe ? '#ca8a04' : '#0284c7';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(-bubbleWidth / 2, -bubbleHeight, bubbleWidth, bubbleHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Tail pointer
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(4, 0);
    ctx.fillStyle = isMe ? '#fef08a' : '#ffffff';
    ctx.fill();
    ctx.stroke();

    // Text (truncated if long)
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let displayText = text;
    if (textMetrics.width > 200) {
      displayText = text.substring(0, 16) + '...';
    }
    ctx.fillText(displayText, 0, -bubbleHeight / 2);

    ctx.restore();
  }

  updateMultiplayerUI() {
    const roomInfoArea = document.getElementById('multi-room-active-info');
    const roomFormArea = document.getElementById('multi-room-forms');
    const curRoomCodeEl = document.getElementById('multi-current-room-code');
    const memberCountEl = document.getElementById('multi-member-count');
    const memberListEl = document.getElementById('multi-member-list');
    const topBarMultiBadge = document.getElementById('topbar-multi-badge');

    if (this.isConnected && this.roomId) {
      if (roomInfoArea) roomInfoArea.classList.remove('hidden');
      if (roomFormArea) roomFormArea.classList.add('hidden');
      if (curRoomCodeEl) curRoomCodeEl.innerText = this.roomId;
      
      const totalMembers = this.otherPlayers.size + 1;
      if (memberCountEl) memberCountEl.innerText = `${totalMembers}명`;
      if (topBarMultiBadge) {
        const textSpan = topBarMultiBadge.querySelector('.topbar-room-text');
        if (textSpan) {
          textSpan.innerHTML = `방: <b>${this.roomId}</b> (${totalMembers}명) 📋`;
        } else {
          topBarMultiBadge.innerText = `방: ${this.roomId} (${totalMembers}명)`;
        }
        topBarMultiBadge.classList.remove('hidden');
      }

      if (memberListEl) {
        memberListEl.innerHTML = '';

        // My card
        const myItem = document.createElement('div');
        myItem.className = 'multi-member-item is-me';
        myItem.innerHTML = `
          <span class="member-dot online"></span>
          <span class="member-name">${this.playerName} (나)</span>
          <span class="member-tag ${this.isHost ? 'host' : ''}">${this.isHost ? '👑 방장' : '집사'}</span>
        `;
        memberListEl.appendChild(myItem);

        // Other players cards
        this.otherPlayers.forEach((pEntry) => {
          const item = document.createElement('div');
          item.className = 'multi-member-item';
          item.innerHTML = `
            <span class="member-dot online"></span>
            <span class="member-name">${pEntry.data.name}</span>
            <span class="member-tag friend">친구 🐾</span>
          `;
          memberListEl.appendChild(item);
        });
      }
    } else {
      if (roomInfoArea) roomInfoArea.classList.add('hidden');
      if (roomFormArea) roomFormArea.classList.remove('hidden');
      if (topBarMultiBadge) topBarMultiBadge.classList.add('hidden');
    }
  }
}
