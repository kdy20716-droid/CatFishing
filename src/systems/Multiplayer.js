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

    // Chat
    this.messages = [];
    this.myChatBubble = { text: '', timer: 0 };

    // Sync throttle
    this.lastSyncTime = 0;
    this.syncInterval = 0.10; // Send updates every 100ms for ultra-smooth movement

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
        hostName: this.playerName
      });
    }

    this.updateMultiplayerUI();
    this.hud.showNotification(`🎉 방 [${cleanCode}] 개설 완료! 친구에게 방 코드를 알려주세요.`, '🌐');
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
    this.hud.showNotification(`🚀 방 [${cleanCode}] 입장 성공! 즐거운 낚시되세요!`, '✨');
    this.appendSystemChatMessage(`방 [${cleanCode}]에 입장했습니다!`);
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

    // Show Chat Widget UI
    const chatWidget = document.getElementById('ingame-chat-container');
    if (chatWidget) chatWidget.classList.add('visible');
  }

  handleBroadcastMessage(msg) {
    if (!msg || msg.roomId !== this.roomId) return;
    if (msg.senderId === this.playerId || msg.playerId === this.playerId) return;

    if (msg.type === 'CHAT') {
      this.appendChatMessage(msg.senderName, msg.text, false, true);
      const pEntry = this.otherPlayers.get(msg.senderId);
      if (pEntry) {
        pEntry.chatBubble = { text: msg.text, timer: 5.0 };
      }
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

    // Send my state to Firestore throttled
    if (now - this.lastSyncTime >= this.syncInterval) {
      this.lastSyncTime = now;
      this.syncMyState(cat, rod, economy);
    }

    // Update and interpolate other players
    this.otherPlayers.forEach((pEntry) => {
      const rCat = pEntry.remoteCat;
      rCat.animTime += dt;

      // Smooth lerp positions
      rCat.pos.x += (pEntry.targetX - rCat.pos.x) * 0.15;
      rCat.pos.y += (pEntry.targetY - rCat.pos.y) * 0.15;
      rCat.waterY = cat.waterY;
      rCat.facing = pEntry.data.facing || 1;
      rCat.state = pEntry.data.state || 'IDLE';

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
    const db = this.getDb();
    if (!db || !this.roomId || !this.isConnected) return;

    try {
      const playerRef = doc(db, 'cozy_fishing_rooms', this.roomId, 'players', this.playerId);
      await setDoc(playerRef, {
        id: this.playerId,
        name: this.playerName,
        lastSeen: Date.now(),
        x: Math.round(cat.pos.x * 10) / 10,
        y: Math.round(cat.pos.y * 10) / 10,
        facing: cat.facing,
        state: cat.state,
        rodId: economy.currentRodId,
        boatId: economy.currentBoatId,
        hatId: economy.currentHatId,
        catSkinId: economy.catSkinId,
        hookCount: economy.hookCount,
        rodState: rod.state,
        isSubmerged: rod.isSubmerged,
        hookPos: rod.state !== 'READY' ? { x: Math.round(rod.hookPos.x), y: Math.round(rod.hookPos.y) } : null,
        bobberPos: rod.state === 'FISHING' ? { x: Math.round(rod.bobberPos.x), y: Math.round(rod.bobberPos.y) } : null,
        currentBaitId: rod.currentBaitId
      }, { merge: true });
    } catch (e) {
      // Ignore background sync errors
    }
  }

  draw(ctx, localCat = null, localRod = null) {
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

    // 3. Draw My Hook Name Tag when depth >= 25m (Multiplayer only)
    if (localCat && localRod && localRod.state === 'FISHING' && localRod.isSubmerged) {
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
